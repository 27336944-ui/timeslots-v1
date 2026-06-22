import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException, ErrorCodes } from '../../common/exceptions/business-exception';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { TemplateResponseDto } from './dto/template-response.dto';

function toResponse(t: {
  id: string;
  userId: string;
  name: string;
  type: string;
  title: string;
  goal: string | null;
  priority: string | null;
  categoryId: string | null;
  estimatedMinutes: number | null;
  defaultDuration: number | null;
  defaultNature: string | null;
  config: unknown;
  sortOrder: number;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}): TemplateResponseDto {
  return {
    id: t.id,
    userId: t.userId,
    name: t.name,
    type: t.type,
    title: t.title,
    goal: t.goal,
    priority: t.priority,
    categoryId: t.categoryId,
    estimatedMinutes: t.estimatedMinutes,
    defaultDuration: t.defaultDuration,
    defaultNature: t.defaultNature,
    config: typeof t.config === 'string' ? t.config : (t.config != null ? JSON.stringify(t.config) : null),
    sortOrder: t.sortOrder,
    isSystem: t.isSystem,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

@Injectable()
export class TemplateService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTemplateDto): Promise<TemplateResponseDto> {
    const maxOrder = await this.prisma.client.template.aggregate({
      where: { userId, type: dto.type },
      _max: { sortOrder: true },
    });
    const sortOrder = dto.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1;

    const template = await this.prisma.client.template.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        title: dto.title,
        goal: dto.goal ?? null,
        priority: dto.priority ?? null,
        categoryId: dto.categoryId ?? null,
        estimatedMinutes: dto.estimatedMinutes ?? null,
        defaultDuration: dto.defaultDuration ?? null,
        defaultNature: dto.defaultNature ?? null,
        sortOrder,
        isSystem: false,
      },
    });
    return toResponse(template);
  }

  async findByType(userId: string, type: string): Promise<TemplateResponseDto[]> {
    const templates = await this.prisma.client.template.findMany({
      where: { userId, type, isDeleted: false },
      orderBy: [{ isSystem: 'desc' }, { sortOrder: 'asc' }],
    });
    return templates.map(toResponse);
  }

  async findAll(userId: string): Promise<TemplateResponseDto[]> {
    const templates = await this.prisma.client.template.findMany({
      where: { userId, isDeleted: false },
      orderBy: [{ type: 'asc' }, { isSystem: 'desc' }, { sortOrder: 'asc' }],
    });
    return templates.map(toResponse);
  }

  async findById(userId: string, id: string): Promise<TemplateResponseDto> {
    const template = await this.prisma.client.template.findFirst({
      where: { id, userId, isDeleted: false },
    });
    if (!template) {
      throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '模版不存在', HttpStatus.NOT_FOUND);
    }
    return toResponse(template);
  }

  async update(userId: string, id: string, dto: UpdateTemplateDto): Promise<TemplateResponseDto> {
    const template = await this.prisma.client.template.findFirst({
      where: { id, userId, isDeleted: false },
    });
    if (!template) {
      throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '模版不存在', HttpStatus.NOT_FOUND);
    }
    if (template.isSystem) {
      throw new BusinessException(ErrorCodes.VALIDATION_FAILED, '系统预置模版不可修改');
    }

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.goal !== undefined) data.goal = dto.goal;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.categoryId !== undefined) data.categoryId = dto.categoryId;
    if (dto.estimatedMinutes !== undefined) data.estimatedMinutes = dto.estimatedMinutes;
    if (dto.defaultDuration !== undefined) data.defaultDuration = dto.defaultDuration;
    if (dto.defaultNature !== undefined) data.defaultNature = dto.defaultNature;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    if (dto.config !== undefined) data.config = dto.config;

    const updated = await this.prisma.client.template.update({ where: { id }, data });
    return toResponse(updated);
  }

  async apply(userId: string, templateId: string, date: string): Promise<{ blocks: unknown[] }> {
    const template = await this.prisma.client.template.findFirst({
      where: { id: templateId, isDeleted: false },
    });
    if (!template) {
      throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '模版不存在', HttpStatus.NOT_FOUND);
    }
    if (!template.isSystem && template.userId !== userId) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '无权使用该模版', HttpStatus.FORBIDDEN);
    }

    const dayStart = new Date(`${date}T09:00:00+08:00`);

    if (template.config) {
      let parsed: { blocks?: Array<{ title: string; startOffsetMinutes: number; durationMinutes: number; goal?: string; priority?: string; categoryId?: string }> };
      const raw = template.config;
      if (typeof raw === 'string') {
        try {
          parsed = JSON.parse(raw);
        } catch {
          throw new BusinessException(ErrorCodes.VALIDATION_FAILED, '模版配置格式无效');
        }
      } else if (typeof raw === 'object' && raw !== null) {
        parsed = raw as typeof parsed;
      } else {
        throw new BusinessException(ErrorCodes.VALIDATION_FAILED, '模版配置格式无效');
      }
      if (!parsed.blocks || !Array.isArray(parsed.blocks) || parsed.blocks.length === 0) {
        throw new BusinessException(ErrorCodes.VALIDATION_FAILED, '模版配置缺少 blocks 数组');
      }

      const blocks = await Promise.all(
        parsed.blocks.map((b) => {
          const start = new Date(dayStart.getTime() + b.startOffsetMinutes * 60000);
          const end = new Date(start.getTime() + b.durationMinutes * 60000);
          return this.prisma.client.timeBlock.create({
            data: {
              userId,
              title: b.title,
              startTime: start,
              endTime: end,
              status: 'todo',
              // priority removed from TimeBlock schema
              category: b.categoryId ?? template.categoryId ?? 'life',
              categoryId: b.categoryId ?? template.categoryId ?? null,
              nature: template.defaultNature ?? 'PUBLIC',
              description: b.goal ?? template.goal ?? null,
              source: 'template',
              sourceId: templateId,
            },
          });
        }),
      );

      return { blocks };
    }

    const duration = template.defaultDuration ?? 60;
    const endDate = new Date(dayStart.getTime() + duration * 60000);

    const block = await this.prisma.client.timeBlock.create({
      data: {
        userId,
        title: template.title,
        startTime: dayStart,
        endTime: endDate,
        status: 'todo',
        // priority removed from TimeBlock schema
        category: template.categoryId ?? 'life',
        categoryId: template.categoryId ?? null,
        nature: template.defaultNature ?? 'PUBLIC',
        description: template.goal ?? null,
        source: 'template',
        sourceId: templateId,
      },
    });

    return { blocks: [block] };
  }

  async softDelete(userId: string, id: string): Promise<{ deleted: boolean }> {
    const template = await this.prisma.client.template.findFirst({
      where: { id, userId, isDeleted: false },
    });
    if (!template) {
      throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '模版不存在', HttpStatus.NOT_FOUND);
    }
    if (template.isSystem) {
      throw new BusinessException(ErrorCodes.VALIDATION_FAILED, '系统预置模版不可删除');
    }

    await this.prisma.client.template.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    return { deleted: true };
  }
}