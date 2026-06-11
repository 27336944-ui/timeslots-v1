import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';


const SOFT_DELETE_MODELS = ['Task', 'TimeBlock'];


function createExtendedClient(): PrismaClient {
  const base = new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
  });

  return base.$extends({
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          if (SOFT_DELETE_MODELS.includes(model)) {
            args.where = { ...args.where, isDeleted: false };
          }
          return query(args);
        },
        async findFirst({ model, args, query }) {
          if (SOFT_DELETE_MODELS.includes(model)) {
            args.where = { ...args.where, isDeleted: false };
          }
          return query(args);
        },
        async findUnique({ model, args, query }) {
          if (SOFT_DELETE_MODELS.includes(model)) {
            args.where = { ...args.where, isDeleted: false };
          }
          return query(args);
        },
        async count({ model, args, query }) {
          if (SOFT_DELETE_MODELS.includes(model)) {
            args.where = { ...args.where, isDeleted: false };
          }
          return query(args);
        },
        async findFirstOrThrow({ model, args, query }) {
          if (SOFT_DELETE_MODELS.includes(model)) {
            args.where = { ...args.where, isDeleted: false };
          }
          return query(args);
        },
        async findUniqueOrThrow({ model, args, query }) {
          if (SOFT_DELETE_MODELS.includes(model)) {
            args.where = { ...args.where, isDeleted: false };
          }
          return query(args);
        },
      },
    },
  }) as unknown as PrismaClient;
}


@Injectable()
export class PrismaService implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);
  private dbConnected = false;

  readonly client: PrismaClient = createExtendedClient();

  async onModuleInit(): Promise<void> {
    try {
      await this.client.$connect();
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
      await this.client.$queryRaw`SELECT 1`;
      this.dbConnected = true;
      return true;
    } catch {
      this.dbConnected = false;
      return false;
    }
  }
}
