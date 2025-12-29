export declare class HealthCheckDto {
    status: string;
    timestamp: string;
    service: string;
    version: string;
    checks: {
        database: string;
    };
}
