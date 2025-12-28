import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { register } from '@config/metrics.config';

@Controller('metrics')
export class MetricsController {
  @Get()
  async getMetrics(@Res() res: Response) {
    res.set('Content-Type', 'text/plain');
    return res.send(await register.metrics());
  }
}
