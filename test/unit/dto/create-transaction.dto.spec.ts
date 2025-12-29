import { validate } from 'class-validator';
import { CreateTransactionDto } from '@dto/create-transaction.dto';
import { TransactionType } from '@entities/transaction.entity';

describe('CreateTransactionDto', () => {
  it('should be defined', () => {
    expect(CreateTransactionDto).toBeDefined();
  });

  it('should create a valid DTO instance', () => {
    const dto = new CreateTransactionDto();
    dto.transactionId = 'txn-123';
    dto.amount = 100.5;
    dto.currency = 'USD';
    dto.type = TransactionType.CREDIT;

    expect(dto).toBeInstanceOf(CreateTransactionDto);
    expect(dto.transactionId).toBe('txn-123');
    expect(dto.amount).toBe(100.5);
    expect(dto.currency).toBe('USD');
    expect(dto.type).toBe(TransactionType.CREDIT);
  });

  it('should accept optional metadata', () => {
    const dto = new CreateTransactionDto();
    dto.transactionId = 'txn-123';
    dto.amount = 100.5;
    dto.currency = 'USD';
    dto.type = TransactionType.CREDIT;
    dto.metadata = { source: 'test' };

    expect(dto.metadata).toEqual({ source: 'test' });
  });

  describe('validation', () => {
    it('should pass validation with valid data', async () => {
      const dto = new CreateTransactionDto();
      dto.transactionId = 'txn-123';
      dto.amount = 100.5;
      dto.currency = 'USD';
      dto.type = TransactionType.CREDIT;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when transactionId is missing', async () => {
      const dto = new CreateTransactionDto();
      dto.amount = 100.5;
      dto.currency = 'USD';
      dto.type = TransactionType.CREDIT;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('transactionId');
    });

    it('should fail validation when amount is negative', async () => {
      const dto = new CreateTransactionDto();
      dto.transactionId = 'txn-123';
      dto.amount = -10;
      dto.currency = 'USD';
      dto.type = TransactionType.CREDIT;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const amountError = errors.find((e) => e.property === 'amount');
      expect(amountError).toBeDefined();
    });

    it('should fail validation when currency is invalid', async () => {
      const dto = new CreateTransactionDto();
      dto.transactionId = 'txn-123';
      dto.amount = 100.5;
      dto.currency = 'INVALID';
      dto.type = TransactionType.CREDIT;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const currencyError = errors.find((e) => e.property === 'currency');
      expect(currencyError).toBeDefined();
    });

    it('should fail validation when transactionId exceeds max length', async () => {
      const dto = new CreateTransactionDto();
      dto.transactionId = 'a'.repeat(256);
      dto.amount = 100.5;
      dto.currency = 'USD';
      dto.type = TransactionType.CREDIT;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const idError = errors.find((e) => e.property === 'transactionId');
      expect(idError).toBeDefined();
    });

    it('should fail validation when amount has more than 2 decimal places', async () => {
      const dto = new CreateTransactionDto();
      dto.transactionId = 'txn-123';
      dto.amount = 100.555;
      dto.currency = 'USD';
      dto.type = TransactionType.CREDIT;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const amountError = errors.find((e) => e.property === 'amount');
      expect(amountError).toBeDefined();
    });

    it('should fail validation when type is invalid', async () => {
      const dto = new CreateTransactionDto();
      dto.transactionId = 'txn-123';
      dto.amount = 100.5;
      dto.currency = 'USD';
      dto.type = 'invalid' as TransactionType;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const typeError = errors.find((e) => e.property === 'type');
      expect(typeError).toBeDefined();
    });

    it('should fail validation when metadata is not an object', async () => {
      const dto = new CreateTransactionDto();
      dto.transactionId = 'txn-123';
      dto.amount = 100.5;
      dto.currency = 'USD';
      dto.type = TransactionType.CREDIT;
      dto.metadata = 'not-an-object' as any;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const metadataError = errors.find((e) => e.property === 'metadata');
      expect(metadataError).toBeDefined();
    });

    it('should pass validation when metadata is a valid object', async () => {
      const dto = new CreateTransactionDto();
      dto.transactionId = 'txn-123';
      dto.amount = 100.5;
      dto.currency = 'USD';
      dto.type = TransactionType.CREDIT;
      dto.metadata = { source: 'test', reference: 'ref-123' };

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass validation with DEBIT type', async () => {
      const dto = new CreateTransactionDto();
      dto.transactionId = 'txn-123';
      dto.amount = 100.5;
      dto.currency = 'USD';
      dto.type = TransactionType.DEBIT;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
