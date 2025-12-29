import { TransactionsRepository } from '@repositories/transactions.repository';
import { CreateTransactionDto } from '@dto/create-transaction.dto';
import { QueryTransactionsDto } from '@dto/query-transactions.dto';
import { Transaction, TransactionStatus } from '@entities/transaction.entity';
export declare class TransactionsService {
    private readonly transactionsRepository;
    constructor(transactionsRepository: TransactionsRepository);
    create(createTransactionDto: CreateTransactionDto): Promise<Transaction>;
    findOne(id: string): Promise<Transaction>;
    findAll(queryDto: QueryTransactionsDto): Promise<{
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
}
