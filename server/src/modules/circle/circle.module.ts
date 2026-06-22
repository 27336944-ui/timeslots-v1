import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CircleController } from './circle.controller';
import { CircleService } from './circle.service';


@Module({
  imports: [PrismaModule],
  controllers: [CircleController],
  providers: [CircleService],
  exports: [CircleService],
})
export class CircleModule {}
