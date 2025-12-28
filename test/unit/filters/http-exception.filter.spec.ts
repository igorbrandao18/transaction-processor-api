import { HttpExceptionFilter } from '@filters/http-exception.filter';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';
import { Request, Response } from 'express';
import { logger } from '@config/logger.config';

jest.mock('@config/logger.config');

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockArgumentsHost: Partial<ArgumentsHost>;

  beforeEach(() => {
    filter = new HttpExceptionFilter();

    mockRequest = {
      path: '/transactions',
      url: '/transactions',
      method: 'GET',
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    };

    jest.spyOn(logger, 'error').mockImplementation();
    jest.spyOn(logger, 'warn').mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should handle HttpException with status code', () => {
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

    filter.catch(exception, mockArgumentsHost as ArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.NOT_FOUND,
      timestamp: expect.any(String),
      path: '/transactions',
      message: 'Not Found',
    });
  });

  it('should handle HttpException with object response', () => {
    const exception = new HttpException(
      { message: 'Validation failed', errors: ['field1', 'field2'] },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockArgumentsHost as ArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      timestamp: expect.any(String),
      path: '/transactions',
      message: 'Validation failed',
      errors: ['field1', 'field2'],
    });
  });

  it('should handle non-HttpException as 500', () => {
    const exception = new Error('Internal error');

    filter.catch(exception, mockArgumentsHost as ArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: expect.any(String),
      path: '/transactions',
      message: 'Internal server error',
    });
  });

  it('should log warning for 404 errors', () => {
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

    filter.catch(exception, mockArgumentsHost as ArgumentsHost);

    expect(logger.warn).toHaveBeenCalledWith('Resource not found', {
      status: HttpStatus.NOT_FOUND,
      error: 'Not Found',
      path: '/transactions',
      method: 'GET',
    });
  });

  it('should log error for 500+ status codes', () => {
    const exception = new HttpException(
      'Internal Server Error',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );

    filter.catch(exception, mockArgumentsHost as ArgumentsHost);

    expect(logger.error).toHaveBeenCalledWith('Exception caught', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      stack: expect.any(String),
      path: '/transactions',
      method: 'GET',
    });
  });

  it('should log error for 503 status code', () => {
    const exception = new HttpException(
      'Service Unavailable',
      HttpStatus.SERVICE_UNAVAILABLE,
    );

    filter.catch(exception, mockArgumentsHost as ArgumentsHost);

    expect(logger.error).toHaveBeenCalled();
  });

  it('should log warning for 4xx client errors (except 404)', () => {
    const exception = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockArgumentsHost as ArgumentsHost);

    expect(logger.warn).toHaveBeenCalledWith('Client error', {
      status: HttpStatus.BAD_REQUEST,
      error: 'Bad Request',
      path: '/transactions',
      method: 'GET',
    });
  });

  it('should log warning for 409 status code', () => {
    const exception = new HttpException('Conflict', HttpStatus.CONFLICT);

    filter.catch(exception, mockArgumentsHost as ArgumentsHost);

    expect(logger.warn).toHaveBeenCalledWith('Client error', {
      status: HttpStatus.CONFLICT,
      error: 'Conflict',
      path: '/transactions',
      method: 'GET',
    });
  });

  it('should ignore 404 errors for ignored paths', () => {
    mockRequest.path = '/favicon.ico';
    mockRequest.url = '/favicon.ico';
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

    filter.catch(exception, mockArgumentsHost as ArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should ignore service-worker.js', () => {
    mockRequest.path = '/service-worker.js';
    mockRequest.url = '/service-worker.js';
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

    filter.catch(exception, mockArgumentsHost as ArgumentsHost);

    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should ignore robots.txt', () => {
    mockRequest.path = '/robots.txt';
    mockRequest.url = '/robots.txt';
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

    filter.catch(exception, mockArgumentsHost as ArgumentsHost);

    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should ignore manifest.json', () => {
    mockRequest.path = '/manifest.json';
    mockRequest.url = '/manifest.json';
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

    filter.catch(exception, mockArgumentsHost as ArgumentsHost);

    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should handle string error response', () => {
    const exception = new HttpException('Simple error', HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockArgumentsHost as ArgumentsHost);

    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      timestamp: expect.any(String),
      path: '/transactions',
      message: 'Simple error',
    });
  });

  it('should handle non-Error exceptions', () => {
    const exception = 'String exception';

    filter.catch(exception, mockArgumentsHost as ArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(logger.error).toHaveBeenCalledWith('Exception caught', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'String exception',
      stack: undefined,
      path: '/transactions',
      method: 'GET',
    });
  });

  it('should include timestamp in response', () => {
    const exception = new HttpException('Error', HttpStatus.BAD_REQUEST);
    const beforeTime = new Date().toISOString();

    filter.catch(exception, mockArgumentsHost as ArgumentsHost);

    const afterTime = new Date().toISOString();
    const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0];

    expect(callArgs.timestamp).toBeDefined();
    expect(callArgs.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(callArgs.timestamp >= beforeTime).toBe(true);
    expect(callArgs.timestamp <= afterTime).toBe(true);
  });
});
