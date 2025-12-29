import { Controller, Get, Header } from '@nestjs/common';
import { register } from '@config/metrics.config';

@Controller('metrics')
export class MetricsController {
  @Get()
  @Header('Content-Type', 'text/plain')
  async getMetrics(): Promise<string> {
    return register.metrics();
  }
}
