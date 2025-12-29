"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const queue_metrics_service_1 = require("../../src/services/queue-metrics.service");
const bull_1 = require("@nestjs/bull");
const metrics_config_1 = require("../../src/config/metrics.config");
jest.mock('@config/metrics.config', () => ({
    transactionsQueueSize: {
        set: jest.fn(),
    },
}));
describe('QueueMetricsService', () => {
    let service;
    let mockQueue;
    beforeEach(async () => {
        mockQueue = {
            getWaitingCount: jest.fn().mockResolvedValue(5),
            getActiveCount: jest.fn().mockResolvedValue(2),
            getCompletedCount: jest.fn().mockResolvedValue(100),
            getFailedCount: jest.fn().mockResolvedValue(3),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                queue_metrics_service_1.QueueMetricsService,
                {
                    provide: (0, bull_1.getQueueToken)('transactions'),
                    useValue: mockQueue,
                },
            ],
        }).compile();
        service = module.get(queue_metrics_service_1.QueueMetricsService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('onModuleInit', () => {
        it('should call updateQueueMetrics on init', async () => {
            await service.onModuleInit();
            await new Promise((resolve) => setTimeout(resolve, 100));
            expect(mockQueue.getWaitingCount).toHaveBeenCalled();
            expect(mockQueue.getActiveCount).toHaveBeenCalled();
            expect(mockQueue.getCompletedCount).toHaveBeenCalled();
            expect(mockQueue.getFailedCount).toHaveBeenCalled();
        }, 10000);
    });
    describe('updateQueueMetrics', () => {
        it('should update all queue metrics', async () => {
            await service.onModuleInit();
            await new Promise((resolve) => setTimeout(resolve, 100));
            expect(metrics_config_1.transactionsQueueSize.set).toHaveBeenCalledWith({ state: 'waiting' }, 5);
            expect(metrics_config_1.transactionsQueueSize.set).toHaveBeenCalledWith({ state: 'active' }, 2);
            expect(metrics_config_1.transactionsQueueSize.set).toHaveBeenCalledWith({ state: 'completed' }, 100);
            expect(metrics_config_1.transactionsQueueSize.set).toHaveBeenCalledWith({ state: 'failed' }, 3);
        }, 10000);
        it('should handle errors gracefully', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            mockQueue.getWaitingCount.mockRejectedValueOnce(new Error('Queue error'));
            await service.onModuleInit();
            await new Promise((resolve) => setTimeout(resolve, 100));
            expect(consoleErrorSpy).toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        }, 10000);
    });
});
//# sourceMappingURL=queue-metrics.service.spec.js.map