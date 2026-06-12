import { ReminderService } from './reminder.service';
import { BusinessException } from '../../common/exceptions/business-exception';
import { createPrismaMock, DEFAULT_UUID, NOW } from '../../test-utils/prisma-mock';


describe('ReminderService', () => {
  let service: ReminderService;
  let prisma: ReturnType<typeof createPrismaMock>;

  const mockReminder = {
    id: 'rem-1', userId: DEFAULT_UUID, blockId: 'block-1',
    remindAt: new Date('2099-06-11T07:45:00.000Z'),
    leadMinutes: 15, status: 'PENDING',
    isDeleted: false, deletedAt: null, version: 1,
    createdAt: NOW, updatedAt: NOW,
  };

  const mockBlock = {
    id: 'block-1', userId: DEFAULT_UUID, title: '测试日程',
    startTime: new Date('2099-06-11T08:00:00.000Z'),
    endTime: new Date('2099-06-11T09:00:00.000Z'),
    status: 'todo', isDeleted: false,
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new ReminderService(prisma as unknown as any);
  });

  describe('create', () => {
    it('should create a reminder', async () => {
      prisma.timeBlock.findFirst.mockResolvedValue(mockBlock);
      prisma.reminder.findFirst.mockResolvedValue(null);
      prisma.reminder.create.mockResolvedValue(mockReminder);
      const result = await service.create(DEFAULT_UUID, { blockId: 'block-1', leadMinutes: 15 });
      expect(result).toHaveProperty('leadMinutes', 15);
      expect(result).toHaveProperty('status', 'PENDING');
    });

    it('should throw NotFoundException for bad block', async () => {
      prisma.timeBlock.findFirst.mockResolvedValue(null);
      await expect(service.create(DEFAULT_UUID, { blockId: 'bad-block', leadMinutes: 15 })).rejects.toThrow(BusinessException);
    });

    it('should throw ConflictException for duplicate', async () => {
      prisma.timeBlock.findFirst.mockResolvedValue(mockBlock);
      prisma.reminder.findFirst.mockResolvedValue(mockReminder);
      await expect(service.create(DEFAULT_UUID, { blockId: 'block-1', leadMinutes: 15 })).rejects.toThrow(BusinessException);
    });

    it('should throw BadRequestException for past block', async () => {
      const pastBlock = { ...mockBlock, startTime: new Date('2020-01-01T00:00:00.000Z') };
      prisma.timeBlock.findFirst.mockResolvedValue(pastBlock);
      await expect(service.create(DEFAULT_UUID, { blockId: 'block-1', leadMinutes: 15 })).rejects.toThrow(BusinessException);
    });
  });

  describe('findMyReminders', () => {
    it('should return list', async () => {
      prisma.reminder.findMany.mockResolvedValue([mockReminder]);
      const result = await service.findMyReminders(DEFAULT_UUID);
      expect(result).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('should return reminder', async () => {
      prisma.reminder.findFirst.mockResolvedValue(mockReminder);
      const result = await service.findById(DEFAULT_UUID, 'rem-1');
      expect(result).toHaveProperty('leadMinutes', 15);
    });

    it('should throw NotFoundException', async () => {
      prisma.reminder.findFirst.mockResolvedValue(null);
      await expect(service.findById(DEFAULT_UUID, 'bad-id')).rejects.toThrow(BusinessException);
    });
  });

  describe('findByBlockId', () => {
    it('should return reminders for block', async () => {
      prisma.reminder.findMany.mockResolvedValue([mockReminder]);
      const result = await service.findByBlockId(DEFAULT_UUID, 'block-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update lead minutes', async () => {
      prisma.reminder.findFirst.mockResolvedValue(mockReminder);
      prisma.timeBlock.findFirst.mockResolvedValue(mockBlock);
      prisma.reminder.update.mockResolvedValue({ ...mockReminder, leadMinutes: 30 });
      const result = await service.update(DEFAULT_UUID, 'rem-1', { leadMinutes: 30 });
      expect(result.leadMinutes).toBe(30);
    });
  });

  describe('softDelete', () => {
    it('should soft delete', async () => {
      prisma.reminder.findFirst.mockResolvedValue(mockReminder);
      await service.softDelete(DEFAULT_UUID, 'rem-1');
      expect(prisma.reminder.update).toHaveBeenCalled();
    });
  });
});
