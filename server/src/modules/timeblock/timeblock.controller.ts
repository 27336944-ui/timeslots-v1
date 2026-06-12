import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TimeBlockService } from './timeblock.service';
import { ApprovalService } from '../approval/approval.service';
import { CreateTimeBlockDto } from './dto/create-timeblock.dto';
import { UpdateTimeBlockDto } from './dto/update-timeblock.dto';
import { TimeBlockResponseDto } from './dto/timeblock-response.dto';


@Controller('api/v1/time-blocks')
@UseGuards(JwtAuthGuard)
export class TimeBlockController {
  constructor(
    private readonly timeBlockService: TimeBlockService,
    private readonly approvalService: ApprovalService,
  ) {}

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
  ): Promise<Record<string, TimeBlockResponseDto[]>> {
    return this.timeBlockService.findByDateRange(userId, start, end);
  }

  @Get('by-task/:taskId')
  async findByTaskId(
    @CurrentUser('userId') userId: string,
    @Param('taskId') taskId: string,
  ): Promise<TimeBlockResponseDto[]> {
    return this.timeBlockService.findByTaskId(userId, taskId);
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
    await this.approvalService.handleBlockUpdate(userId, id).catch(() => {});
    return result;
  }

  @Delete(':id')
  async remove(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ): Promise<{ deleted: boolean }> {
    await this.timeBlockService.softDelete(userId, id);
    return { deleted: true };
  }
}
