import { Module } from '@nestjs/common';
import { LlmController } from './llm.controller';
import { LlmService } from './llm.service';
import { QuotaModule } from '../quota/quota.module';

@Module({
  imports: [QuotaModule],
  controllers: [LlmController],
  providers: [LlmService],
  exports: [LlmService],
})
export class LlmModule {}
