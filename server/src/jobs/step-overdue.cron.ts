import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EventLogService } from '../modules/eventlog/event-log.service';


@Injectable()
export class StepOverdueCron {
  private readonly logger = new Logger(StepOverdueCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventLog: EventLogService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async markOverdueSteps(): Promise<void> {
    const now = new Date();

    const overdueSteps = await this.prisma.client.step.findMany({
      where: {
        status: 'scheduled',
        timeBlock: { startTime: { lt: now } },
      },
      select: { id: true, taskId: true },
    });

    if (overdueSteps.length === 0) return;

    this.logger.log(`[StepOverdueCron] marking ${overdueSteps.length} steps as overdue`);

    await this.prisma.client.step.updateMany({
      where: { id: { in: overdueSteps.map(s => s.id) } },
      data: { status: 'overdue' },
    });

    for (const s of overdueSteps) {
      this.eventLog.log('system', 'step_overdue', {
        taskId: s.taskId,
        fromStatus: 'scheduled',
        toStatus: 'overdue',
      });
    }
  }
}
