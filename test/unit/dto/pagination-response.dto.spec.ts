import {
  PaginationMetaDto,
  PaginatedTransactionsResponseDto,
} from '@dto/pagination-response.dto';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from '@entities/transaction.entity';

describe('PaginationResponseDto', () => {
  describe('PaginationMetaDto', () => {
    it('should be defined', () => {
      expect(PaginationMetaDto).toBeDefined();
    });

    it('should create a valid instance', () => {
      const dto = new PaginationMetaDto();
      dto.page = 1;
      dto.limit = 20;
      dto.total = 100;
      dto.totalPages = 5;

      expect(dto).toBeInstanceOf(PaginationMetaDto);
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(20);
      expect(dto.total).toBe(100);
      expect(dto.totalPages).toBe(5);
    });
  });

  describe('PaginatedTransactionsResponseDto', () => {
    it('should be defined', () => {
      expect(PaginatedTransactionsResponseDto).toBeDefined();
    });

    it('should create a valid instance', () => {
      const transaction: Transaction = {
        id: '123',
        transactionId: 'txn-123',
        amount: 100.5,
        currency: 'USD',
        type: TransactionType.CREDIT,
        status: TransactionStatus.COMPLETED,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = new PaginatedTransactionsResponseDto();
      dto.data = [transaction];
      dto.pagination = {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      };

      expect(dto).toBeInstanceOf(PaginatedTransactionsResponseDto);
      expect(dto.data).toHaveLength(1);
      expect(dto.data[0]).toEqual(transaction);
      expect(dto.pagination.page).toBe(1);
      expect(dto.pagination.limit).toBe(20);
      expect(dto.pagination.total).toBe(1);
      expect(dto.pagination.totalPages).toBe(1);
    });

    it('should handle empty data array', () => {
      const dto = new PaginatedTransactionsResponseDto();
      dto.data = [];
      dto.pagination = {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      };

      expect(dto.data).toHaveLength(0);
      expect(dto.pagination.total).toBe(0);
      expect(dto.pagination.totalPages).toBe(0);
    });
  });
});
