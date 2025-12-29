import type { Job } from 'bull';
import { TransactionsService } from '@services/transactions.service';
import { CreateTransactionDto } from '@dto/create-transaction.dto';
export declare class TransactionProcessor {
    private readonly transactionsService;
    constructor(transactionsService: TransactionsService);
    handleTransaction(job: Job<CreateTransactionDto>): Promise<import("@entities/transaction.entity").Transaction>;
}
