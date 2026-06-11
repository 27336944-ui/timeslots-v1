import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * 需要应用软删除拦截的模型列表。
 *
 * 与 `prisma/schema.prisma` 中带 `isDeleted` 字段的模型保持一致。
 */
const SOFT_DELETE_MODELS: readonly string[] = [
  'User',
  'TimeBlock',
  'Circle',
  'CircleMember',
  'TaskGroup',
  'Comment',
  'RSVP',
  'CoachCard',
  'CoachFeedback',
  'Quota',
  'QuotaTransaction',
];

/**
 * Prisma Client 的 NestJS 包装。
 *
 * 核心能力：
 * 1. **软删除无感拦截**：通过 `$extends` 在 read 操作上自动注入 `where: { isDeleted: false }`
 * 2. **弹性启动**：DB 不可达时**不阻塞进程**（仅 warn 日志），保证前端联调时 server 能起
 * 3. **优雅关闭**：`onModuleDestroy` 主动 `$disconnect`
 *
 * 拦截范围（read）：
 * - `findMany` / `findFirst` / `findUnique` / `count`
 * - `findUniqueOrThrow` / `findFirstOrThrow`
 *
 * **不**拦截：
 * - `create` / `update`（写操作正常）
 * - `delete`（物理删除需走 `update { isDeleted: true }` 模式）
 *
 * 使用方式：
 * ```typescript
 * @Injectable()
 * export class EventService {
 *   constructor(private prisma: PrismaService) {}
 *
 *   async findAll() {
 *     return this.prisma.client.timeBlock.findMany();  // 走扩展（带 isDeleted 过滤）
 *   }
 *
 *   async createTx() {
 *     return this.prisma.$transaction(async (tx) => {  // 默认 tx（不带扩展）
 *       return tx.timeBlock.create({ ... });
 *     });
 *   }
 * }
 * ```
 *
 * @see AGENTS §5.3.3 #8 (修订后：$extends 替代已弃用的 Middleware)
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  /**
   * 带软删除扩展的 Prisma 客户端（构造时预创建）。
   *
   * 业务 Service 注入 `PrismaService` 后**必须**用 `this.prisma.client.*` 走扩展路径；
   * 事务回调内用 `this.prisma.$transaction(...)` 获取默认 `Prisma.TransactionClient`。
   */
  public readonly client;

  constructor() {
    super({ log: ['warn', 'error'] });
    this.client = this.buildExtendedClient();
  }

  /**
   * NestJS 生命周期：模块初始化时尝试连接 DB。
   *
   * **弹性策略**：DB 不可达时**不抛出异常**，仅 warn 日志。
   * 这样在本地开发无 DB 的场景下，server 仍能起，业务接口会按业务异常路径返回 5xx。
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Prisma connected (soft-delete extension active)');
    } catch (err) {
      this.logger.warn(
        `Prisma connect failed: ${(err as Error).message}. ` +
          'Server will start anyway; DB queries will fail until DB is up.',
      );
    }
  }

  /**
   * NestJS 生命周期：模块销毁时主动断开连接。
   */
  async onModuleDestroy(): Promise<void> {
    try {
      await this.$disconnect();
    } catch {
      // ignore
    }
  }

  /**
   * 构造带软删除拦截的扩展客户端。
   *
   * 内部实现：拦截 `allModels` 的 read 操作，在 `args.where` 注入 `isDeleted: false`。
   */
  private buildExtendedClient() {
    return this.$extends({
      query: {
        $allModels: {
          async findMany({ model, args, query }) {
            if (isSoftDeleteModel(model)) {
              args.where = { ...(args.where ?? {}), isDeleted: false };
            }
            return query(args);
          },
          async findFirst({ model, args, query }) {
            if (isSoftDeleteModel(model)) {
              args.where = { ...(args.where ?? {}), isDeleted: false };
            }
            return query(args);
          },
          async findUnique({ model, args, query }) {
            if (isSoftDeleteModel(model)) {
              args.where = { ...(args.where ?? {}), isDeleted: false };
            }
            return query(args);
          },
          async findFirstOrThrow({ model, args, query }) {
            if (isSoftDeleteModel(model)) {
              args.where = { ...(args.where ?? {}), isDeleted: false };
            }
            return query(args);
          },
          async findUniqueOrThrow({ model, args, query }) {
            if (isSoftDeleteModel(model)) {
              args.where = { ...(args.where ?? {}), isDeleted: false };
            }
            return query(args);
          },
          async count({ model, args, query }) {
            if (isSoftDeleteModel(model)) {
              args.where = { ...(args.where ?? {}), isDeleted: false };
            }
            return query(args);
          },
        },
      },
    });
  }
}

/**
 * 模块级辅助：判断模型是否需要软删除拦截。
 *
 * 抽到顶层避免 `$extends` 回调中 `this` 上下文丢失问题。
 */
function isSoftDeleteModel(model: string | undefined): boolean {
  return typeof model === 'string' && SOFT_DELETE_MODELS.includes(model);
}
