import { Injectable, HttpStatus } from '@nestjs/common';
import { BusinessException, ErrorCodes } from '../../common/exceptions/business-exception';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCircleDto } from './dto/create-circle.dto';
import { UpdateCircleDto } from './dto/update-circle.dto';
import { CircleResponseDto } from './dto/circle-response.dto';
import { CircleMemberResponseDto } from './dto/circle-member-response.dto';
import { InviteResponseDto } from './dto/invite-response.dto';


function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}


@Injectable()
export class CircleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCircleDto): Promise<CircleResponseDto> {
    const owner = await this.prisma.client.user.findFirst({
      where: { id: userId, isDeleted: false },
    });
    if (!owner) {
      throw new BusinessException(ErrorCodes.USER_NOT_EXISTS, '用户不存在', HttpStatus.NOT_FOUND);
    }

    let inviteCode: string;
    let retries = 0;
    while (true) {
      inviteCode = generateInviteCode();
      const existing = await this.prisma.client.circle.findFirst({
        where: { inviteCode, isDeleted: false },
      });
      if (!existing) break;
      retries++;
      if (retries > 10) {
        throw new BusinessException(ErrorCodes.VALIDATION_FAILED, '邀请码生成失败，请重试');
      }
    }

    const circle = await this.prisma.client.circle.create({
      data: {
        ownerId: userId,
        name: dto.name,
        description: dto.description ?? null,
        inviteCode,
      },
    });

    await this.prisma.client.circleMember.create({
      data: {
        circleId: circle.id,
        userId,
        role: 'OWNER',
      },
    });

    return this.toResponse(circle, userId);
  }

  async findMyCircles(userId: string): Promise<CircleResponseDto[]> {
    const memberships = await this.prisma.client.circleMember.findMany({
      where: { userId, isDeleted: false },
      select: { circleId: true, role: true },
    });

    if (memberships.length === 0) return [];

    const circleIds = memberships.map((m) => m.circleId);
    const roleMap = new Map(memberships.map((m) => [m.circleId, m.role]));

    const circles = await this.prisma.client.circle.findMany({
      where: { id: { in: circleIds }, isDeleted: false },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      circles.map((c) => this.toResponse(c, userId, roleMap.get(c.id))),
    );
  }

  async findById(userId: string, circleId: string): Promise<CircleResponseDto> {
    const membership = await this.prisma.client.circleMember.findFirst({
      where: { circleId, userId, isDeleted: false },
    });
    if (!membership) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '你不是该圈子成员', HttpStatus.FORBIDDEN);
    }

    const circle = await this.prisma.client.circle.findFirst({
      where: { id: circleId, isDeleted: false },
    });
    if (!circle) {
      throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '圈子不存在', HttpStatus.NOT_FOUND);
    }

    return this.toResponse(circle, userId, membership.role, true);
  }

  async update(
    userId: string,
    circleId: string,
    dto: UpdateCircleDto,
  ): Promise<CircleResponseDto> {
    const membership = await this.prisma.client.circleMember.findFirst({
      where: { circleId, userId, isDeleted: false, role: { in: ['OWNER'] } },
    });
    if (!membership) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '仅圈主可修改圈子', HttpStatus.FORBIDDEN);
    }

    const circle = await this.prisma.client.circle.findFirst({
      where: { id: circleId, isDeleted: false },
    });
    if (!circle) {
      throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '圈子不存在', HttpStatus.NOT_FOUND);
    }

    const updated = await this.prisma.client.circle.update({
      where: { id: circleId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });

    return this.toResponse(updated, userId);
  }

  async softDelete(userId: string, circleId: string): Promise<void> {
    const membership = await this.prisma.client.circleMember.findFirst({
      where: { circleId, userId, isDeleted: false, role: 'OWNER' },
    });
    if (!membership) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '仅圈主可删除圈子', HttpStatus.FORBIDDEN);
    }

    const circle = await this.prisma.client.circle.findFirst({
      where: { id: circleId, isDeleted: false },
    });
    if (!circle) {
      throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '圈子不存在', HttpStatus.NOT_FOUND);
    }

    await this.prisma.client.$transaction(async (tx) => {
      await tx.circle.update({
        where: { id: circleId },
        data: { isDeleted: true, deletedAt: new Date() },
      });
      await tx.circleMember.updateMany({
        where: { circleId },
        data: { isDeleted: true, deletedAt: new Date() },
      });
    });
  }

  async invite(userId: string, circleId: string): Promise<InviteResponseDto> {
    const membership = await this.prisma.client.circleMember.findFirst({
      where: {
        circleId, userId, isDeleted: false,
        role: { in: ['OWNER', 'ADMIN'] },
      },
    });
    if (!membership) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '无权生成邀请码', HttpStatus.FORBIDDEN);
    }

    const circle = await this.prisma.client.circle.findFirst({
      where: { id: circleId, isDeleted: false },
    });
    if (!circle) {
      throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '圈子不存在', HttpStatus.NOT_FOUND);
    }

    let inviteCode: string;
    let retries = 0;
    while (true) {
      inviteCode = generateInviteCode();
      const existing = await this.prisma.client.circle.findFirst({
        where: { inviteCode, isDeleted: false },
      });
      if (!existing) break;
      retries++;
      if (retries > 10) {
        throw new BusinessException(ErrorCodes.VALIDATION_FAILED, '邀请码生成失败，请重试');
      }
    }

    await this.prisma.client.circle.update({
      where: { id: circleId },
      data: { inviteCode },
    });

    return { inviteCode };
  }

  async joinByCode(userId: string, code: string): Promise<CircleResponseDto> {
    const circle = await this.prisma.client.circle.findFirst({
      where: { inviteCode: code, isDeleted: false },
    });
    if (!circle) {
      throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '邀请码无效或圈子已删除', HttpStatus.NOT_FOUND);
    }

    if (circle.status !== 'active') {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '圈子已归档，无法加入', HttpStatus.FORBIDDEN);
    }

    const existing = await this.prisma.client.circleMember.findFirst({
      where: { circleId: circle.id, userId, isDeleted: false },
    });
    if (existing) {
      throw new BusinessException(ErrorCodes.DUPLICATE_ENTRY, '你已在该圈子中', HttpStatus.CONFLICT);
    }

    const member = await this.prisma.client.circleMember.create({
      data: {
        circleId: circle.id,
        userId,
        role: 'MEMBER',
      },
    });

    return this.toResponse(circle, userId, member.role);
  }

  async removeMember(
    userId: string,
    circleId: string,
    memberId: string,
  ): Promise<void> {
    const membership = await this.prisma.client.circleMember.findFirst({
      where: {
        circleId, userId, isDeleted: false,
        role: { in: ['OWNER', 'ADMIN'] },
      },
    });
    if (!membership) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '无权移除成员', HttpStatus.FORBIDDEN);
    }

    const target = await this.prisma.client.circleMember.findFirst({
      where: { id: memberId, circleId, isDeleted: false },
    });
    if (!target) {
      throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '成员不存在', HttpStatus.NOT_FOUND);
    }

    if (target.userId === userId) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '不能移除自己', HttpStatus.FORBIDDEN);
    }

    if (target.role === 'OWNER') {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '不能移除圈主', HttpStatus.FORBIDDEN);
    }

    if (membership.role === 'ADMIN' && target.role === 'ADMIN') {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '管理员不能移除其他管理员', HttpStatus.FORBIDDEN);
    }

    await this.prisma.client.circleMember.update({
      where: { id: memberId },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  async leaveCircle(userId: string, circleId: string): Promise<void> {
    const membership = await this.prisma.client.circleMember.findFirst({
      where: { circleId, userId, isDeleted: false },
    });
    if (!membership) {
      throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '你不在该圈子中', HttpStatus.NOT_FOUND);
    }
    if (membership.role === 'OWNER') {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '圈主不能退出，请先转让或删除圈子', HttpStatus.FORBIDDEN);
    }
    await this.prisma.client.circleMember.update({
      where: { id: membership.id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  private async toResponse(
    circle: {
      id: string; ownerId: string; name: string; description: string | null;
      inviteCode: string; status: string; createdAt: Date; updatedAt: Date;
    },
    userId: string,
    role?: string,
    includeMembers?: boolean,
  ): Promise<CircleResponseDto> {
    const membership = role
      ? { role }
      : await this.prisma.client.circleMember.findFirst({
          where: { circleId: circle.id, userId, isDeleted: false },
          select: { role: true },
        });

    const members = await this.prisma.client.circleMember.findMany({
      where: { circleId: circle.id, isDeleted: false },
    });

    let memberDtos: CircleMemberResponseDto[] | undefined;
    if (includeMembers) {
      const userIds = members.map((m) => m.userId);
      const users = await this.prisma.client.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, nickname: true, avatar: true },
      });
      const userMap = new Map(users.map((u) => [u.id, u]));

      memberDtos = members.map((m) => ({
        id: m.id,
        userId: m.userId,
        nickname: userMap.get(m.userId)?.nickname ?? '未知用户',
        avatar: userMap.get(m.userId)?.avatar ?? null,
        role: m.role,
        joinedAt: m.createdAt.toISOString(),
      }));
    }

    return {
      id: circle.id,
      ownerId: circle.ownerId,
      name: circle.name,
      description: circle.description,
      inviteCode: circle.inviteCode,
      status: circle.status,
      memberCount: members.length,
      members: memberDtos,
      myRole: membership?.role ?? '',
      createdAt: circle.createdAt.toISOString(),
      updatedAt: circle.updatedAt.toISOString(),
    };
  }
}
