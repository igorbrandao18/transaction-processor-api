import { TransactionsService } from '@services/transactions.service';
import { TransactionsQueue } from '@queues/transactions.queue';
import { CreateTransactionDto } from '@dto/create-transaction.dto';
import { QueryTransactionsDto } from '@dto/query-transactions.dto';
import { PaginatedTransactionsResponseDto } from '@dto/pagination-response.dto';
import { Transaction } from '@entities/transaction.entity';
export declare class TransactionsController {
    private readonly transactionsService;
    private readonly transactionsQueue;
    constructor(transactionsService: TransactionsService, transactionsQueue: TransactionsQueue);
    create(createTransactionDto: CreateTransactionDto): Promise<{
        message: string;
        jobId: string;
        transactionId: string;
    }>;
    findAll(query: QueryTransactionsDto): Promise<PaginatedTransactionsResponseDto>;
    getMetadata(): Promise<{
        types: string[];
        statuses: string[];
        currencies: string[];
    }>;
    findOne(id: string): Promise<Transaction>;
    getQueueStatus(transactionId: string): Promise<{
        id: import("bull").JobId;
        transactionId: string;
        state: import("bull").JobStatus | "stuck";
        progress: any;
        data: any;
        result: any;
        failedReason: string | undefined;
        processedOn: number | undefined;
        finishedOn: number | undefined;
    }>;
    getQueueStats(): Promise<{
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        total: number;
    }>;
}
