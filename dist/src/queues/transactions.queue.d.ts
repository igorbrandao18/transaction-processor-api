import type { Queue } from 'bull';
import type { CreateTransactionDto } from '@dto/create-transaction.dto';
export declare class TransactionsQueue {
    private readonly queue;
    constructor(queue: Queue);
    addTransactionJob(transactionData: CreateTransactionDto): Promise<{
        jobId: string;
        transactionId: string;
    }>;
    getJobStatus(transactionId: string): Promise<{
        id: import("bull").JobId;
        transactionId: string;
        state: import("bull").JobStatus | "stuck";
        progress: any;
        data: any;
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
        total: number;
    }>;
}
