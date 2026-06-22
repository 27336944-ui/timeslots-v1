import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AiController } from './ai.controller';
import { SlotSuggesterService } from './slot-suggester.service';


@Module({
  imports: [PrismaModule],
  controllers: [AiController],
  providers: [SlotSuggesterService],
})
export class AiModule {}
