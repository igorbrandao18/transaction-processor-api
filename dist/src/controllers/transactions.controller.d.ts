import { TransactionsService } from '@services/transactions.service';
import { CreateTransactionDto } from '@dto/create-transaction.dto';
import { QueryTransactionsDto } from '@dto/query-transactions.dto';
import { PaginatedTransactionsResponseDto } from '@dto/pagination-response.dto';
import { Transaction } from '@entities/transaction.entity';
export declare class TransactionsController {
    private readonly transactionsService;
    constructor(transactionsService: TransactionsService);
    create(createTransactionDto: CreateTransactionDto): Promise<Transaction>;
    findAll(query: QueryTransactionsDto): Promise<PaginatedTransactionsResponseDto>;
    getMetadata(): Promise<{
        types: string[];
        statuses: string[];
        currencies: string[];
    }>;
    findOne(id: string): Promise<Transaction>;
}
