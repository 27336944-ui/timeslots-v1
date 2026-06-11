import { Test, TestingModule } from '@nestjs/testing';
import { EventVisibilityService } from './event-visibility.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TimeBlock, TimeBlockNature } from '@prisma/client';
import { mockPrisma } from '../../../test/helpers/prisma-mock';

describe('EventVisibilityService', () => {
  let service: EventVisibilityService;

  const mockEvent = (overrides: Partial<TimeBlock> = {}): TimeBlock => ({
    id: 'event-1',
    userId: 'owner-1',
    title: 'Test Event',
    summary: 'Summary',
    encryptedDetails: { data: 'x', iv: 'y', tag: 'z' },
    startTime: new Date(),
    endTime: new Date(),
    status: 'ACTIVE',
    nature: TimeBlockNature.PRIVATE,
    actualDurationMinutes: null,
    aiTraceId: null,
    isAIGenerated: false,
    isBusy: true,
    taskGroupId: null,
    circleId: null,
    isDeleted: false,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as TimeBlock);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventVisibilityService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<EventVisibilityService>(EventVisibilityService);
    jest.clearAllMocks();
  });

  describe('checkPermission', () => {
    it('Owner 应该拥有最高权限', async () => {
      const event = mockEvent({ userId: 'owner-1' });
      const ctx = await service.checkPermission(event, 'owner-1');
      expect(ctx.isOwner).toBe(true);
      expect(ctx.isInSameCircle).toBe(true);
    });

    it('P0: 私密日程，非 Owner 绝对不可见 (isInSameCircle = false)', async () => {
      const event = mockEvent({ nature: TimeBlockNature.PRIVATE });
      const ctx = await service.checkPermission(event, 'viewer-1');
      expect(ctx.isOwner).toBe(false);
      expect(ctx.isInSameCircle).toBe(false);
    });

    it('P2: 分享圈日程，同圈成员可见', async () => {
      const event = mockEvent({ nature: TimeBlockNature.CIRCLE_ONLY, circleId: 'circle-1' });
      mockPrisma.client.circleMember.findUnique.mockResolvedValue({ id: 'member-1' });

      const ctx = await service.checkPermission(event, 'viewer-1');
      expect(ctx.isInSameCircle).toBe(true);
      expect(mockPrisma.client.circleMember.findUnique).toHaveBeenCalledWith({
        where: {
          circle_members_uk: { circleId: 'circle-1', userId: 'viewer-1' },
        },
      });
    });

    it('P2: 分享圈日程，非同圈成员不可见', async () => {
      const event = mockEvent({ nature: TimeBlockNature.CIRCLE_ONLY, circleId: 'circle-1' });
      mockPrisma.client.circleMember.findUnique.mockResolvedValue(null);

      const ctx = await service.checkPermission(event, 'viewer-1');
      expect(ctx.isInSameCircle).toBe(false);
    });
  });

  describe('maskEvent', () => {
    it('Owner 应该获得完整数据 (包含 encryptedDetails)', () => {
      const event = mockEvent({});
      const ctx = { viewerId: 'owner-1', isOwner: true, isInSameCircle: true };

      const result = service.maskEvent(event, ctx);
      expect(result).toEqual(event);
      expect((result as TimeBlock).encryptedDetails).toBeDefined();
    });

    it('P0: 非 Owner 查看私密日程，返回 null (触发 404)', () => {
      const event = mockEvent({ nature: TimeBlockNature.PRIVATE });
      const ctx = { viewerId: 'viewer-1', isOwner: false, isInSameCircle: false };

      const result = service.maskEvent(event, ctx);
      expect(result).toBeNull();
    });

    it('P2: 同圈成员查看分享圈日程，必须脱敏 encryptedDetails', () => {
      const event = mockEvent({ nature: TimeBlockNature.CIRCLE_ONLY });
      const ctx = { viewerId: 'viewer-1', isOwner: false, isInSameCircle: true };

      const result = service.maskEvent(event, ctx);
      expect(result).not.toBeNull();
      expect(result?.title).toBe('Test Event');
      expect((result as TimeBlock).encryptedDetails).toBeUndefined();
    });

    it('P1: 外部人员查看公开日程，仅返回基础信息', () => {
      const event = mockEvent({ nature: TimeBlockNature.PUBLIC });
      const ctx = { viewerId: 'viewer-1', isOwner: false, isInSameCircle: false };

      const result = service.maskEvent(event, ctx);
      expect(result).toEqual({
        id: event.id,
        title: event.title,
        summary: event.summary,
        startTime: event.startTime,
        endTime: event.endTime,
        status: event.status,
        nature: event.nature,
      });
    });

    it('兜底策略: 未知 nature 或无权限，默认返回 null (Fail-Secure)', () => {
      const event = mockEvent({ nature: 'UNKNOWN_NATURE' as unknown as TimeBlockNature });
      const ctx = { viewerId: 'viewer-1', isOwner: false, isInSameCircle: false };

      const result = service.maskEvent(event, ctx);
      expect(result).toBeNull();
    });
  });
});
