import { AuthService } from './auth.service';
import { createPrismaMock, DEFAULT_UUID } from '../../test-utils/prisma-mock';
import { BusinessException } from '../../common/exceptions/business-exception';


describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new AuthService(
      prisma as unknown as any,
      { sign: jest.fn().mockReturnValue('mock-jwt-token') } as unknown as any,
      { get: jest.fn().mockReturnValue('test-secret') } as unknown as any,
      { initDefaults: jest.fn().mockResolvedValue(undefined) } as unknown as any,
      { initDefaults: jest.fn().mockResolvedValue(undefined) } as unknown as any,
    );
  });

  describe('login', () => {
    it('should return token and user for valid userId', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: DEFAULT_UUID, nickname: 'TestUser', avatar: null,
        isDeleted: false, deletedAt: null,
      });

      const result = await service.login({ userId: DEFAULT_UUID });
      expect(result).toHaveProperty('accessToken', 'mock-jwt-token');
      expect(result.user).toHaveProperty('nickname', 'TestUser');
    });

    it('should throw for invalid userId', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      await expect(service.login({ userId: 'bad-id' })).rejects.toThrow(BusinessException);
    });

    it('should throw ForbiddenException for deleted user', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: DEFAULT_UUID, nickname: 'DeletedUser', avatar: null,
        isDeleted: true, deletedAt: new Date(),
      });
      await expect(service.login({ userId: DEFAULT_UUID })).rejects.toThrow(BusinessException);
    });
  });

  describe('updateProfile', () => {
    it('should update nickname and avatar', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: DEFAULT_UUID, isDeleted: false,
      });
      prisma.user.update.mockResolvedValue({
        id: DEFAULT_UUID, nickname: 'NewName', avatar: 'new-avatar.jpg',
      });

      const result = await service.updateProfile(DEFAULT_UUID, { nickname: 'NewName', avatar: 'new-avatar.jpg' });
      expect(result.nickname).toBe('NewName');
      expect(result.avatar).toBe('new-avatar.jpg');
    });

    it('should throw for non-existent user', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      await expect(service.updateProfile('bad-id', { nickname: 'Test' })).rejects.toThrow(BusinessException);
    });
  });

  describe('deleteAccount', () => {
    it('should soft-delete and return restoreToken', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: DEFAULT_UUID, nickname: 'Test', isDeleted: false });
      prisma.user.update.mockResolvedValue({ id: DEFAULT_UUID, isDeleted: true, restoreToken: 'mock-token' });

      const result = await service.deleteAccount(DEFAULT_UUID);
      expect(result).toHaveProperty('deleted', true);
      expect(result).toHaveProperty('restoreToken');
    });
  });

  describe('restoreAccount', () => {
    it('should restore deleted user with valid token', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: DEFAULT_UUID, nickname: 'Test', isDeleted: true,
        deletedAt: new Date(), restoreToken: 'valid-token',
      });
      const result = await service.restoreAccount({ userId: DEFAULT_UUID, restoreToken: 'valid-token' });
      expect(result).toHaveProperty('accessToken');
    });

    it('should throw for invalid restore token', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: DEFAULT_UUID, nickname: 'Test', isDeleted: true,
        deletedAt: new Date(), restoreToken: 'real-token',
      });
      await expect(service.restoreAccount({ userId: DEFAULT_UUID, restoreToken: 'wrong' })).rejects.toThrow(BusinessException);
    });
  });
});
