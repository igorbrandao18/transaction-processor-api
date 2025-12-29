import { Test, TestingModule } from '@nestjs/testing';
import { TransactionProcessor } from '@processors/transaction.processor';
import { TransactionsService } from '@services/transactions.service';
import { CreateTransactionDto } from '@dto/create-transaction.dto';
import {
  TransactionType,
  TransactionStatus,
} from '@entities/transaction.entity';
import type { Job } from 'bull';
import { logger } from '@config/logger.config';

jest.mock('@config/logger.config');

describe('TransactionProcessor', () => {
  let processor: TransactionProcessor;
  let service: TransactionsService;

  const mockCreateDto: CreateTransactionDto = {
    transactionId: 'test-123',
    amount: 100.5,
    currency: 'USD',
    type: TransactionType.CREDIT,
  };

  const mockTransaction = {
    id: 'uuid-123',
    transactionId: 'test-123',
    amount: 100.5,
    currency: 'USD',
    type: TransactionType.CREDIT,
    status: TransactionStatus.PENDING,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionProcessor,
        {
          provide: TransactionsService,
          useValue: {
            create: jest.fn(),
            updateStatus: jest.fn(),
            findByTransactionId: jest.fn(),
          },
        },
      ],
    }).compile();

    processor = module.get<TransactionProcessor>(TransactionProcessor);
    service = module.get<TransactionsService>(TransactionsService);
    jest.spyOn(logger, 'info').mockImplementation();
    jest.spyOn(logger, 'error').mockImplementation();
    jest.spyOn(logger, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleTransaction', () => {
    it('should process transaction successfully', async () => {
      const mockJob = {
        id: '1',
        data: mockCreateDto,
        attemptsMade: 0,
      } as Job<CreateTransactionDto>;

      const completedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.COMPLETED,
      };

      jest.spyOn(service, 'create').mockResolvedValue(mockTransaction);
      jest
        .spyOn(service, 'updateStatus')
        .mockResolvedValue(completedTransaction);

      const result = await processor.handleTransaction(mockJob);

      expect(service.create).toHaveBeenCalledWith({
        transactionId: 'test-123',
        amount: 100.5,
        currency: 'USD',
        type: TransactionType.CREDIT,
      });
      expect(service.updateStatus).toHaveBeenCalledWith(
        'uuid-123',
        TransactionStatus.COMPLETED,
      );
      expect(result).toEqual(completedTransaction);
      expect(result.status).toBe(TransactionStatus.COMPLETED);
      expect(logger.info).toHaveBeenCalledWith(
        'Processing transaction from queue',
        expect.objectContaining({
          jobId: '1',
          transactionId: 'test-123',
          attempt: 1,
        }),
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Transaction processed successfully',
        expect.objectContaining({
          jobId: '1',
          transactionId: 'test-123',
          transactionStatus: TransactionStatus.COMPLETED,
        }),
      );
    });

    it('should log error and throw when processing fails', async () => {
      const mockJob = {
        id: '2',
        data: mockCreateDto,
        attemptsMade: 0,
      } as Job<CreateTransactionDto>;

      const error = new Error('Database error');
      jest.spyOn(service, 'create').mockRejectedValue(error);
      jest.spyOn(service, 'findByTransactionId').mockResolvedValue(null);

      await expect(processor.handleTransaction(mockJob)).rejects.toThrow(
        'Database error',
      );

      expect(service.findByTransactionId).toHaveBeenCalledWith('test-123');
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to process transaction',
        expect.objectContaining({
          jobId: '2',
          transactionId: 'test-123',
          error: 'Database error',
          attempt: 1,
        }),
      );
    });

    it('should log attempt number correctly', async () => {
      const mockJob = {
        id: '3',
        data: mockCreateDto,
        attemptsMade: 2,
      } as Job<CreateTransactionDto>;

      const completedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.COMPLETED,
      };

      jest.spyOn(service, 'create').mockResolvedValue(mockTransaction);
      jest
        .spyOn(service, 'updateStatus')
        .mockResolvedValue(completedTransaction);

      await processor.handleTransaction(mockJob);

      expect(logger.info).toHaveBeenCalledWith(
        'Processing transaction from queue',
        expect.objectContaining({
          jobId: '3',
          transactionId: 'test-123',
          attempt: 3,
        }),
      );
    });

    it('should update transaction status to failed when error occurs and transaction exists with PENDING status', async () => {
      const mockJob = {
        id: '4',
        data: mockCreateDto,
        attemptsMade: 0,
      } as Job<CreateTransactionDto>;

      const error = new Error('Processing error');
      jest.spyOn(service, 'create').mockRejectedValue(error);
      jest
        .spyOn(service, 'findByTransactionId')
        .mockResolvedValue(mockTransaction);
      jest.spyOn(service, 'updateStatus').mockResolvedValue({
        ...mockTransaction,
        status: TransactionStatus.FAILED,
      });

      await expect(processor.handleTransaction(mockJob)).rejects.toThrow(
        'Processing error',
      );

      expect(service.findByTransactionId).toHaveBeenCalledWith('test-123');
      expect(service.updateStatus).toHaveBeenCalledWith(
        'uuid-123',
        TransactionStatus.FAILED,
      );
    });

    it('should handle updateStatus failure gracefully', async () => {
      const mockJob = {
        id: '5',
        data: mockCreateDto,
        attemptsMade: 0,
      } as Job<CreateTransactionDto>;

      const error = new Error('Processing error');
      const updateError = new Error('Update failed');
      jest.spyOn(service, 'create').mockRejectedValue(error);
      jest
        .spyOn(service, 'findByTransactionId')
        .mockResolvedValue(mockTransaction);
      jest.spyOn(service, 'updateStatus').mockRejectedValue(updateError);

      await expect(processor.handleTransaction(mockJob)).rejects.toThrow(
        'Processing error',
      );

      expect(logger.warn).toHaveBeenCalledWith(
        'Could not update transaction status to failed',
        expect.objectContaining({
          transactionId: 'test-123',
          error: 'Update failed',
        }),
      );
    });

    it('should not update status when transaction exists but status is not PENDING', async () => {
      const mockJob = {
        id: '6',
        data: mockCreateDto,
        attemptsMade: 0,
      } as Job<CreateTransactionDto>;

      const error = new Error('Processing error');
      const completedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.COMPLETED,
      };
      jest.spyOn(service, 'create').mockRejectedValue(error);
      jest
        .spyOn(service, 'findByTransactionId')
        .mockResolvedValue(completedTransaction);

      await expect(processor.handleTransaction(mockJob)).rejects.toThrow(
        'Processing error',
      );

      expect(service.updateStatus).not.toHaveBeenCalled();
    });

    it('should not update status when error response indicates transaction already exists', async () => {
      const mockJob = {
        id: '7',
        data: mockCreateDto,
        attemptsMade: 0,
      } as Job<CreateTransactionDto>;

      const error: any = new Error('Conflict');
      error.response = { error: 'Transaction already exists' };
      jest.spyOn(service, 'create').mockRejectedValue(error);

      await expect(processor.handleTransaction(mockJob)).rejects.toThrow(
        'Conflict',
      );

      expect(service.findByTransactionId).not.toHaveBeenCalled();
      expect(service.updateStatus).not.toHaveBeenCalled();
    });

    it('should handle error without response property', async () => {
      const mockJob = {
        id: '8',
        data: mockCreateDto,
        attemptsMade: 0,
      } as Job<CreateTransactionDto>;

      const error = new Error('Processing error');
      jest.spyOn(service, 'create').mockRejectedValue(error);
      jest.spyOn(service, 'findByTransactionId').mockResolvedValue(null);

      await expect(processor.handleTransaction(mockJob)).rejects.toThrow(
        'Processing error',
      );

      expect(service.findByTransactionId).toHaveBeenCalled();
    });

    it('should handle error with null response', async () => {
      const mockJob = {
        id: '9',
        data: mockCreateDto,
        attemptsMade: 0,
      } as Job<CreateTransactionDto>;

      const error: any = new Error('Processing error');
      error.response = null;
      jest.spyOn(service, 'create').mockRejectedValue(error);
      jest.spyOn(service, 'findByTransactionId').mockResolvedValue(null);

      await expect(processor.handleTransaction(mockJob)).rejects.toThrow(
        'Processing error',
      );

      expect(service.findByTransactionId).toHaveBeenCalled();
    });
  });
});
