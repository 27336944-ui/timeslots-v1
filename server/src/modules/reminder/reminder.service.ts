import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { ReminderResponseDto } from './dto/reminder-response.dto';
import { BusinessException, ErrorCodes } from '../../common/exceptions/business-exception';


function toResponse(reminder: {
  id: string;
  userId: string;
  blockId: string;
  remindAt: Date;
  leadMinutes: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): ReminderResponseDto {
  return {
    id: reminder.id,
    userId: reminder.userId,
    blockId: reminder.blockId,
    remindAt: reminder.remindAt.toISOString(),
    leadMinutes: reminder.leadMinutes,
    status: reminder.status,
    createdAt: reminder.createdAt.toISOString(),
    updatedAt: reminder.updatedAt.toISOString(),
  };
}


@Injectable()
export class ReminderService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateReminderDto): Promise<ReminderResponseDto> {
    const block = await this.prisma.client.timeBlock.findFirst({
      where: { id: dto.blockId },
    });

    if (!block) {
      throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '时间块不存在', HttpStatus.NOT_FOUND);
    }

    if (block.userId !== userId) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '无权为该时间块设置提醒', HttpStatus.FORBIDDEN);
    }

    if (block.startTime <= new Date()) {
      throw new BusinessException(ErrorCodes.VALIDATION_FAILED, '无法为已开始的时间块设置提醒');
    }

    const existing = await this.prisma.client.reminder.findFirst({
      where: {
        userId,
        blockId: dto.blockId,
        status: { in: ['PENDING', 'SENDING'] },
      },
    });

    if (existing) {
      throw new BusinessException(ErrorCodes.DUPLICATE_ENTRY, '该时间块已存在有效提醒', HttpStatus.CONFLICT);
    }

    const remindAt = new Date(block.startTime.getTime() - dto.leadMinutes * 60 * 1000);

    const reminder = await this.prisma.client.reminder.create({
      data: {
        userId,
        blockId: dto.blockId,
        remindAt,
        leadMinutes: dto.leadMinutes,
        status: 'PENDING',
      },
    });

    return toResponse(reminder);
  }

  async findMyReminders(userId: string): Promise<ReminderResponseDto[]> {
    const reminders = await this.prisma.client.reminder.findMany({
      where: { userId },
      orderBy: { remindAt: 'asc' },
    });
    return reminders.map(toResponse);
  }

  async findByBlockId(userId: string, blockId: string): Promise<ReminderResponseDto[]> {
    const reminders = await this.prisma.client.reminder.findMany({
      where: { userId, blockId },
      orderBy: { createdAt: 'desc' },
    });
    return reminders.map(toResponse);
  }

  async findById(userId: string, id: string): Promise<ReminderResponseDto> {
    const reminder = await this.prisma.client.reminder.findFirst({
      where: { id },
    });

    if (!reminder) {
      throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '提醒不存在', HttpStatus.NOT_FOUND);
    }

    if (reminder.userId !== userId) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '无权访问该提醒', HttpStatus.FORBIDDEN);
    }

    return toResponse(reminder);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateReminderDto,
  ): Promise<ReminderResponseDto> {
    const reminder = await this.prisma.client.reminder.findFirst({
      where: { id },
    });

    if (!reminder) {
      throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '提醒不存在', HttpStatus.NOT_FOUND);
    }

    if (reminder.userId !== userId) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '无权修改该提醒', HttpStatus.FORBIDDEN);
    }

    if (reminder.status !== 'PENDING') {
      throw new BusinessException(ErrorCodes.VALIDATION_FAILED, '只能修改待发送的提醒');
    }

    const data: Record<string, unknown> = {};

    if (dto.leadMinutes !== undefined) {
      const block = await this.prisma.client.timeBlock.findFirst({
      where: { id: reminder.blockId },
    });

      if (!block) {
        throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '关联时间块不存在', HttpStatus.NOT_FOUND);
      }

      data.leadMinutes = dto.leadMinutes;
      data.remindAt = new Date(block.startTime.getTime() - dto.leadMinutes * 60 * 1000);
    }

    if (dto.status !== undefined) {
      data.status = dto.status;
    }

    const updated = await this.prisma.client.reminder.update({
      where: { id },
      data,
    });

    return toResponse(updated);
  }

  async softDelete(userId: string, id: string): Promise<void> {
    const reminder = await this.prisma.client.reminder.findFirst({
      where: { id },
    });

    if (!reminder) {
      throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '提醒不存在', HttpStatus.NOT_FOUND);
    }

    if (reminder.userId !== userId) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '无权删除该提醒', HttpStatus.FORBIDDEN);
    }

    await this.prisma.client.reminder.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  /**
   * 扫描待发送提醒，防重发（行锁语义）
   * 返回值是成功数 + 失败数
   */
  async scanAndSend(): Promise<{ sent: number; failed: number }> {
    const now = new Date();

    // 行锁：原子 updateMany 仅锁定 PENDING 记录，多实例竞争下仅第一个成功
    await this.prisma.client.reminder.updateMany({
      where: { isDeleted: false, status: 'PENDING', remindAt: { lte: now } },
      data: { status: 'SENDING' },
    });

    let sent = 0;
    let failed = 0;

    const toSend = await this.prisma.client.reminder.findMany({
      where: { status: 'SENDING' },
    });

    if (toSend.length === 0) {
      return { sent: 0, failed: 0 };
    }

    for (const reminder of toSend) {
      try {
        // TODO: 实际发送微信订阅消息（需 templateId）
        // 当前仅记录日志
        console.warn(
          `[ReminderCron] 发送提醒 userId=${reminder.userId} blockId=${reminder.blockId} remindAt=${reminder.remindAt.toISOString()}`,
        );

        await this.prisma.client.reminder.update({
          where: { id: reminder.id },
          data: { status: 'SENT' },
        });
        sent++;
      } catch {
        await this.prisma.client.reminder.update({
          where: { id: reminder.id },
          data: { status: 'FAILED' },
        });
        failed++;
      }
    }

    return { sent, failed };
  }
}
