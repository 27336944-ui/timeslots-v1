
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
import { StepModule } from './modules/step/step.module';
import { CategoryModule } from './modules/category/category.module';
import { TemplateModule } from './modules/template/template.module';
import { LlmModule } from './modules/llm/llm.module';
import { ApprovalModule } from './modules/approval/approval.module';
import { SearchModule } from './modules/search/search.module';
import { EventLogModule } from './modules/eventlog/event-log.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AiModule } from './modules/ai/ai.module';
import { DelegationModule } from './modules/delegation/delegation.module';
import { ShareModule } from './modules/share/share.module';
import { ReminderCron } from './jobs/reminder.cron';
import { SoftDeleteCleanupCron } from './jobs/soft-delete-cleanup.cron';
import { RecurrenceGeneratorCron } from './jobs/recurrence-generator.cron';
import { StepOverdueCron } from './jobs/step-overdue.cron';
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

    StepModule,

    CategoryModule,

    TemplateModule,

    LlmModule,

    ApprovalModule,

    SearchModule,

    EventLogModule,

    NotificationModule,

    AiModule,

    ScheduleModule.forRoot(),

    DelegationModule,

    ShareModule,
  ],
  providers: [ReminderCron, SoftDeleteCleanupCron, RecurrenceGeneratorCron, StepOverdueCron],
})
export class AppModule {}
