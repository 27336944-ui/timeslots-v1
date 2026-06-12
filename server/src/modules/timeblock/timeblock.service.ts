
import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException, ErrorCodes } from '../../common/exceptions/business-exception';
import { EventVisibilityService } from '../visibility/event-visibility.service';
import { CreateTimeBlockDto } from './dto/create-timeblock.dto';
import { UpdateTimeBlockDto } from './dto/update-timeblock.dto';
import { TimeBlockResponseDto } from './dto/timeblock-response.dto';


interface BlockWithAll {
  id: string;
  userId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  status: string;
  location: string | null;
  description: string | null;
  priority: string;
  category: string;
  recurrence: string;
  recurrenceEndAt: Date | null;
  contacts: string | null;
  weather: string | null;
  taskId: string | null;
  nature: string;
  circleId: string | null;
  createdAt: Date;
  updatedAt: Date;
}


function toResponse(block: BlockWithAll): TimeBlockResponseDto {
  return {
    id: block.id,
    userId: block.userId,
    title: block.title,
    startTime: block.startTime.toISOString(),
    endTime: block.endTime.toISOString(),
    status: block.status,
    location: block.location,
    description: block.description,
    priority: block.priority,
    category: block.category,
    recurrence: block.recurrence,
    recurrenceEndAt: block.recurrenceEndAt?.toISOString?.() ?? null,
    contacts: block.contacts,
    weather: block.weather,
    taskId: block.taskId,
    nature: block.nature,
    circleId: block.circleId,
    createdAt: block.createdAt.toISOString(),
    updatedAt: block.updatedAt.toISOString(),
  };
}


function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}


function isRecurringOnDate(block: BlockWithAll, dateStr: string): boolean {
  const blockStart = new Date(block.startTime);
  const queryDate = new Date(`${dateStr}T00:00:00+08:00`);

  if (blockStart >= new Date(queryDate.getTime() + 86400000)) return false;
  if (block.recurrenceEndAt && new Date(block.recurrenceEndAt) < queryDate) return false;

  switch (block.recurrence) {
    case 'daily': return true;
    case 'weekly': return queryDate.getDay() === blockStart.getDay();
    case 'monthly': return queryDate.getDate() === blockStart.getDate();
    case 'yearly': return queryDate.getMonth() === blockStart.getMonth() && queryDate.getDate() === blockStart.getDate();
    default: return false;
  }
}


function adjustToDate(block: BlockWithAll, dateStr: string): BlockWithAll {
  const src = new Date(block.startTime);
  const dst = new Date(`${dateStr}T${String(src.getHours()).padStart(2, '0')}:${String(src.getMinutes()).padStart(2, '0')}:${String(src.getSeconds()).padStart(2, '0')}+08:00`);
  const duration = block.endTime.getTime() - src.getTime();
  return { ...block, startTime: dst, endTime: new Date(dst.getTime() + duration) };
}


@Injectable()
export class TimeBlockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly visibility: EventVisibilityService,
  ) {}

  private validateTimeRange(startTime: Date, endTime: Date): void {
    if (startTime >= endTime) {
      throw new BusinessException(ErrorCodes.INVALID_DATE, '开始时间必须早于结束时间');
    }
  }

  async create(userId: string, dto: CreateTimeBlockDto): Promise<TimeBlockResponseDto> {
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    this.validateTimeRange(startTime, endTime);

    if (dto.nature === 'CIRCLE_ONLY' && !dto.circleId) {
      throw new BusinessException(ErrorCodes.VALIDATION_FAILED, 'CIRCLE_ONLY 可见性必须指定圈子');
    }

    const block = await this.prisma.client.timeBlock.create({
      data: {
        userId,
        title: dto.title,
        startTime,
        endTime,
        status: dto.status ?? 'todo',
        location: dto.location ?? null,
        description: dto.description ?? null,
        priority: dto.priority ?? 'medium',
        category: dto.category ?? 'life',
        recurrence: dto.recurrence ?? 'none',
        recurrenceEndAt: dto.recurrenceEndAt ? new Date(dto.recurrenceEndAt) : null,
        contacts: dto.contacts ?? null,
        weather: dto.weather ?? null,
        taskId: dto.taskId ?? null,
        nature: dto.nature ?? 'PUBLIC',
        circleId: dto.circleId ?? null,
      },
    });

    return toResponse(block);
  }

  private async getVisibleBlocks(userId: string): Promise<BlockWithAll[]> {
    const viewerCircleIds = await this.visibility.getViewerCircleIds(userId);
    const blocks = await this.prisma.client.timeBlock.findMany({
      where: {
        OR: [
          { userId },
          { nature: 'PUBLIC' },
          { nature: 'CIRCLE_ONLY', circleId: { in: viewerCircleIds } },
        ],
      },
      orderBy: { startTime: 'asc' },
    });
    return this.visibility.filter(userId, blocks);
  }

  async findByDate(userId: string, date: string): Promise<TimeBlockResponseDto[]> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BusinessException(ErrorCodes.VALIDATION_FAILED, '日期格式无效，应为 YYYY-MM-DD');
    }

    const dayStart = new Date(`${date}T00:00:00+08:00`);
    if (isNaN(dayStart.getTime())) {
      throw new BusinessException(ErrorCodes.VALIDATION_FAILED, '日期值无效');
    }
    const nextDate = new Date(dayStart);
    nextDate.setDate(nextDate.getDate() + 1);

    const directBlocks = await this.prisma.client.timeBlock.findMany({
      where: {
        startTime: { gte: dayStart, lt: nextDate },
        OR: [
          { userId },
          { nature: 'PUBLIC' },
          { nature: 'CIRCLE_ONLY', circleId: { in: await this.visibility.getViewerCircleIds(userId) } },
        ],
      },
      orderBy: { startTime: 'asc' },
    });

    const recurringBlocks = await this.prisma.client.timeBlock.findMany({
      where: {
        recurrence: { not: 'none' },
        startTime: { lt: nextDate },
        OR: [
          { userId },
          { nature: 'PUBLIC' },
          { nature: 'CIRCLE_ONLY', circleId: { in: await this.visibility.getViewerCircleIds(userId) } },
        ],
      },
    });

    const visibleRecurring = await this.visibility.filter(userId, recurringBlocks);
    const expanded = visibleRecurring
      .filter((b) => isRecurringOnDate(b, date))
      .map((b) => toResponse(adjustToDate(b, date)));

    const filtered = await this.visibility.filter(userId, directBlocks);
    const result = [...filtered.map(toResponse), ...expanded];
    result.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return result;
  }

  async findByDateRange(userId: string, start: string, end: string): Promise<Record<string, TimeBlockResponseDto[]>> {
    const startDate = new Date(`${start}T00:00:00+08:00`);
    const endDate = new Date(`${end}T23:59:59+08:00`);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BusinessException(ErrorCodes.VALIDATION_FAILED, '日期格式无效');
    }

    const viewerCircleIds = await this.visibility.getViewerCircleIds(userId);

    const directBlocks = await this.prisma.client.timeBlock.findMany({
      where: {
        startTime: { gte: startDate, lte: endDate },
        OR: [
          { userId },
          { nature: 'PUBLIC' },
          { nature: 'CIRCLE_ONLY', circleId: { in: viewerCircleIds } },
        ],
      },
      orderBy: { startTime: 'asc' },
    });

    const recurringBlocks = await this.prisma.client.timeBlock.findMany({
      where: {
        recurrence: { not: 'none' },
        startTime: { lte: endDate },
        OR: [
          { userId },
          { nature: 'PUBLIC' },
          { nature: 'CIRCLE_ONLY', circleId: { in: viewerCircleIds } },
        ],
      },
    });

    const visibleRecurring = await this.visibility.filter(userId, recurringBlocks);

    const result: Record<string, TimeBlockResponseDto[]> = {};
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      const dateStr = toLocalDateStr(cursor);

      const dateDirect = directBlocks.filter((b) => {
        const bs = new Date(b.startTime);
        return bs >= cursor && bs < new Date(cursor.getTime() + 86400000);
      });

      const dateExpanded = visibleRecurring
        .filter((b) => isRecurringOnDate(b, dateStr))
        .map((b) => toResponse(adjustToDate(b, dateStr)));

      const all = [...dateDirect.map(toResponse), ...dateExpanded];
      all.sort((a, b) => a.startTime.localeCompare(b.startTime));
      result[dateStr] = all;

      cursor.setDate(cursor.getDate() + 1);
    }

    return result;
  }

  async findMyBlocks(userId: string): Promise<TimeBlockResponseDto[]> {
    const visible = await this.getVisibleBlocks(userId);
    return visible.map(toResponse);
  }

  async findByTaskId(userId: string, taskId: string): Promise<TimeBlockResponseDto[]> {
    const blocks = await this.prisma.client.timeBlock.findMany({
      where: { taskId },
      orderBy: { startTime: 'asc' },
    });

    const filtered = await this.visibility.filter(userId, blocks);
    return filtered.map(toResponse);
  }

  async findById(userId: string, id: string): Promise<TimeBlockResponseDto> {
    const block = await this.prisma.client.timeBlock.findFirst({
      where: { id },
    });

    if (!block) {
      throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '时间块不存在', HttpStatus.NOT_FOUND);
    }

    const canView = await this.visibility.canView(block, userId);
    if (!canView) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '无权访问该时间块', HttpStatus.FORBIDDEN);
    }

    return toResponse(block);
  }

  async update(userId: string, id: string, dto: UpdateTimeBlockDto): Promise<TimeBlockResponseDto> {
    const block = await this.prisma.client.timeBlock.findFirst({
      where: { id },
    });

    if (!block) {
      throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '时间块不存在', HttpStatus.NOT_FOUND);
    }

    if (block.userId !== userId) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '无权修改该时间块', HttpStatus.FORBIDDEN);
    }

    if (dto.nature === 'CIRCLE_ONLY' && dto.circleId === undefined && !block.circleId) {
      throw new BusinessException(ErrorCodes.VALIDATION_FAILED, 'CIRCLE_ONLY 可见性必须指定圈子');
    }
    if (dto.nature === 'CIRCLE_ONLY' && dto.circleId === null) {
      throw new BusinessException(ErrorCodes.VALIDATION_FAILED, 'CIRCLE_ONLY 可见性必须指定圈子');
    }

    const newStartTime = dto.startTime !== undefined ? new Date(dto.startTime) : block.startTime;
    const newEndTime = dto.endTime !== undefined ? new Date(dto.endTime) : block.endTime;
    this.validateTimeRange(newStartTime, newEndTime);

    const updated = await this.prisma.client.timeBlock.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.startTime !== undefined && { startTime: newStartTime }),
        ...(dto.endTime !== undefined && { endTime: newEndTime }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.recurrence !== undefined && { recurrence: dto.recurrence }),
        ...(dto.recurrenceEndAt !== undefined && { recurrenceEndAt: dto.recurrenceEndAt ? new Date(dto.recurrenceEndAt) : null }),
        ...(dto.contacts !== undefined && { contacts: dto.contacts }),
        ...(dto.weather !== undefined && { weather: dto.weather }),
        ...(dto.taskId !== undefined && { taskId: dto.taskId || null }),
        ...(dto.nature !== undefined && { nature: dto.nature }),
        ...(dto.circleId !== undefined && { circleId: dto.circleId || null }),
      },
    });

    return toResponse(updated);
  }

  async softDelete(userId: string, id: string): Promise<void> {
    const block = await this.prisma.client.timeBlock.findFirst({
      where: { id },
    });

    if (!block) {
      throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '时间块不存在', HttpStatus.NOT_FOUND);
    }

    if (block.userId !== userId) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '无权删除该时间块', HttpStatus.FORBIDDEN);
    }

    await this.prisma.client.timeBlock.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    await this.prisma.client.reminder.updateMany({
      where: { blockId: id, userId },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }
}
