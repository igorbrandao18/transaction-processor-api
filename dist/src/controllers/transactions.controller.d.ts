import { TransactionsService } from '@services/transactions.service';
import { TransactionsQueue } from '@queues/transactions.queue';
import { CreateTransactionDto } from '@dto/create-transaction.dto';
import { QueryTransactionsDto } from '@dto/query-transactions.dto';
import { Transaction, TransactionType, TransactionStatus } from '@entities/transaction.entity';
export declare class TransactionsController {
    private readonly transactionsService;
    private readonly transactionsQueue;
    constructor(transactionsService: TransactionsService, transactionsQueue: TransactionsQueue);
    create(createTransactionDto: CreateTransactionDto): Promise<{
        message: string;
        transactionId: string | undefined;
        status: string;
    }>;
    findAll(queryDto: QueryTransactionsDto): Promise<{
        data: Transaction[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getMetadata(): Promise<{
        types: TransactionType[];
        statuses: TransactionStatus[];
        currencies: readonly ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "SEK", "NZD", "MXN", "SGD", "HKD", "NOK", "TRY", "RUB", "INR", "BRL", "ZAR", "DKK", "PLN", "TWD", "THB", "MYR", "CZK", "HUF", "ILS", "CLP", "PHP", "AED", "COP", "SAR", "IDR", "KRW", "EGP", "IQD", "ARS", "VND", "PKR", "BGN"];
    }>;
    findOne(id: string): Promise<Transaction>;
    getQueueStatus(transactionId: string): Promise<{
        id: import("bull").JobId;
        transactionId: string;
        state: import("bull").JobStatus | "stuck";
        progress: any;
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
        delayed: number;
        jobs: {
            waiting: {
                id: import("bull").JobId;
                transactionId: string | undefined;
                createdAt: string;
            }[];
            active: {
                id: import("bull").JobId;
                transactionId: string | undefined;
                createdAt: string;
            }[];
            delayed: {
                id: import("bull").JobId;
                transactionId: string | undefined;
                createdAt: string;
                delay: any;
            }[];
        };
    }>;
}
