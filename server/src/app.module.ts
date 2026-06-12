
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { TimeBlockModule } from './modules/timeblock/timeblock.module';
import { TaskModule } from './modules/task/task.module';
import { CircleModule } from './modules/circle/circle.module';
import { ReminderModule } from './modules/reminder/reminder.module';
import { ApprovalModule } from './modules/approval/approval.module';
import { ReminderCron } from './jobs/reminder.cron';
import { SoftDeleteCleanupCron } from './jobs/soft-delete-cleanup.cron';
import { validationSchema } from './config/validation';


@Module({
  imports: [
    
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: validationSchema,
    }),
    
    PrismaModule,
    
    HealthModule,
    
    AuthModule,

    TimeBlockModule,

    TaskModule,

    CircleModule,

    ReminderModule,

    ApprovalModule,

    ScheduleModule.forRoot(),
  ],
  providers: [ReminderCron, SoftDeleteCleanupCron],
})
export class AppModule {}
