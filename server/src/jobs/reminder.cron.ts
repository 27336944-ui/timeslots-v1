import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReminderService } from '../modules/reminder/reminder.service';


@Injectable()
export class ReminderCron {
  private readonly logger = new Logger(ReminderCron.name);

  constructor(private readonly reminderService: ReminderService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleReminders(): Promise<void> {
    const { sent, failed } = await this.reminderService.scanAndSend();

    if (sent > 0 || failed > 0) {
      this.logger.log(`提醒扫描完成: sent=${sent} failed=${failed}`);
    }
  }
}
