import type { Transaction } from '@entities/transaction.entity';

export const mockTransaction: Omit<
  Transaction,
  'id' | 'createdAt' | 'updatedAt'
> = {
  transactionId: 'test-transaction-id-123',
  amount: 100.5,
  currency: 'BRL',
  type: 'credit',
  status: 'pending',
  metadata: {
    source: 'test',
    reference: 'test-order-123',
  },
};

export const mockTransactionResponse: Transaction = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  transactionId: 'test-transaction-id-123',
  amount: 100.5,
  currency: 'BRL',
  type: 'credit',
  status: 'pending',
  metadata: {
    source: 'test',
    reference: 'test-order-123',
  },
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

export const createMockTransaction = (
  overrides?: Partial<Transaction>,
): Transaction => ({
  ...mockTransactionResponse,
  ...overrides,
});
