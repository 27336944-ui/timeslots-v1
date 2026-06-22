import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ApprovalModule } from '../approval/approval.module';
import { VisibilityModule } from '../visibility/visibility.module';
import { TimeBlockController } from './timeblock.controller';
import { TimeBlockService } from './timeblock.service';
import { ShareCardService } from './share-card.service';


@Module({
  imports: [PrismaModule, ApprovalModule, VisibilityModule],
  controllers: [TimeBlockController],
  providers: [TimeBlockService, ShareCardService],
})
export class TimeBlockModule {}
