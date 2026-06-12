import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';


const SOFT_DELETE_TABLES = [
  'Task', 'TimeBlock', 'Reminder', 'Circle', 'CircleMember',
  'ApprovalRequest', 'ApprovalRecipient',
];


@Injectable()
export class SoftDeleteCleanupCron {
  private readonly logger = new Logger(SoftDeleteCleanupCron.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanup(): Promise<void> {
    let total = 0;

    for (const table of SOFT_DELETE_TABLES) {
      try {
        const count = await this.prisma.client.$executeRawUnsafe(
          `DELETE FROM "${table}" WHERE "isDeleted" = true AND "deletedAt" < NOW() - INTERVAL '7 days'`,
        );
        if (count > 0) {
          total += count;
          this.logger.log(`清理 ${table}: ${count} 条`);
        }
      } catch (err) {
        this.logger.error(`清理 ${table} 失败`, err);
      }
    }

    if (total > 0) {
      this.logger.log(`软删清理完成，共 ${total} 条`);
    }
  }
}
