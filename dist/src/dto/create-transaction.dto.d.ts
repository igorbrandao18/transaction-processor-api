import { TransactionType } from '@entities/transaction.entity';
export declare class CreateTransactionDto {
    transactionId?: string;
    amount: number;
    currency: string;
    type: TransactionType;
    metadata?: Record<string, any>;
}
