import type { Job } from 'bull';
import { TransactionsService } from '@services/transactions.service';
import type { CreateTransactionDto } from '@dto/create-transaction.dto';
export declare class TransactionProcessor {
    private readonly transactionsService;
    private readonly logger;
    constructor(transactionsService: TransactionsService);
    handleTransaction(job: Job<CreateTransactionDto>): Promise<import("../entities/transaction.entity").Transaction>;
}
