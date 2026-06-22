import { Injectable, HttpStatus } from '@nestjs/common';
import { ContactType, ApprovalRecipientStatus, ApprovalRequestStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException, ErrorCodes } from '../../common/exceptions/business-exception';
import { EventLogService } from '../eventlog/event-log.service';
import { CreateApprovalDto } from './dto/create-approval.dto';
import { RespondApprovalDto } from './dto/respond-approval.dto';
import { ApprovalResponseDto } from './dto/approval-response.dto';
import { NotificationService } from '../notification/notification.service';
import { SmsService } from '../notification/sms.service';
import * as crypto from 'crypto';


type ApprovalRequestWithRecipients = Prisma.ApprovalRequestGetPayload<{
  include: { recipients: true };
}>;

type PendingRecipientWithRequest = Prisma.ApprovalRecipientGetPayload<{
  include: {
    request: {
      include: {
        initiator: { select: { id: true; nickname: true; avatar: true } };
      };
    };
  };
}>;

export interface PendingItem {
  recipientId: string;
  requestId: string;
  title: string;
  startTime: string;
  endTime: string;
  description: string | null;
  status: string;
  initiator: { id: string; nickname: string; avatar: string | null };
  createdAt: string;
}

export interface RespondResult {
  action: string;
  ok: boolean;
}

export interface BindResult {
  recipientId: string;
}

export interface OkResult {
  ok: boolean;
}

export interface ShareInfoResult {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  description: string | null;
  category: string;
  status: string;
  initiator: { id: string; nickname: string; avatar: string | null };
}

function toISO(d: Date | string): string {
  return d instanceof Date ? d.toISOString() : d;
}


@Injectable()
export class ApprovalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notification: NotificationService,
    private readonly sms: SmsService,
    private readonly eventLog: EventLogService,
  ) {}

  async create(userId: string, dto: CreateApprovalDto): Promise<ApprovalResponseDto> {
    const block = await this.prisma.client.timeBlock.findFirst({
      where: { id: dto.blockId, userId, isDeleted: false },
    });
    if (!block) throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '日程不存在', HttpStatus.NOT_FOUND);

    const shareToken = crypto.randomUUID();

    const request = await this.prisma.client.$transaction(async (tx) => {
      const req = await tx.approvalRequest.create({
        data: {
          initiatorId: userId,
          blockId: block.id,
          title: block.title,
          startTime: block.startTime,
          endTime: block.endTime,
          description: block.description,
          category: block.category,
          nature: block.nature,
          categoryId: block.categoryId,
          circleId: block.circleId,
          shareToken,
          recipients: {
            create: dto.recipients.map((r) => ({
              contactType: r.contactType as ContactType,
              contactValue: r.contactValue ?? null,
              status: 'pending' as ApprovalRecipientStatus,
            })),
          },
        },
        include: { recipients: true },
      });
      return req;
    });

    for (const recipient of request.recipients) {
      if (recipient.contactType === 'phone' && recipient.contactValue) {
        this.sms.send({
          phoneNumber: recipient.contactValue,
          content: `[timeslots] 邀请你参加：${request.title}`,
          shortLink: `https://timeslots.app/d/${request.id}`,
        });
      }
    }

    this.eventLog.log(userId, 'approval_create', {
      entityId: request.id,
      source: `block:${request.blockId},recipients:${request.recipients.length}`,
    });

    return this.toResponse(request, userId);
  }

  async findMyInitiated(userId: string): Promise<ApprovalResponseDto[]> {
    const requests = await this.prisma.client.approvalRequest.findMany({
      where: { initiatorId: userId },
      include: { recipients: true },
      orderBy: { createdAt: 'desc' },
    });
    return requests.map((r) => this.toResponse(r, userId));
  }

  async findMyPending(userId: string): Promise<PendingItem[]> {
    const recipients = await this.prisma.client.approvalRecipient.findMany({
      where: {
        status: 'pending',
        userId,
      },
      include: {
        request: {
          include: {
            initiator: { select: { id: true, nickname: true, avatar: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return recipients.map((r: PendingRecipientWithRequest) => ({
      recipientId: r.id,
      requestId: r.requestId,
      title: r.request.title,
      startTime: toISO(r.request.startTime),
      endTime: toISO(r.request.endTime),
      description: r.request.description,
      status: r.status,
      initiator: r.request.initiator,
      createdAt: toISO(r.createdAt),
    }));
  }

  async findById(userId: string, requestId: string): Promise<ApprovalResponseDto> {
    const request = await this.prisma.client.approvalRequest.findFirst({
      where: { id: requestId, OR: [{ initiatorId: userId }, { recipients: { some: { userId } } }] },
      include: { recipients: true },
    });
    if (!request) throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '审批请求不存在', HttpStatus.NOT_FOUND);
    return this.toResponse(request, userId);
  }

  async respond(
    currentUserId: string,
    requestId: string,
    recipientId: string,
    dto: RespondApprovalDto,
  ): Promise<RespondResult> {
    const recipient = await this.prisma.client.approvalRecipient.findFirst({
      where: { id: recipientId, requestId },
      include: { request: true },
    });
    if (!recipient) throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '审批记录不存在', HttpStatus.NOT_FOUND);
    if (recipient.status !== 'pending') throw new BusinessException(ErrorCodes.VALIDATION_FAILED, '已回应，不可重复操作');
    if (recipient.userId && recipient.userId !== currentUserId) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '无权操作此审批', HttpStatus.FORBIDDEN);
    }

    const reqTitle = recipient.request.title;
    const reqStartTime = recipient.request.startTime;
    const reqEndTime = recipient.request.endTime;
    const reqDescription = recipient.request.description;
    const reqCategory = recipient.request.category;
    const reqNature = recipient.request.nature ?? 'PRIVATE';
    const reqCategoryId = recipient.request.categoryId;
    const reqCircleId = recipient.request.circleId;

    await this.prisma.client.$transaction(async (tx) => {
      if (dto.action === 'approve') {
        const block = await tx.timeBlock.create({
          data: {
            userId: currentUserId,
            title: reqTitle,
            startTime: reqStartTime,
            endTime: reqEndTime,
            description: reqDescription,
            category: reqCategory,
            categoryId: reqCategoryId,
            nature: reqNature,
            circleId: reqCircleId,
            source: 'approval',
            sourceId: recipient.id,
            status: 'todo',
          },
        });

        await tx.approvalRecipient.update({
          where: { id: recipientId },
          data: {
            status: 'approved' as ApprovalRecipientStatus,
            userId: currentUserId,
            blockId: block.id,
            respondedAt: new Date(),
          },
        });
      } else {
        await tx.approvalRecipient.update({
          where: { id: recipientId },
          data: {
            status: 'rejected' as ApprovalRecipientStatus,
            userId: currentUserId,
            respondedAt: new Date(),
          },
        });
      }
    });

    await this.updateRequestStatus(requestId);

    const initiatorId = recipient.request.initiatorId;
    if (initiatorId && initiatorId !== currentUserId) {
      const initiatorUser = await this.prisma.client.user.findFirst({
        where: { id: initiatorId, isDeleted: false },
        select: { openid: true },
      });
      if (initiatorUser?.openid) {
        this.notification.sendSubscribeMessage({
          userId: initiatorId,
          openid: initiatorUser.openid,
          scenario: 'approval_result',
          data: {
            thing1: reqTitle,
            phrase2: dto.action === 'approve' ? '已通过' : '已拒绝',
          },
        });
      }
    }

    this.eventLog.log(currentUserId, 'approval_respond', {
      entityId: requestId,
      source: `action:${dto.action},recipientId:${recipientId}`,
    });

    return { action: dto.action, ok: true };
  }

  async bindRecipient(userId: string, requestId: string): Promise<BindResult> {
    const existing = await this.prisma.client.approvalRecipient.findFirst({
      where: { requestId, userId, isDeleted: false },
    });
    if (existing) throw new BusinessException(ErrorCodes.CONCURRENT_MODIFICATION, '已绑定过此审批，不可重复绑定', HttpStatus.CONFLICT);

    const recipient = await this.prisma.client.approvalRecipient.findFirst({
      where: {
        requestId,
        status: 'pending',
        userId: null,
      },
      orderBy: { createdAt: 'asc' },
    });
    if (!recipient) throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '没有可绑定的审批记录', HttpStatus.NOT_FOUND);

    const updated = await this.prisma.client.approvalRecipient.update({
      where: { id: recipient.id },
      data: { userId },
    });

    return { recipientId: updated.id };
  }

  async resend(userId: string, requestId: string, recipientId: string): Promise<OkResult> {
    const recipient = await this.prisma.client.approvalRecipient.findFirst({
      where: { id: recipientId, requestId },
      include: { request: true },
    });
    if (!recipient || recipient.request.initiatorId !== userId) throw new BusinessException(ErrorCodes.FORBIDDEN, '无权操作', HttpStatus.FORBIDDEN);

    await this.prisma.client.approvalRecipient.update({
      where: { id: recipientId },
      data: { status: 'pending' as ApprovalRecipientStatus, notifiedAt: new Date() },
    });

    if (recipient.contactType === 'phone' && recipient.contactValue) {
      this.sms.send({
        phoneNumber: recipient.contactValue,
        content: `[timeslots] 重新邀请你：${recipient.request.title}`,
        shortLink: `https://timeslots.app/d/${requestId}`,
      });
    }

    return { ok: true };
  }

  async cancel(userId: string, requestId: string): Promise<OkResult> {
    const request = await this.prisma.client.approvalRequest.findFirst({
      where: { id: requestId, initiatorId: userId },
    });
    if (!request) throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '审批请求不存在', HttpStatus.NOT_FOUND);

    await this.prisma.client.$transaction(async (tx) => {
      await tx.approvalRequest.update({
        where: { id: requestId },
        data: { status: 'cancelled', isDeleted: true, deletedAt: new Date() },
      });
      await tx.approvalRecipient.updateMany({
        where: { requestId },
        data: { status: 'expired', isDeleted: true, deletedAt: new Date() },
      });
    });

    return { ok: true };
  }

  async handleBlockUpdate(userId: string, blockId: string): Promise<void> {
    const requests = await this.prisma.client.approvalRequest.findMany({
      where: {
        blockId,
        initiatorId: userId,
        status: { notIn: ['cancelled'] },
        isDeleted: false,
      },
      include: { recipients: true },
    });

    if (requests.length === 0) return;

    const block = await this.prisma.client.timeBlock.findFirst({
      where: { id: blockId },
    });
    if (!block) return;

    const updateData = {
      title: block.title,
      startTime: block.startTime,
      endTime: block.endTime,
      description: block.description,
      category: block.category,
      nature: block.nature,
      categoryId: block.categoryId,
      circleId: block.circleId,
      status: 'pending' as ApprovalRequestStatus,
    };

    const reqIds = requests.map((r) => r.id);
    const respondedRecipientIds: string[] = [];
    for (const req of requests) {
      for (const recipient of req.recipients) {
        if (recipient.status !== 'pending') {
          respondedRecipientIds.push(recipient.id);
        }
      }
    }

    await this.prisma.client.$transaction(async (tx) => {
      await tx.approvalRequest.updateMany({
        where: { id: { in: reqIds } },
        data: updateData,
      });

      if (respondedRecipientIds.length > 0) {
        await tx.approvalRecipient.updateMany({
          where: { id: { in: respondedRecipientIds } },
          data: {
            status: 'pending' as ApprovalRecipientStatus,
            respondedAt: null,
            blockId: null,
          },
        });
      }
    });
  }

  async getByShareToken(token: string): Promise<ShareInfoResult> {
    const request = await this.prisma.client.approvalRequest.findFirst({
      where: { shareToken: token },
      include: {
        initiator: { select: { id: true, nickname: true, avatar: true } },
      },
    });
    if (!request) throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '审批请求不存在', HttpStatus.NOT_FOUND);

    return {
      id: request.id,
      title: request.title,
      startTime: toISO(request.startTime),
      endTime: toISO(request.endTime),
      description: request.description,
      category: request.category,
      status: request.status,
      initiator: request.initiator,
    };
  }

  private async updateRequestStatus(requestId: string): Promise<void> {
    const recipients = await this.prisma.client.approvalRecipient.findMany({
      where: { requestId },
    });

    const total = recipients.length;
    const responded = recipients.filter(
      (r) => r.status === 'approved' || r.status === 'rejected',
    );

    let newStatus: string;
    if (responded.length === 0) newStatus = 'pending';
    else if (responded.length === total) newStatus = 'completed';
    else newStatus = 'partial';

    await this.prisma.client.approvalRequest.update({
      where: { id: requestId },
      data: { status: newStatus as ApprovalRequestStatus },
    });
  }

  private toResponse(request: ApprovalRequestWithRecipients, userId: string): ApprovalResponseDto {
    return {
      id: request.id,
      initiatorId: request.initiatorId,
      blockId: request.blockId,
      title: request.title,
      startTime: toISO(request.startTime),
      endTime: toISO(request.endTime),
      description: request.description,
      category: request.category,
      status: request.status,
      shareToken: request.shareToken,
      isInitiator: request.initiatorId === userId,
      recipients: request.recipients.map((r) => ({
        id: r.id,
        contactType: r.contactType,
        contactValue: r.contactValue,
        status: r.status,
        respondedAt: r.respondedAt?.toISOString?.() ?? (r.respondedAt as unknown as string) ?? null,
      })),
      createdAt: toISO(request.createdAt),
    };
  }
}
