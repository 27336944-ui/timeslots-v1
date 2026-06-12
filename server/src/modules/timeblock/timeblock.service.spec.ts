import { TimeBlockService } from './timeblock.service';
import { BusinessException } from '../../common/exceptions/business-exception';
import { createPrismaMock, DEFAULT_UUID, NOW, MOCK_DATE_STR } from '../../test-utils/prisma-mock';


const mockVisibility = {
  filter: <T extends { id: string; userId: string; nature: string; circleId: string | null }>(_viewerId: string, blocks: T[]) => Promise.resolve(blocks),
  canView: <T extends { id: string; userId: string; nature: string; circleId: string | null }>(_block: T, _viewerId: string) => Promise.resolve(true),
  getViewerCircleIds: (_userId: string) => Promise.resolve([] as string[]),
};


describe('TimeBlockService', () => {
  let service: TimeBlockService;
  let prisma: ReturnType<typeof createPrismaMock>;

  const mockBlock = {
    id: 'block-1', userId: DEFAULT_UUID, title: '测试日程',
    startTime: new Date('2026-06-11T02:00:00.000Z'),
    endTime: new Date('2026-06-11T03:00:00.000Z'),
    status: 'todo', location: null, description: null,
    priority: 'medium', category: 'work', recurrence: 'none',
    contacts: null, weather: null, taskId: null,
    nature: 'PUBLIC', circleId: null,
    isDeleted: false, deletedAt: null, version: 1,
    createdAt: NOW, updatedAt: NOW,
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new TimeBlockService(prisma as unknown as any, mockVisibility as any);
  });

  describe('create', () => {
    it('should create a timeblock', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: DEFAULT_UUID, isDeleted: false });
      prisma.timeBlock.create.mockResolvedValue(mockBlock);
      const result = await service.create(DEFAULT_UUID, { title: '测试日程', startTime: '2026-06-11T10:00:00+08:00', endTime: '2026-06-11T11:00:00+08:00' });
      expect(result).toHaveProperty('title', '测试日程');
    });

    it('should create block even without explicit user check', async () => {
      prisma.timeBlock.create.mockResolvedValue(mockBlock);
      const result = await service.create('any-id', { title: 'Test', startTime: '2026-06-11T10:00:00+08:00', endTime: '2026-06-11T11:00:00+08:00' });
      expect(result).toHaveProperty('title', '测试日程');
    });
  });

  describe('findMyBlocks', () => {
    it('should return list', async () => {
      prisma.timeBlock.findMany.mockResolvedValue([mockBlock]);
      const result = await service.findMyBlocks(DEFAULT_UUID);
      expect(result).toHaveLength(1);
    });

    it('should return empty array', async () => {
      prisma.timeBlock.findMany.mockResolvedValue([]);
      const result = await service.findMyBlocks(DEFAULT_UUID);
      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return block when found', async () => {
      prisma.timeBlock.findFirst.mockResolvedValue(mockBlock);
      const result = await service.findById(DEFAULT_UUID, 'block-1');
      expect(result).toHaveProperty('title', '测试日程');
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.timeBlock.findFirst.mockResolvedValue(null);
      await expect(service.findById(DEFAULT_UUID, 'bad-id')).rejects.toThrow(BusinessException);
    });
  });

  describe('findByDate', () => {
    it('should return blocks for date', async () => {
      prisma.timeBlock.findMany.mockResolvedValue([mockBlock]);
      const result = await service.findByDate(DEFAULT_UUID, MOCK_DATE_STR);
      expect(result).toHaveLength(1);
    });

    it('should throw for invalid date', async () => {
      await expect(service.findByDate(DEFAULT_UUID, 'not-a-date')).rejects.toThrow(BusinessException);
    });
  });

  describe('update', () => {
    it('should update title', async () => {
      prisma.timeBlock.findFirst.mockResolvedValue(mockBlock);
      prisma.timeBlock.update.mockResolvedValue({ ...mockBlock, title: '新标题' });
      const result = await service.update(DEFAULT_UUID, 'block-1', { title: '新标题' });
      expect(result.title).toBe('新标题');
    });
  });

  describe('softDelete', () => {
    it('should soft delete', async () => {
      prisma.timeBlock.findFirst.mockResolvedValue(mockBlock);
      await service.softDelete(DEFAULT_UUID, 'block-1');
      expect(prisma.timeBlock.update).toHaveBeenCalled();
    });
  });

  describe('findByTaskId', () => {
    it('should return blocks for task', async () => {
      prisma.timeBlock.findMany.mockResolvedValue([mockBlock]);
      const result = await service.findByTaskId(DEFAULT_UUID, 'task-1');
      expect(result).toHaveLength(1);
    });
  });
});
