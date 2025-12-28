import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from '@controllers/transactions.controller';
import { TransactionsService } from '@services/transactions.service';
import { TransactionsQueue } from '@queues/transactions.queue';
import { CreateTransactionDto } from '@dto/create-transaction.dto';
import { QueryTransactionsDto } from '@dto/query-transactions.dto';
import {
  TransactionType,
  TransactionStatus,
} from '@entities/transaction.entity';
import { NotFoundException } from '@nestjs/common';
import { logger } from '@config/logger.config';

jest.mock('@config/logger.config');

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let service: TransactionsService;
  let queue: TransactionsQueue;

  const mockTransaction = {
    id: 'uuid-123',
    transactionId: 'test-123',
    amount: 100.5,
    currency: 'USD',
    type: TransactionType.CREDIT,
    status: TransactionStatus.PENDING,
    metadata: { source: 'test' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCreateDto: CreateTransactionDto = {
    transactionId: 'test-123',
    amount: 100.5,
    currency: 'USD',
    type: TransactionType.CREDIT,
    metadata: { source: 'test' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        {
          provide: TransactionsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: TransactionsQueue,
          useValue: {
            addTransaction: jest.fn().mockResolvedValue(undefined),
            getJobStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
    service = module.get<TransactionsService>(TransactionsService);
    queue = module.get<TransactionsQueue>(TransactionsQueue);
    jest.spyOn(logger, 'info').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should add transaction to queue', async () => {
      const result = await controller.create(mockCreateDto);

      expect(queue.addTransaction).toHaveBeenCalledWith(mockCreateDto);
      expect(result).toEqual({
        message: 'Transaction queued for processing',
        transactionId: 'test-123',
        status: 'queued',
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated transactions', async () => {
      const mockQueryDto: QueryTransactionsDto = { page: 1, limit: 20 };
      const mockResult = {
        data: [mockTransaction],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      };

      jest.spyOn(service, 'findAll').mockResolvedValue(mockResult);

      const result = await controller.findAll(mockQueryDto);

      expect(service.findAll).toHaveBeenCalledWith(mockQueryDto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findOne', () => {
    it('should return a transaction by id', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockTransaction);

      const result = await controller.findOne('uuid-123');

      expect(service.findOne).toHaveBeenCalledWith('uuid-123');
      expect(result).toEqual(mockTransaction);
    });

    it('should throw NotFoundException when transaction not found', async () => {
      const error = new NotFoundException('Transaction not found');
      jest.spyOn(service, 'findOne').mockRejectedValue(error);

      await expect(controller.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getQueueStatus', () => {
    it('should return queue job status', async () => {
      const mockStatus = {
        id: '1',
        transactionId: 'test-123',
        state: 'completed',
        progress: 100,
        result: mockTransaction,
        failedReason: null,
        processedOn: Date.now(),
        finishedOn: Date.now(),
      };

      jest.spyOn(queue, 'getJobStatus').mockResolvedValue(mockStatus);

      const result = await controller.getQueueStatus('test-123');

      expect(queue.getJobStatus).toHaveBeenCalledWith('test-123');
      expect(result).toEqual(mockStatus);
    });

    it('should throw NotFoundException when job not found', async () => {
      jest.spyOn(queue, 'getJobStatus').mockResolvedValue(null);

      await expect(controller.getQueueStatus('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
