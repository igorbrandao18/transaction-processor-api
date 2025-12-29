import { OnModuleInit } from '@nestjs/common';
import type { Queue } from 'bull';
export declare class QueueMetricsService implements OnModuleInit {
    private readonly queue;
    constructor(queue: Queue);
    onModuleInit(): void;
    private updateQueueMetrics;
}
