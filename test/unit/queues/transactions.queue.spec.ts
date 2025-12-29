import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { TransactionsQueue } from '@queues/transactions.queue';
import { CreateTransactionDto } from '@dto/create-transaction.dto';
import { TransactionType } from '@entities/transaction.entity';
import { TRANSACTION_QUEUE_NAME } from '@config/bullmq.config';
import type { Queue } from 'bull';

describe('TransactionsQueue', () => {
  let queue: TransactionsQueue;
  let mockBullQueue: Partial<Queue<CreateTransactionDto>>;

  const mockCreateDto: CreateTransactionDto = {
    transactionId: 'test-123',
    amount: 100.5,
    currency: 'USD',
    type: TransactionType.CREDIT,
  };

  beforeEach(async () => {
    mockBullQueue = {
      add: jest.fn().mockResolvedValue({
        id: '1',
        data: mockCreateDto,
      } as any),
      getJob: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsQueue,
        {
          provide: getQueueToken(TRANSACTION_QUEUE_NAME),
          useValue: mockBullQueue,
        },
      ],
    }).compile();

    queue = module.get<TransactionsQueue>(TransactionsQueue);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addTransaction', () => {
    it('should add transaction to queue with correct options', async () => {
      await queue.addTransaction(mockCreateDto);

      expect(mockBullQueue.add).toHaveBeenCalledWith(
        'process-transaction',
        mockCreateDto,
        expect.objectContaining({
          jobId: 'test-123',
          attempts: expect.any(Number),
          backoff: expect.objectContaining({
            type: 'exponential',
            delay: expect.any(Number),
          }),
        }),
      );
    });

    it('should use default attempts when BULLMQ_DEFAULT_ATTEMPTS is not set', async () => {
      const originalAttempts = process.env.BULLMQ_DEFAULT_ATTEMPTS;
      delete process.env.BULLMQ_DEFAULT_ATTEMPTS;

      await queue.addTransaction(mockCreateDto);

      const callArgs = (mockBullQueue.add as jest.Mock).mock.calls[0];
      expect(callArgs[2].attempts).toBe(3);

      process.env.BULLMQ_DEFAULT_ATTEMPTS = originalAttempts;
    });

    it('should use default backoff delay when BULLMQ_BACKOFF_DELAY is not set', async () => {
      const originalDelay = process.env.BULLMQ_BACKOFF_DELAY;
      delete process.env.BULLMQ_BACKOFF_DELAY;

      await queue.addTransaction(mockCreateDto);

      const callArgs = (mockBullQueue.add as jest.Mock).mock.calls[0];
      expect(callArgs[2].backoff.delay).toBe(2000);

      process.env.BULLMQ_BACKOFF_DELAY = originalDelay;
    });

    it('should use transactionId as jobId for idempotency', async () => {
      const dtoWithDifferentId: CreateTransactionDto = {
        ...mockCreateDto,
        transactionId: 'unique-id-456',
      };

      await queue.addTransaction(dtoWithDifferentId);

      expect(mockBullQueue.add).toHaveBeenCalledWith(
        'process-transaction',
        dtoWithDifferentId,
        expect.objectContaining({
          jobId: 'unique-id-456',
        }),
      );
    });
  });

  describe('getJobStatus', () => {
    it('should return job status when job exists', async () => {
      const mockJob = {
        id: '1',
        data: mockCreateDto,
        progress: jest.fn().mockResolvedValue(100),
        getState: jest.fn().mockResolvedValue('completed'),
        returnvalue: { id: 'uuid-123', transactionId: 'test-123' },
        failedReason: null,
        processedOn: Date.now(),
        finishedOn: Date.now(),
      } as any;

      (mockBullQueue.getJob as jest.Mock).mockResolvedValue(mockJob);

      const status = await queue.getJobStatus('test-123');

      expect(mockBullQueue.getJob).toHaveBeenCalledWith('test-123');
      expect(mockJob.getState).toHaveBeenCalled();
      expect(status).toEqual({
        id: '1',
        transactionId: 'test-123',
        state: 'completed',
        progress: 100,
        result: { id: 'uuid-123', transactionId: 'test-123' },
        failedReason: null,
        processedOn: expect.any(Number),
        finishedOn: expect.any(Number),
      });
    });

    it('should return null when job does not exist', async () => {
      (mockBullQueue.getJob as jest.Mock).mockResolvedValue(null);

      const status = await queue.getJobStatus('non-existent');

      expect(status).toBeNull();
      expect(mockBullQueue.getJob).toHaveBeenCalledWith('non-existent');
    });

    it('should handle failed job status', async () => {
      const mockJob = {
        id: '2',
        data: mockCreateDto,
        progress: jest.fn().mockResolvedValue(0),
        getState: jest.fn().mockResolvedValue('failed'),
        returnvalue: null,
        failedReason: 'Processing error',
        processedOn: Date.now(),
        finishedOn: null,
      } as any;

      (mockBullQueue.getJob as jest.Mock).mockResolvedValue(mockJob);

      const status = await queue.getJobStatus('test-123');

      expect(mockJob.getState).toHaveBeenCalled();
      expect(status?.state).toBe('failed');
      expect(status?.failedReason).toBe('Processing error');
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      const mockWaitingJobs = [
        {
          id: '1',
          data: mockCreateDto,
          timestamp: Date.now(),
        },
      ];
      const mockActiveJobs = [
        {
          id: '2',
          data: mockCreateDto,
          timestamp: Date.now(),
        },
      ];
      const mockCompletedJobs: any[] = [];
      const mockFailedJobs: any[] = [];
      const mockDelayedJobs: any[] = [];

      mockBullQueue.getWaiting = jest
        .fn()
        .mockResolvedValue(mockWaitingJobs as any);
      mockBullQueue.getActive = jest
        .fn()
        .mockResolvedValue(mockActiveJobs as any);
      mockBullQueue.getCompleted = jest
        .fn()
        .mockResolvedValue(mockCompletedJobs);
      mockBullQueue.getFailed = jest.fn().mockResolvedValue(mockFailedJobs);
      mockBullQueue.getDelayed = jest.fn().mockResolvedValue(mockDelayedJobs);

      const stats = await queue.getQueueStats();

      expect(stats).toEqual({
        waiting: 1,
        active: 1,
        completed: 0,
        failed: 0,
        delayed: 0,
        jobs: {
          waiting: [
            {
              id: '1',
              transactionId: 'test-123',
              createdAt: expect.any(String),
            },
          ],
          active: [
            {
              id: '2',
              transactionId: 'test-123',
              createdAt: expect.any(String),
            },
          ],
          delayed: [],
        },
      });
    });

    it('should handle delayed jobs with delay property', async () => {
      const mockDelayedJob = {
        id: '3',
        data: mockCreateDto,
        timestamp: Date.now(),
        delay: 5000,
      };

      mockBullQueue.getWaiting = jest.fn().mockResolvedValue([]);
      mockBullQueue.getActive = jest.fn().mockResolvedValue([]);
      mockBullQueue.getCompleted = jest.fn().mockResolvedValue([]);
      mockBullQueue.getFailed = jest.fn().mockResolvedValue([]);
      mockBullQueue.getDelayed = jest
        .fn()
        .mockResolvedValue([mockDelayedJob] as any);

      const stats = await queue.getQueueStats();

      expect(stats.delayed).toBe(1);
      expect(stats.jobs.delayed[0].delay).toBe(5000);
    });

    it('should handle empty queue', async () => {
      mockBullQueue.getWaiting = jest.fn().mockResolvedValue([]);
      mockBullQueue.getActive = jest.fn().mockResolvedValue([]);
      mockBullQueue.getCompleted = jest.fn().mockResolvedValue([]);
      mockBullQueue.getFailed = jest.fn().mockResolvedValue([]);
      mockBullQueue.getDelayed = jest.fn().mockResolvedValue([]);

      const stats = await queue.getQueueStats();

      expect(stats.waiting).toBe(0);
      expect(stats.active).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.failed).toBe(0);
      expect(stats.delayed).toBe(0);
    });

    it('should handle delayed jobs without delay property', async () => {
      const mockDelayedJob = {
        id: '4',
        data: mockCreateDto,
        timestamp: Date.now(),
      };

      mockBullQueue.getWaiting = jest.fn().mockResolvedValue([]);
      mockBullQueue.getActive = jest.fn().mockResolvedValue([]);
      mockBullQueue.getCompleted = jest.fn().mockResolvedValue([]);
      mockBullQueue.getFailed = jest.fn().mockResolvedValue([]);
      mockBullQueue.getDelayed = jest
        .fn()
        .mockResolvedValue([mockDelayedJob] as any);

      const stats = await queue.getQueueStats();

      expect(stats.delayed).toBe(1);
      expect(stats.jobs.delayed[0].delay).toBe(0);
    });
  });

  describe('getJobStatus', () => {
    it('should handle job with progress as number instead of function', async () => {
      const mockJob = {
        id: '5',
        data: mockCreateDto,
        progress: 50,
        getState: jest.fn().mockResolvedValue('active'),
        returnvalue: null,
        failedReason: null,
        processedOn: Date.now(),
        finishedOn: null,
      } as any;

      (mockBullQueue.getJob as jest.Mock).mockResolvedValue(mockJob);

      const status = await queue.getJobStatus('test-123');

      expect(status?.progress).toBe(50);
    });
  });
});
