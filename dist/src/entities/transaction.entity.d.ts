export declare enum TransactionType {
    CREDIT = "credit",
    DEBIT = "debit"
}
export declare enum TransactionStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    FAILED = "failed"
}
export declare class Transaction {
    id: string;
    transactionId: string;
    amount: number;
    currency: string;
    type: TransactionType;
    status: TransactionStatus;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export interface TransactionRow {
    id: string;
    transaction_id: string;
    amount: number;
    currency: string;
    type: string;
    status: string;
    metadata?: Record<string, any>;
    created_at: Date;
    updated_at: Date;
}
