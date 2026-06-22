import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StepService } from './step.service';
import { CreateStepDto } from './dto/create-step.dto';
import { UpdateStepDto } from './dto/update-step.dto';
import { StepResponseDto } from './dto/step-response.dto';
import { ScheduleStepDto } from './dto/schedule-step.dto';

@Controller('api/v1/steps')
@UseGuards(JwtAuthGuard)
export class StepController {
  constructor(private readonly stepService: StepService) {}

  @Post()
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateStepDto,
  ): Promise<StepResponseDto> {
    return this.stepService.create(userId, dto);
  }

  @Get('by-task/:taskId')
  async findByTaskId(
    @CurrentUser('userId') userId: string,
    @Param('taskId') taskId: string,
  ): Promise<StepResponseDto[]> {
    return this.stepService.findByTaskId(userId, taskId);
  }

  @Get(':id')
  async findById(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ): Promise<StepResponseDto> {
    return this.stepService.findById(userId, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateStepDto,
  ): Promise<StepResponseDto> {
    return this.stepService.update(userId, id, dto);
  }

  @Delete(':id')
  async remove(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ): Promise<{ deleted: boolean }> {
    await this.stepService.softDelete(userId, id);
    return { deleted: true };
  }

  @Post(':id/schedule')
  async schedule(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: ScheduleStepDto,
  ): Promise<{ step: StepResponseDto; timeBlockId: string }> {
    return this.stepService.schedule(userId, id, dto);
  }
}
