import { TransactionsRepository } from '@repositories/transactions.repository';
import { Transaction } from '@entities/transaction.entity';
import type { CreateTransactionDto } from '@dto/create-transaction.dto';
import type { QueryTransactionsDto } from '@dto/query-transactions.dto';
import { TransactionStatus } from '@entities/transaction.entity';
export declare class TransactionsService {
    private readonly repository;
    constructor(repository: TransactionsRepository);
    create(dto: CreateTransactionDto): Promise<Transaction>;
    findById(id: string): Promise<Transaction>;
    findAll(query: QueryTransactionsDto): Promise<{
        data: Transaction[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    updateStatus(id: string, status: TransactionStatus): Promise<Transaction>;
    findByTransactionId(transactionId: string): Promise<Transaction | null>;
    getMetadata(): {
        types: string[];
        statuses: string[];
        currencies: string[];
    };
}
