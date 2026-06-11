import {
  Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards,
} from '@nestjs/common';
import { TaskGroupService, TaskGroupView } from './task-group.service';
import { CreateTaskGroupDto } from './dto/create-task-group.dto';
import { UpdateTaskGroupDto } from './dto/update-task-group.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';

@Controller('api/v1/task-groups')
@UseGuards(JwtAuthGuard)
export class TaskGroupController {
  constructor(private readonly taskGroupService: TaskGroupService) {}

  @Post()
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateTaskGroupDto,
  ): Promise<TaskGroupView> {
    return this.taskGroupService.create(userId, dto);
  }

  @Get('my')
  async findMy(@CurrentUser('userId') userId: string): Promise<TaskGroupView[]> {
    return this.taskGroupService.findMyGroups(userId);
  }

  @Get(':id')
  async findOne(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TaskGroupView> {
    return this.taskGroupService.findOne(userId, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskGroupDto,
  ): Promise<TaskGroupView> {
    return this.taskGroupService.update(userId, id, dto);
  }

  @Delete(':id')
  async remove(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ deleted: true }> {
    await this.taskGroupService.remove(userId, id);
    return { deleted: true };
  }
}
