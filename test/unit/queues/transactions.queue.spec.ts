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
});
