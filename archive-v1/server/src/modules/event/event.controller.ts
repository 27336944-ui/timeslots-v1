import {
  Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { EventService, MyEventView } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import type { TimeBlock } from '@prisma/client';

/**
 * 日程（Time Block）HTTP 端点。
 *
 * - `POST   /api/v1/time-blocks`            创建（自动扣 1 点）
 * - `GET    /api/v1/time-blocks/my`         列表（不含 encryptedDetails）
 * - `GET    /api/v1/time-blocks/by-date/:date`  日视图（指定日 00:00~24:00）
 * - `GET    /api/v1/time-blocks/:id`        单条
 * - `PATCH  /api/v1/time-blocks/:id`        更新
 * - `DELETE /api/v1/time-blocks/:id`        软删除
 */
@Controller('api/v1/time-blocks')
@UseGuards(JwtAuthGuard)
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateEventDto,
  ): Promise<TimeBlock> {
    return this.eventService.create(userId, dto);
  }

  @Get('my')
  async findMy(@CurrentUser('userId') userId: string): Promise<MyEventView[]> {
    return this.eventService.findMyEvents(userId);
  }

  @Get('shared')
  async findShared(@CurrentUser('userId') userId: string): Promise<MyEventView[]> {
    return this.eventService.findSharedEvents(userId);
  }

  @Get('by-date/:date')
  async findByDate(
    @CurrentUser('userId') userId: string,
    @Param('date') dateStr: string,
  ): Promise<MyEventView[]> {
    return this.eventService.findByDate(userId, new Date(dateStr));
  }

  @Get(':id')
  async findOne(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TimeBlock> {
    return this.eventService.findById(userId, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEventDto,
  ): Promise<TimeBlock> {
    return this.eventService.update(userId, id, dto);
  }

  @Delete(':id')
  async remove(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ deleted: true }> {
    await this.eventService.remove(userId, id);
    return { deleted: true };
  }
}
