import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TimeBlockStatus } from '@prisma/client';

/**
 * 一段空闲时间。
 */
export interface TimeSlot {
  start: Date;
  end: Date;
}

/**
 * 对外忙闲查询服务（PRD §5 "Share" Tab 配套）。
 *
 * 核心约束：
 * - **物理隔离**：与 `EventService` 解耦，避免隐私泄露
 * - **最小数据**：只返回时间区间，不返回任何日程详情
 * - **算法**：查询所有"占用"日程 → 计算时间轴"差集"得到空闲段
 */
@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取用户在指定时间范围内的空闲时段。
   *
   * @param userId - 用户 ID
   * @param rangeStart - 范围起点（含）
   * @param rangeEnd - 范围终点（不含）
   * @returns 空闲时段列表（按时间升序）
   */
  async getFreeSlots(
    userId: string,
    rangeStart: Date,
    rangeEnd: Date,
  ): Promise<TimeSlot[]> {
    const busyBlocks = await this.prisma.client.timeBlock.findMany({
      where: {
        userId,
        status: TimeBlockStatus.ACTIVE,
        startTime: { lt: rangeEnd },
        endTime: { gt: rangeStart },
      },
      select: {
        startTime: true,
        endTime: true,
      },
      orderBy: { startTime: 'asc' },
    });

    const freeSlots: TimeSlot[] = [];
    let cursor = rangeStart;

    for (const block of busyBlocks) {
      const blockStart = block.startTime < rangeStart ? rangeStart : block.startTime;
      const blockEnd = block.endTime > rangeEnd ? rangeEnd : block.endTime;

      if (cursor < blockStart) {
        freeSlots.push({ start: cursor, end: blockStart });
      }

      if (blockEnd > cursor) {
        cursor = blockEnd;
      }
    }

    if (cursor < rangeEnd) {
      freeSlots.push({ start: cursor, end: rangeEnd });
    }

    return freeSlots;
  }
}
