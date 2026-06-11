import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TimeBlockService } from './timeblock.service';
import { CreateTimeBlockDto } from './dto/create-timeblock.dto';
import { UpdateTimeBlockDto } from './dto/update-timeblock.dto';
import { TimeBlockResponseDto } from './dto/timeblock-response.dto';


@Controller('api/v1/time-blocks')
@UseGuards(JwtAuthGuard)
export class TimeBlockController {
  constructor(private readonly timeBlockService: TimeBlockService) {}

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
    return this.timeBlockService.update(userId, id, dto);
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
