import { ErrorHandlerMiddleware } from '@middleware/error-handler.middleware';
import { Request, Response, NextFunction } from 'express';
import { logger } from '@config/logger.config';

jest.mock('@config/logger.config');

describe('ErrorHandlerMiddleware', () => {
  let middleware: ErrorHandlerMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let originalSend: Response['send'];

  beforeEach(() => {
    middleware = new ErrorHandlerMiddleware();
    mockNext = jest.fn();

    mockRequest = {
      path: '/transactions',
      method: 'GET',
    };

    originalSend = jest.fn().mockReturnValue(mockResponse);
    mockResponse = {
      statusCode: 200,
      send: originalSend,
    };

    jest.spyOn(logger, 'error').mockImplementation();
    jest.spyOn(logger, 'warn').mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call next', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should wrap res.send and call original send for success responses', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    const wrappedSend = mockResponse.send as jest.Mock;
    wrappedSend('success');

    expect(originalSend).toHaveBeenCalledWith('success');
    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should ignore 404 errors for ignored paths', () => {
    mockRequest.path = '/favicon.ico';
    mockResponse.statusCode = 404;

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    const wrappedSend = mockResponse.send as jest.Mock;
    wrappedSend('Not Found');

    expect(originalSend).toHaveBeenCalledWith('Not Found');
    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should ignore service-worker.js', () => {
    mockRequest.path = '/service-worker.js';
    mockResponse.statusCode = 404;

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    const wrappedSend = mockResponse.send as jest.Mock;
    wrappedSend('Not Found');

    expect(originalSend).toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should ignore robots.txt', () => {
    mockRequest.path = '/robots.txt';
    mockResponse.statusCode = 404;

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    const wrappedSend = mockResponse.send as jest.Mock;
    wrappedSend('Not Found');

    expect(originalSend).toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should ignore manifest.json', () => {
    mockRequest.path = '/manifest.json';
    mockResponse.statusCode = 404;

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    const wrappedSend = mockResponse.send as jest.Mock;
    wrappedSend('Not Found');

    expect(originalSend).toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should log error for 500+ status codes', () => {
    mockResponse.statusCode = 500;

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    const wrappedSend = mockResponse.send as jest.Mock;
    wrappedSend('Internal Server Error');

    expect(originalSend).toHaveBeenCalledWith('Internal Server Error');
    expect(logger.error).toHaveBeenCalledWith('HTTP Error Response', {
      statusCode: 500,
      path: '/transactions',
      method: 'GET',
    });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should log error for 503 status code', () => {
    mockResponse.statusCode = 503;

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    const wrappedSend = mockResponse.send as jest.Mock;
    wrappedSend('Service Unavailable');

    expect(logger.error).toHaveBeenCalledWith('HTTP Error Response', {
      statusCode: 503,
      path: '/transactions',
      method: 'GET',
    });
  });

  it('should log warning for 4xx client errors (except 404)', () => {
    mockResponse.statusCode = 400;

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    const wrappedSend = mockResponse.send as jest.Mock;
    wrappedSend('Bad Request');

    expect(originalSend).toHaveBeenCalledWith('Bad Request');
    expect(logger.warn).toHaveBeenCalledWith('HTTP Client Error Response', {
      statusCode: 400,
      path: '/transactions',
      method: 'GET',
    });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should log warning for 409 status code', () => {
    mockResponse.statusCode = 409;

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    const wrappedSend = mockResponse.send as jest.Mock;
    wrappedSend('Conflict');

    expect(logger.warn).toHaveBeenCalledWith('HTTP Client Error Response', {
      statusCode: 409,
      path: '/transactions',
      method: 'GET',
    });
  });

  it('should not log for 404 status code (non-ignored paths)', () => {
    mockRequest.path = '/unknown';
    mockResponse.statusCode = 404;

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    const wrappedSend = mockResponse.send as jest.Mock;
    wrappedSend('Not Found');

    expect(originalSend).toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should preserve this context when calling original send', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    const wrappedSend = mockResponse.send as jest.Mock;
    const mockThis = { statusCode: 200 };
    wrappedSend.call(mockThis, 'test');

    expect(originalSend).toHaveBeenCalled();
  });
});
