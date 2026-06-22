import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TimeBlockService } from './timeblock.service';
import { ApprovalService } from '../approval/approval.service';
import { ShareCardService } from './share-card.service';
import { CreateTimeBlockDto } from './dto/create-timeblock.dto';
import { UpdateTimeBlockDto } from './dto/update-timeblock.dto';
import { TimeBlockResponseDto } from './dto/timeblock-response.dto';
import { CheckConflictsDto, ConflictInfo } from './dto/check-conflicts.dto';
import { CreateShareCardDto, ShareCardResponseDto, ShareCardRespondDto, ShareCardRespondResponse } from './dto/share-card.dto';
import { GapDto, PlaceFlexibleDto } from './dto/gap.dto';
import { NamecardResponseDto } from './dto/namecard.dto';
import { TimeBlockStatsDto } from './dto/timeblock-stats.dto';


@Controller('api/v1/time-blocks')
@UseGuards(JwtAuthGuard)
export class TimeBlockController {
  private readonly logger = new Logger(TimeBlockController.name);

  constructor(
    private readonly timeBlockService: TimeBlockService,
    private readonly approvalService: ApprovalService,
    private readonly shareCardService: ShareCardService,
  ) {}

  @Post('check-conflicts')
  async checkConflicts(
    @CurrentUser('userId') userId: string,
    @Body() dto: CheckConflictsDto,
  ): Promise<ConflictInfo[]> {
    return this.timeBlockService.checkConflicts(userId, dto.startTime, dto.endTime, dto.excludeId);
  }

  @Post()
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateTimeBlockDto,
  ): Promise<TimeBlockResponseDto> {
    return this.timeBlockService.create(userId, dto);
  }

  @Get('my')
  async findMyBlocks(
    @CurrentUser('userId') userId: string,
  ): Promise<TimeBlockResponseDto[]> {
    return this.timeBlockService.findMyBlocks(userId);
  }

  @Get('by-date/:date')
  async findByDate(
    @CurrentUser('userId') userId: string,
    @Param('date') date: string,
  ): Promise<TimeBlockResponseDto[]> {
    return this.timeBlockService.findByDate(userId, date);
  }

  @Get('by-date-range')
  async findByDateRange(
    @CurrentUser('userId') userId: string,
    @Query('start') start: string,
    @Query('end') end: string,
    @Query('limit') limit?: string,
  ): Promise<Record<string, TimeBlockResponseDto[]>> {
    return this.timeBlockService.findByDateRange(userId, start, end, limit);
  }

  @Get('by-task/:taskId')
  async findByTaskId(
    @CurrentUser('userId') userId: string,
    @Param('taskId') taskId: string,
  ): Promise<TimeBlockResponseDto[]> {
    return this.timeBlockService.findByTaskId(userId, taskId);
  }

  @Post('share-card')
  async createShareCard(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateShareCardDto,
  ): Promise<ShareCardResponseDto> {
    return this.shareCardService.generateShareCard(userId, dto.date);
  }

  @Get('share-card/:token')
  @Public()
  async getShareCard(
    @Param('token') token: string,
  ): Promise<ShareCardResponseDto | null> {
    return this.shareCardService.getShareCard(token);
  }

  @Post('share-card/:token/respond')
  @Public()
  async respondToShareCard(
    @Param('token') token: string,
    @Body() dto: ShareCardRespondDto,
  ): Promise<ShareCardRespondResponse> {
    return this.shareCardService.respondToShareCard(token, dto);
  }

  @Get('stats')
  async getStats(
    @CurrentUser('userId') userId: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ): Promise<TimeBlockStatsDto> {
    return this.timeBlockService.getStats(userId, start, end);
  }

  @Get('namecard')
  async getNamecard(
    @CurrentUser('userId') userId: string,
    @Query('date') date: string,
  ): Promise<NamecardResponseDto> {
    return this.timeBlockService.generateNamecard(userId, date);
  }

  @Get('gaps')
  async getGaps(
    @CurrentUser('userId') userId: string,
    @Query('date') date: string,
  ): Promise<GapDto[]> {
    return this.timeBlockService.getGaps(userId, date);
  }

  @Post('place-flexible')
  async placeFlexible(
    @CurrentUser('userId') userId: string,
    @Body() dto: PlaceFlexibleDto,
  ): Promise<TimeBlockResponseDto> {
    return this.timeBlockService.placeFlexible(userId, dto);
  }

  @Delete(':id/unplace')
  async unplaceBlock(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ): Promise<{ deleted: boolean }> {
    return this.timeBlockService.unplaceBlock(userId, id);
  }

  @Get(':id')
  async findById(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ): Promise<TimeBlockResponseDto> {
    return this.timeBlockService.findById(userId, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTimeBlockDto,
  ): Promise<TimeBlockResponseDto> {
    const result = await this.timeBlockService.update(userId, id, dto);
    await this.approvalService.handleBlockUpdate(userId, id).catch((err) => {
      this.logger.error(`审批同步失败 blockId=${id}`, err);
    });
    return result;
  }

  @Delete(':id')
  async remove(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Query('updateMode') updateMode?: string,
  ): Promise<{ deleted: boolean }> {
    await this.timeBlockService.softDelete(userId, id, updateMode);
    return { deleted: true };
  }
}
