import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EventLogService } from './event-log.service';


@Global()
@Module({
  imports: [PrismaModule],
  providers: [EventLogService],
  exports: [EventLogService],
})
export class EventLogModule {}
