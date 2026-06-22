import { TaskService } from './task.service';
import { BusinessException } from '../../common/exceptions/business-exception';
import { createPrismaMock, DEFAULT_UUID, NOW } from '../../test-utils/prisma-mock';


describe('TaskService', () => {
  let service: TaskService;
  let prisma: ReturnType<typeof createPrismaMock>;

  const mockTask = {
    id: 'task-1', userId: DEFAULT_UUID, title: '测试任务',
    goal: '完成测试', steps: [{ text: '步骤1', isDone: false }],
    status: 'pending', priority: 'medium', category: 'work',
    dueAt: null, completedNote: null, retrospective: null, improvements: null,
    isDeleted: false, deletedAt: null, version: 1,
    createdAt: NOW, updatedAt: NOW,
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    const mockEventLog = { log: jest.fn() };
    service = new TaskService(prisma as unknown as any, mockEventLog as any);
  });

  describe('create', () => {
    it('should create a task', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: DEFAULT_UUID, isDeleted: false });
      prisma.task.create.mockResolvedValue(mockTask);
      const result = await service.create(DEFAULT_UUID, { title: '测试任务', category: 'work' });
      expect(result).toHaveProperty('title', '测试任务');
    });
  });

  describe('findMyTasks', () => {
    it('should return list', async () => {
      prisma.task.findMany.mockResolvedValue([mockTask]);
      const result = await service.findMyTasks(DEFAULT_UUID);
      expect(result).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('should return task when found', async () => {
      prisma.task.findFirst.mockResolvedValue(mockTask);
      const result = await service.findById(DEFAULT_UUID, 'task-1');
      expect(result).toHaveProperty('title', '测试任务');
    });

    it('should throw NotFoundException', async () => {
      prisma.task.findFirst.mockResolvedValue(null);
      await expect(service.findById(DEFAULT_UUID, 'bad-id')).rejects.toThrow(BusinessException);
    });
  });

  describe('update', () => {
    it('should update task fields', async () => {
      prisma.task.findFirst.mockResolvedValue(mockTask);
      prisma.task.update.mockResolvedValue({ ...mockTask, title: '更新标题', status: 'done' });
      const result = await service.update(DEFAULT_UUID, 'task-1', { title: '更新标题', status: 'done' });
      expect(result.title).toBe('更新标题');
      expect(result.status).toBe('done');
    });
  });

  describe('softDelete', () => {
    it('should soft delete', async () => {
      prisma.task.findFirst.mockResolvedValue(mockTask);
      await service.softDelete(DEFAULT_UUID, 'task-1');
      expect(prisma.task.update).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return stats object', async () => {
      prisma.task.findMany.mockResolvedValue([mockTask]);
      prisma.timeBlock.findMany.mockResolvedValue([]);
      const result = await service.getStats(DEFAULT_UUID);
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('pending');
      expect(result).toHaveProperty('done');
      expect(result).toHaveProperty('today');
      expect(result).toHaveProperty('week');
    });
  });

  describe('findByCategory', () => {
    it('should filter by category', async () => {
      prisma.task.findMany.mockResolvedValue([mockTask]);
      const result = await service.findByCategory(DEFAULT_UUID, 'work');
      expect(result).toHaveLength(1);
    });
  });

  describe('completeWithReview', () => {
    it('marks task done when all steps completed', async () => {
      prisma.task.findFirst.mockResolvedValue(mockTask);
      prisma.step.findMany.mockResolvedValue([]);
      prisma.task.update.mockResolvedValue({ ...mockTask, status: 'done', completedNote: '完成', retrospective: '很好' });

      const result = await service.completeWithReview(DEFAULT_UUID, 'task-1', '完成', '很好');

      expect(result.status).toBe('done');
      expect(result.completedNote).toBe('完成');
      expect(result.retrospective).toBe('很好');
    });

    it('completes task when there are no steps at all', async () => {
      const noStepsTask = { ...mockTask, steps: [] };
      prisma.task.findFirst.mockResolvedValue(noStepsTask);
      prisma.step.findMany.mockResolvedValue([]);
      prisma.task.update.mockResolvedValue({ ...noStepsTask, status: 'done', completedNote: '无步骤', retrospective: 'OK' });

      const result = await service.completeWithReview(DEFAULT_UUID, 'task-1', '无步骤', 'OK');

      expect(result.status).toBe('done');
    });

    it('throws when some steps are not done', async () => {
      prisma.task.findFirst.mockResolvedValue(mockTask);
      prisma.step.findMany.mockResolvedValue([{ id: 'step-1', status: 'scheduled' }]);

      await expect(
        service.completeWithReview(DEFAULT_UUID, 'task-1', '想先完成', '还差一步'),
      ).rejects.toThrow(BusinessException);
    });

    it('throws TASK_NOT_FOUND for missing task', async () => {
      prisma.task.findFirst.mockResolvedValue(null);

      await expect(
        service.completeWithReview(DEFAULT_UUID, 'bad-id', 'nope', 'nope'),
      ).rejects.toThrow(BusinessException);
    });

    it('throws FORBIDDEN for other users task', async () => {
      prisma.task.findFirst.mockResolvedValue({ ...mockTask, userId: 'other-user' });

      await expect(
        service.completeWithReview(DEFAULT_UUID, 'task-1', '不归我', '别人的任务'),
      ).rejects.toThrow(BusinessException);
    });
  });
});
