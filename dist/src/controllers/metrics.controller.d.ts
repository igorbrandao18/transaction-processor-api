import type { Response } from 'express';
export declare class MetricsController {
    getMetrics(res: Response): Promise<Response<any, Record<string, any>>>;
}
