import { Transaction, TransactionStatus } from '@entities/transaction.entity';
export declare class TransactionsRepository {
    private mapRowToEntity;
    create(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction>;
    findById(id: string): Promise<Transaction | null>;
    findByTransactionId(transactionId: string): Promise<Transaction | null>;
    findAll(query: {
        page?: number;
        limit?: number;
        status?: TransactionStatus;
        type?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<{
        transactions: Transaction[];
        total: number;
    }>;
    updateStatus(id: string, status: TransactionStatus): Promise<Transaction>;
}
