import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { CreateTaskGroupDto } from './dto/create-task-group.dto';
import { UpdateTaskGroupDto } from './dto/update-task-group.dto';

export interface TaskGroupView {
  id: string;
  name: string;
  color: string;
  notes: string | null;
  totalCount: number;
  doneCount: number;
  progress: number;
  createdAt: Date;
}

@Injectable()
export class TaskGroupService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTaskGroupDto): Promise<TaskGroupView> {
    const created = await this.prisma.client.taskGroup.create({
      data: {
        userId,
        name: dto.name,
        notes: dto.notes ?? null,
        color: dto.color ?? '#888888',
      },
    });
    return { ...created, totalCount: 0, doneCount: 0, progress: 0 };
  }

  async findMyGroups(userId: string): Promise<TaskGroupView[]> {
    const groups = await this.prisma.client.taskGroup.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    const results: TaskGroupView[] = [];
    for (const g of groups) {
      const totalCount = await this.prisma.client.task.count({ where: { taskGroupId: g.id } });
      const doneCount = await this.prisma.client.task.count({ where: { taskGroupId: g.id, status: 'DONE' } });
      results.push({
        ...g,
        totalCount,
        doneCount,
        progress: totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0,
      });
    }
    return results;
  }

  async findOne(userId: string, id: string): Promise<TaskGroupView> {
    const g = await this.prisma.client.taskGroup.findFirst({ where: { id, userId } });
    if (!g) throw new BusinessException(40401, '任务组不存在或无权访问');
    const totalCount = await this.prisma.client.task.count({ where: { taskGroupId: g.id } });
    const doneCount = await this.prisma.client.task.count({ where: { taskGroupId: g.id, status: 'DONE' } });
    return { ...g, totalCount, doneCount, progress: totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0 };
  }

  async update(userId: string, id: string, dto: UpdateTaskGroupDto): Promise<TaskGroupView> {
    const existing = await this.prisma.client.taskGroup.findFirst({ where: { id, userId } });
    if (!existing) throw new BusinessException(40401, '任务组不存在或无权访问');
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.color !== undefined) data.color = dto.color;
    const updated = await this.prisma.client.taskGroup.update({ where: { id }, data });
    const totalCount = await this.prisma.client.task.count({ where: { taskGroupId: id } });
    const doneCount = await this.prisma.client.task.count({ where: { taskGroupId: id, status: 'DONE' } });
    return { ...updated, totalCount, doneCount, progress: totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0 };
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.client.taskGroup.findFirst({ where: { id, userId } });
    if (!existing) throw new BusinessException(40401, '任务组不存在或无权访问');
    await this.prisma.client.taskGroup.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
  }
}
