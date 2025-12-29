export declare class ValidationErrorDto {
    property: string;
    constraints: Record<string, string>;
}
export declare class BadRequestErrorDto {
    statusCode: number;
    message: string;
    errors: ValidationErrorDto[];
}
export declare class ConflictErrorDto {
    statusCode: number;
    error: string;
    transactionId: string;
    existingTransaction: any;
}
export declare class NotFoundErrorDto {
    statusCode: number;
    message: string;
    path: string;
    timestamp: string;
}
export declare class InternalServerErrorDto {
    statusCode: number;
    message: string;
    path: string;
    timestamp: string;
}
