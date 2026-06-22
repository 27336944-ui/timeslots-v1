import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { TaskStatsDto } from './dto/task-stats.dto';
import { ForwardCreateTaskDto } from './dto/forward-create-task.dto';
import { CompleteTaskDto } from './dto/complete-task.dto';


@Controller('api/v1/tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateTaskDto,
  ): Promise<TaskResponseDto> {
    return this.taskService.create(userId, dto);
  }

  @Post('from-text')
  async forwardCreate(
    @CurrentUser('userId') userId: string,
    @Body() dto: ForwardCreateTaskDto,
  ): Promise<TaskResponseDto> {
    return this.taskService.forwardCreateTask(userId, dto);
  }

  @Get('my')
  async findMyTasks(
    @CurrentUser('userId') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<TaskResponseDto[]> {
    return this.taskService.findMyTasks(userId, limit, offset);
  }

  @Get('my/stats')
  async getStats(
    @CurrentUser('userId') userId: string,
  ): Promise<TaskStatsDto> {
    return this.taskService.getStats(userId);
  }

  @Get('my/category/:category')
  async findByCategory(
    @CurrentUser('userId') userId: string,
    @Param('category') category: string,
  ): Promise<TaskResponseDto[]> {
    return this.taskService.findByCategory(userId, category);
  }

  @Get(':id')
  async findById(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ): Promise<TaskResponseDto> {
    return this.taskService.findById(userId, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    return this.taskService.update(userId, id, dto);
  }

  @Delete(':id')
  async remove(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ): Promise<{ deleted: boolean }> {
    await this.taskService.softDelete(userId, id);
    return { deleted: true };
  }

  @Post(':id/complete')
  async completeWithReview(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: CompleteTaskDto,
  ): Promise<TaskResponseDto> {
    return this.taskService.completeWithReview(userId, id, dto.completedNote, dto.retrospective);
  }
}
