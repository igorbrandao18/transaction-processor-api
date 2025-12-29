import type { Queue } from 'bull';
import { CreateTransactionDto } from '@dto/create-transaction.dto';
export declare class TransactionsQueue {
    private readonly transactionQueue;
    constructor(transactionQueue: Queue<CreateTransactionDto>);
    addTransaction(dto: CreateTransactionDto): Promise<void>;
    getJobStatus(transactionId: string): Promise<{
        id: import("bull").JobId;
        transactionId: string;
        state: import("bull").JobStatus | "stuck";
        progress: any;
        result: any;
        failedReason: string | undefined;
        processedOn: number | undefined;
        finishedOn: number | undefined;
    } | null>;
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
