import { TransactionsRepository } from '@repositories/transactions.repository';
import { Transaction } from '@entities/transaction.entity';
import type { CreateTransactionDto } from '@dto/create-transaction.dto';
import type { QueryTransactionsDto } from '@dto/query-transactions.dto';
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
    getMetadata(): {
        types: string[];
        statuses: string[];
        currencies: string[];
    };
}
