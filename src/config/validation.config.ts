import { ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import { logger } from '@config/logger.config';

export const validationPipeConfig = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
  exceptionFactory: (errors) => {
    logger.error('Validation error', { errors });
    return new HttpException(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        errors: errors,
      },
      HttpStatus.BAD_REQUEST,
    );
  },
});
