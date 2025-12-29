import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { TransactionsQueue } from './transactions.queue';
import type { Queue } from 'bull';
import type { CreateTransactionDto } from '@dto/create-transaction.dto';
import type { Job } from 'bull';

describe('TransactionsQueue', () => {
  let queue: TransactionsQueue;
  let mockQueue: jest.Mocked<Queue>;

  const mockCreateDto: CreateTransactionDto = {
    transactionId: 'txn-2024-01-15-abc123',
    amount: 100.5,
    currency: 'BRL',
    type: 'credit',
    status: 'pending',
    description: 'Test transaction',
  };

  const mockJob: Partial<Job<CreateTransactionDto>> = {
    id: 'txn-2024-01-15-abc123',
    data: mockCreateDto,
    getState: jest.fn(),
    progress: jest.fn(),
    returnvalue: null,
    failedReason: null,
    processedOn: null,
    finishedOn: null,
  };

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn(),
      getJobs: jest.fn(),
      getWaitingCount: jest.fn(),
      getActiveCount: jest.fn(),
      getCompletedCount: jest.fn(),
      getFailedCount: jest.fn(),
    } as unknown as jest.Mocked<Queue>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsQueue,
        {
          provide: getQueueToken('transactions'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    queue = module.get<TransactionsQueue>(TransactionsQueue);
  });

  describe('addTransactionJob', () => {
    it('should add a transaction job to the queue', async () => {
      mockQueue.add = jest.fn().mockResolvedValue(mockJob as Job);

      const result = await queue.addTransactionJob(mockCreateDto);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'process-transaction',
        mockCreateDto,
        {
          jobId: mockCreateDto.transactionId,
        },
      );
      expect(result).toEqual({
        jobId: 'txn-2024-01-15-abc123',
        transactionId: 'txn-2024-01-15-abc123',
      });
    });

    it('should handle job with undefined id', async () => {
      const jobWithoutId = { ...mockJob, id: undefined };
      mockQueue.add = jest.fn().mockResolvedValue(jobWithoutId as Job);

      const result = await queue.addTransactionJob(mockCreateDto);

      expect(result.jobId).toBe('');
      expect(result.transactionId).toBe(mockCreateDto.transactionId);
    });

    it('should handle queue errors', async () => {
      const error = new Error('Queue error');
      mockQueue.add = jest.fn().mockRejectedValue(error);

      await expect(queue.addTransactionJob(mockCreateDto)).rejects.toThrow(
        'Queue error',
      );
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
      } as unknown as Job;

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
        failedReason: null,
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
      } as unknown as Job;

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
