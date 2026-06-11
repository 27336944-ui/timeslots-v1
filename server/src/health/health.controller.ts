
import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';


@Controller()
export class HealthController {
  
  constructor(private readonly prisma: PrismaService) {}

  
  @Get('api/v1/health')
  async check() {
    const dbConnected = await this.prisma.checkConnection();
    return {
      status: 'ok',
      db: dbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }

  
  @Get()
  root() {
    return {
      name: 'timeslots-server',
      version: '0.1.0',
      health: '/api/v1/health',
    };
  }
}
