import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException, ErrorCodes } from '../../common/exceptions/business-exception';
import { EventLogService } from '../eventlog/event-log.service';
import { NotificationService } from '../notification/notification.service';
import { CreateStepDto } from './dto/create-step.dto';
import { UpdateStepDto } from './dto/update-step.dto';
import { StepResponseDto } from './dto/step-response.dto';
import { ScheduleStepDto } from './dto/schedule-step.dto';

interface StepRow {
  id: string;
  taskId: string;
  sortOrder: number;
  text: string;
  estimatedMinutes: number | null;
  status: string;
  dependsOnId: string | null;
  suggestedStart: Date | null;
  suggestedEnd: Date | null;
  timeBlockId: string | null;
  scheduledDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}


function toResponse(s: StepRow, blocked = false): StepResponseDto {
  return {
    id: s.id,
    taskId: s.taskId,
    sortOrder: s.sortOrder,
    text: s.text,
    estimatedMinutes: s.estimatedMinutes,
    status: s.status,
    dependsOnId: s.dependsOnId ?? null,
    blocked,
    suggestedStart: s.suggestedStart?.toISOString() ?? null,
    suggestedEnd: s.suggestedEnd?.toISOString() ?? null,
    timeBlockId: s.timeBlockId,
    scheduledDate: s.scheduledDate?.toISOString() ?? null,
    completedAt: s.completedAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}


async function fetchDepBlockedMap(prisma: PrismaService, steps: StepRow[]): Promise<Map<string, boolean>> {
  const depIds = steps.map(s => s.dependsOnId).filter(Boolean) as string[];
  if (depIds.length === 0) return new Map();

  const deps = await prisma.client.step.findMany({
    where: { id: { in: depIds } },
    select: { id: true, status: true },
  });
  const depStatus = new Map(deps.map(d => [d.id, d.status]));
  const blocked = new Map<string, boolean>();
  for (const s of steps) {
    if (!s.dependsOnId) {
      blocked.set(s.id, false);
    } else {
      blocked.set(s.id, depStatus.get(s.dependsOnId) !== 'done');
    }
  }
  return blocked;
}

@Injectable()
export class StepService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventLog: EventLogService,
    private readonly notification: NotificationService,
  ) {}

  async create(userId: string, dto: CreateStepDto): Promise<StepResponseDto> {
    const task = await this.prisma.client.task.findFirst({ where: { id: dto.taskId } });
    if (!task) {
      throw new BusinessException(ErrorCodes.TASK_NOT_FOUND, '任务不存在', HttpStatus.NOT_FOUND);
    }
    if (task.userId !== userId) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '无权操作该任务', HttpStatus.FORBIDDEN);
    }

    const maxOrder = await this.prisma.client.step.aggregate({
      where: { taskId: dto.taskId },
      _max: { sortOrder: true },
    });
    const sortOrder = dto.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1;

    const step = await this.prisma.client.step.create({
      data: {
        taskId: dto.taskId,
        text: dto.text,
        sortOrder,
        estimatedMinutes: dto.estimatedMinutes ?? null,
        status: (dto.status as 'unscheduled' | 'scheduled' | 'done' | 'overdue') ?? 'unscheduled',
        dependsOnId: dto.dependsOnId ?? null,
      },
    });
    this.eventLog.log(userId, 'step_create', { stepId: step.id, taskId: dto.taskId });
    return toResponse(step as StepRow);
  }

  async findByTaskId(userId: string, taskId: string): Promise<StepResponseDto[]> {
    const task = await this.prisma.client.task.findFirst({ where: { id: taskId } });
    if (!task) {
      throw new BusinessException(ErrorCodes.TASK_NOT_FOUND, '任务不存在', HttpStatus.NOT_FOUND);
    }
    if (task.userId !== userId) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '无权访问该任务', HttpStatus.FORBIDDEN);
    }

    const steps = await this.prisma.client.step.findMany({
      where: { taskId },
      orderBy: { sortOrder: 'asc' },
    }) as StepRow[];

    const blockedMap = await fetchDepBlockedMap(this.prisma, steps);
    return steps.map(s => toResponse(s, blockedMap.get(s.id) ?? false));
  }

  async findById(userId: string, id: string): Promise<StepResponseDto> {
    const step = await this.prisma.client.step.findFirst({ where: { id } }) as StepRow | null;
    if (!step) {
      throw new BusinessException(ErrorCodes.STEP_NOT_FOUND, '步骤不存在', HttpStatus.NOT_FOUND);
    }
    const task = await this.prisma.client.task.findFirst({ where: { id: step.taskId } });
    if (!task || task.userId !== userId) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '无权访问该步骤', HttpStatus.FORBIDDEN);
    }

    let blocked = false;
    if (step.dependsOnId) {
      const dep = await this.prisma.client.step.findFirst({ where: { id: step.dependsOnId }, select: { status: true } });
      blocked = !dep || dep.status !== 'done';
    }
    return toResponse(step, blocked);
  }

  async update(userId: string, id: string, dto: UpdateStepDto): Promise<StepResponseDto> {
    const step = await this.prisma.client.step.findFirst({ where: { id } });
    if (!step) {
      throw new BusinessException(ErrorCodes.STEP_NOT_FOUND, '步骤不存在', HttpStatus.NOT_FOUND);
    }
    const task = await this.prisma.client.task.findFirst({ where: { id: step.taskId } });
    if (!task || task.userId !== userId) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '无权修改该步骤', HttpStatus.FORBIDDEN);
    }

    const data: Record<string, unknown> = {};
    if (dto.text !== undefined) data.text = dto.text;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    if (dto.estimatedMinutes !== undefined) data.estimatedMinutes = dto.estimatedMinutes;
    if (dto.dependsOnId !== undefined) data.dependsOnId = dto.dependsOnId;
    if (dto.suggestedStart !== undefined) data.suggestedStart = new Date(dto.suggestedStart);
    if (dto.suggestedEnd !== undefined) data.suggestedEnd = new Date(dto.suggestedEnd);
    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === 'done') {
        data.completedAt = new Date();
        // overdue→done 回退路径：清除过期标记
      } else if (dto.status === 'scheduled' && step.status === 'overdue') {
        data.scheduledDate = new Date();
      }
    }

    const updated = await this.prisma.client.step.update({ where: { id }, data }) as StepRow;

    this.eventLog.log(userId, 'step_update', {
      stepId: id,
      taskId: step.taskId,
      fromStatus: step.status,
      toStatus: updated.status,
    });

    if (dto.status === 'done') {
      await this.unlockDependents(userId, id);
    }

    let blocked = false;
    if (updated.dependsOnId) {
      const dep = await this.prisma.client.step.findFirst({ where: { id: updated.dependsOnId }, select: { status: true } });
      blocked = !dep || dep.status !== 'done';
    }
    return toResponse(updated, blocked);
  }

  async softDelete(userId: string, id: string): Promise<void> {
    const step = await this.prisma.client.step.findFirst({ where: { id } });
    if (!step) {
      throw new BusinessException(ErrorCodes.STEP_NOT_FOUND, '步骤不存在', HttpStatus.NOT_FOUND);
    }
    const task = await this.prisma.client.task.findFirst({ where: { id: step.taskId } });
    if (!task || task.userId !== userId) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '无权删除该步骤', HttpStatus.FORBIDDEN);
    }
    await this.prisma.client.step.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    this.eventLog.log(userId, 'step_delete', { stepId: id, taskId: step.taskId });
  }

  async schedule(
    userId: string,
    id: string,
    dto: ScheduleStepDto,
  ): Promise<{ step: StepResponseDto; timeBlockId: string }> {
    const step = await this.prisma.client.step.findFirst({ where: { id } }) as StepRow | null;
    if (!step) {
      throw new BusinessException(ErrorCodes.STEP_NOT_FOUND, '步骤不存在', HttpStatus.NOT_FOUND);
    }
    const task = await this.prisma.client.task.findFirst({ where: { id: step.taskId } });
    if (!task || task.userId !== userId) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '无权操作该步骤', HttpStatus.FORBIDDEN);
    }

    let blocked = false;
    if (step.dependsOnId) {
      const dep = await this.prisma.client.step.findFirst({ where: { id: step.dependsOnId }, select: { status: true } });
      blocked = !dep || dep.status !== 'done';
    }
    if (blocked) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '前置步骤未完成，无法排期', HttpStatus.FORBIDDEN);
    }

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    if (startTime >= endTime) {
      throw new BusinessException(ErrorCodes.INVALID_DATE, '开始时间必须早于结束时间');
    }

    const [result, updated] = await this.prisma.client.$transaction(async (tx) => {
      const created = await tx.timeBlock.create({
        data: {
          userId,
          title: `${task.title} - ${step.text}`,
          startTime,
          endTime,
          status: 'todo',
          taskId: step.taskId,
        },
      });

      const updatedStep = await tx.step.update({
        where: { id },
        data: {
          timeBlockId: created.id,
          scheduledDate: startTime,
          status: 'scheduled',
        },
      });

      return [created, updatedStep];
    });

    this.eventLog.log(userId, 'step_schedule', {
      stepId: step.id,
      taskId: step.taskId,
      fromStatus: step.status,
      toStatus: 'scheduled',
    });

    return { step: toResponse(updated as StepRow), timeBlockId: result.id };
  }

  private async unlockDependents(userId: string, stepId: string): Promise<void> {
    const dependents = await this.prisma.client.step.findMany({
      where: { dependsOnId: stepId, status: { not: 'done' } },
      select: { id: true, text: true },
    });
    if (dependents.length === 0) return;

    const user = await this.prisma.client.user.findFirst({
      where: { id: userId, isDeleted: false },
      select: { openid: true },
    });
    if (user?.openid) {
      const dependentTitles = dependents.map((s) => s.text).join('、');
      this.notification.sendSubscribeMessage({
        userId,
        openid: user.openid,
        scenario: 'step_unlock',
        data: {
          thing1: '步骤已完成',
          thing2: dependentTitles,
        },
      });
    }
  }
}
