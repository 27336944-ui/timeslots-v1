import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EventVisibilityService } from './event-visibility.service';


@Module({
  imports: [PrismaModule],
  providers: [EventVisibilityService],
  exports: [EventVisibilityService],
})
export class VisibilityModule {}
