
import { Injectable, HttpStatus } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException, ErrorCodes } from '../../common/exceptions/business-exception';
import { EventLogService } from '../eventlog/event-log.service';
import { EventVisibilityService } from '../visibility/event-visibility.service';
import { CreateTimeBlockDto } from './dto/create-timeblock.dto';
import { UpdateTimeBlockDto } from './dto/update-timeblock.dto';
import { TimeBlockResponseDto } from './dto/timeblock-response.dto';
import { GapDto, PlaceFlexibleDto } from './dto/gap.dto';
import { ConflictInfo } from './dto/check-conflicts.dto';
import { NamecardResponseDto, DayFreeSlot } from './dto/namecard.dto';
import { TimeBlockStatsDto } from './dto/timeblock-stats.dto';


interface BlockWithAll {
  id: string;
  userId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  triggerTime: Date | null;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  location: string | null;
  description: string | null;
  category: string;
  categoryId: string | null;
  source: string | null;
  sourceId: string | null;
  recurrence: string;
  recurrenceEndAt: Date | null;
  recurrenceGroupId: string | null;
  contacts: string | null;
  weather: string | null;
  taskId: string | null;
  nature: string;
  circleId: string | null;
  rigidity: string | null;
  bufferBefore: number | null;
  bufferAfter: number | null;
  anchorType: string | null;
  isDeleted: boolean;
  deletedAt: Date | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}


function toResponse(block: BlockWithAll): TimeBlockResponseDto {
  return {
    id: block.id,
    userId: block.userId,
    title: block.title,
    startTime: block.startTime?.toISOString() ?? '',
    endTime: block.endTime?.toISOString() ?? '',
    triggerTime: block.triggerTime?.toISOString() ?? null,
    startDate: block.startDate?.toISOString?.()?.split('T')[0] ?? null,
    endDate: block.endDate?.toISOString?.()?.split('T')[0] ?? null,
    status: block.status,
    location: block.location,
    description: block.description,
    category: block.category,
    categoryId: block.categoryId,
    source: block.source,
    sourceId: block.sourceId,
    recurrence: block.recurrence,
    recurrenceEndAt: block.recurrenceEndAt?.toISOString?.() ?? null,
    contacts: block.contacts,
    weather: block.weather,
    taskId: block.taskId,
    nature: block.nature,
    circleId: block.circleId,
    rigidity: block.rigidity,
    bufferBefore: block.bufferBefore,
    bufferAfter: block.bufferAfter,
    anchorType: block.anchorType,
    recurrenceGroupId: block.recurrenceGroupId,
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
    case 'weekdays': { const d = queryDate.getDay(); return d >= 1 && d <= 5; }
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


function getBufferDefaults(anchorType: string | null): { bufferBefore: number | null; bufferAfter: number | null } {
  switch (anchorType) {
    case 'meeting': return { bufferBefore: 10, bufferAfter: 15 };
    case 'commute': return { bufferBefore: 20, bufferAfter: 5 };
    case 'social': return { bufferBefore: 5, bufferAfter: 5 };
    case 'medical': return { bufferBefore: 10, bufferAfter: 10 };
    default: return { bufferBefore: 5, bufferAfter: 5 };
  }
}

@Injectable()
export class TimeBlockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly visibility: EventVisibilityService,
    private readonly eventLog: EventLogService,
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

    // Parse triggerTime/startDate/endDate
    let triggerTime: Date | null = null;
    if (dto.triggerTime) {
      triggerTime = new Date(dto.triggerTime);
    }
    let startDate: Date | null = null;
    if (dto.startDate) {
      startDate = new Date(`${dto.startDate}T00:00:00+08:00`);
    }
    let endDate: Date | null = null;
    if (dto.endDate) {
      endDate = new Date(`${dto.endDate}T23:59:59+08:00`);
    }

    let categoryId = dto.categoryId;
    let category = dto.category ?? 'life';

    if (!categoryId) {
      const defaultCat = await this.getDefaultCategory(userId);
      if (defaultCat) {
        categoryId = defaultCat.id;
        category = defaultCat.name;
      }
    }

    let circleId = dto.circleId;
    if (dto.nature === 'CIRCLE_ONLY' && !circleId) {
      const defaultCircle = await this.getDefaultCircle(userId);
      if (defaultCircle) {
        circleId = defaultCircle.id;
      }
    }

    const recurrenceGroupId = dto.recurrence && dto.recurrence !== 'none' ? uuidv4() : null;

    const anchorType = dto.anchorType ?? null;
    const bufferDefaults = anchorType ? getBufferDefaults(anchorType) : { bufferBefore: null, bufferAfter: null };

    const block = await this.prisma.client.timeBlock.create({
      data: {
        userId,
        title: dto.title,
        startTime,
        endTime,
        triggerTime,
        startDate,
        endDate,
        status: dto.status ?? 'todo',
        location: dto.location ?? null,
        description: dto.description ?? null,
        category,
        categoryId,
        source: dto.source ?? (dto.taskId ? 'step' : 'manual'),
        sourceId: dto.sourceId ?? null,
        recurrence: dto.recurrence ?? 'none',
        recurrenceEndAt: dto.recurrenceEndAt ? new Date(dto.recurrenceEndAt) : null,
        recurrenceGroupId,
        contacts: dto.contacts ?? null,
        weather: dto.weather ?? null,
        taskId: dto.taskId ?? null,
        nature: dto.nature ?? 'PUBLIC',
        circleId,
        rigidity: dto.rigidity ?? null,
        bufferBefore: dto.bufferBefore ?? bufferDefaults.bufferBefore,
        bufferAfter: dto.bufferAfter ?? bufferDefaults.bufferAfter,
        anchorType,
      },
    });

    this.eventLog.log(userId, 'block_create', {
      source: block.source ?? 'manual',
      categoryId: block.categoryId ?? undefined,
    });

    return toResponse(block);
  }

  private async getDefaultCategory(userId: string): Promise<{ id: string; name: string } | null> {
    const workParent = await this.prisma.client.category.findFirst({
      where: { userId, name: '工作', parentId: null, isDeleted: false },
    });
    if (!workParent) return null;

    const defaultChild = await this.prisma.client.category.findFirst({
      where: { userId, parentId: workParent.id, isDefault: true, isDeleted: false },
    });
    if (!defaultChild) return null;

    return { id: defaultChild.id, name: defaultChild.name };
  }

  private async getDefaultCircle(userId: string): Promise<{ id: string } | null> {
    const colleagueParent = await this.prisma.client.circle.findFirst({
      where: { ownerId: userId, name: '同事', parentId: null, isDeleted: false },
    });
    if (!colleagueParent) return null;

    const defaultChild = await this.prisma.client.circle.findFirst({
      where: { ownerId: userId, parentId: colleagueParent.id, isDefault: true, isDeleted: false },
    });
    if (!defaultChild) return null;

    return { id: defaultChild.id };
  }

  async checkConflicts(
    userId: string,
    startTime: string,
    endTime: string,
    excludeId?: string,
  ): Promise<ConflictInfo[]> {
    const start = new Date(startTime);
    const end = new Date(endTime);
    this.validateTimeRange(start, end);

    const visible = await this.getVisibleBlocks(userId);

    return visible
      .filter((b) => b.id !== excludeId)
      .filter((b) => {
        const bs = b.startTime.getTime();
        const be = b.endTime.getTime();
        const s = start.getTime();
        const e = end.getTime();
        return s < be && e > bs;
      })
      .map((b) => ({
        id: b.id,
        title: b.title,
        startTime: b.startTime.toISOString(),
        endTime: b.endTime.toISOString(),
      }));
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

    const allBlocks = await this.prisma.client.timeBlock.findMany({
      where: {
        OR: [
          { startTime: { gte: dayStart, lt: nextDate } },
          { recurrence: { not: 'none' }, startTime: { lt: nextDate } },
        ],
        AND: [{
          OR: [
            { userId },
            { nature: 'PUBLIC' },
            { nature: 'CIRCLE_ONLY', circleId: { in: await this.visibility.getViewerCircleIds(userId) } },
          ],
        }],
      },
      orderBy: { startTime: 'asc' },
    });

    const visible = await this.visibility.filter(userId, allBlocks);
    const directBlocks = visible.filter(b => b.recurrence === 'none' || !b.recurrence);
    const recurringBlocks = visible.filter(b => b.recurrence && b.recurrence !== 'none');

    const expanded = recurringBlocks
      .filter((b) => isRecurringOnDate(b, date))
      .map((b) => toResponse(adjustToDate(b, date)));

    const result = [...directBlocks.map(toResponse), ...expanded];
    result.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return result;
  }

  async findByDateRange(userId: string, start: string, end: string, limit?: string): Promise<Record<string, TimeBlockResponseDto[]>> {
    const startDate = new Date(`${start}T00:00:00+08:00`);
    const endDate = new Date(`${end}T23:59:59+08:00`);
    const maxTake = limit ? parseInt(limit, 10) : undefined;
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
    let total = 0;
    while (cursor <= endDate) {
      const dateStr = toLocalDateStr(cursor);

      const dateDirect = directBlocks.filter((b) => {
        const bs = new Date(b.startTime);
        return bs >= cursor && bs < new Date(cursor.getTime() + 86400000);
      });

      const dateExpanded = visibleRecurring
        .filter((b) => isRecurringOnDate(b, dateStr))
        .map((b) => toResponse(adjustToDate(b, dateStr)));

      let all = [...dateDirect.map(toResponse), ...dateExpanded];
      all.sort((a, b) => a.startTime.localeCompare(b.startTime));
      if (maxTake !== undefined && total + all.length > maxTake) {
        all = all.slice(0, maxTake - total);
      }
      result[dateStr] = all;
      total += all.length;
      if (maxTake !== undefined && total >= maxTake) break;

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
      where: { taskId, userId },
      orderBy: { startTime: 'asc' },
    });

    const filtered = await this.visibility.filter(userId, blocks);
    return filtered.map(toResponse);
  }

  async findById(userId: string, id: string): Promise<TimeBlockResponseDto> {
    const block = await this.prisma.client.timeBlock.findFirst({
      where: { id, isDeleted: false },
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
      where: { id, isDeleted: false },
    });

    if (!block) {
      throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '时间块不存在', HttpStatus.NOT_FOUND);
    }

    // 允许修改自己创建的日程，或自己能看到（PUBLIC/CIRCLE_ONLY）的日程
    const canView = await this.visibility.canView(block, userId);
    if (!canView) {
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

    // Parse new triggerTime/startDate/endDate
    let triggerTime: Date | null | undefined = undefined;
    if (dto.triggerTime !== undefined) {
      triggerTime = dto.triggerTime ? new Date(dto.triggerTime) : null;
    }
    let startDate: Date | null | undefined = undefined;
    if (dto.startDate !== undefined) {
      startDate = dto.startDate ? new Date(`${dto.startDate}T00:00:00+08:00`) : null;
    }
    let endDate: Date | null | undefined = undefined;
    if (dto.endDate !== undefined) {
      endDate = dto.endDate ? new Date(`${dto.endDate}T23:59:59+08:00`) : null;
    }

    const updateMode = dto.updateMode ?? 'single';

    if (updateMode === 'all' && block.recurrenceGroupId) {
      await this.prisma.client.timeBlock.updateMany({
        where: { recurrenceGroupId: block.recurrenceGroupId, userId },
        data: {
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.status !== undefined && { status: dto.status }),
          ...(dto.location !== undefined && { location: dto.location }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.category !== undefined && { category: dto.category }),
          ...(dto.categoryId !== undefined && { categoryId: dto.categoryId || null }),
          ...(dto.recurrence !== undefined && { recurrence: dto.recurrence }),
          ...(dto.recurrenceEndAt !== undefined && { recurrenceEndAt: dto.recurrenceEndAt ? new Date(dto.recurrenceEndAt) : null }),
          ...(dto.contacts !== undefined && { contacts: dto.contacts }),
          ...(dto.weather !== undefined && { weather: dto.weather }),
          ...(dto.taskId !== undefined && { taskId: dto.taskId || null }),
          ...(dto.nature !== undefined && { nature: dto.nature }),
          ...(dto.circleId !== undefined && { circleId: dto.circleId || null }),
          ...(dto.rigidity !== undefined && { rigidity: dto.rigidity }),
          ...(dto.bufferBefore !== undefined && { bufferBefore: dto.bufferBefore }),
          ...(dto.bufferAfter !== undefined && { bufferAfter: dto.bufferAfter }),
          ...(dto.anchorType !== undefined && { anchorType: dto.anchorType }),
          ...(triggerTime !== undefined && { triggerTime }),
          ...(startDate !== undefined && { startDate }),
          ...(endDate !== undefined && { endDate }),
        },
      });

      const updatedBlock = await this.prisma.client.timeBlock.findFirst({
        where: { id },
      });
      if (!updatedBlock) {
        throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '时间块不存在', HttpStatus.NOT_FOUND);
      }
      this.eventLog.log(userId, 'block_update', {
        source: `batch,groupId:${block.recurrenceGroupId}`,
        entityId: id,
      });
      return toResponse(updatedBlock);
    }

    const updated = await this.prisma.client.timeBlock.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.startTime !== undefined && { startTime: newStartTime }),
        ...(dto.endTime !== undefined && { endTime: newEndTime }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId || null }),
        ...(dto.recurrence !== undefined && { recurrence: dto.recurrence }),
        ...(dto.recurrenceEndAt !== undefined && { recurrenceEndAt: dto.recurrenceEndAt ? new Date(dto.recurrenceEndAt) : null }),
        ...(dto.contacts !== undefined && { contacts: dto.contacts }),
        ...(dto.weather !== undefined && { weather: dto.weather }),
        ...(dto.taskId !== undefined && { taskId: dto.taskId || null }),
        ...(dto.nature !== undefined && { nature: dto.nature }),
        ...(dto.circleId !== undefined && { circleId: dto.circleId || null }),
        ...(dto.rigidity !== undefined && { rigidity: dto.rigidity }),
        ...(dto.bufferBefore !== undefined && { bufferBefore: dto.bufferBefore }),
        ...(dto.bufferAfter !== undefined && { bufferAfter: dto.bufferAfter }),
        ...(dto.anchorType !== undefined && { anchorType: dto.anchorType }),
        ...(triggerTime !== undefined && { triggerTime }),
        ...(startDate !== undefined && { startDate }),
        ...(endDate !== undefined && { endDate }),
      },
    });

    this.eventLog.log(userId, 'block_update', {
      source: 'single',
      entityId: id,
    });

    return toResponse(updated);
  }

  async softDelete(userId: string, id: string, updateMode?: string): Promise<void> {
    const block = await this.prisma.client.timeBlock.findFirst({
      where: { id, isDeleted: false },
    });

    if (!block) {
      throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '时间块不存在', HttpStatus.NOT_FOUND);
    }

    // 允许删除自己创建的日程，或自己能看到（PUBLIC/CIRCLE_ONLY）的日程
    // 对于别人创建的 PUBLIC 日程，当前用户只是"移除自己视角"而非物理删除别人的数据
    const canView = await this.visibility.canView(block, userId);
    if (!canView) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '无权删除该时间块', HttpStatus.FORBIDDEN);
    }

    const mode = updateMode ?? 'single';

    if (mode === 'all' && block.recurrenceGroupId) {
      const ids = (await this.prisma.client.timeBlock.findMany({
        where: { recurrenceGroupId: block.recurrenceGroupId, userId, isDeleted: false },
        select: { id: true },
      })).map((b) => b.id);

      await this.prisma.client.timeBlock.updateMany({
        where: { id: { in: ids } },
        data: { isDeleted: true, deletedAt: new Date() },
      });
      if (ids.length > 0) {
        await this.prisma.client.reminder.updateMany({
          where: { blockId: { in: ids }, userId },
          data: { isDeleted: true, deletedAt: new Date() },
        });
      }
      return;
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

    this.eventLog.log(userId, 'block_delete', {
      source: mode === 'all' ? 'batch' : 'single',
      entityId: id,
    });
  }

  async getStats(userId: string, start: string, end: string): Promise<TimeBlockStatsDto> {
    const startDate = new Date(`${start}T00:00:00+08:00`);
    const endDate = new Date(`${end}T23:59:59+08:00`);

    const blocks = await this.prisma.client.timeBlock.findMany({
      where: {
        userId,
        isDeleted: false,
        startTime: { gte: startDate, lte: endDate },
      },
      orderBy: { startTime: 'asc' },
    });

    const totalBlocks = blocks.length;
    let totalMinutes = 0;
    const byCategory: Record<string, number> = {};
    const dailyMinutes: Record<string, number> = {};

    for (const b of blocks) {
      const duration = (b.endTime.getTime() - b.startTime.getTime()) / 60000;
      totalMinutes += duration;

      const cat = b.category || 'life';
      byCategory[cat] = (byCategory[cat] || 0) + duration;

      const day = `${b.startTime.getFullYear()}-${String(b.startTime.getMonth() + 1).padStart(2, '0')}-${String(b.startTime.getDate()).padStart(2, '0')}`;
      dailyMinutes[day] = (dailyMinutes[day] || 0) + duration;
    }

    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    const avgDurationMinutes = totalBlocks > 0 ? Math.round((totalMinutes / totalBlocks) * 10) / 10 : 0;

    const roundedByCategory: Record<string, number> = {};
    for (const [k, v] of Object.entries(byCategory)) {
      roundedByCategory[k] = Math.round((v / 60) * 10) / 10;
    }

    const roundedDaily: Record<string, number> = {};
    for (const [k, v] of Object.entries(dailyMinutes)) {
      roundedDaily[k] = Math.round((v / 60) * 10) / 10;
    }

    return {
      totalBlocks,
      totalHours,
      byCategory: roundedByCategory,
      avgDurationMinutes,
      dailyDistribution: roundedDaily,
    };
  }

  // ---- Time Namecard (冷启动引擎) ----

  async generateNamecard(userId: string, startDate: string): Promise<NamecardResponseDto> {
    const start = new Date(`${startDate}T00:00:00+08:00`);
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start.getTime() + i * 86400000);
      dates.push(toLocalDateStr(d));
    }

    const allBlocks = await this.prisma.client.timeBlock.findMany({
      where: { userId, isDeleted: false, startTime: { gte: start }, endTime: { lte: new Date(start.getTime() + 7 * 86400000) } },
      orderBy: { startTime: 'asc' },
    });

    let totalMinutes = 0;
    let totalDurationMs = 0;
    let blockCount = 0;

    const weeklyHeatmap: DayFreeSlot[] = [];

    for (const dateStr of dates) {
      const dayStart = new Date(`${dateStr}T00:00:00+08:00`).getTime();
      const dayEnd = new Date(`${dateStr}T23:59:59+08:00`).getTime();
      const dayBlocks = allBlocks.filter((b) => {
        const bs = b.startTime.getTime();
        const be = b.endTime.getTime();
        return bs < dayEnd && be > dayStart;
      });

      const freeSlots: Array<{ start: string; end: string }> = [];
      let cursor = dayStart;
      for (const b of dayBlocks) {
        const bs = Math.max(b.startTime.getTime(), dayStart);
        if (bs > cursor) {
          freeSlots.push({ start: new Date(cursor).toISOString(), end: b.startTime.toISOString() });
        }
        const be = Math.min(b.endTime.getTime(), dayEnd);
        if (be > cursor) cursor = be;
        totalMinutes += (be - bs) / 60000;
        totalDurationMs += (be - bs);
        blockCount++;
      }
      if (dayEnd > cursor) {
        freeSlots.push({ start: new Date(cursor).toISOString(), end: new Date(dayEnd).toISOString() });
      }

      weeklyHeatmap.push({ date: dateStr, freeSlots });
    }

    const totalHours = totalMinutes / 60;
    const freeMinutes = 7 * 24 * 60 - totalMinutes;
    const avgBlockDuration = blockCount > 0 ? totalDurationMs / blockCount / 60000 : 0;

    return {
      totalHours: Math.round(totalHours * 10) / 10,
      freeHours: Math.round(freeMinutes / 60 * 10) / 10,
      busyHours: Math.round(totalHours * 10) / 10,
      avgBlockDuration: Math.round(avgBlockDuration * 10) / 10,
      weeklyHeatmap,
    };
  }

  async getGaps(userId: string, date: string): Promise<GapDto[]> {
    const dayStart = new Date(`${date}T00:00:00+08:00`);
    const dayEnd = new Date(`${date}T23:59:59+08:00`);

    const blocks = await this.prisma.client.timeBlock.findMany({
      where: {
        userId,
        isDeleted: false,
        startTime: { lt: dayEnd },
        endTime: { gt: dayStart },
      },
      orderBy: { startTime: 'asc' },
    });

    const gaps: GapDto[] = [];
    let cursor = dayStart.getTime();

    for (const b of blocks) {
      const bs = Math.max(b.startTime.getTime(), dayStart.getTime());
      if (bs > cursor) {
        const durationMinutes = Math.round((bs - cursor) / 60000);
        gaps.push({
          startTime: new Date(cursor).toISOString(),
          endTime: b.startTime.toISOString(),
          durationMinutes,
        });
      }
      const be = Math.min(b.endTime.getTime(), dayEnd.getTime());
      if (be > cursor) cursor = be;
    }

    if (dayEnd.getTime() > cursor) {
      const durationMinutes = Math.round((dayEnd.getTime() - cursor) / 60000);
      gaps.push({
        startTime: new Date(cursor).toISOString(),
        endTime: dayEnd.toISOString(),
        durationMinutes,
      });
    }

    return gaps;
  }

  async placeFlexible(userId: string, dto: PlaceFlexibleDto): Promise<TimeBlockResponseDto> {
    const task = await this.prisma.client.task.findFirst({
      where: { id: dto.taskId, userId, isDeleted: false },
    });
    if (!task) {
      throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '任务不存在', HttpStatus.NOT_FOUND);
    }

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    // Derive triggerTime/startDate/endDate from startTime/endTime
    const triggerTime = startTime;
    const startDate = new Date(`${startTime.toISOString().split('T')[0]}T00:00:00+08:00`);
    const endDate = new Date(`${endTime.toISOString().split('T')[0]}T23:59:59+08:00`);

    const block = await this.prisma.client.timeBlock.create({
      data: {
        userId,
        title: task.title,
        startTime,
        endTime,
        triggerTime,
        startDate,
        endDate,
        taskId: dto.taskId,
        source: 'flexible',
        sourceId: dto.taskId,
        rigidity: 'relative',
        status: 'todo',
        category: task.category,
        categoryId: task.categoryId,
      },
    });

    this.eventLog.log(userId, 'block_create', {
      source: 'flexible',
      taskId: dto.taskId,
    });

    return toResponse(block);
  }

  async unplaceBlock(userId: string, id: string): Promise<{ deleted: boolean }> {
    const block = await this.prisma.client.timeBlock.findFirst({
      where: { id, userId, isDeleted: false },
    });
    if (!block) {
      throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '时间块不存在', HttpStatus.NOT_FOUND);
    }
    if (block.source !== 'flexible') {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '只能取消放置弹性任务', HttpStatus.FORBIDDEN);
    }

    await this.prisma.client.timeBlock.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    this.eventLog.log(userId, 'block_delete', {
      source: 'flexible',
      entityId: id,
    });

    return { deleted: true };
  }
}
