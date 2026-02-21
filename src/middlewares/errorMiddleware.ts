import { AppError } from '../utils/appError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { logger } from '../config/logger.js';
import type { ErrorRequestHandler } from 'express';

/**
 * if req accepts html
 *  - for routes in AUTH_UI_REDIRECT_MAP, redirect to auth route with error message
 *  - for Others, render error page
 * if req accepts json
 *  - send JSON res
 */

export const errorMiddleware: ErrorRequestHandler = (error, req, res, _next): void => {
  const isAppError = error instanceof AppError;
  const statusCode = isAppError ? error.statusCode : 500;
  const message = isAppError ? error.message : 'Internal server error';
  const acceptsHtml = req.accepts(['html', 'json']) === 'html';
  const isApiError = req.url.startsWith('/api');

  // Logging
  if (!isAppError || statusCode >= 500) {
    logger.error({
      message: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
    });
  } else {
    logger.warn({
      message: error.message,
      path: req.path,
      method: req.method,
      statusCode,
    });
  }

  // UI response
  if (acceptsHtml && !isApiError) {
    return res.status(statusCode).render('pages/app/error', {
      title: 'Error-Page',
      statusCode,
      message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }

  // JSON response
  return ApiResponse.error(res, message, statusCode);
};
