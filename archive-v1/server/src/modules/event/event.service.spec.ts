import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { EventService } from './event.service';
import { PrismaService } from '../../prisma/prisma.service';
import { QuotaService } from '../quota/quota.service';
import { EncryptionService } from '../../common/services/encryption.service';

const userId = '11111111-1111-1111-1111-111111111111';

describe('EventService', () => {
  let service: EventService;

  const client = {
    timeBlock: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };
  const prismaMock = {
    client,
    $transaction: jest.fn((fn: (tx: any) => any) => fn(client)),
  };
  const quotaMock = { deductInTx: jest.fn() };
  const encryptionMock = { encrypt: jest.fn((s: string) => `enc:${s}`) };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: QuotaService, useValue: quotaMock },
        { provide: EncryptionService, useValue: encryptionMock },
      ],
    }).compile();
    service = module.get<EventService>(EventService);
  });

  describe('create', () => {
    it('成功创建日程并扣 1 点', async () => {
      const now = new Date();
      const dto = {
        title: '会议',
        startTime: now.toISOString(),
        endTime: new Date(now.getTime() + 3600000).toISOString(),
        rawAiInput: '原始输入',
      };
      client.timeBlock.create.mockResolvedValue({ id: 'b1', userId, title: dto.title });
      await service.create(userId, dto);
      const call = client.timeBlock.create.mock.calls[0][0];
      expect(call.data.title).toBe('会议');
      expect(call.data.userId).toBe(userId);
      expect(call.data.nature).toBe('PRIVATE');
      expect(encryptionMock.encrypt).toHaveBeenCalledWith('原始输入');
      expect(quotaMock.deductInTx).toHaveBeenCalledWith(client, userId, 1, 'b1');
    });

    it('endTime <= startTime 应抛 40001', async () => {
      const dto = {
        title: '错',
        startTime: '2026-06-08T10:00:00Z',
        endTime: '2026-06-08T09:00:00Z',
      };
      await expect(service.create(userId, dto)).rejects.toMatchObject({ businessCode: 40001 });
    });
  });

  describe('findMyEvents', () => {
    it('应返回事件列表', async () => {
      client.timeBlock.findMany.mockResolvedValue([
        { id: 'b1', title: 'x', startTime: new Date(), endTime: new Date(), nature: 'WORK', status: 'ACTIVE' },
      ]);
      const list = await service.findMyEvents(userId);
      expect(list).toHaveLength(1);
      expect(client.timeBlock.findMany.mock.calls[0][0].select).toBeDefined();
    });
  });

  describe('findByDate', () => {
    it('应过滤指定日期', async () => {
      client.timeBlock.findMany.mockResolvedValue([]);
      const list = await service.findByDate(userId, new Date('2026-06-08'));
      const where = client.timeBlock.findMany.mock.calls[0][0].where;
      expect(where.startTime.gte).toBeDefined();
      expect(where.startTime.lt).toBeDefined();
      expect(list).toEqual([]);
    });
  });

  describe('findById', () => {
    it('存在时返回日程', async () => {
      client.timeBlock.findFirst.mockResolvedValue({ id: 'b1', userId, title: 'x' });
      const b = await service.findById(userId, 'b1');
      expect(b.id).toBe('b1');
    });

    it('不存在时抛 40401', async () => {
      client.timeBlock.findFirst.mockResolvedValue(null);
      await expect(service.findById(userId, 'b1')).rejects.toMatchObject({ businessCode: 40401 });
    });
  });

  describe('update', () => {
    it('部分更新应正确合并', async () => {
      client.timeBlock.findFirst.mockResolvedValue({ id: 'b1', userId, title: 'x' });
      client.timeBlock.update.mockResolvedValue({ id: 'b1', userId, title: '新标题' });
      const result = await service.update(userId, 'b1', { title: '新标题' });
      expect(result.title).toBe('新标题');
      const call = client.timeBlock.update.mock.calls[0][0];
      expect(call.data.title).toBe('新标题');
    });

    it('不存在时抛 40401', async () => {
      client.timeBlock.findFirst.mockResolvedValue(null);
      await expect(service.update(userId, 'b1', { title: 'x' })).rejects.toMatchObject({ businessCode: 40401 });
    });
  });

  describe('remove', () => {
    it('应软删除', async () => {
      client.timeBlock.findFirst.mockResolvedValue({ id: 'b1', userId });
      client.timeBlock.update.mockResolvedValue({});
      await service.remove(userId, 'b1');
      const call = client.timeBlock.update.mock.calls[0][0];
      expect(call.data.isDeleted).toBe(true);
      expect(call.data.deletedAt).toBeInstanceOf(Date);
    });
  });
});
