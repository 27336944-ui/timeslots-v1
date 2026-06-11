import { Injectable } from '@nestjs/common';
import { Prisma, Task, TaskPriority, TaskStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

/**
 * 任务视图（前端展示用）。
 *
 * 排除敏感内部字段；保留业务字段。
 */
export interface TaskView {
  id: string;
  title: string;
  notes: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: Date | null;
  completedAt: Date | null;
  sortOrder: number;
  taskGroupId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 任务聚合统计（前端 3 卡展示用）。
 */
export interface TaskStats {
  today: number;
  week: number;
  overdue: number;
}

/**
 * 查询过滤选项。
 */
export interface TaskListFilter {
  status?: TaskStatus;
  taskGroupId?: string;
  dueFrom?: Date;
  dueTo?: Date;
}

@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建任务。
   *
   * 跨用户隔离：使用 `userId` 过滤写入；不信任前端传入的 userId（从 `@CurrentUser` 注入）。
   */
  async create(userId: string, dto: CreateTaskDto): Promise<TaskView> {
    if (dto.taskGroupId) {
      const group = await this.prisma.client.taskGroup.findFirst({
        where: { id: dto.taskGroupId, userId },
      });
      if (!group) {
        throw new BusinessException(40401, '任务组不存在或无权访问');
      }
    }
    const created = await this.prisma.client.task.create({
      data: {
        userId,
        title: dto.title,
        notes: dto.notes ?? null,
        priority: dto.priority ?? 'MEDIUM',
        status: dto.status ?? 'PENDING',
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        taskGroupId: dto.taskGroupId ?? null,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
    return this.toView(created);
  }

  /**
   * 查询本人任务列表。
   *
   * 支持可选过滤；显式 `userId` 过滤保证跨用户隔离。
   */
  async findMyTasks(
    userId: string,
    filter: TaskListFilter = {},
  ): Promise<TaskView[]> {
    const where: Prisma.TaskWhereInput = { userId };
    if (filter.status) where.status = filter.status;
    if (filter.taskGroupId) where.taskGroupId = filter.taskGroupId;
    if (filter.dueFrom || filter.dueTo) {
      where.dueAt = {};
      if (filter.dueFrom) (where.dueAt as Prisma.DateTimeFilter).gte = filter.dueFrom;
      if (filter.dueTo) (where.dueAt as Prisma.DateTimeFilter).lte = filter.dueTo;
    }
    const tasks = await this.prisma.client.task.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    return tasks.map((t) => this.toView(t));
  }

  /**
   * 聚合统计：今日待办 / 本周到期 / 逾期。
   *
   * - 今日待办：dueAt 在 [今日 00:00, 明日 00:00) 且 status != DONE
   * - 本周到期：dueAt 在 [今日, +7 日) 且 status != DONE
   * - 逾期：dueAt < 今日 00:00 且 status != DONE
   */
  async getStats(userId: string, now: Date = new Date()): Promise<TaskStats> {
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const baseWhere: Prisma.TaskWhereInput = {
      userId,
      status: { not: 'DONE' },
    };

    const [today, week, overdue] = await Promise.all([
      this.prisma.client.task.count({
        where: {
          ...baseWhere,
          dueAt: { gte: startOfToday, lt: startOfTomorrow },
        },
      }),
      this.prisma.client.task.count({
        where: {
          ...baseWhere,
          dueAt: { gte: startOfToday, lt: endOfWeek },
        },
      }),
      this.prisma.client.task.count({
        where: {
          ...baseWhere,
          dueAt: { lt: startOfToday },
        },
      }),
    ]);

    return { today, week, overdue };
  }

  /**
   * 查询单条任务。
   *
   * 跨用户隔离：必须 `userId + id` 复合条件；不匹配抛 404。
   */
  async findOne(userId: string, id: string): Promise<TaskView> {
    const task = await this.prisma.client.task.findFirst({ where: { id, userId } });
    if (!task) {
      throw new BusinessException(40401, '任务不存在或无权访问');
    }
    return this.toView(task);
  }

  /**
   * 更新任务。
   *
   * 业务约定：status -> DONE 时自动设 `completedAt = now`；反向时清空。
   */
  async update(userId: string, id: string, dto: UpdateTaskDto): Promise<TaskView> {
    const existing = await this.prisma.client.task.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new BusinessException(40401, '任务不存在或无权访问');
    }

    const data: Prisma.TaskUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.dueAt !== undefined) {
      data.dueAt = dto.dueAt ? new Date(dto.dueAt) : null;
    }
    if (dto.taskGroupId !== undefined) {
      data.taskGroup = dto.taskGroupId
        ? { connect: { id: dto.taskGroupId } }
        : { disconnect: true };
    }
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === 'DONE') {
        data.completedAt = new Date();
      } else if (existing.status === 'DONE') {
        data.completedAt = null;
      }
    }

    const updated = await this.prisma.client.task.update({ where: { id }, data });
    return this.toView(updated);
  }

  /**
   * 软删除任务。
   *
   * 设置 `isDeleted = true` + `deletedAt = now`；不物理删除（保留 30 天可恢复窗口）。
   */
  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.client.task.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new BusinessException(40401, '任务不存在或无权访问');
    }
    await this.prisma.client.task.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  private toView(t: Task): TaskView {
    return {
      id: t.id,
      title: t.title,
      notes: t.notes,
      status: t.status,
      priority: t.priority,
      dueAt: t.dueAt,
      completedAt: t.completedAt,
      sortOrder: t.sortOrder,
      taskGroupId: t.taskGroupId,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    };
  }
}
