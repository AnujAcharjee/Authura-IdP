import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import { SERVER_URL } from '../utils/constant.js';
import { ENV } from '../config/env.js';
import { logger } from '../config/logger.js';
import redis from '../config/redis.js';
import {
  getEmailVerificationTemplate,
  getPasswordResetEmailTemplate,
  getSignInVerificationTemplate,
} from '../templates/email/index.js';
import { AuthenticationFlow } from './auth.service.js';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

class EmailService {
  private mailer!: MailerSend;
  private readonly fromAddress: string;
  private initialized = false;

  constructor() {
    logger.info('Using MailerSend API', {
      context: 'EmailService.constructor',
    });

    this.fromAddress = ENV.EMAIL_FROM ?? 'no-reply@yourdomain.com';
    this.precompileTemplates();
  }

  async init() {
    if (this.initialized) return;

    this.mailer = new MailerSend({
      apiKey: ENV.MAILERSEND_API_KEY,
    });

    logger.info('MailerSend initialized');
    this.initialized = true;
  }

  private precompileTemplates() {
    try {
      getEmailVerificationTemplate('test', 'test');
      getPasswordResetEmailTemplate('test', 'test');
      getSignInVerificationTemplate('test', 'test');

      logger.info('Email templates precompiled successfully');
    } catch (error) {
      logger.error('Failed to precompile email templates', { error });
    }
  }

  // -----------------------
  // REDIS RATE LIMIT
  // -----------------------
  private async checkRateLimit(key: string, limitSeconds = 3600) {
    const redisKey = `email:rate:${key}`;

    const exists = await redis.get(redisKey);

    if (exists) {
      throw new Error('Too many requests');
    }

    await redis.set(redisKey, '1', 'EX', limitSeconds);
  }

  private async sendWithRetry(options: SendEmailOptions, retries = 3) {
    let lastError;

    for (let i = 0; i < retries; i++) {
      try {
        const sentFrom = new Sender(this.fromAddress, 'Pramaan');
        const recipients = [new Recipient(options.to)];

        const emailParams = new EmailParams()
          .setFrom(sentFrom)
          .setTo(recipients)
          .setSubject(options.subject)
          .setHtml(options.html)
          .setText(options.text);

        return await this.mailer.email.send(emailParams);
      } catch (err) {
        lastError = err;
        await new Promise((res) => setTimeout(res, 500 * (i + 1)));
      }
    }

    throw lastError;
  }

  private buildUrl(path: string, token: string, flow: AuthenticationFlow, requestId?: string) {
    const url = new URL(`${SERVER_URL}${path}`);
    url.searchParams.append('token', token);

    if (flow === 'oauth') {
      url.searchParams.append('flow', flow);
      if (requestId) url.searchParams.append('request_id', requestId);
    }

    return url.toString();
  }

  async sendVerificationEmail(
    to: string,
    name: string,
    token: string,
    flow: AuthenticationFlow,
    requestId?: string,
  ) {
    await this.init();

    await this.checkRateLimit(`verify:${to}`);

    const url = this.buildUrl('/email/verify', token, flow, requestId);

    await this.sendWithRetry({
      to,
      subject: 'Verify your email',
      html: getEmailVerificationTemplate(name, url),
      text: `Verify your email: ${url}`,
    });

    logger.info('Verification email sent', { to });
  }

  async sendSignInVerifyEmail(
    to: string,
    name: string,
    token: string,
    flow: AuthenticationFlow,
    requestId?: string,
  ) {
    await this.init();

    await this.checkRateLimit(`signin:${to}`);

    const url = this.buildUrl('/signin/verify', token, flow, requestId);

    await this.sendWithRetry({
      to,
      subject: 'Verify your sign-in',
      html: getSignInVerificationTemplate(name, url),
      text: `Verify your sign-in: ${url}`,
    });

    logger.info('Sign-in email sent', { to });
  }

  async sendPasswordResetEmail(
    to: string,
    name: string,
    token: string,
    flow: AuthenticationFlow,
    requestId?: string,
  ) {
    await this.init();

    await this.checkRateLimit(`reset:${to}`);

    const url = this.buildUrl('/reset-password', token, flow, requestId);

    await this.sendWithRetry({
      to,
      subject: 'Reset your password',
      html: getPasswordResetEmailTemplate(name, url),
      text: `Reset your password: ${url}`,
    });

    logger.info('Password reset email sent', { to });
  }
}

export const emailService = new EmailService();
