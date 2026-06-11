import { Injectable, Logger } from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException, ErrorCodes } from '../../common/exceptions/business.exception';

/**
 * AI 点数扣费服务（金融级）。
 *
 * 核心亮点：
 * 1. **优先扣当月 + 永久兜底**：当月点数先用，不够再扣永久
 * 2. **乐观锁防超卖**：`where: { id, version }` 保证并发请求不会双扣
 *    - 冲突时 Prisma 抛 `P2025` → 捕获并抛 `CONCURRENT_MODIFICATION` (40901)
 * 3. **审计流水**：每次扣费写入 `QuotaTransaction`（含 `balanceAfter` 快照）
 * 4. **双入口设计**：
 *    - `deduct()` — 外部调用，自行管理 `$transaction`
 *    - `deductInTx()` — 事务内调用，由调用方共享事务（与 EventService.create 同生共死）
 *
 * @see AGENTS §5.3.3 #13
 */
@Injectable()
export class QuotaService {
  private readonly logger = new Logger(QuotaService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 扣费（外部直接调用，自行管理事务）。
   *
   * 适用场景：补偿扣费、定时退扣、单独扣费。
   *
   * @param userId - 用户 ID
   * @param amount - 扣减数量（正数；`<= 0` 直接返回）
   * @param relatedBlockId - 关联 TimeBlock ID（可选，写入审计流水）
   * @throws BusinessException 余额不足时 `QUOTA_EXCEEDED` (40201)
   * @throws BusinessException 乐观锁冲突时 `CONCURRENT_MODIFICATION` (40901)
   */
  async deduct(userId: string, amount: number, relatedBlockId?: string): Promise<void> {
    if (amount <= 0) return;

    try {
      await this.prisma.$transaction(async (tx) => {
        await this.deductInTx(tx, userId, amount, relatedBlockId);
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn(`Optimistic lock conflict for user ${userId}`);
        throw ErrorCodes.CONCURRENT_MODIFICATION;
      }
      throw error;
    }
  }

  /**
   * 事务内扣费（由 EventService.create 等复合事务调用）。
   *
   * 必须在 `this.prisma.$transaction(async (tx) => ...)` 回调内调用，
   * 以保证扣费与日程创建同生共死。
   *
   * @param tx - Prisma 事务客户端
   * @param userId - 用户 ID
   * @param amount - 扣减数量（正数；`<= 0` 直接返回）
   * @param relatedBlockId - 关联 TimeBlock ID（写入审计流水）
   * @throws BusinessException 余额不足时 `QUOTA_EXCEEDED` (40201)
   * @throws BusinessException 乐观锁冲突时 `CONCURRENT_MODIFICATION` (40901)
   */
  async deductInTx(
    tx: Prisma.TransactionClient,
    userId: string,
    amount: number,
    relatedBlockId?: string,
  ): Promise<void> {
    if (amount <= 0) return;

    const quota = await tx.quota.findUnique({ where: { userId } });
    if (!quota) throw ErrorCodes.QUOTA_ACCOUNT_NOT_FOUND;

    const totalBalance = quota.monthlyPoints + quota.permanentPoints;
    if (totalBalance < amount) {
      throw ErrorCodes.QUOTA_EXCEEDED;
    }

    const deductMonthly = Math.min(quota.monthlyPoints, amount);
    const deductPermanent = amount - deductMonthly;
    const newMonthly = quota.monthlyPoints - deductMonthly;
    const newPermanent = quota.permanentPoints - deductPermanent;

    try {
      await tx.quota.update({
        where: {
          id: quota.id,
          version: quota.version,
        },
        data: {
          monthlyPoints: newMonthly,
          permanentPoints: newPermanent,
          version: { increment: 1 },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn(`Optimistic lock conflict in tx for user ${userId}`);
        throw ErrorCodes.CONCURRENT_MODIFICATION;
      }
      throw error;
    }

    await tx.quotaTransaction.create({
      data: {
        userId,
        type: TransactionType.DEDUCT,
        amount: -amount,
        balanceAfter: newMonthly + newPermanent,
        description: 'AI 日程解析扣费',
        relatedBlockId,
      },
    });
  }

  /**
   * 查询用户额度余额（含过期时间）。
   */
  async getBalance(userId: string): Promise<{
    permanentPoints: number;
    monthlyPoints: number;
    monthlyExpireAt: Date | null;
  }> {
    const quota = await this.prisma.client.quota.findUnique({ where: { userId } });
    if (!quota) {
      return { permanentPoints: 0, monthlyPoints: 0, monthlyExpireAt: null };
    }
    return {
      permanentPoints: quota.permanentPoints,
      monthlyPoints: quota.monthlyPoints,
      monthlyExpireAt: quota.monthlyExpireAt,
    };
  }
}
