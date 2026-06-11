import { Injectable } from '@nestjs/common';
import { Circle, CircleRole, CircleStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { CreateCircleDto } from './dto/create-circle.dto';
import { UpdateCircleDto } from './dto/update-circle.dto';
import * as crypto from 'crypto';

/**
 * 圈子视图。
 */
export interface CircleView {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  role: CircleRole;
  inviteCode: string;
  createdAt: Date;
}

@Injectable()
export class CircleService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建圈子。
   *
   * 自动生成 8 位 inviteCode（nanoid 风格）。
   * 创建者自动成为 OWNER + 加入 CircleMember。
   */
  async create(userId: string, dto: CreateCircleDto): Promise<CircleView> {
    const inviteCode = crypto.randomBytes(6).toString('base64url').slice(0, 8);
    const created = await this.prisma.$transaction(async (tx) => {
      const circle = await tx.circle.create({
        data: {
          ownerId: userId,
          name: dto.name,
          description: dto.description ?? null,
          inviteCode,
        },
      });
      await tx.circleMember.create({
        data: { circleId: circle.id, userId, role: 'OWNER' },
      });
      return circle;
    });
    return this.toView(created, 1, 'OWNER');
  }

  /**
   * 获取我的圈子列表。
   */
  async findMyCircles(userId: string): Promise<CircleView[]> {
    const memberships = await this.prisma.client.circleMember.findMany({
      where: { userId },
      include: { circle: true },
    });
    const results: CircleView[] = [];
    for (const m of memberships) {
      const count = await this.prisma.client.circleMember.count({
        where: { circleId: m.circleId },
      });
      results.push(this.toView(m.circle, count, m.role));
    }
    return results;
  }

  /**
   * 圈子详情。
   */
  async findOne(userId: string, id: string): Promise<CircleView> {
    const membership = await this.prisma.client.circleMember.findFirst({
      where: { circleId: id, userId },
      include: { circle: true },
    });
    if (!membership) {
      throw new BusinessException(40401, '圈子不存在或无权访问');
    }
    const count = await this.prisma.client.circleMember.count({
      where: { circleId: id },
    });
    return this.toView(membership.circle, count, membership.role);
  }

  /**
   * 更新圈子。仅 OWNER 可操作。
   */
  async update(userId: string, id: string, dto: UpdateCircleDto): Promise<CircleView> {
    const membership = await this.prisma.client.circleMember.findFirst({
      where: { circleId: id, userId, role: 'OWNER' },
    });
    if (!membership) {
      throw new BusinessException(40301, '仅圈子创建者可修改');
    }
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    const updated = await this.prisma.client.circle.update({ where: { id }, data });
    const count = await this.prisma.client.circleMember.count({ where: { circleId: id } });
    return this.toView(updated, count, 'OWNER');
  }

  /**
   * 生成/获取 inviteCode。
   */
  async getInviteCode(userId: string, id: string): Promise<string> {
    const membership = await this.prisma.client.circleMember.findFirst({
      where: { circleId: id, userId, role: { in: ['OWNER', 'ADMIN'] } },
      include: { circle: true },
    });
    if (!membership) {
      throw new BusinessException(40301, '无权查看邀请码');
    }
    return membership.circle.inviteCode;
  }

  /**
   * 通过 inviteCode 加入圈子。
   */
  async joinByCode(userId: string, inviteCode: string): Promise<CircleView> {
    const circle = await this.prisma.client.circle.findUnique({ where: { inviteCode } });
    if (!circle) {
      throw new BusinessException(40401, '邀请码无效或圈子已删除');
    }
    const existing = await this.prisma.client.circleMember.findFirst({
      where: { circleId: circle.id, userId },
    });
    if (existing) {
      throw new BusinessException(40901, '已加入该圈子');
    }
    await this.prisma.client.circleMember.create({
      data: { circleId: circle.id, userId, role: 'MEMBER' },
    });
    const count = await this.prisma.client.circleMember.count({ where: { circleId: circle.id } });
    return this.toView(circle, count, 'MEMBER');
  }

  /**
   * 软删除圈子（OWNER 专属）。
   */
  async remove(userId: string, id: string): Promise<void> {
    const membership = await this.prisma.client.circleMember.findFirst({
      where: { circleId: id, userId, role: 'OWNER' },
    });
    if (!membership) {
      throw new BusinessException(40301, '仅创建者可删除圈子');
    }
    await this.prisma.client.circle.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date(), status: 'ARCHIVED' },
    });
  }

  /**
   * 踢出成员（OWNER/ADMIN 专属）。
   */
  async removeMember(userId: string, circleId: string, memberId: string): Promise<void> {
    const self = await this.prisma.client.circleMember.findFirst({
      where: { circleId, userId, role: { in: ['OWNER', 'ADMIN'] } },
    });
    if (!self) {
      throw new BusinessException(40301, '无权管理成员');
    }
    const target = await this.prisma.client.circleMember.findFirst({
      where: { circleId, id: memberId },
    });
    if (!target) {
      throw new BusinessException(40401, '成员不存在');
    }
    if (target.role === 'OWNER') {
      throw new BusinessException(40301, '不能移除创建者');
    }
    await this.prisma.client.circleMember.update({
      where: { id: memberId },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  private toView(c: Circle, memberCount: number, role: CircleRole): CircleView {
    return {
      id: c.id,
      name: c.name,
      description: c.description,
      memberCount,
      role,
      inviteCode: c.inviteCode,
      createdAt: c.createdAt,
    };
  }
}
