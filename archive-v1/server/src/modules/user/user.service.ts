import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QuotaService } from '../quota/quota.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { UpdateProfileDto } from './dto/update-profile.dto';

export interface UserProfileView {
  profile: { nickname: string; subtitle: string };
  quota: { permanent: number; monthly: number; expiresLabel: string };
}

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quotaService: QuotaService,
  ) {}

  async getProfile(userId: string): Promise<UserProfileView> {
    const user = await this.prisma.client.user.findUnique({ where: { id: userId } });
    if (!user) throw new BusinessException(40401, '用户不存在');
    const balance = await this.quotaService.getBalance(userId);
    const expiresLabel = balance.monthlyExpireAt
      ? new Date(balance.monthlyExpireAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
      : '无';

    return {
      profile: {
        nickname: user.nickname ?? '用户',
        subtitle: '已用额度 ',
      },
      quota: {
        permanent: balance.permanentPoints,
        monthly: balance.monthlyPoints,
        expiresLabel,
      },
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserProfileView> {
    const data: Record<string, unknown> = {};
    if (dto.nickname !== undefined) data.nickname = dto.nickname;
    if (dto.avatarUrl !== undefined) data.avatarUrl = dto.avatarUrl;
    if (dto.dayStartsAt !== undefined) data.dayStartsAt = dto.dayStartsAt;
    if (dto.coachSettings !== undefined) data.coachSettings = dto.coachSettings;
    if (Object.keys(data).length > 0) {
      await this.prisma.client.user.update({ where: { id: userId }, data });
    }
    return this.getProfile(userId);
  }

  async requestDelete(userId: string): Promise<void> {
    const user = await this.prisma.client.user.findUnique({ where: { id: userId } });
    if (!user) throw new BusinessException(40401, '用户不存在');
    if (user.status === 'PENDING_DELETE') {
      throw new BusinessException(40901, '账号删除已申请，等待 7 天冷静期');
    }
    if (user.status === 'DELETED') {
      throw new BusinessException(40401, '账号已删除');
    }

    await this.prisma.client.user.update({
      where: { id: userId },
      data: { status: 'PENDING_DELETE', deletedAt: new Date() },
    });
  }

  async restoreAccount(userId: string): Promise<void> {
    const user = await this.prisma.client.user.findUnique({ where: { id: userId } });
    if (!user) throw new BusinessException(40401, '用户不存在');
    if (user.status !== 'PENDING_DELETE') {
      throw new BusinessException(40001, '当前无待恢复的删除申请');
    }

    await this.prisma.client.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE', deletedAt: null },
    });
  }

  async hardDeleteExpired(): Promise<number> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const expired = await this.prisma.client.user.findMany({
      where: {
        status: 'PENDING_DELETE',
        deletedAt: { lte: sevenDaysAgo },
        isDeleted: false,
      },
      select: { id: true },
    });

    if (expired.length === 0) return 0;

    const now = new Date();
    const ids = expired.map((u) => u.id);

    await this.prisma.$transaction(async (tx) => {
      await tx.timeBlock.updateMany({ where: { userId: { in: ids }, isDeleted: false }, data: { isDeleted: true, deletedAt: now } });
      await tx.task.updateMany({ where: { userId: { in: ids }, isDeleted: false }, data: { isDeleted: true, deletedAt: now } });
      await tx.taskGroup.updateMany({ where: { userId: { in: ids }, isDeleted: false }, data: { isDeleted: true, deletedAt: now } });
      await tx.comment.updateMany({ where: { authorId: { in: ids }, isDeleted: false }, data: { isDeleted: true, deletedAt: now } });
      await tx.circle.updateMany({ where: { ownerId: { in: ids }, isDeleted: false }, data: { isDeleted: true, deletedAt: now } });
      await tx.coachCard.updateMany({ where: { userId: { in: ids }, isDeleted: false }, data: { isDeleted: true, deletedAt: now } });
      await tx.quotaTransaction.updateMany({ where: { userId: { in: ids }, isDeleted: false }, data: { isDeleted: true, deletedAt: now } });
      await tx.quota.updateMany({ where: { userId: { in: ids }, isDeleted: false }, data: { isDeleted: true, deletedAt: now } });
      await tx.user.updateMany({ where: { id: { in: ids } }, data: { status: 'DELETED', isDeleted: true, deletedAt: now } });
    });

    return expired.length;
  }
}
