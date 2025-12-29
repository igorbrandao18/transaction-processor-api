import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from '@entities/transaction.entity';

describe('Transaction Entity', () => {
  describe('TransactionType enum', () => {
    it('should have CREDIT value', () => {
      expect(TransactionType.CREDIT).toBe('credit');
    });

    it('should have DEBIT value', () => {
      expect(TransactionType.DEBIT).toBe('debit');
    });
  });

  describe('TransactionStatus enum', () => {
    it('should have PENDING value', () => {
      expect(TransactionStatus.PENDING).toBe('pending');
    });

    it('should have COMPLETED value', () => {
      expect(TransactionStatus.COMPLETED).toBe('completed');
    });

    it('should have FAILED value', () => {
      expect(TransactionStatus.FAILED).toBe('failed');
    });
  });

  describe('Transaction class', () => {
    it('should create a valid transaction instance', () => {
      const transaction = new Transaction();
      transaction.id = '123';
      transaction.transactionId = 'txn-123';
      transaction.amount = 100.5;
      transaction.currency = 'USD';
      transaction.type = TransactionType.CREDIT;
      transaction.status = TransactionStatus.PENDING;
      transaction.metadata = {};
      transaction.createdAt = new Date();
      transaction.updatedAt = new Date();

      expect(transaction).toBeInstanceOf(Transaction);
      expect(transaction.id).toBe('123');
      expect(transaction.transactionId).toBe('txn-123');
      expect(transaction.amount).toBe(100.5);
      expect(transaction.currency).toBe('USD');
      expect(transaction.type).toBe(TransactionType.CREDIT);
      expect(transaction.status).toBe(TransactionStatus.PENDING);
      expect(transaction.metadata).toEqual({});
    });

    it('should handle optional metadata', () => {
      const transaction = new Transaction();
      transaction.id = '123';
      transaction.transactionId = 'txn-123';
      transaction.amount = 100.5;
      transaction.currency = 'USD';
      transaction.type = TransactionType.DEBIT;
      transaction.status = TransactionStatus.COMPLETED;
      transaction.metadata = { source: 'test' };
      transaction.createdAt = new Date();
      transaction.updatedAt = new Date();

      expect(transaction.metadata).toEqual({ source: 'test' });
    });

    it('should handle all transaction types', () => {
      const creditTransaction = new Transaction();
      creditTransaction.type = TransactionType.CREDIT;
      expect(creditTransaction.type).toBe('credit');

      const debitTransaction = new Transaction();
      debitTransaction.type = TransactionType.DEBIT;
      expect(debitTransaction.type).toBe('debit');
    });

    it('should handle all transaction statuses', () => {
      const pending = new Transaction();
      pending.status = TransactionStatus.PENDING;
      expect(pending.status).toBe('pending');

      const completed = new Transaction();
      completed.status = TransactionStatus.COMPLETED;
      expect(completed.status).toBe('completed');

      const failed = new Transaction();
      failed.status = TransactionStatus.FAILED;
      expect(failed.status).toBe('failed');
    });
  });
});
