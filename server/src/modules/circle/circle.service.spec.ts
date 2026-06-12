import { CircleService } from './circle.service';
import { BusinessException } from '../../common/exceptions/business-exception';
import { createPrismaMock, DEFAULT_UUID, OTHER_UUID, NOW } from '../../test-utils/prisma-mock';


describe('CircleService', () => {
  let service: CircleService;
  let prisma: ReturnType<typeof createPrismaMock>;

  const mockCircle = {
    id: 'circle-1', ownerId: DEFAULT_UUID, name: '测试圈子',
    description: '这是一个测试圈子', inviteCode: 'ABC12345',
    status: 'active', isDeleted: false, deletedAt: null, version: 1,
    createdAt: NOW, updatedAt: NOW,
  };

  const ownerShip = {
    id: 'mem-1', circleId: 'circle-1', userId: DEFAULT_UUID,
    role: 'OWNER', isDeleted: false, createdAt: NOW, updatedAt: NOW,
  };

  const memberEntry = {
    id: 'mem-2', circleId: 'circle-1', userId: OTHER_UUID,
    role: 'MEMBER', isDeleted: false, createdAt: NOW, updatedAt: NOW,
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new CircleService(prisma as unknown as any);

    // Most tests need circleMember findMany and user lookup to work
    prisma.circleMember.findMany.mockResolvedValue([ownerShip, memberEntry]);
    prisma.circleMember.findFirst.mockResolvedValue(ownerShip);
    prisma.user.findFirst.mockResolvedValue({ id: DEFAULT_UUID, isDeleted: false });
    prisma.user.findMany.mockResolvedValue([
      { id: DEFAULT_UUID, nickname: 'Owner', avatar: null },
      { id: OTHER_UUID, nickname: 'Member', avatar: null },
    ]);
  });

  describe('create', () => {
    it('should create circle with owner membership', async () => {
      prisma.circle.findFirst.mockResolvedValueOnce(null); // unique inviteCode check
      prisma.circle.create.mockResolvedValue(mockCircle);
      prisma.circleMember.create.mockResolvedValue(ownerShip);

      const result = await service.create(DEFAULT_UUID, { name: '测试圈子', description: '这是一个测试圈子' });
      expect(result).toHaveProperty('name', '测试圈子');
      expect(result).toHaveProperty('myRole', 'OWNER');
      expect(result).toHaveProperty('memberCount', 2);
    });

    it('should throw for non-existent user', async () => {
      prisma.user.findFirst.mockResolvedValueOnce(null);
      await expect(service.create('bad-id', { name: 'Test' })).rejects.toThrow(BusinessException);
    });
  });

  describe('findMyCircles', () => {
    it('should return circles where user is member', async () => {
      prisma.circleMember.findMany.mockResolvedValueOnce([{ circleId: 'circle-1', role: 'OWNER' }]);
      prisma.circle.findMany.mockResolvedValue([mockCircle]);

      const result = await service.findMyCircles(DEFAULT_UUID);
      expect(result).toHaveLength(1);
    });

    it('should return empty array', async () => {
      prisma.circleMember.findMany.mockResolvedValueOnce([]);
      const result = await service.findMyCircles(DEFAULT_UUID);
      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return circle detail for member', async () => {
      prisma.circleMember.findFirst.mockResolvedValueOnce(ownerShip);
      prisma.circle.findFirst.mockResolvedValue(mockCircle);

      const result = await service.findById(DEFAULT_UUID, 'circle-1');
      expect(result).toHaveProperty('name', '测试圈子');
      expect(result.members).toHaveLength(2);
    });

    it('should throw ForbiddenException for non-member', async () => {
      prisma.circleMember.findFirst.mockResolvedValue(null);
      await expect(service.findById('stranger', 'circle-1')).rejects.toThrow(BusinessException);
    });
  });

  describe('update', () => {
    it('should update circle when owner', async () => {
      prisma.circleMember.findFirst.mockResolvedValueOnce(ownerShip);
      prisma.circle.findFirst.mockResolvedValue(mockCircle);
      prisma.circle.update.mockResolvedValue({ ...mockCircle, name: '新名称' });
      prisma.circleMember.findMany.mockResolvedValueOnce([ownerShip]); // toResponse needs members

      const result = await service.update(DEFAULT_UUID, 'circle-1', { name: '新名称' });
      expect(result.name).toBe('新名称');
    });

    it('should throw ForbiddenException when not owner', async () => {
      prisma.circleMember.findFirst.mockResolvedValue(null);
      await expect(service.update(OTHER_UUID, 'circle-1', { name: 'X' })).rejects.toThrow(BusinessException);
    });
  });

  describe('invite', () => {
    it('should generate new invite code', async () => {
      prisma.circleMember.findFirst.mockResolvedValue(ownerShip);
      prisma.circle.findFirst.mockResolvedValueOnce(mockCircle); // circle lookup
      prisma.circle.findFirst.mockResolvedValueOnce(null); // unique code check
      prisma.circle.update.mockResolvedValue({ ...mockCircle, inviteCode: 'NEWCODE12' });

      const result = await service.invite(DEFAULT_UUID, 'circle-1');
      expect(result).toHaveProperty('inviteCode');
      expect(result.inviteCode).not.toBe('ABC12345');
    });

    it('should throw ForbiddenException for non-admin', async () => {
      prisma.circleMember.findFirst.mockResolvedValue(null);
      await expect(service.invite(OTHER_UUID, 'circle-1')).rejects.toThrow(BusinessException);
    });
  });

  describe('joinByCode', () => {
    it('should join with valid code', async () => {
      prisma.circle.findFirst.mockResolvedValue(mockCircle);
      prisma.circleMember.findFirst.mockResolvedValue(null);
      prisma.circleMember.create.mockResolvedValue(memberEntry);

      const result = await service.joinByCode(OTHER_UUID, 'ABC12345');
      expect(result).toHaveProperty('name', '测试圈子');
    });

    it('should throw NotFoundException for bad code', async () => {
      prisma.circle.findFirst.mockResolvedValue(null);
      await expect(service.joinByCode(OTHER_UUID, 'WRONG')).rejects.toThrow(BusinessException);
    });

    it('should throw ConflictException for duplicate', async () => {
      prisma.circle.findFirst.mockResolvedValue(mockCircle);
      prisma.circleMember.findFirst.mockResolvedValue(memberEntry);
      await expect(service.joinByCode(OTHER_UUID, 'ABC12345')).rejects.toThrow(BusinessException);
    });

    it('should throw ForbiddenException for archived circle', async () => {
      prisma.circle.findFirst.mockResolvedValue({ ...mockCircle, status: 'archived' });
      prisma.circleMember.findFirst.mockResolvedValue(null);
      await expect(service.joinByCode(OTHER_UUID, 'ABC12345')).rejects.toThrow(BusinessException);
    });
  });

  describe('removeMember', () => {
    it('should remove member when owner', async () => {
      prisma.circleMember.findFirst.mockResolvedValueOnce(ownerShip);
      prisma.circleMember.findFirst.mockResolvedValueOnce(memberEntry);

      await service.removeMember(DEFAULT_UUID, 'circle-1', 'mem-2');
      expect(prisma.circleMember.update).toHaveBeenCalled();
    });

    it('should throw when removing owner', async () => {
      prisma.circleMember.findFirst.mockResolvedValueOnce(ownerShip);
      prisma.circleMember.findFirst.mockResolvedValueOnce(ownerShip);

      await expect(service.removeMember(DEFAULT_UUID, 'circle-1', 'mem-1')).rejects.toThrow(BusinessException);
    });

    it('should throw when removing self', async () => {
      prisma.circleMember.findFirst.mockResolvedValueOnce(ownerShip);
      prisma.circleMember.findFirst.mockResolvedValueOnce(ownerShip);

      await expect(service.removeMember(DEFAULT_UUID, 'circle-1', 'mem-1')).rejects.toThrow('不能移除自己');
    });
  });

  describe('softDelete', () => {
    it('should delete circle and members', async () => {
      prisma.circleMember.findFirst.mockResolvedValue(ownerShip);
      prisma.circle.findFirst.mockResolvedValue(mockCircle);

      await service.softDelete(DEFAULT_UUID, 'circle-1');
      expect((prisma.client.$transaction as jest.Mock)).toHaveBeenCalled();
    });
  });
});
