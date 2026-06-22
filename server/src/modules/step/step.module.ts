import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { StepController } from './step.controller';
import { StepService } from './step.service';

@Module({
  imports: [PrismaModule],
  controllers: [StepController],
  providers: [StepService],
})
export class StepModule {}
