import { Injectable, HttpStatus } from '@nestjs/common';
import { BusinessException, ErrorCodes } from '../../common/exceptions/business-exception';
import { PrismaService } from '../../prisma/prisma.service';
import { EventLogService } from '../eventlog/event-log.service';
import { CreateCircleDto } from './dto/create-circle.dto';
import { UpdateCircleDto } from './dto/update-circle.dto';
import { CircleResponseDto } from './dto/circle-response.dto';
import { CircleMemberResponseDto } from './dto/circle-member-response.dto';
import { InviteResponseDto } from './dto/invite-response.dto';
import { MemberSlotsDto } from './dto/member-availability.dto';

const DEFAULT_CIRCLES: { name: string; children: { name: string }[] }[] = [
  { name: '同事', children: [{ name: '默认同事组' }] },
  { name: '朋友', children: [{ name: '默认好友组' }] },
  { name: '亲人', children: [{ name: '默认家人组' }] },
];

const MAX_CIRCLE_LEVEL = 3;
const MAX_CIRCLE_PER_LEVEL = 20;


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
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventLog: EventLogService,
  ) {}

  async create(userId: string, dto: CreateCircleDto): Promise<CircleResponseDto> {
    const owner = await this.prisma.client.user.findFirst({
      where: { id: userId, isDeleted: false },
    });
    if (!owner) {
      throw new BusinessException(ErrorCodes.USER_NOT_EXISTS, '用户不存在', HttpStatus.NOT_FOUND);
    }

    let level = 1;
    const isFixed = false;
    const parentId: string | null = dto.parentId ?? null;

    if (parentId) {
      const parent = await this.prisma.client.circle.findFirst({ where: { id: parentId } });
      if (!parent || parent.ownerId !== userId) {
        throw new BusinessException(ErrorCodes.INVALID_CATEGORY, '父圈子不存在', HttpStatus.NOT_FOUND);
      }
      if (parent.level >= MAX_CIRCLE_LEVEL) {
        throw new BusinessException(ErrorCodes.VALIDATION_FAILED, `圈子最多支持 ${MAX_CIRCLE_LEVEL} 级`);
      }
      level = parent.level + 1;
    }

    // Check count at this level under this parent
    const count = await this.prisma.client.circle.count({
      where: { ownerId: userId, parentId: parentId ?? null },
    });
    if (count >= MAX_CIRCLE_PER_LEVEL) {
      throw new BusinessException(ErrorCodes.VALIDATION_FAILED, `每级圈子最多 ${MAX_CIRCLE_PER_LEVEL} 个`);
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
        parentId,
        level,
        isFixed,
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
    if (circle.isFixed) {
      throw new BusinessException(ErrorCodes.VALIDATION_FAILED, '固定大类不可修改');
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
    if (circle.isFixed) {
      throw new BusinessException(ErrorCodes.VALIDATION_FAILED, '固定大类不可删除');
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

    this.eventLog.log(userId, 'circle_join', {
      source: `code,circleId:${circle.id}`,
    });

    return this.toResponse(circle, userId, member.role);
  }

  async addMembers(
    operatorId: string,
    circleId: string,
    userIds: string[],
  ): Promise<CircleResponseDto> {
    const membership = await this.prisma.client.circleMember.findFirst({
      where: {
        circleId, userId: operatorId, isDeleted: false,
        role: { in: ['OWNER', 'ADMIN'] },
      },
    });
    if (!membership) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '无权添加成员', HttpStatus.FORBIDDEN);
    }

    const circle = await this.prisma.client.circle.findFirst({
      where: { id: circleId, isDeleted: false },
    });
    if (!circle) {
      throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '圈子不存在', HttpStatus.NOT_FOUND);
    }

    const existing = await this.prisma.client.circleMember.findMany({
      where: { circleId, userId: { in: userIds }, isDeleted: false },
      select: { userId: true },
    });
    const existingSet = new Set(existing.map((e) => e.userId));

    const toAdd = userIds.filter((uid) => !existingSet.has(uid));
    if (toAdd.length === 0) {
      throw new BusinessException(ErrorCodes.DUPLICATE_ENTRY, '所选用户已是该圈子成员', HttpStatus.CONFLICT);
    }

    await this.prisma.client.circleMember.createMany({
      data: toAdd.map((uid) => ({
        circleId,
        userId: uid,
        role: 'MEMBER',
      })),
    });

    this.eventLog.log(operatorId, 'circle_join', {
      source: `addMembers,circleId:${circleId},count:${toAdd.length}`,
    });

    return this.toResponse(circle, operatorId, membership.role, true);
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

    this.eventLog.log(userId, 'circle_leave', {
      source: `circleId:${circleId}`,
    });
  }

  async initDefaults(userId: string): Promise<void> {
    const existing = await this.prisma.client.circle.count({ where: { ownerId: userId } });
    if (existing > 0) return;

    for (let i = 0; i < DEFAULT_CIRCLES.length; i++) {
      const parent = DEFAULT_CIRCLES[i];
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

      const parentCircle = await this.prisma.client.circle.create({
        data: {
          ownerId: userId,
          name: parent.name,
          inviteCode,
          sortOrder: i,
          level: 1,
          isFixed: true,
          isDefault: true,
        },
      });

      await this.prisma.client.circleMember.create({
        data: {
          circleId: parentCircle.id,
          userId,
          role: 'OWNER',
        },
      });

      for (let j = 0; j < parent.children.length; j++) {
        const child = parent.children[j];
        let childInviteCode: string;
        let childRetries = 0;
        while (true) {
          childInviteCode = generateInviteCode();
          const existing = await this.prisma.client.circle.findFirst({
            where: { inviteCode: childInviteCode, isDeleted: false },
          });
          if (!existing) break;
          childRetries++;
          if (childRetries > 10) {
            throw new BusinessException(ErrorCodes.VALIDATION_FAILED, '邀请码生成失败，请重试');
          }
        }

        const childCircle = await this.prisma.client.circle.create({
          data: {
            ownerId: userId,
            name: child.name,
            inviteCode: childInviteCode,
            parentId: parentCircle.id,
            sortOrder: j,
            level: 2,
            isDefault: true,
          },
        });

        await this.prisma.client.circleMember.create({
          data: {
            circleId: childCircle.id,
            userId,
            role: 'OWNER',
          },
        });
      }
    }
  }

  async getMemberAvailability(
    userId: string,
    circleId: string,
    date: string,
  ): Promise<MemberSlotsDto[]> {
    const membership = await this.prisma.client.circleMember.findFirst({
      where: { circleId, userId, isDeleted: false },
    });
    if (!membership) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '你不是该圈子成员', HttpStatus.FORBIDDEN);
    }

    const members = await this.prisma.client.circleMember.findMany({
      where: { circleId, isDeleted: false },
      select: { userId: true, role: true },
    });

    if (members.length === 0) return [];

    const userIds = members.map((m) => m.userId);
    const users = await this.prisma.client.user.findMany({
      where: { id: { in: userIds }, isDeleted: false },
      select: { id: true, nickname: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.nickname]));

    const dayStart = new Date(date + 'T00:00:00+08:00');
    const dayEnd = new Date(date + 'T23:59:59+08:00');

    const blocks = await this.prisma.client.timeBlock.findMany({
      where: {
        userId: { in: userIds },
        startTime: { lt: dayEnd },
        endTime: { gt: dayStart },
        isDeleted: false,
        nature: { not: 'PRIVATE' },
      },
      select: { userId: true, startTime: true, endTime: true },
      orderBy: { startTime: 'asc' },
    });

    const roleMap = new Map(members.map((m) => [m.userId, m.role]));
    const blockMap = new Map<string, { start: string; end: string }[]>();
    for (const b of blocks) {
      if (!blockMap.has(b.userId)) blockMap.set(b.userId, []);
      blockMap.get(b.userId)!.push({
        start: b.startTime.toISOString(),
        end: b.endTime.toISOString(),
      });
    }

    return members.map((m) => ({
      userId: m.userId,
      nickname: userMap.get(m.userId) ?? '未知用户',
      role: roleMap.get(m.userId) ?? 'MEMBER',
      busySlots: blockMap.get(m.userId) ?? [],
    }));
  }

  private async toResponse(
    circle: {
      id: string; ownerId: string; name: string; parentId: string | null;
      level: number; isFixed: boolean; isDefault: boolean; sortOrder: number;
      description: string | null; inviteCode: string; status: string;
      createdAt: Date; updatedAt: Date;
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

    let memberCount: number;
    let memberDtos: CircleMemberResponseDto[] | undefined;

    if (includeMembers) {
      const members = await this.prisma.client.circleMember.findMany({
        where: { circleId: circle.id, isDeleted: false },
      });
      memberCount = members.length;
      const userIds = members.map((m) => m.userId);
      const users = await this.prisma.client.user.findMany({
        where: { id: { in: userIds }, isDeleted: false },
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
    } else {
      memberCount = await this.prisma.client.circleMember.count({
        where: { circleId: circle.id, isDeleted: false },
      });
    }

    return {
      id: circle.id,
      ownerId: circle.ownerId,
      name: circle.name,
      parentId: circle.parentId,
      level: circle.level,
      isFixed: circle.isFixed,
      isDefault: circle.isDefault,
      sortOrder: circle.sortOrder,
      description: circle.description,
      inviteCode: circle.inviteCode,
      status: circle.status,
      memberCount,
      members: memberDtos,
      myRole: membership?.role ?? '',
      createdAt: circle.createdAt.toISOString(),
      updatedAt: circle.updatedAt.toISOString(),
    };
  }
}
