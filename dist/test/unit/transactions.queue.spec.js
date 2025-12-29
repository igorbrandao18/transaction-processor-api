"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const bull_1 = require("@nestjs/bull");
const transactions_queue_1 = require("../../src/queues/transactions.queue");
const transaction_entity_1 = require("../../src/entities/transaction.entity");
describe('TransactionsQueue', () => {
    let queue;
    let mockQueue;
    const mockCreateDto = {
        transactionId: 'txn-2024-01-15-abc123',
        amount: 100.5,
        currency: 'BRL',
        type: transaction_entity_1.TransactionType.CREDIT,
        status: transaction_entity_1.TransactionStatus.PENDING,
    };
    const mockJob = {
        id: 'txn-2024-01-15-abc123',
        data: mockCreateDto,
        getState: jest.fn(),
        progress: jest.fn(),
        returnvalue: null,
        failedReason: undefined,
        processedOn: undefined,
        finishedOn: undefined,
    };
    beforeEach(async () => {
        mockQueue = {
            add: jest.fn(),
            getJobs: jest.fn(),
            getWaitingCount: jest.fn(),
            getActiveCount: jest.fn(),
            getCompletedCount: jest.fn(),
            getFailedCount: jest.fn(),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                transactions_queue_1.TransactionsQueue,
                {
                    provide: (0, bull_1.getQueueToken)('transactions'),
                    useValue: mockQueue,
                },
            ],
        }).compile();
        queue = module.get(transactions_queue_1.TransactionsQueue);
    });
    describe('addTransactionJob', () => {
        it('should add a transaction job to the queue', async () => {
            mockQueue.add = jest.fn().mockResolvedValue(mockJob);
            const result = await queue.addTransactionJob(mockCreateDto);
            expect(mockQueue.add).toHaveBeenCalledWith('process-transaction', mockCreateDto, {
                jobId: mockCreateDto.transactionId,
            });
            expect(result).toEqual({
                jobId: 'txn-2024-01-15-abc123',
                transactionId: 'txn-2024-01-15-abc123',
            });
        });
        it('should handle job with undefined id', async () => {
            const jobWithoutId = { ...mockJob, id: undefined };
            mockQueue.add = jest.fn().mockResolvedValue(jobWithoutId);
            const result = await queue.addTransactionJob(mockCreateDto);
            expect(result.jobId).toBe('');
            expect(result.transactionId).toBe(mockCreateDto.transactionId);
        });
        it('should handle queue errors', async () => {
            const error = new Error('Queue error');
            mockQueue.add = jest.fn().mockRejectedValue(error);
            await expect(queue.addTransactionJob(mockCreateDto)).rejects.toThrow('Queue error');
        });
    });
    describe('getJobStatus', () => {
        it('should return job status when job exists', async () => {
            const completedJob = {
                ...mockJob,
                getState: jest.fn().mockResolvedValue('completed'),
                progress: jest.fn().mockReturnValue(100),
                returnvalue: { id: '123', transactionId: 'txn-2024-01-15-abc123' },
                processedOn: 1234567890,
                finishedOn: 1234567900,
            };
            jest.spyOn(completedJob, 'getState');
            jest.spyOn(completedJob, 'progress');
            mockQueue.getJobs = jest.fn().mockResolvedValue([completedJob]);
            const result = await queue.getJobStatus('txn-2024-01-15-abc123');
            expect(mockQueue.getJobs).toHaveBeenCalledWith([
                'waiting',
                'active',
                'completed',
                'failed',
            ]);
            expect(result).toEqual({
                id: 'txn-2024-01-15-abc123',
                transactionId: 'txn-2024-01-15-abc123',
                state: 'completed',
                progress: 100,
                data: mockCreateDto,
                result: { id: '123', transactionId: 'txn-2024-01-15-abc123' },
                failedReason: undefined,
                processedOn: 1234567890,
                finishedOn: 1234567900,
            });
        });
        it('should return null when job does not exist', async () => {
            mockQueue.getJobs = jest.fn().mockResolvedValue([]);
            const result = await queue.getJobStatus('non-existent-job');
            expect(result).toBeNull();
        });
        it('should return null when job with different id exists', async () => {
            const otherJob = {
                ...mockJob,
                id: 'other-job-id',
            };
            mockQueue.getJobs = jest.fn().mockResolvedValue([otherJob]);
            const result = await queue.getJobStatus('txn-2024-01-15-abc123');
            expect(result).toBeNull();
        });
    });
    describe('getQueueStats', () => {
        it('should return queue statistics', async () => {
            mockQueue.getWaitingCount = jest.fn().mockResolvedValue(5);
            mockQueue.getActiveCount = jest.fn().mockResolvedValue(2);
            mockQueue.getCompletedCount = jest.fn().mockResolvedValue(100);
            mockQueue.getFailedCount = jest.fn().mockResolvedValue(3);
            const result = await queue.getQueueStats();
            expect(mockQueue.getWaitingCount).toHaveBeenCalledTimes(1);
            expect(mockQueue.getActiveCount).toHaveBeenCalledTimes(1);
            expect(mockQueue.getCompletedCount).toHaveBeenCalledTimes(1);
            expect(mockQueue.getFailedCount).toHaveBeenCalledTimes(1);
            expect(result).toEqual({
                waiting: 5,
                active: 2,
                completed: 100,
                failed: 3,
                total: 110,
            });
        });
        it('should handle zero counts', async () => {
            mockQueue.getWaitingCount = jest.fn().mockResolvedValue(0);
            mockQueue.getActiveCount = jest.fn().mockResolvedValue(0);
            mockQueue.getCompletedCount = jest.fn().mockResolvedValue(0);
            mockQueue.getFailedCount = jest.fn().mockResolvedValue(0);
            const result = await queue.getQueueStats();
            expect(result).toEqual({
                waiting: 0,
                active: 0,
                completed: 0,
                failed: 0,
                total: 0,
            });
        });
    });
});
//# sourceMappingURL=transactions.queue.spec.js.map