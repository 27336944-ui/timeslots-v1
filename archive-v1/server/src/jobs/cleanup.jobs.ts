import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserService } from '../modules/user/user.service';

@Injectable()
export class CleanupJobs {
  private readonly logger = new Logger(CleanupJobs.name);

  constructor(private readonly userService: UserService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async hardDeleteExpiredUsers() {
    this.logger.log('Starting hard-delete expired users...');
    try {
      const count = await this.userService.hardDeleteExpired();
      if (count > 0) {
        this.logger.log(`Hard-deleted ${count} expired user(s)`);
      }
    } catch (err) {
      this.logger.error(`Hard-delete job failed: ${err}`);
    }
  }
}
