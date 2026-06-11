import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CoachService } from '../modules/coach/coach.service';

@Injectable()
export class CoachJobs {
  private readonly logger = new Logger(CoachJobs.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly coachService: CoachService,
  ) {}

  @Cron(CronExpression.EVERY_WEEK)
  async generateWeeklyReports() {
    this.logger.log('Starting weekly coach report generation...');
    const users = await this.findActiveUsersWithBlocks();
    let ok = 0;
    for (const u of users) {
      try {
        await this.coachService.generateWeekly(u.id);
        ok++;
      } catch (err) {
        this.logger.warn(`Weekly report failed for user ${u.id}: ${err}`);
      }
    }
    this.logger.log(`Weekly coach reports generated for ${ok}/${users.length} users`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_9PM)
  async generateDailyReviews() {
    this.logger.log('Starting daily coach review generation...');
    const users = await this.findActiveUsersWithBlocks();
    let ok = 0;
    for (const u of users) {
      try {
        await this.coachService.generateDaily(u.id);
        ok++;
      } catch (err) {
        this.logger.warn(`Daily review failed for user ${u.id}: ${err}`);
      }
    }
    this.logger.log(`Daily coach reviews generated for ${ok}/${users.length} users`);
  }

  private async findActiveUsersWithBlocks() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return this.prisma.client.user.findMany({
      where: {
        isDeleted: false,
        status: 'ACTIVE',
        timeBlocks: {
          some: {
            startTime: { gte: sevenDaysAgo },
            isDeleted: false,
          },
        },
      },
      select: { id: true },
    });
  }
}
