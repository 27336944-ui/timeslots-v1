import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { TaskService, TaskStats, TaskView, TaskListFilter } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';

/**
 * 任务 HTTP 端点。
 *
 * 所有路由都受 `JwtAuthGuard` 保护；userId 从 token 注入（@CurrentUser('userId')），绝不信任前端传入。
 *
 * - `POST   /api/v1/tasks`            创建
 * - `GET    /api/v1/tasks/my`         列表（过滤）
 * - `GET    /api/v1/tasks/my/stats`   聚合统计
 * - `GET    /api/v1/tasks/:id`        单条
 * - `PATCH  /api/v1/tasks/:id`        更新
 * - `DELETE /api/v1/tasks/:id`        软删除
 *
 * 成功响应由全局 `TransformInterceptor` 包装为 `{code: 0, data, message: 'success'}`。
 */
@Controller('api/v1/tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateTaskDto,
  ): Promise<TaskView> {
    return this.taskService.create(userId, dto);
  }

  @Get('my')
  async findMy(
    @CurrentUser('userId') userId: string,
    @Query('status') status?: TaskStatus,
    @Query('taskGroupId') taskGroupId?: string,
    @Query('dueFrom') dueFrom?: string,
    @Query('dueTo') dueTo?: string,
  ): Promise<TaskView[]> {
    const filter: TaskListFilter = {};
    if (status) filter.status = status;
    if (taskGroupId) filter.taskGroupId = taskGroupId;
    if (dueFrom) filter.dueFrom = new Date(dueFrom);
    if (dueTo) filter.dueTo = new Date(dueTo);
    return this.taskService.findMyTasks(userId, filter);
  }

  @Get('my/stats')
  async myStats(@CurrentUser('userId') userId: string): Promise<TaskStats> {
    return this.taskService.getStats(userId);
  }

  @Get(':id')
  async findOne(
    @CurrentUser('userId') userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<TaskView> {
    return this.taskService.findOne(userId, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser('userId') userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateTaskDto,
  ): Promise<TaskView> {
    return this.taskService.update(userId, id, dto);
  }

  @Delete(':id')
  async remove(
    @CurrentUser('userId') userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<{ deleted: true }> {
    await this.taskService.remove(userId, id);
    return { deleted: true };
  }
}
