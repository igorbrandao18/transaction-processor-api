import { TransactionStatus, TransactionType } from '@entities/transaction.entity';
export declare class QueryTransactionsDto {
    page?: number;
    limit?: number;
    status?: TransactionStatus;
    type?: TransactionType;
    startDate?: string;
    endDate?: string;
}
