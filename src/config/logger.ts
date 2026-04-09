import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';
import winston from 'winston';
import { ENV } from './env.js';

const logtail = new Logtail(ENV.LOGTAIL_SOURCE_TOKEN);

const logLevel = ENV.NODE_ENV === 'production' ? 'info' : 'debug';

const formatConfig = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

export const logger = winston.createLogger({
  level: logLevel,
  format: formatConfig,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
    new LogtailTransport(logtail),
  ],
});

export const requestLogger = winston.createLogger({
  format: formatConfig,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
    new LogtailTransport(logtail),
  ],
});
