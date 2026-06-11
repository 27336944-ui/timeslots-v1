
import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { TaskStatsDto } from './dto/task-stats.dto';


function toResponse(task: {
  id: string;
  userId: string;
  title: string;
  goal: string | null;
  steps: unknown;
  status: string;
  priority: string;
  category: string;
  dueAt: Date | null;
  completedNote: string | null;
  retrospective: string | null;
  improvements: string | null;
  createdAt: Date;
  updatedAt: Date;
}): TaskResponseDto {
  return {
    id: task.id,
    userId: task.userId,
    title: task.title,
    goal: task.goal,
    steps: task.steps as { text: string; isDone: boolean }[] | null,
    status: task.status,
    priority: task.priority,
    category: task.category,
    dueAt: task.dueAt?.toISOString() ?? null,
    completedNote: task.completedNote,
    retrospective: task.retrospective,
    improvements: task.improvements,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}


@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTaskDto): Promise<TaskResponseDto> {
    const task = await this.prisma.task.create({
      data: {
        userId,
        title: dto.title,
        goal: dto.goal ?? null,
        steps: (dto.steps ?? undefined) as Prisma.InputJsonValue,
        status: dto.status ?? 'pending',
        priority: dto.priority ?? 'medium',
        category: dto.category ?? 'life',
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
      },
    });

    return toResponse(task);
  }

  async findMyTasks(userId: string): Promise<TaskResponseDto[]> {
    const tasks = await this.prisma.task.findMany({
      where: { userId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
    });

    return tasks.map(toResponse);
  }

  async findById(userId: string, id: string): Promise<TaskResponseDto> {
    const task = await this.prisma.task.findFirst({
      where: { id, isDeleted: false },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    if (task.userId !== userId) {
      throw new ForbiddenException('无权访问该任务');
    }

    return toResponse(task);
  }

  async findByCategory(userId: string, category: string): Promise<TaskResponseDto[]> {
    if (!['work', 'life', 'private'].includes(category)) {
      throw new BadRequestException('分类无效，应为 work/life/private');
    }

    const tasks = await this.prisma.task.findMany({
      where: { userId, category, isDeleted: false },
      orderBy: { createdAt: 'desc' },
    });

    return tasks.map(toResponse);
  }

  async update(userId: string, id: string, dto: UpdateTaskDto): Promise<TaskResponseDto> {
    const task = await this.prisma.task.findFirst({
      where: { id, isDeleted: false },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    if (task.userId !== userId) {
      throw new ForbiddenException('无权修改该任务');
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.goal !== undefined && { goal: dto.goal }),
        ...(dto.steps !== undefined && { steps: dto.steps as Prisma.InputJsonValue }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.dueAt !== undefined && { dueAt: dto.dueAt ? new Date(dto.dueAt) : null }),
        ...(dto.completedNote !== undefined && { completedNote: dto.completedNote }),
        ...(dto.retrospective !== undefined && { retrospective: dto.retrospective }),
        ...(dto.improvements !== undefined && { improvements: dto.improvements }),
      },
    });

    return toResponse(updated);
  }

  async softDelete(userId: string, id: string): Promise<void> {
    const task = await this.prisma.task.findFirst({
      where: { id, isDeleted: false },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    if (task.userId !== userId) {
      throw new ForbiddenException('无权删除该任务');
    }

    await this.prisma.task.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  async getStats(userId: string): Promise<TaskStatsDto> {
    const tasks = await this.prisma.task.findMany({
      where: { userId, isDeleted: false },
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

    const taskIdsWithBlock = await this.prisma.timeBlock.findMany({
      where: { userId, isDeleted: false, taskId: { not: null } },
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
