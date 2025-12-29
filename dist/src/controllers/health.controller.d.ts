import { PrismaService } from '@config/prisma.service';
export declare class HealthController {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
