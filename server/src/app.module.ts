
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { TimeBlockModule } from './modules/timeblock/timeblock.module';
import { TaskModule } from './modules/task/task.module';


@Module({
  imports: [
    
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    PrismaModule,
    
    HealthModule,
    
    AuthModule,

    TimeBlockModule,

    TaskModule,
  ],
})
export class AppModule {}
