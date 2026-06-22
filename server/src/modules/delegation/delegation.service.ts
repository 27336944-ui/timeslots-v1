import { Injectable, HttpStatus } from '@nestjs/common';
import { Prisma, StepStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EventLogService } from '../eventlog/event-log.service';
import { NotificationService } from '../notification/notification.service';
import { BusinessException, ErrorCodes } from '../../common/exceptions/business-exception';
import { CreateDelegationDto } from './dto/create-delegation.dto';
import { RespondDelegationDto } from './dto/respond-delegation.dto';
import { DeliverDelegationDto } from './dto/deliver-delegation.dto';
import type { DelegationResponseDto, DelegationListItem } from './dto/delegation-response.dto';
import crypto from 'node:crypto';


function toResponse(d: {
  id: string; type: string; initiatorId: string;
  recipientUserId: string | null; recipientPhone: string | null;
  shareToken: string; stepId: string | null; taskId: string | null;
  blockId: string | null; candidateSlots: unknown; status: string;
  message: string | null; deadline: Date | null; acceptedSlot: unknown;
  deliverNote: string | null; createdAt: Date;
}): DelegationResponseDto {
  return {
    id: d.id,
    type: d.type,
    initiatorId: d.initiatorId,
    recipientUserId: d.recipientUserId ?? null,
    recipientPhone: d.recipientPhone ?? null,
    shareToken: d.shareToken,
    stepId: d.stepId ?? null,
    taskId: d.taskId ?? null,
    blockId: d.blockId ?? null,
    candidateSlots: (d.candidateSlots ?? null) as { startTime: string; endTime: string }[] | null,
    status: d.status,
    message: d.message ?? null,
    deadline: d.deadline?.toISOString() ?? null,
    acceptedSlot: (d.acceptedSlot ?? null) as { startTime: string; endTime: string } | null,
    deliverNote: d.deliverNote ?? null,
    createdAt: d.createdAt.toISOString(),
  };
}


@Injectable()
export class DelegationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventLog: EventLogService,
    private readonly notification: NotificationService,
  ) {}

  async create(userId: string, dto: CreateDelegationDto): Promise<DelegationResponseDto> {
    if (!dto.recipientUserId && !dto.recipientPhone) {
      throw new BusinessException(ErrorCodes.VALIDATION_FAILED, '必须指定接收方', HttpStatus.BAD_REQUEST);
    }

    if (dto.type === 'step_execution') {
      if (!dto.stepId) {
        throw new BusinessException(ErrorCodes.VALIDATION_FAILED, '步骤委托必须指定步骤', HttpStatus.BAD_REQUEST);
      }
      const step = await this.prisma.client.step.findFirst({
        where: { id: dto.stepId, isDeleted: false },
        include: { task: true },
      });
      if (!step || step.task?.userId !== userId) {
        throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '步骤不存在', HttpStatus.NOT_FOUND);
      }
    }

    if (dto.type === 'appointment') {
      if (!dto.blockId) {
        throw new BusinessException(ErrorCodes.VALIDATION_FAILED, '约会委托必须指定时间块', HttpStatus.BAD_REQUEST);
      }
      const block = await this.prisma.client.timeBlock.findFirst({
        where: { id: dto.blockId, isDeleted: false },
      });
      if (!block || block.userId !== userId) {
        throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '时间块不存在', HttpStatus.NOT_FOUND);
      }
    }

    const shareToken = crypto.randomUUID();

    const delegation = await this.prisma.client.delegation.create({
      data: {
        type: dto.type,
        initiatorId: userId,
        recipientUserId: dto.recipientUserId ?? null,
        recipientPhone: dto.recipientPhone ?? null,
        shareToken,
        stepId: dto.stepId ?? null,
        taskId: dto.taskId ?? null,
        blockId: dto.blockId ?? null,
        candidateSlots: (dto.candidateSlots ?? null) as unknown as Prisma.InputJsonValue,
        message: dto.message ?? null,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
      },
    });

    this.eventLog.log(userId, 'delegation_create', {
      source: `type:${dto.type},stepId:${dto.stepId ?? ''}`,
    });

    if (dto.recipientUserId) {
      const recipient = await this.prisma.client.user.findFirst({
        where: { id: dto.recipientUserId, isDeleted: false },
      });
      if (recipient?.openid) {
        this.notification.sendSubscribeMessage({
          userId: dto.recipientUserId,
          openid: recipient.openid,
          scenario: 'delegation_request',
          data: { thing1: `委托：${dto.message ?? '步骤执行'}` },
        });
      }
    }

    return toResponse(delegation);
  }

  async findById(userId: string, id: string): Promise<DelegationResponseDto> {
    const delegation = await this.prisma.client.delegation.findFirst({
      where: { id, isDeleted: false },
    });
    if (!delegation) {
      throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '委托不存在', HttpStatus.NOT_FOUND);
    }
    if (delegation.initiatorId !== userId && delegation.recipientUserId !== userId) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '无权查看此委托', HttpStatus.FORBIDDEN);
    }
    return toResponse(delegation);
  }

  async findMy(userId: string): Promise<{ initiated: DelegationListItem[]; received: DelegationListItem[] }> {
    const [initiated, received] = await Promise.all([
      this.prisma.client.delegation.findMany({
        where: { initiatorId: userId, isDeleted: false },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.client.delegation.findMany({
        where: { recipientUserId: userId, isDeleted: false },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    const enriched = async (list: readonly {
      id: string; type: string; initiatorId: string; recipientUserId: string | null; deadline: Date | null;
      message: string | null; status: string; stepId: string | null; taskId: string | null; createdAt: Date;
    }[], isInitiator: boolean): Promise<DelegationListItem[]> => {
      // P2-1 fix: batch query to avoid N+1
      const stepIds = list.filter(d => d.stepId).map(d => d.stepId!);
      const taskIds = list.filter(d => d.taskId).map(d => d.taskId!);
      const userIds = list.map(d => isInitiator ? d.recipientUserId : d.initiatorId).filter(Boolean) as string[];

      const [steps, tasks, users] = await Promise.all([
        stepIds.length > 0 ? this.prisma.client.step.findMany({ where: { id: { in: stepIds } }, select: { id: true, text: true } }) : [],
        taskIds.length > 0 ? this.prisma.client.task.findMany({ where: { id: { in: taskIds } }, select: { id: true, title: true } }) : [],
        userIds.length > 0 ? this.prisma.client.user.findMany({ where: { id: { in: userIds } }, select: { id: true, nickname: true } }) : [],
      ]);

      const stepMap = new Map(steps.map(s => [s.id, s.text]));
      const taskMap = new Map(tasks.map(t => [t.id, t.title]));
      const userMap = new Map(users.map(u => [u.id, u.nickname]));

      return list.map((d) => {
        const otherUserId = isInitiator ? d.recipientUserId : d.initiatorId;
        return {
          id: d.id,
          type: d.type,
          initiatorId: d.initiatorId,
          initiatorName: otherUserId ? (userMap.get(otherUserId) ?? '未知用户') : '未知用户',
          stepText: d.stepId ? (stepMap.get(d.stepId) ?? null) : null,
          taskTitle: d.taskId ? (taskMap.get(d.taskId) ?? null) : null,
          status: d.status,
          message: d.message ?? null,
          deadline: d.deadline?.toISOString() ?? null,
          createdAt: d.createdAt.toISOString(),
        };
      });
    };

    return {
      initiated: await enriched(initiated, true),
      received: await enriched(received, false),
    };
  }

  async respond(userId: string, id: string, dto: RespondDelegationDto): Promise<DelegationResponseDto> {
    const delegation = await this.prisma.client.delegation.findFirst({
      where: { id, isDeleted: false },
    });
    if (!delegation) {
      throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '委托不存在', HttpStatus.NOT_FOUND);
    }
    if (delegation.recipientUserId && delegation.recipientUserId !== userId) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '无权操作此委托', HttpStatus.FORBIDDEN);
    }
    if (delegation.status !== 'pending') {
      throw new BusinessException(ErrorCodes.VALIDATION_FAILED, '已回应，不可重复操作');
    }

    if (dto.action === 'accept') {
      await this.prisma.client.$transaction(async (tx) => {
        // P0-1 fix: bind recipientUserId atomically with optimistic lock
        if (!delegation.recipientUserId) {
          const updated = await tx.delegation.update({
            where: { id, recipientUserId: null },
            data: { recipientUserId: userId },
          });
          Object.assign(delegation, updated);
        }

        if (delegation.type === 'step_execution' && delegation.stepId) {
          // P1-1 fix: mark step as in_progress (not scheduled)
          await tx.step.update({
            where: { id: delegation.stepId },
            data: { status: StepStatus.in_progress },
          });
        }

        const updateData: Record<string, unknown> = { status: 'accepted' };
        if (delegation.type === 'appointment' && dto.acceptedSlot) {
          updateData.acceptedSlot = dto.acceptedSlot as unknown as Prisma.InputJsonValue;
          const block = await tx.timeBlock.create({
            data: {
              userId: delegation.recipientUserId ?? userId,
              title: delegation.message || '委派任务',
              startTime: new Date(dto.acceptedSlot.startTime),
              endTime: new Date(dto.acceptedSlot.endTime),
              status: 'todo',
              source: 'delegation',
              sourceId: delegation.id,
              nature: 'PUBLIC',
            },
          });
          updateData.blockId = block.id;
        }

        await tx.delegation.update({ where: { id }, data: updateData });
      });
    } else {
      await this.prisma.client.delegation.update({
        where: { id },
        data: { status: 'rejected' },
      });
    }

    // P1-3 fix: query initiator's openid before sending notification
    const initiator = await this.prisma.client.user.findFirst({
      where: { id: delegation.initiatorId, isDeleted: false },
      select: { openid: true },
    });
    this.notification.sendSubscribeMessage({
      userId: delegation.initiatorId,
      openid: initiator?.openid ?? '',
      scenario: 'delegation_complete',
      data: { thing1: `委托已被${dto.action === 'accept' ? '接受' : '拒绝'}` },
    });

    this.eventLog.log(userId, 'delegation_respond', {
      source: `action:${dto.action},delegationId:${id}`,
    });

    const updated = await this.prisma.client.delegation.findFirst({ where: { id } });
    if (!updated) throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '委托不存在', HttpStatus.NOT_FOUND);
    return toResponse(updated);
  }

  async deliver(userId: string, id: string, dto: DeliverDelegationDto): Promise<DelegationResponseDto> {
    const delegation = await this.prisma.client.delegation.findFirst({
      where: { id, isDeleted: false },
    });
    if (!delegation) {
      throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '委托不存在', HttpStatus.NOT_FOUND);
    }
    if (delegation.recipientUserId !== userId) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '只有接收方可以交付', HttpStatus.FORBIDDEN);
    }
    if (delegation.status !== 'accepted') {
      throw new BusinessException(ErrorCodes.VALIDATION_FAILED, '委托未接受，无法交付');
    }

    await this.prisma.client.$transaction(async (tx) => {
      if (delegation.type === 'step_execution' && delegation.stepId) {
        await tx.step.update({
          where: { id: delegation.stepId },
          data: { status: 'done', completedAt: new Date() },
        });
      }

      await tx.delegation.update({
        where: { id },
        data: { status: 'completed', deliverNote: dto.note },
      });
    });

    const initiator2 = await this.prisma.client.user.findFirst({
      where: { id: delegation.initiatorId, isDeleted: false },
      select: { openid: true },
    });
    this.notification.sendSubscribeMessage({
      userId: delegation.initiatorId,
      openid: initiator2?.openid ?? '',
      scenario: 'delegation_complete',
      data: { thing1: '委托已完成交付' },
    });

    this.eventLog.log(userId, 'delegation_deliver', {
      source: `delegationId:${id}`,
    });

    const updated = await this.prisma.client.delegation.findFirst({ where: { id } });
    if (!updated) throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '委托不存在', HttpStatus.NOT_FOUND);
    return toResponse(updated);
  }
}
