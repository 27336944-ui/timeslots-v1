import { Test, TestingModule } from '@nestjs/testing';
import { TaskGroupService, TaskGroupView } from './task-group.service';
import { PrismaService } from '../../prisma/prisma.service';

const userId = '11111111-1111-1111-1111-111111111111';

const mockGroup = {
  id: 'g1',
  userId,
  name: '工作',
  color: '#888888',
  notes: null,
  isDeleted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('TaskGroupService', () => {
  let service: TaskGroupService;

  const client = {
    taskGroup: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    task: { count: jest.fn() },
  };
  const prismaMock = { client };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskGroupService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = module.get<TaskGroupService>(TaskGroupService);
  });

  describe('create', () => {
    it('应创建任务组，默认 color', async () => {
      client.taskGroup.create.mockResolvedValue(mockGroup);
      const result = await service.create(userId, { name: '工作' });
      expect(result.name).toBe('工作');
      expect(result.totalCount).toBe(0);
      expect(result.doneCount).toBe(0);
      expect(result.progress).toBe(0);
    });
  });

  describe('findMyGroups', () => {
    it('应返回带进度的任务组列表', async () => {
      client.taskGroup.findMany.mockResolvedValue([mockGroup]);
      client.task.count.mockResolvedValueOnce(5).mockResolvedValueOnce(3);
      const list = await service.findMyGroups(userId);
      expect(list).toHaveLength(1);
      expect(list[0].totalCount).toBe(5);
      expect(list[0].doneCount).toBe(3);
      expect(list[0].progress).toBe(60);
    });
  });

  describe('findOne', () => {
    it('存在时返回详情', async () => {
      client.taskGroup.findFirst.mockResolvedValue(mockGroup);
      client.task.count.mockResolvedValueOnce(10).mockResolvedValueOnce(4);
      const result = await service.findOne(userId, 'g1');
      expect(result.progress).toBe(40);
    });

    it('不存在时抛 40401', async () => {
      client.taskGroup.findFirst.mockResolvedValue(null);
      await expect(service.findOne(userId, 'g1')).rejects.toMatchObject({ businessCode: 40401 });
    });
  });

  describe('update', () => {
    it('应更新并重新计算进度', async () => {
      client.taskGroup.findFirst.mockResolvedValue(mockGroup);
      client.taskGroup.update.mockResolvedValue({ ...mockGroup, name: '新名' });
      client.task.count.mockResolvedValueOnce(2).mockResolvedValueOnce(1);
      const result = await service.update(userId, 'g1', { name: '新名' });
      expect(result.name).toBe('新名');
      expect(result.progress).toBe(50);
    });
  });

  describe('remove', () => {
    it('应软删除', async () => {
      client.taskGroup.findFirst.mockResolvedValue(mockGroup);
      client.taskGroup.update.mockResolvedValue({});
      await service.remove(userId, 'g1');
      const call = client.taskGroup.update.mock.calls[0][0];
      expect(call.data.isDeleted).toBe(true);
      expect(call.data.deletedAt).toBeInstanceOf(Date);
    });
  });
});
