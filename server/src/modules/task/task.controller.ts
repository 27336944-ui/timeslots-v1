import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { TaskStatsDto } from './dto/task-stats.dto';


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

  @Get('my')
  async findMyTasks(
    @CurrentUser('userId') userId: string,
  ): Promise<TaskResponseDto[]> {
    return this.taskService.findMyTasks(userId);
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
}
