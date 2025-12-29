import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from '@services/transactions.service';
import { TransactionsQueue } from '@queues/transactions.queue';
import { CreateTransactionDto } from '@dto/create-transaction.dto';
import { QueryTransactionsDto } from '@dto/query-transactions.dto';
import { Transaction } from '@entities/transaction.entity';
import { PaginatedTransactionsResponseDto } from '@dto/pagination-response.dto';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let transactionsService: jest.Mocked<TransactionsService>;
  let transactionsQueue: jest.Mocked<TransactionsQueue>;

  const mockTransaction: Transaction = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    transactionId: 'txn-2024-01-15-abc123',
    amount: 100.5,
    currency: 'BRL',
    type: 'credit',
    status: 'pending',
    description: 'Test transaction',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  };

  const mockCreateDto: CreateTransactionDto = {
    transactionId: 'txn-2024-01-15-abc123',
    amount: 100.5,
    currency: 'BRL',
    type: 'credit',
    status: 'pending',
    description: 'Test transaction',
  };

  beforeEach(async () => {
    const mockTransactionsService = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      getMetadata: jest.fn(),
    };

    const mockTransactionsQueue = {
      addTransactionJob: jest.fn(),
      getJobStatus: jest.fn(),
      getQueueStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        {
          provide: TransactionsService,
          useValue: mockTransactionsService,
        },
        {
          provide: TransactionsQueue,
          useValue: mockTransactionsQueue,
        },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
    transactionsService =
      module.get<jest.Mocked<TransactionsService>>(TransactionsService);
    transactionsQueue =
      module.get<jest.Mocked<TransactionsQueue>>(TransactionsQueue);
  });

  describe('create', () => {
    it('should queue a transaction and return 202 Accepted', async () => {
      const expectedResponse = {
        message: 'Transaction queued for processing',
        jobId: 'txn-2024-01-15-abc123',
        transactionId: 'txn-2024-01-15-abc123',
      };

      transactionsQueue.addTransactionJob.mockResolvedValue({
        jobId: 'txn-2024-01-15-abc123',
        transactionId: 'txn-2024-01-15-abc123',
      });

      const result = await controller.create(mockCreateDto);

      expect(transactionsQueue.addTransactionJob).toHaveBeenCalledWith(
        mockCreateDto,
      );
      expect(transactionsQueue.addTransactionJob).toHaveBeenCalledTimes(1);
      expect(transactionsService.create).not.toHaveBeenCalled();
      expect(result).toEqual(expectedResponse);
    });

    it('should handle queue errors', async () => {
      const error = new Error('Queue error');
      transactionsQueue.addTransactionJob.mockRejectedValue(error);

      await expect(controller.create(mockCreateDto)).rejects.toThrow(
        'Queue error',
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated transactions', async () => {
      const query: QueryTransactionsDto = {
        page: 1,
        limit: 10,
      };

      const mockPaginatedResponse: PaginatedTransactionsResponseDto = {
        data: [mockTransaction],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      transactionsService.findAll.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.findAll(query);

      expect(transactionsService.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockPaginatedResponse);
    });
  });

  describe('getMetadata', () => {
    it('should return transaction metadata', async () => {
      const mockMetadata = {
        types: ['credit', 'debit'],
        statuses: ['pending', 'completed', 'failed'],
        currencies: ['BRL', 'USD', 'EUR'],
      };

      transactionsService.getMetadata.mockResolvedValue(mockMetadata);

      const result = await controller.getMetadata();

      expect(transactionsService.getMetadata).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockMetadata);
    });
  });

  describe('findOne', () => {
    it('should return a transaction by id', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';

      transactionsService.findById.mockResolvedValue(mockTransaction);

      const result = await controller.findOne(id);

      expect(transactionsService.findById).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockTransaction);
    });

    it('should throw error if transaction not found', async () => {
      const id = 'non-existent-id';
      const error = new Error('Transaction not found');

      transactionsService.findById.mockRejectedValue(error);

      await expect(controller.findOne(id)).rejects.toThrow(
        'Transaction not found',
      );
    });
  });

  describe('getQueueStatus', () => {
    it('should return job status', async () => {
      const transactionId = 'txn-2024-01-15-abc123';
      const mockStatus = {
        id: transactionId,
        transactionId,
        state: 'completed',
        progress: 100,
        data: mockCreateDto,
        result: mockTransaction,
        failedReason: null,
        processedOn: Date.now(),
        finishedOn: Date.now(),
      };

      transactionsQueue.getJobStatus.mockResolvedValue(mockStatus);

      const result = await controller.getQueueStatus(transactionId);

      expect(transactionsQueue.getJobStatus).toHaveBeenCalledWith(
        transactionId,
      );
      expect(result).toEqual(mockStatus);
    });

    it('should throw error if job not found', async () => {
      const transactionId = 'non-existent-job';

      transactionsQueue.getJobStatus.mockResolvedValue(null);

      await expect(controller.getQueueStatus(transactionId)).rejects.toThrow(
        `Job with transactionId "${transactionId}" not found`,
      );
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      const mockStats = {
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
        total: 110,
      };

      transactionsQueue.getQueueStats.mockResolvedValue(mockStats);

      const result = await controller.getQueueStats();

      expect(transactionsQueue.getQueueStats).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockStats);
    });
  });
});
