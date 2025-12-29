import { Transaction } from '@entities/transaction.entity';
export declare class PaginationMetaDto {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
export declare class PaginatedTransactionsResponseDto {
    data: Transaction[];
    pagination: PaginationMetaDto;
}
