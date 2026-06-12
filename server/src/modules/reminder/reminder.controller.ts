import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReminderService } from './reminder.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { ReminderResponseDto } from './dto/reminder-response.dto';


@Controller('api/v1/reminders')
@UseGuards(JwtAuthGuard)
export class ReminderController {
  constructor(private readonly reminderService: ReminderService) {}

  @Post()
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateReminderDto,
  ): Promise<ReminderResponseDto> {
    return this.reminderService.create(userId, dto);
  }

  @Get('my')
  async findMyReminders(
    @CurrentUser('userId') userId: string,
  ): Promise<ReminderResponseDto[]> {
    return this.reminderService.findMyReminders(userId);
  }

  @Get('block/:blockId')
  async findByBlockId(
    @CurrentUser('userId') userId: string,
    @Param('blockId') blockId: string,
  ): Promise<ReminderResponseDto[]> {
    return this.reminderService.findByBlockId(userId, blockId);
  }

  @Get(':id')
  async findById(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ): Promise<ReminderResponseDto> {
    return this.reminderService.findById(userId, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateReminderDto,
  ): Promise<ReminderResponseDto> {
    return this.reminderService.update(userId, id, dto);
  }

  @Delete(':id')
  async remove(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ): Promise<{ deleted: boolean }> {
    await this.reminderService.softDelete(userId, id);
    return { deleted: true };
  }
}
