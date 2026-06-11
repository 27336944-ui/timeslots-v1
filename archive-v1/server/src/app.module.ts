import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './config/configuration';
import { validationSchema } from './config/validation';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { EventModule } from './modules/event/event.module';
import { QuotaModule } from './modules/quota/quota.module';
import { TaskModule } from './modules/task/task.module';
import { CommentModule } from './modules/comment/comment.module';
import { CircleModule } from './modules/circle/circle.module';
import { TaskGroupModule } from './modules/task-group/task-group.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { LlmModule } from './modules/llm/llm.module';
import { CoachModule } from './modules/coach/coach.module';
import { CoachJobs } from './jobs/coach.jobs';
import { CleanupJobs } from './jobs/cleanup.jobs';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    HealthModule,
    EventModule,
    QuotaModule,
    TaskModule,
    CommentModule,
    CircleModule,
    TaskGroupModule,
    UserModule,
    AuthModule,
    LlmModule,
    CoachModule,
  ],
  providers: [CoachJobs, CleanupJobs],
})
export class AppModule {}
