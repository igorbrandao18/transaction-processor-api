import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { logger } from '@config/logger.config';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly ignoredPaths = [
    '/favicon.ico',
    '/service-worker.js',
    '/robots.txt',
    '/manifest.json',
  ];

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    const shouldIgnore = this.ignoredPaths.some((path) =>
      request.path.includes(path),
    );

    if (shouldIgnore && status === HttpStatus.NOT_FOUND) {
      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        ...(typeof errorResponse === 'string'
          ? { message: errorResponse }
          : errorResponse),
      });
      return;
    }

    if (status === HttpStatus.NOT_FOUND) {
      logger.warn('Resource not found', {
        status,
        error:
          exception instanceof Error ? exception.message : String(exception),
        path: request.url,
        method: request.method,
      });
    } else if (status >= 500) {
      logger.error('Exception caught', {
        status,
        error:
          exception instanceof Error ? exception.message : String(exception),
        stack: exception instanceof Error ? exception.stack : undefined,
        path: request.url,
        method: request.method,
      });
    } else {
      logger.warn('Client error', {
        status,
        error:
          exception instanceof Error ? exception.message : String(exception),
        path: request.url,
        method: request.method,
      });
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(typeof errorResponse === 'string'
        ? { message: errorResponse }
        : errorResponse),
    });
  }
}
