import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../../prisma/prisma.service';
import { QuotaService } from '../quota/quota.service';

const userId = '11111111-1111-1111-1111-111111111111';

describe('UserService', () => {
  let service: UserService;

  const mockTx = {
    timeBlock: { updateMany: jest.fn() },
    task: { updateMany: jest.fn() },
    taskGroup: { updateMany: jest.fn() },
    comment: { updateMany: jest.fn() },
    circle: { updateMany: jest.fn() },
    coachCard: { updateMany: jest.fn() },
    quotaTransaction: { updateMany: jest.fn() },
    quota: { updateMany: jest.fn() },
    user: { updateMany: jest.fn() },
  };

  const client = {
    user: { findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() },
  };
  const prismaMock = {
    client,
    $transaction: jest.fn((cb: (tx: any) => any) => cb(mockTx)),
  };
  const quotaMock = {
    getBalance: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: QuotaService, useValue: quotaMock },
      ],
    }).compile();
    service = module.get<UserService>(UserService);
  });

  describe('getProfile', () => {
    it('应返回用户信息与额度', async () => {
      client.user.findUnique.mockResolvedValue({ id: userId, nickname: '张三' });
      quotaMock.getBalance.mockResolvedValue({ permanentPoints: 500, monthlyPoints: 30, monthlyExpireAt: new Date('2026-07-01').toISOString() });
      const result = await service.getProfile(userId);
      expect(result.profile.nickname).toBe('张三');
      expect(result.quota.permanent).toBe(500);
      expect(result.quota.monthly).toBe(30);
      expect(result.quota.expiresLabel).toContain('7月');
    });

    it('用户不存在时抛 40401', async () => {
      client.user.findUnique.mockResolvedValue(null);
      await expect(service.getProfile(userId)).rejects.toMatchObject({ businessCode: 40401 });
    });
  });

  describe('updateProfile', () => {
    it('应更新并返回新 profile', async () => {
      client.user.findUnique.mockResolvedValue({ id: userId, nickname: '新昵称' });
      quotaMock.getBalance.mockResolvedValue({ permanentPoints: 500, monthlyPoints: 30, monthlyExpireAt: null });
      client.user.update.mockResolvedValue({});
      const result = await service.updateProfile(userId, { nickname: '新昵称' });
      expect(client.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: userId }, data: { nickname: '新昵称' } }),
      );
      expect(result.profile.nickname).toBe('新昵称');
    });
  });

  describe('requestDelete', () => {
    it('将 ACTIVE 用户置为 PENDING_DELETE', async () => {
      client.user.findUnique.mockResolvedValue({ id: userId, status: 'ACTIVE' });
      await service.requestDelete(userId);
      expect(client.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: expect.objectContaining({ status: 'PENDING_DELETE', deletedAt: expect.any(Date) }),
      });
    });

    it('PENDING_DELETE 时抛 40901', async () => {
      client.user.findUnique.mockResolvedValue({ id: userId, status: 'PENDING_DELETE' });
      await expect(service.requestDelete(userId)).rejects.toMatchObject({ businessCode: 40901 });
    });

    it('DELETED 时抛 40401', async () => {
      client.user.findUnique.mockResolvedValue({ id: userId, status: 'DELETED' });
      await expect(service.requestDelete(userId)).rejects.toMatchObject({ businessCode: 40401 });
    });
  });

  describe('restoreAccount', () => {
    it('将 PENDING_DELETE 用户恢复为 ACTIVE', async () => {
      client.user.findUnique.mockResolvedValue({ id: userId, status: 'PENDING_DELETE' });
      await service.restoreAccount(userId);
      expect(client.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { status: 'ACTIVE', deletedAt: null },
      });
    });

    it('非 PENDING_DELETE 时抛 40001', async () => {
      client.user.findUnique.mockResolvedValue({ id: userId, status: 'ACTIVE' });
      await expect(service.restoreAccount(userId)).rejects.toMatchObject({ businessCode: 40001 });
    });
  });

  describe('hardDeleteExpired', () => {
    it('软删除过期 PENDING_DELETE 用户及其关联数据', async () => {
      client.user.findMany.mockResolvedValue([{ id: userId }]);
      const count = await service.hardDeleteExpired();
      expect(count).toBe(1);
      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(mockTx.user.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'DELETED', isDeleted: true }) }),
      );
    });

    it('无过期用户时返回 0', async () => {
      client.user.findMany.mockResolvedValue([]);
      const count = await service.hardDeleteExpired();
      expect(count).toBe(0);
    });
  });
});
