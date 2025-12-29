import type { Transaction } from '@entities/transaction.entity';
export declare const mockTransaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>;
export declare const mockTransactionResponse: Transaction;
export declare const createMockTransaction: (overrides?: Partial<Transaction>) => Transaction;
