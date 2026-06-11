import { Module } from '@nestjs/common';
import { CoachController } from './coach.controller';
import { CoachService } from './coach.service';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [LlmModule],
  controllers: [CoachController],
  providers: [CoachService],
  exports: [CoachService],
})
export class CoachModule {}
