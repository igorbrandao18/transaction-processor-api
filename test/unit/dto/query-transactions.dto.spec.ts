import { QueryTransactionsDto } from '@dto/query-transactions.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  TransactionStatus,
  TransactionType,
} from '@entities/transaction.entity';

describe('QueryTransactionsDto', () => {
  it('should create instance with default values', () => {
    const dto = new QueryTransactionsDto();

    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(20);
  });

  it('should validate valid page number', async () => {
    const dto = plainToInstance(QueryTransactionsDto, { page: 1 });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(1);
  });

  it('should validate page number greater than 1', async () => {
    const dto = plainToInstance(QueryTransactionsDto, { page: 5 });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(5);
  });

  it('should reject page number less than 1', async () => {
    const dto = plainToInstance(QueryTransactionsDto, { page: 0 });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject negative page number', async () => {
    const dto = plainToInstance(QueryTransactionsDto, { page: -1 });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should validate valid limit', async () => {
    const dto = plainToInstance(QueryTransactionsDto, { limit: 10 });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.limit).toBe(10);
  });

  it('should validate limit of 100 (maximum)', async () => {
    const dto = plainToInstance(QueryTransactionsDto, { limit: 100 });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.limit).toBe(100);
  });

  it('should reject limit greater than 100', async () => {
    const dto = plainToInstance(QueryTransactionsDto, { limit: 101 });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject limit less than 1', async () => {
    const dto = plainToInstance(QueryTransactionsDto, { limit: 0 });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should validate valid status', async () => {
    const dto = plainToInstance(QueryTransactionsDto, {
      status: TransactionStatus.PENDING,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.status).toBe(TransactionStatus.PENDING);
  });

  it('should validate all status values', async () => {
    const statuses = [
      TransactionStatus.PENDING,
      TransactionStatus.COMPLETED,
      TransactionStatus.FAILED,
    ];

    for (const status of statuses) {
      const dto = plainToInstance(QueryTransactionsDto, { status });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    }
  });

  it('should reject invalid status', async () => {
    const dto = plainToInstance(QueryTransactionsDto, {
      status: 'INVALID_STATUS',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should validate valid type', async () => {
    const dto = plainToInstance(QueryTransactionsDto, {
      type: TransactionType.CREDIT,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.type).toBe(TransactionType.CREDIT);
  });

  it('should validate DEBIT type', async () => {
    const dto = plainToInstance(QueryTransactionsDto, {
      type: TransactionType.DEBIT,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.type).toBe(TransactionType.DEBIT);
  });

  it('should reject invalid type', async () => {
    const dto = plainToInstance(QueryTransactionsDto, { type: 'INVALID_TYPE' });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should validate valid ISO date string for startDate', async () => {
    const dto = plainToInstance(QueryTransactionsDto, {
      startDate: '2024-01-01T00:00:00Z',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.startDate).toBe('2024-01-01T00:00:00Z');
  });

  it('should reject invalid date string for startDate', async () => {
    const dto = plainToInstance(QueryTransactionsDto, {
      startDate: 'invalid-date',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should validate valid ISO date string for endDate', async () => {
    const dto = plainToInstance(QueryTransactionsDto, {
      endDate: '2024-12-31T23:59:59Z',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.endDate).toBe('2024-12-31T23:59:59Z');
  });

  it('should reject invalid date string for endDate', async () => {
    const dto = plainToInstance(QueryTransactionsDto, {
      endDate: 'not-a-date',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should allow all optional fields to be undefined', async () => {
    const dto = new QueryTransactionsDto();

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate complete query with all fields', async () => {
    const dto = plainToInstance(QueryTransactionsDto, {
      page: 2,
      limit: 50,
      status: TransactionStatus.COMPLETED,
      type: TransactionType.CREDIT,
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-12-31T23:59:59Z',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(50);
    expect(dto.status).toBe(TransactionStatus.COMPLETED);
    expect(dto.type).toBe(TransactionType.CREDIT);
    expect(dto.startDate).toBe('2024-01-01T00:00:00Z');
    expect(dto.endDate).toBe('2024-12-31T23:59:59Z');
  });

  it('should convert string numbers to numbers for page', () => {
    const dto = plainToInstance(QueryTransactionsDto, { page: '5' });

    expect(dto.page).toBe(5);
  });

  it('should convert string numbers to numbers for limit', () => {
    const dto = plainToInstance(QueryTransactionsDto, { limit: '25' });

    expect(dto.limit).toBe(25);
  });
});
