import type { Request, Response } from 'express';
import { BaseController } from './base.controller.js';
import { ENV } from '../config/env.js';
import { SERVER_URL } from '../utils/constant.js';

export class LandingController extends BaseController {
  renderLandingPage = this.handleViewRequest(async (req: Request, res: Response) => {
    res.render('pages/app/landing', {
      title: 'Pramaan - Secure Identity Provider',
      serverUrl: SERVER_URL,
      docUrl: ENV.APP_DOC_URL,
    });
  });
}
