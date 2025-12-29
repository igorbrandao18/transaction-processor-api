import { TransactionType, TransactionStatus } from '@entities/transaction.entity';
export declare class CreateTransactionDto {
    transactionId: string;
    amount: number;
    currency: string;
    type: TransactionType;
    status?: TransactionStatus;
    metadata?: Record<string, any>;
}
