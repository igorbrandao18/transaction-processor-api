import type { QueryTransactionsDto } from '@dto/query-transactions.dto';
type TransactionEntity = {
    id: string;
    transactionId: string;
    amount: number;
    currency: string;
    type: string;
    status: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
};
export declare class TransactionsRepository {
    create(transaction: {
        transactionId: string;
        amount: number;
        currency: string;
        type: string;
        status: string;
        metadata?: Record<string, any>;
    }): Promise<TransactionEntity>;
    findById(id: string): Promise<TransactionEntity | null>;
    findByTransactionId(transactionId: string): Promise<TransactionEntity | null>;
    findAll(query: QueryTransactionsDto): Promise<{
        transactions: TransactionEntity[];
        total: number;
    }>;
    private mapRowToTransaction;
}
export {};
