import { Test, TestingModule } from '@nestjs/testing';
import { TransactionProcessor } from './transaction.processor';
import { TransactionsService } from '@services/transactions.service';
import type { Job } from 'bull';
import type { CreateTransactionDto } from '@dto/create-transaction.dto';
import { Transaction } from '@entities/transaction.entity';

describe('TransactionProcessor', () => {
  let processor: TransactionProcessor;
  let transactionsService: jest.Mocked<TransactionsService>;

  const mockCreateDto: CreateTransactionDto = {
    transactionId: 'txn-2024-01-15-abc123',
    amount: 100.5,
    currency: 'BRL',
    type: 'credit',
    status: 'pending',
    description: 'Test transaction',
  };

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

  const mockJob: Partial<Job<CreateTransactionDto>> = {
    id: 'txn-2024-01-15-abc123',
    data: mockCreateDto,
  };

  beforeEach(async () => {
    const mockTransactionsService = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionProcessor,
        {
          provide: TransactionsService,
          useValue: mockTransactionsService,
        },
      ],
    }).compile();

    processor = module.get<TransactionProcessor>(TransactionProcessor);
    transactionsService =
      module.get<jest.Mocked<TransactionsService>>(TransactionsService);
  });

  describe('handleTransaction', () => {
    it('should process transaction successfully', async () => {
      transactionsService.create.mockResolvedValue(mockTransaction);

      const result = await processor.handleTransaction(
        mockJob as Job<CreateTransactionDto>,
      );

      expect(transactionsService.create).toHaveBeenCalledWith(mockCreateDto);
      expect(transactionsService.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockTransaction);
    });

    it('should throw error when transaction creation fails', async () => {
      const error = new Error('Database error');
      transactionsService.create.mockRejectedValue(error);

      await expect(
        processor.handleTransaction(mockJob as Job<CreateTransactionDto>),
      ).rejects.toThrow('Database error');

      expect(transactionsService.create).toHaveBeenCalledWith(mockCreateDto);
    });

    it('should handle unknown errors', async () => {
      const unknownError = 'Unknown error';
      transactionsService.create.mockRejectedValue(unknownError);

      await expect(
        processor.handleTransaction(mockJob as Job<CreateTransactionDto>),
      ).rejects.toBe(unknownError);
    });
  });
});
