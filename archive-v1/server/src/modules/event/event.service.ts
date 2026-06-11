import { Injectable, HttpStatus } from '@nestjs/common';
import { Prisma, TimeBlock, TimeBlockNature } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { QuotaService } from '../quota/quota.service';
import { EncryptionService } from '../../common/services/encryption.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { BusinessException } from '../../common/exceptions/business.exception';

/**
 * 日程视图（findMyEvents 返回结构）。
 *
 * 显式排除 `encryptedDetails` —— 列表预览无需解密，节省内存 + 网络。
 */
export interface MyEventView {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  nature: string;
  status: string;
}

/**
 * 日程业务逻辑（厚 Service）。
 *
 * 职责：
 * 1. **创建**：`create(userId, dto)` — 加密 rawAiInput + 联动扣费（同事务）
 * 2. **列表**：`findMyEvents(userId)` — 显式 select 排除 `encryptedDetails`
 *
 * 设计要点：
 * - 写操作走 `this.prisma.$transaction(...)`（默认 `Prisma.TransactionClient`）
 * - 读操作走 `this.prisma.client.*`（带软删除扩展）
 */
@Injectable()
export class EventService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quotaService: QuotaService,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * 创建日程。
   *
   * 流程：
   * 1. 校验 `endTime > startTime`（业务规则）
   * 2. 加密 `rawAiInput` → `encryptedDetails`（AES-256-GCM）
   * 3. 开启事务：`timeBlock.create` + `quotaService.deductInTx(1 点)`
   * 4. 任一失败 → 全部回滚
   *
   * @param userId - 创建者 ID（来自 JWT）
   * @param dto - 创建参数
   * @returns 创建成功的 TimeBlock（含 id）
   * @throws BusinessException 当 endTime <= startTime 时 `INVALID_INPUT` (40001)
   */
  async create(
    userId: string,
    dto: CreateEventDto,
  ): Promise<Prisma.TimeBlockGetPayload<{}>> {
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);
    if (end.getTime() <= start.getTime()) {
      throw new BusinessException(40001, '结束时间必须晚于开始时间', HttpStatus.BAD_REQUEST);
    }

    let encryptedDetails: Prisma.InputJsonValue | undefined;
    if (dto.rawAiInput) {
      const enc = this.encryptionService.encrypt(dto.rawAiInput);
      encryptedDetails = enc as Prisma.InputJsonValue;
    }

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.timeBlock.create({
        data: {
          userId,
          title: dto.title,
          startTime: start,
          endTime: end,
          nature: dto.nature ?? TimeBlockNature.PRIVATE,
          encryptedDetails,
        },
      });

      await this.quotaService.deductInTx(tx, userId, 1, created.id);

      return created;
    });
  }

  /**
   * 查询本人日程。
   *
   * **性能优化**：显式 `select` 排除 `encryptedDetails`，列表页无需解密敏感字段。
   *
   * @param userId - 用户 ID
   * @returns 简化字段的事件列表（按 startTime 倒序）
   */
  async findMyEvents(userId: string): Promise<MyEventView[]> {
    return this.prisma.client.timeBlock.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        nature: true,
        status: true,
      },
      orderBy: { startTime: 'desc' },
    });
  }

  /**
   * 查询共享给我的日程。
   *
   * 逻辑：
   * - 排除本人创建的日程（`userId != ownerId`）
   * - nature = PUBLIC 或 (nature = CIRCLE_ONLY AND 我是 circle 成员)
   */
  async findSharedEvents(userId: string): Promise<MyEventView[]> {
    const myCircles = await this.prisma.client.circleMember.findMany({
      where: { userId, isDeleted: false },
      select: { circleId: true },
    });
    const circleIds = myCircles.map((m) => m.circleId);

    return this.prisma.client.timeBlock.findMany({
      where: {
        userId: { not: userId },
        isDeleted: false,
        OR: [
          { nature: TimeBlockNature.PUBLIC },
          ...(circleIds.length > 0
            ? [{ nature: TimeBlockNature.CIRCLE_ONLY, circleId: { in: circleIds } }]
            : []),
        ],
      },
      select: { id: true, title: true, startTime: true, endTime: true, nature: true, status: true },
      orderBy: { startTime: 'desc' },
    });
  }

  /**
   * 按日期查询本人日程（指定日 00:00 ~ 次日 00:00 UTC）。
   *
   * 前端日程 Tab 日视图用。
   */
  async findByDate(userId: string, date: Date): Promise<MyEventView[]> {
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return this.prisma.client.timeBlock.findMany({
      where: { userId, startTime: { gte: start, lt: end } },
      select: { id: true, title: true, startTime: true, endTime: true, nature: true, status: true },
      orderBy: { startTime: 'asc' },
    });
  }

  /**
   * 查询单条日程。
   *
   * 跨用户隔离：必须 `userId + id` 复合条件。
   */
  async findById(userId: string, id: string): Promise<TimeBlock> {
    const block = await this.prisma.client.timeBlock.findFirst({ where: { id, userId } });
    if (!block) {
      throw new BusinessException(40401, '日程不存在或无权访问');
    }
    return block;
  }

  /**
   * 更新日程。
   *
   * 支持部分更新：title / startTime / endTime / nature / status。
   * 跨用户隔离：先查后写。
   */
  async update(userId: string, id: string, dto: UpdateEventDto): Promise<TimeBlock> {
    const existing = await this.prisma.client.timeBlock.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new BusinessException(40401, '日程不存在或无权访问');
    }
    const data: Prisma.TimeBlockUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.startTime !== undefined) data.startTime = new Date(dto.startTime);
    if (dto.endTime !== undefined) data.endTime = new Date(dto.endTime);
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.nature !== undefined) data.nature = dto.nature;

    return this.prisma.client.timeBlock.update({ where: { id }, data });
  }

  /**
   * 软删除日程。
   */
  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.client.timeBlock.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new BusinessException(40401, '日程不存在或无权访问');
    }
    await this.prisma.client.timeBlock.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }
}
