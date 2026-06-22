import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';


function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}


function isRecurringOnDate(recurrence: string, blockStart: Date, recurrenceEndAt: Date | null, dateStr: string): boolean {
  const queryDate = new Date(`${dateStr}T00:00:00+08:00`);

  if (blockStart >= new Date(queryDate.getTime() + 86400000)) return false;
  if (recurrenceEndAt && new Date(recurrenceEndAt) < queryDate) return false;

  switch (recurrence) {
    case 'daily': return true;
    case 'weekdays': { const d = queryDate.getDay(); return d >= 1 && d <= 5; }
    case 'weekly': return queryDate.getDay() === blockStart.getDay();
    case 'monthly': return queryDate.getDate() === blockStart.getDate();
    case 'yearly': return queryDate.getMonth() === blockStart.getMonth() && queryDate.getDate() === blockStart.getDate();
    default: return false;
  }
}


@Injectable()
export class RecurrenceGeneratorCron {
  private readonly logger = new Logger(RecurrenceGeneratorCron.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async generate(): Promise<void> {
    const sourceBlocks = await this.prisma.client.timeBlock.findMany({
      where: {
        recurrence: { not: 'none' },
        isDeleted: false,
        recurrenceGroupId: { not: null },
      },
    });

    if (sourceBlocks.length === 0) return;

    const today = new Date();
    const dates: string[] = [];
    for (let i = 1; i <= 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      dates.push(toLocalDateStr(d));
    }

    let totalCreated = 0;

    for (const template of sourceBlocks) {
      const duration = template.endTime.getTime() - template.startTime.getTime();

      for (const dateStr of dates) {
        if (!isRecurringOnDate(template.recurrence, template.startTime, template.recurrenceEndAt, dateStr)) continue;

        const existingCount = await this.prisma.client.timeBlock.count({
          where: {
            recurrenceGroupId: template.recurrenceGroupId,
            startTime: {
              gte: new Date(`${dateStr}T00:00:00+08:00`),
              lt: new Date(`${dateStr}T23:59:59+08:00`),
            },
            isDeleted: false,
          },
        });

        if (existingCount > 0) continue;

        const hour = template.startTime.getHours();
        const minute = template.startTime.getMinutes();
        const second = template.startTime.getSeconds();
        const instanceStart = new Date(`${dateStr}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}+08:00`);
        const instanceEnd = new Date(instanceStart.getTime() + duration);

        await this.prisma.client.timeBlock.create({
          data: {
            userId: template.userId,
            title: template.title,
            startTime: instanceStart,
            endTime: instanceEnd,
            status: template.status,
            location: template.location,
            description: template.description,
            // priority removed from TimeBlock schema
            category: template.category,
            categoryId: template.categoryId,
            recurrence: 'none',
            recurrenceEndAt: null,
            recurrenceGroupId: template.recurrenceGroupId,
            contacts: template.contacts,
            weather: template.weather,
            taskId: template.taskId,
            nature: template.nature,
            circleId: template.circleId,
          },
        });

        totalCreated++;
      }
    }

    if (totalCreated > 0) {
      this.logger.log(`已生成 ${totalCreated} 个重复日程实例`);
    }
  }
}
