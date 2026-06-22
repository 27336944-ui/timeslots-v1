import { SlotSuggesterService } from './slot-suggester.service';
import { createPrismaMock, DEFAULT_UUID } from '../../test-utils/prisma-mock';


const MOCK_DATE = '2026-06-14';


function makeUser(overrides = {}) {
  return {
    id: DEFAULT_UUID,
    settings: null,
    isDeleted: false,
    ...overrides,
  };
}


function makeBlock(startOffset: number, endOffset: number) {
  const ref = new Date(`${MOCK_DATE}T00:00:00+08:00`).getTime();
  return { startTime: new Date(ref + startOffset * 60000), endTime: new Date(ref + endOffset * 60000) };
}


describe('SlotSuggesterService', () => {
  let service: SlotSuggesterService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    jest.clearAllMocks();
    service = new SlotSuggesterService(prisma as unknown as any);
  });

  describe('suggest', () => {
    it('returns a full-day slot when no blocks exist', async () => {
      prisma.user.findFirst.mockResolvedValue(makeUser());
      prisma.timeBlock.findMany.mockResolvedValue([]);

      const result = await service.suggest({
        userId: DEFAULT_UUID,
        date: MOCK_DATE,
        steps: [{ id: 's1', text: '写报告', estimatedMinutes: 60 }],
      });

      expect(result).toHaveLength(1);
      expect(result[0].stepId).toBe('s1');
      expect(result[0].suggestedStart).toBeTruthy();
      expect(result[0].suggestedEnd).toBeTruthy();
      const start = new Date(result[0].suggestedStart!);
      const end = new Date(result[0].suggestedEnd!);
      expect(end.getTime() - start.getTime()).toBe(60 * 60000);
      expect(result[0].reason).toContain('最早');
    });

    it('schedules steps in gaps between existing blocks', async () => {
      prisma.user.findFirst.mockResolvedValue(makeUser());
      prisma.timeBlock.findMany.mockResolvedValue([
        makeBlock(9 * 60, 10 * 60),
        makeBlock(11 * 60, 12 * 60),
      ]);

      const result = await service.suggest({
        userId: DEFAULT_UUID,
        date: MOCK_DATE,
        steps: [{ id: 's1', text: '回顾', estimatedMinutes: 45 }],
      });

      expect(result).toHaveLength(1);
      const start = new Date(result[0].suggestedStart!);
      expect(start.getHours()).toBe(8);
      expect(start.getMinutes()).toBe(0);
    });

    it('respects dependency order (topological sort)', async () => {
      prisma.user.findFirst.mockResolvedValue(makeUser());
      prisma.timeBlock.findMany.mockResolvedValue([]);

      const result = await service.suggest({
        userId: DEFAULT_UUID,
        date: MOCK_DATE,
        steps: [
          { id: 's1', text: '调研', estimatedMinutes: 60 },
          { id: 's2', text: '写方案', estimatedMinutes: 60, dependsOnId: 's1' },
          { id: 's3', text: '评审', estimatedMinutes: 60, dependsOnId: 's2' },
        ],
      });

      expect(result).toHaveLength(3);
      const s1End = new Date(result[0].suggestedEnd!);
      const s2Start = new Date(result[1].suggestedStart!);
      const s3Start = new Date(result[2].suggestedStart!);
      expect(s2Start.getTime()).toBeGreaterThanOrEqual(s1End.getTime());
      expect(s3Start.getTime()).toBeGreaterThanOrEqual(new Date(result[1].suggestedEnd!).getTime());
    });

    it('returns null slots when no free space is available', async () => {
      prisma.user.findFirst.mockResolvedValue(makeUser());
      prisma.timeBlock.findMany.mockResolvedValue([
        makeBlock(8 * 60, 23 * 60),
      ]);

      const result = await service.suggest({
        userId: DEFAULT_UUID,
        date: MOCK_DATE,
        steps: [{ id: 's1', text: '写报告', estimatedMinutes: 60 }],
      });

      expect(result).toHaveLength(1);
      expect(result[0].suggestedStart).toBeNull();
      expect(result[0].suggestedEnd).toBeNull();
      expect(result[0].reason).toContain('无足够空闲时段');
    });

    it('uses default day boundaries when user has no settings', async () => {
      prisma.user.findFirst.mockResolvedValue(makeUser());
      prisma.timeBlock.findMany.mockResolvedValue([]);

      const result = await service.suggest({
        userId: DEFAULT_UUID,
        date: MOCK_DATE,
        steps: [{ id: 's1', text: '全天任务', estimatedMinutes: 14 * 60 }],
      });

      expect(result[0].suggestedStart).not.toBeNull();
      const start = new Date(result[0].suggestedStart!);
      const end = new Date(result[0].suggestedEnd!);
      expect(start.getHours()).toBe(8);
      expect(end.getHours()).toBe(22);
    });

    it('respects custom day start from user settings', async () => {
      prisma.user.findFirst.mockResolvedValue(
        makeUser({ settings: { dayStartsAt: '10:00', dayEndsAt: '22:00' } }),
      );
      prisma.timeBlock.findMany.mockResolvedValue([]);

      const result = await service.suggest({
        userId: DEFAULT_UUID,
        date: MOCK_DATE,
        steps: [{ id: 's1', text: '晨会', estimatedMinutes: 30 }],
      });

      const start = new Date(result[0].suggestedStart!);
      expect(start.getHours()).toBe(10);
    });

    it('returns null when a step exceeds any single free slot', async () => {
      prisma.user.findFirst.mockResolvedValue(makeUser());
      prisma.timeBlock.findMany.mockResolvedValue([
        makeBlock(8 * 60, 9 * 60),
        makeBlock(9 * 60 + 5, 23 * 60),
      ]);

      const result = await service.suggest({
        userId: DEFAULT_UUID,
        date: MOCK_DATE,
        steps: [{ id: 's1', text: '长任务', estimatedMinutes: 120 }],
      });

      expect(result[0].suggestedStart).toBeNull();
      expect(result[0].suggestedEnd).toBeNull();
    });

    it('fills remaining gap after previous assignment', async () => {
      prisma.user.findFirst.mockResolvedValue(makeUser());
      prisma.timeBlock.findMany.mockResolvedValue([
        makeBlock(10 * 60, 11 * 60),
      ]);

      const result = await service.suggest({
        userId: DEFAULT_UUID,
        date: MOCK_DATE,
        steps: [
          { id: 's1', text: '任务1', estimatedMinutes: 60 },
          { id: 's2', text: '任务2', estimatedMinutes: 60 },
        ],
      });

      expect(result).toHaveLength(2);
      const s1End = new Date(result[0].suggestedEnd!);
      const s2Start = new Date(result[1].suggestedStart!);
      expect(s1End.getHours()).toBe(9);
      expect(s2Start.getHours()).toBe(9);
      expect(s2Start.getMinutes()).toBe(0);
    });

    it('handles dependency on non-existent step ID', async () => {
      prisma.user.findFirst.mockResolvedValue(makeUser());
      prisma.timeBlock.findMany.mockResolvedValue([]);

      const result = await service.suggest({
        userId: DEFAULT_UUID,
        date: MOCK_DATE,
        steps: [
          { id: 's1', text: '独立任务', estimatedMinutes: 30 },
          { id: 's2', text: '依赖不存在步骤', estimatedMinutes: 30, dependsOnId: 'ghost' },
        ],
      });

      expect(result).toHaveLength(2);
      expect(result[0].stepId).toBe('s1');
      expect(result[1].stepId).toBe('s2');
      expect(result[1].suggestedStart).not.toBeNull();
    });

    it('returns empty array for no steps', async () => {
      prisma.user.findFirst.mockResolvedValue(makeUser());
      prisma.timeBlock.findMany.mockResolvedValue([]);

      const result = await service.suggest({
        userId: DEFAULT_UUID,
        date: MOCK_DATE,
        steps: [],
      });

      expect(result).toEqual([]);
    });

    it('uses estimatedMinutes default of 30 when not provided', async () => {
      prisma.user.findFirst.mockResolvedValue(makeUser());
      prisma.timeBlock.findMany.mockResolvedValue([]);

      const result = await service.suggest({
        userId: DEFAULT_UUID,
        date: MOCK_DATE,
        steps: [{ id: 's1', text: '无时长' }],
      });

      expect(result).toHaveLength(1);
      const start = new Date(result[0].suggestedStart!);
      const end = new Date(result[0].suggestedEnd!);
      const dur = (end.getTime() - start.getTime()) / 60000;
      expect(dur).toBe(30);
    });
  });
});
