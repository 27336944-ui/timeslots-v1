import { Injectable } from '@nestjs/common';
import { TimeBlock, TimeBlockNature } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * 权限上下文（`checkPermission` 返回值）。
 *
 * - `isOwner` — 创建者本人
 * - `isInSameCircle` — 与创建者同属一个 Circle
 */
export interface ViewerContext {
  viewerId: string;
  isOwner: boolean;
  isInSameCircle: boolean;
}

/**
 * 日程可见性脱敏服务（P0-P3 决策树）。
 *
 * 算法：
 * - **P0 Owner**：永远可见，返回完整数据（含 `encryptedDetails`）
 * - **P0 阻断**：PRIVATE 非 Owner 非参与者 → `null`（触发 404）
 * - **P1 PUBLIC**：任何人都可见，仅基础字段，不含 `encryptedDetails`
 * - **P2 CIRCLE_ONLY + 同圈**：标题/摘要可见，`encryptedDetails` 脱敏
 * - **兜底（Fail-Secure）**：未知 nature / 无权限 → `null`
 *
 * @remarks **不在 SQL 层脱敏**，所有逻辑在 Service 内存中完成（便于单测）。
 */
@Injectable()
export class EventVisibilityService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 权限校验（返回 `ViewerContext` 而非 boolean，便于 mask 阶段做精细化控制）。
   *
   * @param event - 原始 TimeBlock
   * @param viewerId - 查看者用户 ID
   * @returns 权限上下文
   */
  async checkPermission(event: TimeBlock, viewerId: string): Promise<ViewerContext> {
    const isOwner = event.userId === viewerId;

    if (isOwner) {
      return { viewerId, isOwner: true, isInSameCircle: true };
    }

    if (event.nature === TimeBlockNature.PRIVATE) {
      return { viewerId, isOwner: false, isInSameCircle: false };
    }

    let isInSameCircle = false;
    if (event.circleId) {
      const member = await this.prisma.client.circleMember.findUnique({
        where: {
          circle_members_uk: {
            circleId: event.circleId,
            userId: viewerId,
          },
        },
      });
      isInSameCircle = !!member;
    }

    return { viewerId, isOwner: false, isInSameCircle };
  }

  /**
   * 数据脱敏。
   *
   * @param event - 原始 TimeBlock
   * @param ctx - `checkPermission` 返回的权限上下文
   * @returns 脱敏后的 `Partial<TimeBlock>`，无权限时 `null`
   */
  maskEvent(event: TimeBlock, ctx: ViewerContext): Partial<TimeBlock> | null {
    if (ctx.isOwner) {
      return event;
    }

    if (event.nature === TimeBlockNature.PRIVATE) {
      return null;
    }

    if (event.nature === TimeBlockNature.CIRCLE_ONLY && ctx.isInSameCircle) {
      const { encryptedDetails: _enc, ...safeData } = event;
      return safeData;
    }

    if (event.nature === TimeBlockNature.PUBLIC) {
      return {
        id: event.id,
        title: event.title,
        summary: event.summary,
        startTime: event.startTime,
        endTime: event.endTime,
        status: event.status,
        nature: event.nature,
      };
    }

    return null;
  }
}
