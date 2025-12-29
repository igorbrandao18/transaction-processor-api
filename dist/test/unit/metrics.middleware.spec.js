"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const metrics_middleware_1 = require("../../src/middleware/metrics.middleware");
const metrics_config_1 = require("../../src/config/metrics.config");
jest.mock('@config/metrics.config', () => ({
    httpRequestDuration: {
        observe: jest.fn(),
    },
    httpRequestTotal: {
        inc: jest.fn(),
    },
    httpRequestErrors: {
        inc: jest.fn(),
    },
}));
describe('MetricsMiddleware', () => {
    let middleware;
    let mockRequest;
    let mockResponse;
    let nextFunction;
    beforeEach(() => {
        middleware = new metrics_middleware_1.MetricsMiddleware();
        nextFunction = jest.fn();
        jest.useFakeTimers();
        mockRequest = {
            method: 'GET',
            path: '/api/transactions',
            route: { path: '/api/transactions' },
        };
        mockResponse = {
            statusCode: 200,
            on: jest.fn((event, callback) => {
                if (event === 'finish') {
                    setTimeout(callback, 0);
                }
                return mockResponse;
            }),
        };
    });
    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });
    it('should skip metrics for /api/metrics path', () => {
        Object.defineProperty(mockRequest, 'path', {
            value: '/api/metrics',
            writable: true,
            configurable: true,
        });
        middleware.use(mockRequest, mockResponse, nextFunction);
        expect(nextFunction).toHaveBeenCalledTimes(1);
        expect(mockResponse.on).not.toHaveBeenCalled();
    });
    it('should record metrics for successful requests', () => {
        middleware.use(mockRequest, mockResponse, nextFunction);
        const finishCallback = mockResponse.on.mock.calls.find((call) => call[0] === 'finish')?.[1];
        if (finishCallback) {
            finishCallback();
        }
        expect(nextFunction).toHaveBeenCalledTimes(1);
        expect(metrics_config_1.httpRequestDuration.observe).toHaveBeenCalled();
        expect(metrics_config_1.httpRequestTotal.inc).toHaveBeenCalledWith({
            method: 'GET',
            route: '/api/transactions',
            status: '200',
        });
        expect(metrics_config_1.httpRequestErrors.inc).not.toHaveBeenCalled();
    });
    it('should record error metrics for failed requests', () => {
        mockResponse.statusCode = 404;
        middleware.use(mockRequest, mockResponse, nextFunction);
        const finishCallback = mockResponse.on.mock.calls.find((call) => call[0] === 'finish')?.[1];
        if (finishCallback) {
            finishCallback();
        }
        expect(metrics_config_1.httpRequestErrors.inc).toHaveBeenCalledWith({
            method: 'GET',
            route: '/api/transactions',
            status: '404',
        });
    });
    it('should use path when route is not available', () => {
        mockRequest.route = undefined;
        Object.defineProperty(mockRequest, 'path', {
            value: '/some/path',
            writable: true,
            configurable: true,
        });
        middleware.use(mockRequest, mockResponse, nextFunction);
        const finishCallback = mockResponse.on.mock.calls.find((call) => call[0] === 'finish')?.[1];
        if (finishCallback) {
            finishCallback();
        }
        expect(metrics_config_1.httpRequestTotal.inc).toHaveBeenCalledWith({
            method: 'GET',
            route: '/some/path',
            status: '200',
        });
    });
});
//# sourceMappingURL=metrics.middleware.spec.js.map