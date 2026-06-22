import { StepService } from './step.service';
import { BusinessException } from '../../common/exceptions/business-exception';
import { createPrismaMock, DEFAULT_UUID } from '../../test-utils/prisma-mock';


const mockEventLog = {
  log: jest.fn().mockResolvedValue(undefined),
};

const mockNotification = {
  sendSubscribeMessage: jest.fn().mockResolvedValue(true),
};


const makeStepRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'step-1',
  taskId: 'task-1',
  sortOrder: 0,
  text: '测试步骤',
  estimatedMinutes: 30,
  status: 'unscheduled',
  dependsOnId: null,
  suggestedStart: null,
  suggestedEnd: null,
  timeBlockId: null,
  scheduledDate: null,
  completedAt: null,
  createdAt: new Date('2026-06-11T10:00:00.000Z'),
  updatedAt: new Date('2026-06-11T10:00:00.000Z'),
  ...overrides,
});


describe('StepService', () => {
  let service: StepService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    jest.clearAllMocks();
    service = new StepService(prisma as unknown as any, mockEventLog as any, mockNotification as any);
  });

  describe('create', () => {
    it('should create a step', async () => {
      prisma.task.findFirst.mockResolvedValue({ id: 'task-1', userId: DEFAULT_UUID });
      prisma.step.aggregate.mockResolvedValue({ _max: { sortOrder: null } });
      prisma.step.create.mockResolvedValue(makeStepRow());

      const result = await service.create(DEFAULT_UUID, { taskId: 'task-1', text: '测试步骤' });
      expect(result).toHaveProperty('text', '测试步骤');
      expect(result).toHaveProperty('status', 'unscheduled');
    });
  });

  describe('findByTaskId', () => {
    it('should return steps', async () => {
      prisma.task.findFirst.mockResolvedValue({ id: 'task-1', userId: DEFAULT_UUID });
      prisma.step.findMany.mockResolvedValue([
        makeStepRow({ id: 's1', dependsOnId: null }),
        makeStepRow({ id: 's2', sortOrder: 1, dependsOnId: 's1' }),
      ]);

      const result = await service.findByTaskId(DEFAULT_UUID, 'task-1');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('findById', () => {
    it('should return step', async () => {
      prisma.step.findFirst.mockResolvedValue(makeStepRow());
      prisma.task.findFirst.mockResolvedValue({ id: 'task-1', userId: DEFAULT_UUID });
      const result = await service.findById(DEFAULT_UUID, 'step-1');
      expect(result).toHaveProperty('id', 'step-1');
    });
  });

  describe('update', () => {
    it('should update text', async () => {
      prisma.step.findFirst.mockResolvedValue(makeStepRow());
      prisma.task.findFirst.mockResolvedValue({ id: 'task-1', userId: DEFAULT_UUID });
      prisma.step.update.mockResolvedValue(makeStepRow({ text: '更新后的步骤' }));
      const result = await service.update(DEFAULT_UUID, 'step-1', { text: '更新后的步骤' });
      expect(result).toHaveProperty('text', '更新后的步骤');
    });

    it('should set completedAt when status is done', async () => {
      prisma.step.findFirst.mockResolvedValue(makeStepRow());
      prisma.task.findFirst.mockResolvedValue({ id: 'task-1', userId: DEFAULT_UUID });
      prisma.step.findMany.mockResolvedValue([]); // unlockDependents: no dependents
      prisma.step.update.mockResolvedValue(makeStepRow({ status: 'done', completedAt: new Date() }));
      const result = await service.update(DEFAULT_UUID, 'step-1', { status: 'done' });
      expect(result).toHaveProperty('status', 'done');
    });
  });

  describe('softDelete', () => {
    it('should mark step as deleted', async () => {
      prisma.step.findFirst.mockResolvedValue(makeStepRow());
      prisma.task.findFirst.mockResolvedValue({ id: 'task-1', userId: DEFAULT_UUID });
      prisma.step.update.mockResolvedValue(makeStepRow({ isDeleted: true }));
      await expect(service.softDelete(DEFAULT_UUID, 'step-1')).resolves.toBeUndefined();
    });
  });

  describe('schedule', () => {
    it('should create timeBlock and update step', async () => {
      prisma.step.findFirst.mockResolvedValue(makeStepRow({ status: 'unscheduled' }));
      prisma.task.findFirst.mockResolvedValue({ id: 'task-1', userId: DEFAULT_UUID });
      prisma.timeBlock.create.mockResolvedValue({ id: 'tb-1' });
      prisma.step.update.mockResolvedValue(makeStepRow({
        status: 'scheduled',
        timeBlockId: 'tb-1',
        scheduledDate: new Date('2026-06-11T14:00:00.000Z'),
      }));

      const result = await service.schedule(DEFAULT_UUID, 'step-1', {
        startTime: '2026-06-11T14:00:00+08:00',
        endTime: '2026-06-11T15:00:00+08:00',
      });
      expect(result).toHaveProperty('timeBlockId', 'tb-1');
      expect(result.step).toHaveProperty('status', 'scheduled');
    });

    it('should throw when startTime >= endTime', async () => {
      prisma.step.findFirst.mockResolvedValue(makeStepRow({ status: 'unscheduled' }));
      prisma.task.findFirst.mockResolvedValue({ id: 'task-1', userId: DEFAULT_UUID });

      await expect(service.schedule(DEFAULT_UUID, 'step-1', {
        startTime: '2026-06-11T15:00:00+08:00',
        endTime: '2026-06-11T14:00:00+08:00',
      })).rejects.toThrow(BusinessException);
    });
  });
});
