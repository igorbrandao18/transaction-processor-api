import { LoggerMiddleware } from '@middleware/logger.middleware';
import { Request, Response, NextFunction } from 'express';
import { logger } from '@config/logger.config';

jest.mock('@config/logger.config');
jest.mock('@config/metrics.config', () => ({
  httpRequestDuration: {
    labels: jest.fn().mockReturnThis(),
    observe: jest.fn(),
  },
  httpRequestTotal: {
    labels: jest.fn().mockReturnThis(),
    inc: jest.fn(),
  },
}));

// Mock metrics to avoid unused variable errors
jest.mock('@config/metrics.config', () => ({
  httpRequestDuration: {
    labels: jest.fn().mockReturnThis(),
    observe: jest.fn(),
  },
  httpRequestTotal: {
    labels: jest.fn().mockReturnThis(),
    inc: jest.fn(),
  },
}));

describe('LoggerMiddleware', () => {
  let middleware: LoggerMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockHttpRequestDuration: jest.Mocked<any>;
  let mockHttpRequestTotal: jest.Mocked<any>;

  beforeEach(() => {
    middleware = new LoggerMiddleware();
    mockNext = jest.fn();

    mockHttpRequestDuration = {
      labels: jest.fn().mockReturnThis(),
      observe: jest.fn(),
    };

    mockHttpRequestTotal = {
      labels: jest.fn().mockReturnThis(),
      inc: jest.fn(),
    };

    (httpRequestDuration as any) = mockHttpRequestDuration;
    (httpRequestTotal as any) = mockHttpRequestTotal;

    mockRequest = {
      method: 'GET',
      path: '/transactions',
      query: { page: '1' },
      ip: '127.0.0.1',
      route: { path: '/transactions' },
      get: jest.fn().mockReturnValue('Mozilla/5.0'),
    };

    mockResponse = {
      statusCode: 200,
      on: jest.fn((event: string, callback: () => void) => {
        if (event === 'finish') {
          setTimeout(callback, 0);
        }
        return mockResponse as Response;
      }),
    };

    jest.spyOn(logger, 'info').mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should log incoming request and call next', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(logger.info).toHaveBeenCalledWith('Incoming request', {
      method: 'GET',
      path: '/transactions',
      query: { page: '1' },
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
    });
    expect(mockNext).toHaveBeenCalled();
  });

  it('should skip metrics endpoint', () => {
    mockRequest.path = '/metrics';
    mockRequest.route = { path: '/metrics' };

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(logger.info).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
  });

  it('should use path when route is not available', () => {
    mockRequest.route = undefined;

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(logger.info).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
  });

  it('should log request completion and record metrics on finish', (done) => {
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    // Trigger finish event
    const finishCallback = (mockResponse.on as jest.Mock).mock.calls.find(
      (call) => call[0] === 'finish',
    )?.[1];

    if (finishCallback) {
      finishCallback();

      setTimeout(() => {
        expect(logger.info).toHaveBeenCalledWith('Request completed', {
          method: 'GET',
          path: '/transactions',
          statusCode: 200,
          duration: expect.stringMatching(/\d+ms/),
        });

        expect(mockHttpRequestDuration.labels).toHaveBeenCalledWith(
          'GET',
          '/transactions',
          '200',
        );
        expect(mockHttpRequestDuration.observe).toHaveBeenCalled();

        expect(mockHttpRequestTotal.labels).toHaveBeenCalledWith(
          'GET',
          '/transactions',
          '200',
        );
        expect(mockHttpRequestTotal.inc).toHaveBeenCalled();

        done();
      }, 10);
    } else {
      done();
    }
  });

  it('should handle different status codes', (done) => {
    mockResponse.statusCode = 404;

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    const finishCallback = (mockResponse.on as jest.Mock).mock.calls.find(
      (call) => call[0] === 'finish',
    )?.[1];

    if (finishCallback) {
      finishCallback();

      setTimeout(() => {
        expect(mockHttpRequestTotal.labels).toHaveBeenCalledWith(
          'GET',
          '/transactions',
          '404',
        );
        done();
      }, 10);
    } else {
      done();
    }
  });

  it('should calculate duration correctly', (done) => {
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    const finishCallback = (mockResponse.on as jest.Mock).mock.calls.find(
      (call) => call[0] === 'finish',
    )?.[1];

    if (finishCallback) {
      setTimeout(() => {
        finishCallback();

        setTimeout(() => {
          const duration = mockHttpRequestDuration.observe.mock.calls[0][0];
          expect(duration).toBeGreaterThanOrEqual(0);
          expect(duration).toBeLessThan(1); // Should be in seconds
          done();
        }, 10);
      }, 5);
    } else {
      done();
    }
  });
});
