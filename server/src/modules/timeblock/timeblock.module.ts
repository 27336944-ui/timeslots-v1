import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { TimeBlockController } from './timeblock.controller';
import { TimeBlockService } from './timeblock.service';


@Module({
  imports: [PrismaModule],
  controllers: [TimeBlockController],
  providers: [TimeBlockService],
})
export class TimeBlockModule {}
