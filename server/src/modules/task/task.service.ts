
import { Injectable, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException, ErrorCodes } from '../../common/exceptions/business-exception';
import { EventLogService } from '../eventlog/event-log.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { TaskStatsDto } from './dto/task-stats.dto';
import { ForwardCreateTaskDto } from './dto/forward-create-task.dto';


function isValidSteps(steps: unknown): steps is { text: string; isDone: boolean }[] {
  if (!Array.isArray(steps)) return false;
  return steps.every(s => typeof s === 'object' && s !== null && 'text' in s && 'isDone' in s && typeof s.text === 'string' && typeof s.isDone === 'boolean');
}

function toResponse(task: {
  id: string;
  userId: string;
  title: string;
  goal: string | null;
  steps: unknown;
  status: string;
  category: string;
  categoryId: string | null;
  startDate: Date | null;
  dueAt: Date | null;
  triggerTime: Date | null;
  completedNote: string | null;
  retrospective: string | null;
  improvements: string | null;
  estimatedDuration: number | null;
  createdAt: Date;
  updatedAt: Date;
}): TaskResponseDto {
  return {
    id: task.id,
    userId: task.userId,
    title: task.title,
    goal: task.goal,
    steps: isValidSteps(task.steps) ? task.steps : null,
    status: task.status,
    category: task.category,
    categoryId: task.categoryId,
    startDate: task.startDate?.toISOString() ?? null,
    dueAt: task.dueAt?.toISOString() ?? null,
    triggerTime: task.triggerTime?.toISOString() ?? null,
    completedNote: task.completedNote,
    retrospective: task.retrospective,
    improvements: task.improvements,
    estimatedDuration: task.estimatedDuration ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}


@Injectable()
export class TaskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventLog: EventLogService,
  ) {}

  async create(userId: string, dto: CreateTaskDto, _eventSource?: string): Promise<TaskResponseDto> {
    let categoryId = dto.categoryId;
    let category = dto.category ?? 'life';

    if (!categoryId) {
      const defaultCat = await this.getDefaultCategory(userId);
      if (defaultCat) {
        categoryId = defaultCat.id;
        category = defaultCat.name;
      }
    }

    const task = await this.prisma.client.task.create({
      data: {
        userId,
        title: dto.title,
        goal: dto.goal ?? null,
        steps: (dto.steps ?? undefined) as Prisma.InputJsonValue,
        status: dto.status ?? 'pending',
        category,
        categoryId,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        triggerTime: dto.triggerTime ? new Date(dto.triggerTime) : null,
        estimatedDuration: dto.estimatedDuration ?? null,
      },
    });

    this.eventLog.log(userId, 'task_create', {
      source: _eventSource ?? 'manual',
      categoryId: categoryId ?? undefined,
    });

    return toResponse(task);
  }

  async forwardCreateTask(userId: string, dto: ForwardCreateTaskDto): Promise<TaskResponseDto> {
    const lines = dto.text.trim().split('\n').filter((l) => l.trim().length > 0);
    const title = lines[0]?.trim() || '来自微信消息';
    const goal = lines.slice(1).join('\n').trim() || undefined;

    return this.create(userId, {
      title,
      goal,
      status: 'pending',
      category: 'life',
      categoryId: undefined,
      dueAt: undefined,
      steps: undefined,
    }, 'wechat');
  }

  private async getDefaultCategory(userId: string): Promise<{ id: string; name: string } | null> {
    const workParent = await this.prisma.client.category.findFirst({
      where: { userId, name: '工作', parentId: null, isDeleted: false },
    });
    if (!workParent) return null;

    const defaultChild = await this.prisma.client.category.findFirst({
      where: { userId, parentId: workParent.id, isDefault: true, isDeleted: false },
    });
    if (!defaultChild) return null;

    return { id: defaultChild.id, name: defaultChild.name };
  }

  async findMyTasks(userId: string, limit?: string, offset?: string): Promise<TaskResponseDto[]> {
    const take = limit ? parseInt(limit, 10) : undefined;
    const skip = offset ? parseInt(offset, 10) : undefined;
    const tasks = await this.prisma.client.task.findMany({
      where: { userId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });

    return tasks.map(toResponse);
  }

  async findById(userId: string, id: string): Promise<TaskResponseDto> {
    const task = await this.prisma.client.task.findFirst({
      where: { id, isDeleted: false },
    });

    if (!task) {
      throw new BusinessException(ErrorCodes.TASK_NOT_FOUND, '任务不存在', HttpStatus.NOT_FOUND);
    }

    if (task.userId !== userId) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '无权访问该任务', HttpStatus.FORBIDDEN);
    }

    return toResponse(task);
  }

  async findByCategory(userId: string, category: string): Promise<TaskResponseDto[]> {
    if (!['work', 'life', 'private'].includes(category)) {
      throw new BusinessException(ErrorCodes.INVALID_CATEGORY, '分类无效，应为 work/life/private');
    }

    const tasks = await this.prisma.client.task.findMany({
      where: { userId, category },
      orderBy: { createdAt: 'desc' },
    });

    return tasks.map(toResponse);
  }

  async update(userId: string, id: string, dto: UpdateTaskDto): Promise<TaskResponseDto> {
    const task = await this.prisma.client.task.findFirst({
      where: { id, isDeleted: false },
    });

    if (!task) {
      throw new BusinessException(ErrorCodes.TASK_NOT_FOUND, '任务不存在', HttpStatus.NOT_FOUND);
    }

    if (task.userId !== userId) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '无权修改该任务', HttpStatus.FORBIDDEN);
    }

    const updated = await this.prisma.client.task.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.goal !== undefined && { goal: dto.goal }),
        ...(dto.steps !== undefined && { steps: dto.steps as Prisma.InputJsonValue }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.startDate !== undefined && { startDate: dto.startDate ? new Date(dto.startDate) : null }),
        ...(dto.dueAt !== undefined && { dueAt: dto.dueAt ? new Date(dto.dueAt) : null }),
        ...(dto.triggerTime !== undefined && { triggerTime: dto.triggerTime ? new Date(dto.triggerTime) : null }),
        ...(dto.completedNote !== undefined && { completedNote: dto.completedNote }),
        ...(dto.retrospective !== undefined && { retrospective: dto.retrospective }),
        ...(dto.improvements !== undefined && { improvements: dto.improvements }),
        ...(dto.estimatedDuration !== undefined && { estimatedDuration: dto.estimatedDuration }),
      },
    });

    return toResponse(updated);
  }

  async softDelete(userId: string, id: string): Promise<void> {
    const task = await this.prisma.client.task.findFirst({
      where: { id, isDeleted: false },
    });

    if (!task) {
      throw new BusinessException(ErrorCodes.TASK_NOT_FOUND, '任务不存在', HttpStatus.NOT_FOUND);
    }

    if (task.userId !== userId) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '无权删除该任务', HttpStatus.FORBIDDEN);
    }

    await this.prisma.client.task.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  async completeWithReview(
    userId: string,
    taskId: string,
    completedNote: string,
    retrospective: string,
  ): Promise<TaskResponseDto> {
    const task = await this.prisma.client.task.findFirst({ where: { id: taskId, isDeleted: false } });
    if (!task) throw new BusinessException(ErrorCodes.TASK_NOT_FOUND, '任务不存在', HttpStatus.NOT_FOUND);
    if (task.userId !== userId) throw new BusinessException(ErrorCodes.FORBIDDEN, '无权操作', HttpStatus.FORBIDDEN);

    const allDone = await this.prisma.client.step.findMany({
      where: { taskId, status: { not: 'done' } },
      take: 1,
    });
    if (allDone.length > 0) {
      throw new BusinessException(ErrorCodes.VALIDATION_FAILED, '还有未完成的步骤', HttpStatus.CONFLICT);
    }

    const updated = await this.prisma.client.task.update({
      where: { id: taskId },
      data: {
        status: 'done',
        completedNote,
        retrospective,
      },
    });

    this.eventLog.log(userId, 'task_complete', { taskId });

    return toResponse(updated);
  }

  async getStats(userId: string): Promise<TaskStatsDto> {
    const tasks = await this.prisma.client.task.findMany({
        where: { userId },
      select: { id: true, status: true, dueAt: true },
    });

    const now = new Date();
    const todayStart = this.getShanghaiDayStart(now);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    const weekStart = this.getShanghaiMondayStart();
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    let pending = 0;
    let inProgress = 0;
    let done = 0;
    let overdue = 0;
    let today = 0;
    let week = 0;

    for (const t of tasks) {
      if (t.status === 'pending') pending++;
      else if (t.status === 'in_progress') inProgress++;
      else if (t.status === 'done') done++;

      if (t.status !== 'done' && t.dueAt) {
        if (t.dueAt < now) {
          overdue++;
        }
        if (t.dueAt >= todayStart && t.dueAt < todayEnd) {
          today++;
        }
        if (t.dueAt >= weekStart && t.dueAt < weekEnd) {
          week++;
        }
      }
    }

    const total = tasks.length;

    const taskIdsWithBlock = await this.prisma.client.timeBlock.findMany({
      where: { userId, taskId: { not: null } },
      select: { taskId: true },
      distinct: ['taskId'],
    });
    const arrangedSet = new Set(taskIdsWithBlock.map(b => b.taskId as string));
    const arranged = tasks.filter(t => arrangedSet.has(t.id)).length;
    const unarranged = total - arranged;

    return { total, pending, inProgress, done, arranged, unarranged, overdue, today, week };
  }

  private getShanghaiDayStart(date: Date): Date {
    const local = date.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
    return new Date(`${local}T00:00:00+08:00`);
  }

  private getShanghaiMondayStart(): Date {
    const todayStart = this.getShanghaiDayStart(new Date());
    const day = todayStart.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(todayStart);
    monday.setDate(monday.getDate() + diff);
    return monday;
  }
}
