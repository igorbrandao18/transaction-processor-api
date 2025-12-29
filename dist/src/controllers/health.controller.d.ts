export declare class HealthController {
    check(): Promise<{
        status: string;
        timestamp: string;
        service: string;
        version: string;
        checks: {
            database: string;
        };
    }>;
}
