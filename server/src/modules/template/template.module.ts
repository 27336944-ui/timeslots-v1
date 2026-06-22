import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { TemplateService } from './template.service';
import { TemplateController } from './template.controller';

@Module({
  imports: [PrismaModule],
  controllers: [TemplateController],
  providers: [TemplateService],
  exports: [TemplateService],
})
export class TemplateModule {}