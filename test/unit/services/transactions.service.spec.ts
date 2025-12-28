import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from '@services/transactions.service';
import { TransactionsRepository } from '@repositories/transactions.repository';
import { CreateTransactionDto } from '@dto/create-transaction.dto';
import { QueryTransactionsDto } from '@dto/query-transactions.dto';
import {
  TransactionType,
  TransactionStatus,
} from '@entities/transaction.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { logger } from '@config/logger.config';

jest.mock('@config/logger.config');

describe('TransactionsService', () => {
  let service: TransactionsService;
  let repository: TransactionsRepository;

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
        TransactionsService,
        {
          provide: TransactionsRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByTransactionId: jest.fn(),
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    repository = module.get<TransactionsRepository>(TransactionsRepository);
    jest.spyOn(logger, 'info').mockImplementation();
    jest.spyOn(logger, 'warn').mockImplementation();
    jest.spyOn(logger, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateTransactionDto = {
      transactionId: 'test-123',
      amount: 100.5,
      currency: 'USD',
      type: TransactionType.CREDIT,
    };

    it('should create a new transaction', async () => {
      jest.spyOn(repository, 'findByTransactionId').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockResolvedValue(mockTransaction);

      const result = await service.create(createDto);

      expect(repository.findByTransactionId).toHaveBeenCalledWith('test-123');
      expect(repository.create).toHaveBeenCalled();
      expect(result).toEqual(mockTransaction);
    });

    it('should throw ConflictException if transaction already exists', async () => {
      jest
        .spyOn(repository, 'findByTransactionId')
        .mockResolvedValue(mockTransaction);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should handle race condition and return existing transaction', async () => {
      jest.spyOn(repository, 'findByTransactionId').mockResolvedValue(null);
      const error: any = new Error('Duplicate key');
      error.code = '23505';
      jest.spyOn(repository, 'create').mockRejectedValue(error);
      jest
        .spyOn(repository, 'findByTransactionId')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockTransaction);

      const result = await service.create(createDto);

      expect(result).toEqual(mockTransaction);
    });
  });

  describe('findOne', () => {
    it('should return a transaction by id', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(mockTransaction);

      const result = await service.findOne('uuid-123');

      expect(repository.findById).toHaveBeenCalledWith('uuid-123');
      expect(result).toEqual(mockTransaction);
    });

    it('should throw NotFoundException when transaction not found', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated transactions', async () => {
      const queryDto: QueryTransactionsDto = { page: 1, limit: 20 };
      const mockResult = {
        transactions: [mockTransaction],
        total: 1,
      };

      jest.spyOn(repository, 'findAll').mockResolvedValue(mockResult);

      const result = await service.findAll(queryDto);

      expect(repository.findAll).toHaveBeenCalled();
      expect(result.data).toEqual([mockTransaction]);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });
  });
});
