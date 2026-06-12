
import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';


@Controller('api/v1/health')
export class HealthController {
  
  constructor(private readonly healthService: HealthService) {}

  
  @Get()
  async check() {
    return this.healthService.check();
  }

  
  @Get('info')
  root() {
    return {
      name: 'timeslots-server',
      version: '0.1.0',
      health: '/api/v1/health',
    };
  }
}
