import { ValidationPipe, HttpException } from '@nestjs/common';
import { validationPipeConfig } from '@config/validation.config';
import { logger } from '@config/logger.config';

jest.mock('@config/logger.config');

describe('validation.config', () => {
  it('should export a ValidationPipe instance', () => {
    expect(validationPipeConfig).toBeInstanceOf(ValidationPipe);
  });

  it('should have exceptionFactory defined', () => {
    const exceptionFactory = (validationPipeConfig as any).exceptionFactory;
    expect(exceptionFactory).toBeDefined();
    expect(typeof exceptionFactory).toBe('function');
  });

  it('should log errors in exceptionFactory', () => {
    const errors = [{ property: 'test', constraints: {} }];
    const factory = (validationPipeConfig as any).exceptionFactory;

    factory(errors);

    expect(logger.error).toHaveBeenCalledWith('Validation error', { errors });
  });

  it('should return HttpException from exceptionFactory', () => {
    const errors = [{ property: 'test', constraints: {} }];
    const factory = (validationPipeConfig as any).exceptionFactory;

    const result = factory(errors);

    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(HttpException);
    expect(result.getStatus()).toBe(400);
  });
});
