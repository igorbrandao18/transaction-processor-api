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
            updateStatus: jest.fn(),
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

    it('should handle race condition with duplicate message', async () => {
      jest.spyOn(repository, 'findByTransactionId').mockResolvedValue(null);
      const error: any = new Error('duplicate key value');
      error.message = 'duplicate key value';
      jest.spyOn(repository, 'create').mockRejectedValue(error);
      jest
        .spyOn(repository, 'findByTransactionId')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockTransaction);

      const result = await service.create(createDto);

      expect(result).toEqual(mockTransaction);
    });

    it('should handle race condition but not find existing transaction', async () => {
      jest.spyOn(repository, 'findByTransactionId').mockResolvedValue(null);
      const error: any = new Error('Duplicate key');
      error.code = '23505';
      jest.spyOn(repository, 'create').mockRejectedValue(error);
      jest
        .spyOn(repository, 'findByTransactionId')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      await expect(service.create(createDto)).rejects.toThrow('Duplicate key');
    });

    it('should throw error when create fails with non-duplicate error', async () => {
      jest.spyOn(repository, 'findByTransactionId').mockResolvedValue(null);
      const error = new Error('Database error');
      jest.spyOn(repository, 'create').mockRejectedValue(error);

      await expect(service.create(createDto)).rejects.toThrow('Database error');
    });

    it('should handle error with duplicate message but no code', async () => {
      jest.spyOn(repository, 'findByTransactionId').mockResolvedValue(null);
      const error: any = new Error('duplicate entry found');
      error.code = undefined;
      jest.spyOn(repository, 'create').mockRejectedValue(error);
      jest
        .spyOn(repository, 'findByTransactionId')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockTransaction);

      const result = await service.create(createDto);

      expect(result).toEqual(mockTransaction);
    });

    it('should handle error with code but no duplicate message', async () => {
      jest.spyOn(repository, 'findByTransactionId').mockResolvedValue(null);
      const error: any = new Error('Some other error');
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

    it('should calculate totalPages correctly', async () => {
      const queryDto: QueryTransactionsDto = { page: 1, limit: 10 };
      const mockResult = {
        transactions: [mockTransaction],
        total: 25,
      };

      jest.spyOn(repository, 'findAll').mockResolvedValue(mockResult);

      const result = await service.findAll(queryDto);

      expect(result.pagination.totalPages).toBe(3);
    });

    it('should use default page and limit when not provided', async () => {
      const queryDto: QueryTransactionsDto = {};
      const mockResult = {
        transactions: [mockTransaction],
        total: 1,
      };

      jest.spyOn(repository, 'findAll').mockResolvedValue(mockResult);

      await service.findAll(queryDto);

      expect(repository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        status: undefined,
        type: undefined,
        startDate: undefined,
        endDate: undefined,
      });
    });

    it('should pass all filters to repository', async () => {
      const queryDto: QueryTransactionsDto = {
        page: 2,
        limit: 10,
        status: TransactionStatus.COMPLETED,
        type: TransactionType.CREDIT,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };
      const mockResult = {
        transactions: [mockTransaction],
        total: 5,
      };

      jest.spyOn(repository, 'findAll').mockResolvedValue(mockResult);

      await service.findAll(queryDto);

      expect(repository.findAll).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        status: TransactionStatus.COMPLETED,
        type: TransactionType.CREDIT,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });
    });
  });

  describe('updateStatus', () => {
    it('should update transaction status', async () => {
      const updatedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.COMPLETED,
      };

      jest
        .spyOn(repository, 'updateStatus')
        .mockResolvedValue(updatedTransaction);

      const result = await service.updateStatus(
        'uuid-123',
        TransactionStatus.COMPLETED,
      );

      expect(repository.updateStatus).toHaveBeenCalledWith(
        'uuid-123',
        TransactionStatus.COMPLETED,
      );
      expect(result.status).toBe(TransactionStatus.COMPLETED);
    });
  });

  describe('findByTransactionId', () => {
    it('should find transaction by transactionId', async () => {
      jest
        .spyOn(repository, 'findByTransactionId')
        .mockResolvedValue(mockTransaction);

      const result = await service.findByTransactionId('test-123');

      expect(repository.findByTransactionId).toHaveBeenCalledWith('test-123');
      expect(result).toEqual(mockTransaction);
    });

    it('should return null when transaction not found', async () => {
      jest.spyOn(repository, 'findByTransactionId').mockResolvedValue(null);

      const result = await service.findByTransactionId('non-existent');

      expect(result).toBeNull();
    });
  });
});
