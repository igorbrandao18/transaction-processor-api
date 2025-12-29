import type { Response } from 'express';
export declare class HealthController {
    check(res: Response): Promise<Response<any, Record<string, any>>>;
}
