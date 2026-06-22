import { ApprovalService } from './approval.service';
import { BusinessException } from '../../common/exceptions/business-exception';
import { createPrismaMock, DEFAULT_UUID } from '../../test-utils/prisma-mock';


const mockNotification = {
  sendSubscribeMessage: jest.fn().mockResolvedValue(true),
};

const mockSms = {
  send: jest.fn().mockResolvedValue(true),
};

const mockEventLog = {
  log: jest.fn().mockResolvedValue(undefined),
};


describe('ApprovalService', () => {
  let service: ApprovalService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    jest.clearAllMocks();
    service = new ApprovalService(
      prisma as unknown as any,
      mockNotification as unknown as any,
      mockSms as unknown as any,
      mockEventLog as unknown as any,
    );
  });

  describe('create', () => {
    const mockBlock = {
      id: 'block-1',
      userId: DEFAULT_UUID,
      title: '测试日程',
      startTime: new Date('2026-06-11T14:00:00.000Z'),
      endTime: new Date('2026-06-11T15:00:00.000Z'),
      status: 'pending',
      location: null,
      description: null,
      priority: 'medium',
      category: 'work',
      recurrence: 'none',
      recurrenceEndAt: null,
      recurrenceGroupId: null,
      contacts: null,
      weather: null,
      taskId: null,
      nature: 'PUBLIC',
      circleId: null,
      categoryId: null,
      isDeleted: false,
      deletedAt: null,
      version: 1,
      createdAt: new Date('2026-06-11T10:00:00.000Z'),
      updatedAt: new Date('2026-06-11T10:00:00.000Z'),
    };

    it('should throw when timeblock not found', async () => {
      prisma.timeBlock.findFirst.mockResolvedValue(null);
      await expect(service.create(DEFAULT_UUID, {
        blockId: 'bad-id',
        recipients: [{ contactType: 'friend', contactValue: 'openid-1' }],
      })).rejects.toThrow(BusinessException);
    });

    it('should create approval request via transaction', async () => {
      prisma.timeBlock.findFirst.mockResolvedValue(mockBlock);
      (prisma.client.$transaction as unknown as jest.Mock).mockImplementation(
        async (cb: (tx: Record<string, unknown>) => unknown) => {
          const tx = {
            approvalRequest: {
              create: jest.fn().mockResolvedValue({
                id: 'req-1',
                initiatorId: DEFAULT_UUID,
                blockId: 'block-1',
                title: '测试日程',
                startTime: mockBlock.startTime,
                endTime: mockBlock.endTime,
                description: null,
                category: 'work',
                nature: 'PUBLIC',
                categoryId: null,
                circleId: null,
                shareToken: 'tok-1',
                status: 'pending',
                isDeleted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                recipients: [{ id: 'rec-1', contactType: 'wechat', contactValue: 'openid-1', status: 'pending' }],
              }),
            },
          };
          return cb(tx);
        },
      );

      const result = await service.create(DEFAULT_UUID, {
        blockId: 'block-1',
        recipients: [{ contactType: 'friend', contactValue: 'openid-1' }],
      });
      expect(result).toBeDefined();
    });
  });

  describe('findMyPending', () => {
    it('should return empty array', async () => {
      prisma.approvalRecipient.findMany.mockResolvedValue([]);
      const result = await service.findMyPending(DEFAULT_UUID);
      expect(result).toEqual([]);
    });
  });
});
