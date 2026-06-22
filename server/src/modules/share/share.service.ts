import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException, ErrorCodes } from '../../common/exceptions/business-exception';
import type { CreateShareRecipientDto, UpdateShareRecipientDto, ShareRecipientResponseDto } from './dto/share.dto';


function toResponse(r: {
  id: string; targetUserId: string; level: string; status: string;
  expiresAt: Date | null; createdAt: Date;
  target: { nickname: string };
}): ShareRecipientResponseDto {
  return {
    id: r.id,
    targetUserId: r.targetUserId,
    targetName: r.target.nickname,
    level: r.level,
    status: r.status,
    expiresAt: r.expiresAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}


@Injectable()
export class ShareService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateShareRecipientDto): Promise<ShareRecipientResponseDto> {
    if (userId === dto.targetUserId) {
      throw new BusinessException(ErrorCodes.VALIDATION_FAILED, '不能与自己共享');
    }
    const existing = await this.prisma.client.shareRecipient.findFirst({
      where: { userId, targetUserId: dto.targetUserId, isDeleted: false },
    });
    if (existing) {
      throw new BusinessException(ErrorCodes.CONCURRENT_MODIFICATION, '已存在共享关系');
    }
    const target = await this.prisma.client.user.findFirst({
      where: { id: dto.targetUserId, isDeleted: false },
    });
    if (!target) {
      throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '目标用户不存在');
    }
    const recipient = await this.prisma.client.shareRecipient.create({
      data: {
        userId,
        targetUserId: dto.targetUserId,
        level: (dto.level ?? 'freebusy') as 'full' | 'freebusy' | 'invite_only',
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
      include: { target: { select: { nickname: true } } },
    });
    return toResponse(recipient);
  }

  async findAll(userId: string): Promise<ShareRecipientResponseDto[]> {
    const list = await this.prisma.client.shareRecipient.findMany({
      where: { userId, isDeleted: false, status: 'active' },
      include: { target: { select: { nickname: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return list.map(toResponse);
  }

  async update(userId: string, id: string, dto: UpdateShareRecipientDto): Promise<ShareRecipientResponseDto> {
    const existing = await this.prisma.client.shareRecipient.findFirst({
      where: { id, userId, isDeleted: false },
      include: { target: { select: { nickname: true } } },
    });
    if (!existing) {
      throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '共享关系不存在');
    }
    const updateData: Record<string, unknown> = {};
    if (dto.level) updateData.level = dto.level;
    if (dto.status) updateData.status = dto.status;
    if (dto.expiresAt !== undefined) {
      updateData.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    }
    const updated = await this.prisma.client.shareRecipient.update({
      where: { id },
      data: updateData,
      include: { target: { select: { nickname: true } } },
    });
    return toResponse(updated);
  }

  async remove(userId: string, id: string): Promise<{ deleted: boolean }> {
    const existing = await this.prisma.client.shareRecipient.findFirst({
      where: { id, userId, isDeleted: false },
    });
    if (!existing) {
      throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '共享关系不存在');
    }
    await this.prisma.client.shareRecipient.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    return { deleted: true };
  }

  async getStealth(userId: string): Promise<{ enabled: boolean; expiresAt: string | null }> {
    const user = await this.prisma.client.user.findFirst({
      where: { id: userId, isDeleted: false },
      select: { settings: true },
    });
    const settings = (user?.settings ?? {}) as Record<string, unknown>;
    const stealth = settings.stealthMode as boolean | undefined;
    const expiresAt = settings.stealthExpiresAt as string | undefined;
    const now = new Date();
    if (stealth && expiresAt && new Date(expiresAt) < now) {
      await this._disableStealth(userId);
      return { enabled: false, expiresAt: null };
    }
    return { enabled: !!stealth, expiresAt: expiresAt ?? null };
  }

  async setStealth(userId: string, durationMinutes?: number): Promise<{ enabled: boolean; expiresAt: string | null }> {
    let expiresAt: string | null = null;
    if (durationMinutes && durationMinutes > 0) {
      const d = new Date(Date.now() + durationMinutes * 60_000);
      expiresAt = d.toISOString();
    }
    const user = await this.prisma.client.user.findFirst({
      where: { id: userId, isDeleted: false },
      select: { settings: true },
    });
    const settings = ((user?.settings ?? {}) as Record<string, unknown>);
    await this.prisma.client.user.update({
      where: { id: userId },
      data: {
        settings: { ...settings, stealthMode: true, stealthExpiresAt: expiresAt },
      },
    });
    return { enabled: true, expiresAt };
  }

  async disableStealth(userId: string): Promise<{ enabled: boolean }> {
    await this._disableStealth(userId);
    return { enabled: false };
  }

  private async _disableStealth(userId: string): Promise<void> {
    const user = await this.prisma.client.user.findFirst({
      where: { id: userId, isDeleted: false },
      select: { settings: true },
    });
    const settings = ((user?.settings ?? {}) as Record<string, unknown>);
    await this.prisma.client.user.update({
      where: { id: userId },
      data: {
        settings: { ...settings, stealthMode: false, stealthExpiresAt: null },
      },
    });
  }
}
