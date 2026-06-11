import { Test, TestingModule } from '@nestjs/testing';
import { TaskService, TaskListFilter } from './task.service';
import { PrismaService } from '../../prisma/prisma.service';

const userId = '11111111-1111-1111-1111-111111111111';

/**
 * TaskService 单测。
 *
 * 用自包含 mock（不复用 test/helpers/prisma-mock，因为后者只覆盖 visibility/quota 场景）。
 */
describe('TaskService', () => {
  let service: TaskService;
  const client = {
    task: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    taskGroup: {
      findFirst: jest.fn(),
    },
  };

  const prismaServiceMock = {
    client,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        { provide: PrismaService, useValue: prismaServiceMock },
      ],
    }).compile();
    service = module.get<TaskService>(TaskService);
  });

  describe('create', () => {
    it('无 taskGroup 时直接创建，默认 PENDING + MEDIUM', async () => {
      client.task.create.mockResolvedValue({
        id: 't1',
        userId,
        title: '买菜',
        notes: null,
        status: 'PENDING',
        priority: 'MEDIUM',
        dueAt: null,
        completedAt: null,
        sortOrder: 0,
        taskGroupId: null,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });
      const result = await service.create(userId, { title: '买菜' });
      expect(result.title).toBe('买菜');
      expect(result.status).toBe('PENDING');
      expect(result.priority).toBe('MEDIUM');
      const call = client.task.create.mock.calls[0][0];
      expect(call.data.userId).toBe(userId);
      expect(call.data.priority).toBe('MEDIUM');
    });

    it('taskGroup 不属于本人时抛 40401', async () => {
      client.taskGroup.findFirst.mockResolvedValue(null);
      await expect(
        service.create(userId, { title: 'x', taskGroupId: 'g1' }),
      ).rejects.toMatchObject({ businessCode: 40401 });
    });
  });

  describe('findMyTasks', () => {
    it('带 status 过滤应正确构造 where', async () => {
      client.task.findMany.mockResolvedValue([]);
      const filter: TaskListFilter = { status: 'DONE' };
      await service.findMyTasks(userId, filter);
      const call = client.task.findMany.mock.calls[0][0];
      expect(call.where).toMatchObject({ userId, status: 'DONE' });
    });

    it('无过滤时只按 userId 过滤', async () => {
      client.task.findMany.mockResolvedValue([]);
      await service.findMyTasks(userId);
      const call = client.task.findMany.mock.calls[0][0];
      expect(call.where).toEqual({ userId });
    });
  });

  describe('getStats', () => {
    it('应正确返回 3 项统计', async () => {
      client.task.count
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(2);
      const stats = await service.getStats(userId, new Date('2026-06-07T10:00:00Z'));
      expect(stats).toEqual({ today: 3, week: 8, overdue: 2 });
      expect(client.task.count).toHaveBeenCalledTimes(3);
    });
  });

  describe('update', () => {
    it('status 改为 DONE 时应自动设 completedAt', async () => {
      client.task.findFirst.mockResolvedValue({
        id: 't1',
        userId,
        status: 'PENDING',
        title: 'x',
        notes: null,
        priority: 'MEDIUM',
        dueAt: null,
        completedAt: null,
        sortOrder: 0,
        taskGroupId: null,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });
      client.task.update.mockResolvedValue({
        id: 't1',
        userId,
        status: 'DONE',
        title: 'x',
        notes: null,
        priority: 'MEDIUM',
        dueAt: null,
        completedAt: new Date(),
        sortOrder: 0,
        taskGroupId: null,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });
      await service.update(userId, 't1', { status: 'DONE' });
      const call = client.task.update.mock.calls[0][0];
      expect(call.data.status).toBe('DONE');
      expect(call.data.completedAt).toBeInstanceOf(Date);
    });
  });

  describe('remove', () => {
    it('应软删除（设 isDeleted + deletedAt）', async () => {
      client.task.findFirst.mockResolvedValue({
        id: 't1',
        userId,
        status: 'PENDING',
        title: 'x',
        notes: null,
        priority: 'MEDIUM',
        dueAt: null,
        completedAt: null,
        sortOrder: 0,
        taskGroupId: null,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });
      client.task.update.mockResolvedValue({});
      await service.remove(userId, 't1');
      const call = client.task.update.mock.calls[0][0];
      expect(call.data.isDeleted).toBe(true);
      expect(call.data.deletedAt).toBeInstanceOf(Date);
    });

    it('任务不属于本人时抛 40401', async () => {
      client.task.findFirst.mockResolvedValue(null);
      await expect(service.remove(userId, 't1')).rejects.toMatchObject({ businessCode: 40401 });
    });
  });
});
