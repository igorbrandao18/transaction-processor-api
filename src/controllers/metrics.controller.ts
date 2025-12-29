import { Controller, Get } from '@nestjs/common';
import { register } from '@config/metrics.config';

@Controller('metrics')
export class MetricsController {
  @Get()
  async getMetrics() {
    return register.metrics();
  }
}
