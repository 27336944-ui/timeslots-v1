import { EventVisibilityService } from './event-visibility.service';
import { createPrismaMock } from '../../test-utils/prisma-mock';


const makeBlock = (overrides: Record<string, unknown> = {}) => ({
  id: 'block-1',
  userId: 'viewer-1',
  nature: 'PUBLIC',
  circleId: null,
  ...overrides,
});


describe('EventVisibilityService', () => {
  let service: EventVisibilityService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    jest.clearAllMocks();
    service = new EventVisibilityService(prisma as unknown as any);
  });

  describe('filter', () => {
    it('should return all blocks for owner', async () => {
      prisma.circleMember.findMany.mockResolvedValue([]);
      const blocks = [
        makeBlock({ id: 'b1', userId: 'viewer-1', nature: 'PRIVATE' }),
        makeBlock({ id: 'b2', userId: 'viewer-1', nature: 'PUBLIC' }),
      ];
      const result = await service.filter('viewer-1', blocks);
      expect(result).toHaveLength(2);
    });

    it('should filter out PRIVATE blocks of others', async () => {
      prisma.circleMember.findMany.mockResolvedValue([]);
      const blocks = [
        makeBlock({ id: 'b1', userId: 'other-1', nature: 'PRIVATE' }),
        makeBlock({ id: 'b2', userId: 'other-1', nature: 'PUBLIC' }),
      ];
      const result = await service.filter('viewer-1', blocks);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('b2');
    });

    it('should show CIRCLE_ONLY when viewer is member', async () => {
      prisma.circleMember.findMany.mockResolvedValue([{ circleId: 'circle-1' }]);
      const blocks = [
        makeBlock({ id: 'b1', userId: 'other-1', nature: 'CIRCLE_ONLY', circleId: 'circle-1' }),
      ];
      const result = await service.filter('viewer-1', blocks);
      expect(result).toHaveLength(1);
    });

    it('should hide CIRCLE_ONLY when viewer is not member', async () => {
      prisma.circleMember.findMany.mockResolvedValue([]);
      const blocks = [
        makeBlock({ id: 'b1', userId: 'other-1', nature: 'CIRCLE_ONLY', circleId: 'other-circle' }),
      ];
      const result = await service.filter('viewer-1', blocks);
      expect(result).toHaveLength(0);
    });

    it('should fall back to visible when nature is unknown', async () => {
      prisma.circleMember.findMany.mockResolvedValue([]);
      const blocks = [
        makeBlock({ id: 'b1', userId: 'other-1', nature: 'UNKNOWN' }),
      ];
      const result = await service.filter('viewer-1', blocks);
      expect(result).toHaveLength(1);
    });
  });

  describe('canView', () => {
    it('should return true for PUBLIC', async () => {
      prisma.circleMember.findMany.mockResolvedValue([]);
      const result = await service.canView(makeBlock({ userId: 'other', nature: 'PUBLIC' }), 'viewer-1');
      expect(result).toBe(true);
    });

    it('should return false for PRIVATE', async () => {
      prisma.circleMember.findMany.mockResolvedValue([]);
      const result = await service.canView(makeBlock({ userId: 'other', nature: 'PRIVATE' }), 'viewer-1');
      expect(result).toBe(false);
    });
  });

  describe('getViewerCircleIds', () => {
    it('should return list from memberships', async () => {
      prisma.circleMember.findMany.mockResolvedValue([
        { circleId: 'c1' },
        { circleId: 'c2' },
      ]);
      const result = await service.getViewerCircleIds('viewer-1');
      expect(result).toEqual(['c1', 'c2']);
    });

    it('should return empty when no memberships', async () => {
      prisma.circleMember.findMany.mockResolvedValue([]);
      const result = await service.getViewerCircleIds('viewer-1');
      expect(result).toEqual([]);
    });
  });
});
