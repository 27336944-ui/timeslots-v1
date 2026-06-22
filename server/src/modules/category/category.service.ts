import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException, ErrorCodes } from '../../common/exceptions/business-exception';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';

interface CategoryRow {
  id: string;
  userId: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  level: number;
  isFixed: boolean;
  isDefault: boolean;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_CATEGORIES: { name: string; color: string; children: { name: string; color: string }[] }[] = [
  {
    name: '工作', color: '#10B981',
    children: [
      { name: '默认', color: '#10B981' },
    ],
  },
  {
    name: '生活', color: '#3B82F6',
    children: [
      { name: '默认', color: '#3B82F6' },
    ],
  },
  {
    name: '自有', color: '#F59E0B',
    children: [
      { name: '默认', color: '#F59E0B' },
    ],
  },
];

const MAX_LEVEL = 4;
const MAX_PER_LEVEL = 20;

function toResponse(c: CategoryRow): CategoryResponseDto {
  return {
    id: c.id,
    userId: c.userId,
    name: c.name,
    parentId: c.parentId,
    sortOrder: c.sortOrder,
    isDefault: c.isDefault,
    color: c.color,
    children: [],
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

async function buildTree(
  prisma: PrismaService,
  userId: string,
  parentId: string | null,
): Promise<CategoryResponseDto[]> {
  const rows = await prisma.client.category.findMany({
    where: { userId, parentId, isDeleted: false },
    orderBy: { sortOrder: 'asc' },
  });
  const result: CategoryResponseDto[] = [];
  for (const row of rows) {
    const item = toResponse(row as CategoryRow);
    item.children = await buildTree(prisma, userId, row.id);
    result.push(item);
  }
  return result;
}

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    let level = 1;
    const isFixed = false;

    if (dto.parentId) {
      const parent = await this.prisma.client.category.findFirst({ where: { id: dto.parentId } });
      if (!parent || parent.userId !== userId) {
        throw new BusinessException(ErrorCodes.INVALID_CATEGORY, '父分类不存在', HttpStatus.NOT_FOUND);
      }
      if (parent.level >= MAX_LEVEL) {
        throw new BusinessException(ErrorCodes.VALIDATION_FAILED, `分类最多支持 ${MAX_LEVEL} 级`);
      }
      level = parent.level + 1;
    }

    // Check count at this level under this parent
    const count = await this.prisma.client.category.count({
      where: { userId, parentId: dto.parentId ?? null },
    });
    if (count >= MAX_PER_LEVEL) {
      throw new BusinessException(ErrorCodes.VALIDATION_FAILED, `每级分类最多 ${MAX_PER_LEVEL} 个`);
    }

    const maxOrder = await this.prisma.client.category.aggregate({
      where: { userId, parentId: dto.parentId ?? null },
      _max: { sortOrder: true },
    });
    const sortOrder = dto.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1;

    const cat = await this.prisma.client.category.create({
      data: {
        userId,
        name: dto.name,
        parentId: dto.parentId ?? null,
        sortOrder,
        level,
        isFixed,
        color: dto.color ?? '#10B981',
      },
    });

    if (level < MAX_LEVEL && !dto.name.startsWith('__')) {
      await this.prisma.client.category.create({
        data: {
          userId,
          name: '默认',
          parentId: cat.id,
          sortOrder: 0,
          level: level + 1,
          isFixed: false,
          isDefault: true,
          color: dto.color ?? '#10B981',
        },
      });
    }

    return toResponse(cat as CategoryRow);
  }

  async findMyCategories(userId: string): Promise<CategoryResponseDto[]> {
    return buildTree(this.prisma, userId, null);
  }

  async findById(userId: string, id: string): Promise<CategoryResponseDto> {
    const cat = await this.prisma.client.category.findFirst({ where: { id } });
    if (!cat) {
      throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '分类不存在', HttpStatus.NOT_FOUND);
    }
    if (cat.userId !== userId) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '无权访问该分类', HttpStatus.FORBIDDEN);
    }
    const item = toResponse(cat as CategoryRow);
    item.children = await buildTree(this.prisma, userId, cat.id);
    return item;
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    const cat = await this.prisma.client.category.findFirst({ where: { id } });
    if (!cat) {
      throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '分类不存在', HttpStatus.NOT_FOUND);
    }
    if (cat.userId !== userId) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '无权修改该分类', HttpStatus.FORBIDDEN);
    }
    if (cat.isFixed) {
      throw new BusinessException(ErrorCodes.VALIDATION_FAILED, '固定大类不可修改');
    }

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    if (dto.color !== undefined) data.color = dto.color;

    const updated = await this.prisma.client.category.update({ where: { id }, data });
    const item = toResponse(updated as CategoryRow);
    item.children = await buildTree(this.prisma, userId, updated.id);
    return item;
  }

  async softDelete(userId: string, id: string): Promise<void> {
    const cat = await this.prisma.client.category.findFirst({ where: { id } });
    if (!cat) {
      throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '分类不存在', HttpStatus.NOT_FOUND);
    }
    if (cat.userId !== userId) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, '无权删除该分类', HttpStatus.FORBIDDEN);
    }
    if (cat.isDefault || cat.isFixed) {
      throw new BusinessException(ErrorCodes.VALIDATION_FAILED, '默认分类与固定大类不可删除');
    }
    const hasChildren = await this.prisma.client.category.count({ where: { parentId: id } });
    if (hasChildren > 0) {
      throw new BusinessException(ErrorCodes.VALIDATION_FAILED, '请先删除子分类');
    }

    const usageCount = await this.prisma.client.timeBlock.count({ where: { categoryId: id } });
    const taskUsageCount = await this.prisma.client.task.count({ where: { categoryId: id } });
    if (usageCount > 0 || taskUsageCount > 0) {
      throw new BusinessException(ErrorCodes.VALIDATION_FAILED, '分类使用中，请先迁移日程/任务');
    }

    await this.prisma.client.category.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  async initDefaults(userId: string): Promise<void> {
    const existing = await this.prisma.client.category.count({ where: { userId } });
    if (existing > 0) return;

    for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
      const parent = DEFAULT_CATEGORIES[i];
      const parentCat = await this.prisma.client.category.create({
        data: {
          userId,
          name: parent.name,
          sortOrder: i,
          level: 1,
          isFixed: true,
          isDefault: false,
          color: parent.color,
        },
      });
      for (let j = 0; j < parent.children.length; j++) {
        const child = parent.children[j];
        await this.prisma.client.category.create({
          data: {
            userId,
            name: child.name,
            parentId: parentCat.id,
            sortOrder: j,
            level: 2,
            isDefault: true,
            color: child.color,
          },
        });
      }
    }
  }
}
