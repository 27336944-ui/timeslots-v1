import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTimeBlockDto } from './dto/create-timeblock.dto';
import { UpdateTimeBlockDto } from './dto/update-timeblock.dto';
import { TimeBlockResponseDto } from './dto/timeblock-response.dto';


function toResponse(block: {
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
  contacts: string | null;
  weather: string | null;
  createdAt: Date;
  updatedAt: Date;
}): TimeBlockResponseDto {
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
    contacts: block.contacts,
    weather: block.weather,
    createdAt: block.createdAt.toISOString(),
    updatedAt: block.updatedAt.toISOString(),
  };
}


@Injectable()
export class TimeBlockService {
  constructor(private readonly prisma: PrismaService) {}

  private validateTimeRange(startTime: Date, endTime: Date): void {
    if (startTime >= endTime) {
      throw new BadRequestException('开始时间必须早于结束时间');
    }
  }

  async create(userId: string, dto: CreateTimeBlockDto): Promise<TimeBlockResponseDto> {
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    this.validateTimeRange(startTime, endTime);

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
        contacts: dto.contacts ?? null,
        weather: dto.weather ?? null,
      },
    });

    return toResponse(block);
  }

  async findByDate(userId: string, date: string): Promise<TimeBlockResponseDto[]> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('日期格式无效，应为 YYYY-MM-DD');
    }

    const dayStart = new Date(`${date}T00:00:00+08:00`);
    if (isNaN(dayStart.getTime())) {
      throw new BadRequestException('日期值无效');
    }
    const nextDate = new Date(dayStart);
    nextDate.setDate(nextDate.getDate() + 1);

    const blocks = await this.prisma.client.timeBlock.findMany({
      where: {
        userId,
        isDeleted: false,
        startTime: { gte: dayStart, lt: nextDate },
      },
      orderBy: { startTime: 'asc' },
    });

    return blocks.map(toResponse);
  }

  async findMyBlocks(userId: string): Promise<TimeBlockResponseDto[]> {
    const blocks = await this.prisma.client.timeBlock.findMany({
      where: { userId, isDeleted: false },
      orderBy: { startTime: 'asc' },
    });

    return blocks.map(toResponse);
  }

  async findById(userId: string, id: string): Promise<TimeBlockResponseDto> {
    const block = await this.prisma.client.timeBlock.findFirst({
      where: { id, isDeleted: false },
    });

    if (!block) {
      throw new NotFoundException('时间块不存在');
    }

    if (block.userId !== userId) {
      throw new ForbiddenException('无权访问该时间块');
    }

    return toResponse(block);
  }

  async update(userId: string, id: string, dto: UpdateTimeBlockDto): Promise<TimeBlockResponseDto> {
    const block = await this.prisma.client.timeBlock.findFirst({
      where: { id, isDeleted: false },
    });

    if (!block) {
      throw new NotFoundException('时间块不存在');
    }

    if (block.userId !== userId) {
      throw new ForbiddenException('无权修改该时间块');
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
        ...(dto.contacts !== undefined && { contacts: dto.contacts }),
        ...(dto.weather !== undefined && { weather: dto.weather }),
      },
    });

    return toResponse(updated);
  }

  async softDelete(userId: string, id: string): Promise<void> {
    const block = await this.prisma.client.timeBlock.findFirst({
      where: { id, isDeleted: false },
    });

    if (!block) {
      throw new NotFoundException('时间块不存在');
    }

    if (block.userId !== userId) {
      throw new ForbiddenException('无权删除该时间块');
    }

    await this.prisma.client.timeBlock.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }
}
