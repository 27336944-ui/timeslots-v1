import { Injectable } from '@nestjs/common';
import { Comment } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

export interface CommentView {
  id: string;
  blockId: string;
  authorId: string;
  content: string;
  parentId: string | null;
  createdAt: Date;
}

@Injectable()
export class CommentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    blockId: string,
    dto: CreateCommentDto,
  ): Promise<CommentView> {
    const block = await this.prisma.client.timeBlock.findFirst({ where: { id: blockId } });
    if (!block) {
      throw new BusinessException(40401, '日程不存在');
    }

    const canAccess = await this.canAccessBlock(userId, block.userId, block.circleId, block.nature);
    if (!canAccess) {
      throw new BusinessException(40301, '无权评论此日程');
    }

    if (dto.parentId) {
      const parent = await this.prisma.client.comment.findFirst({ where: { id: dto.parentId, blockId } });
      if (!parent) {
        throw new BusinessException(40401, '父评论不存在');
      }
    }

    const created = await this.prisma.client.comment.create({
      data: { blockId, authorId: userId, content: dto.content, parentId: dto.parentId ?? null },
    });
    return this.toView(created);
  }

  async findByBlock(userId: string, blockId: string): Promise<CommentView[]> {
    const block = await this.prisma.client.timeBlock.findFirst({ where: { id: blockId } });
    if (!block) {
      throw new BusinessException(40401, '日程不存在');
    }

    const canAccess = await this.canAccessBlock(userId, block.userId, block.circleId, block.nature);
    if (!canAccess) {
      throw new BusinessException(40301, '无权查看评论');
    }

    const comments = await this.prisma.client.comment.findMany({
      where: { blockId },
      orderBy: { createdAt: 'asc' },
    });
    return comments.map((c) => this.toView(c));
  }

  async update(userId: string, id: string, dto: UpdateCommentDto): Promise<CommentView> {
    const existing = await this.prisma.client.comment.findFirst({ where: { id } });
    if (!existing) throw new BusinessException(40401, '评论不存在');
    if (existing.authorId !== userId) throw new BusinessException(40301, '无权修改他人评论');

    const updated = await this.prisma.client.comment.update({
      where: { id },
      data: { content: dto.content },
    });
    return this.toView(updated);
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.client.comment.findFirst({ where: { id } });
    if (!existing) throw new BusinessException(40401, '评论不存在');
    if (existing.authorId !== userId) throw new BusinessException(40301, '无权删除他人评论');

    await this.prisma.client.comment.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  private async canAccessBlock(
    userId: string,
    ownerId: string,
    circleId: string | null,
    nature: string,
  ): Promise<boolean> {
    if (userId === ownerId) return true;
    if (nature === 'PUBLIC') return true;
    if (nature === 'CIRCLE_ONLY' && circleId) {
      const member = await this.prisma.client.circleMember.findFirst({
        where: { circleId, userId, isDeleted: false },
      });
      return member !== null;
    }
    return false;
  }

  private toView(c: Comment): CommentView {
    return {
      id: c.id,
      blockId: c.blockId,
      authorId: c.authorId,
      content: c.content,
      parentId: c.parentId,
      createdAt: c.createdAt,
    };
  }
}
