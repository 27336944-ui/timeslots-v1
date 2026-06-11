
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';


@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  
  private readonly logger = new Logger(PrismaService.name);
  
  private dbConnected = false;

  
  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.dbConnected = true;
      this.logger.log('Database connected');
    } catch (err) {
      
      this.logger.warn('Database connection failed, running in degraded mode', err);
    }
  }

  
  get isConnected(): boolean {
    return this.dbConnected;
  }

  
  async checkConnection(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      this.dbConnected = true;
      return true;
    } catch {
      this.dbConnected = false;
      return false;
    }
  }
}
