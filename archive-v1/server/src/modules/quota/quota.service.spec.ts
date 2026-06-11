import { Test, TestingModule } from '@nestjs/testing';
import { QuotaService } from './quota.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { Prisma } from '@prisma/client';
import { mockPrisma, mockTransaction } from '../../../test/helpers/prisma-mock';

describe('QuotaService', () => {
  let service: QuotaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotaService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<QuotaService>(QuotaService);
    jest.clearAllMocks();
  });

  describe('deductInTx', () => {
    const userId = 'user-1';
    const mockQuota = (monthly: number, permanent: number, version = 1) => ({
      id: 'quota-1',
      userId,
      monthlyPoints: monthly,
      permanentPoints: permanent,
      monthlyExpireAt: null,
      version,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    it('场景 A: 余额充足，优先扣减当月积分', async () => {
      const tx = mockTransaction();
      tx.quota.findUnique.mockResolvedValue(mockQuota(10, 50));

      await service.deductInTx(tx as never, userId, 5, 'block-1');

      expect(tx.quota.update).toHaveBeenCalledWith({
        where: { id: 'quota-1', version: 1 },
        data: {
          monthlyPoints: 5,
          permanentPoints: 50,
          version: { increment: 1 },
        },
      });

      expect(tx.quotaTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          amount: -5,
          balanceAfter: 55,
          relatedBlockId: 'block-1',
        }),
      });
    });

    it('场景 B: 混合扣减 (当月不够，扣永久积分)', async () => {
      const tx = mockTransaction();
      tx.quota.findUnique.mockResolvedValue(mockQuota(3, 50));

      await service.deductInTx(tx as never, userId, 10);

      expect(tx.quota.update).toHaveBeenCalledWith({
        where: { id: 'quota-1', version: 1 },
        data: {
          monthlyPoints: 0,
          permanentPoints: 43,
          version: { increment: 1 },
        },
      });
    });

    it('场景 C: 余额不足，抛出 QUOTA_EXCEEDED (40201)', async () => {
      const tx = mockTransaction();
      tx.quota.findUnique.mockResolvedValue(mockQuota(2, 5));

      await expect(
        service.deductInTx(tx as never, userId, 10),
      ).rejects.toThrow(BusinessException);

      try {
        await service.deductInTx(tx as never, userId, 10);
      } catch (e) {
        expect(e).toBeInstanceOf(BusinessException);
        expect((e as BusinessException).businessCode).toBe(40201);
      }

      expect(tx.quota.update).not.toHaveBeenCalled();
    });

    it('场景 D: 乐观锁冲突 (并发扣费)，捕获 P2025 并抛出 CONCURRENT_MODIFICATION (40901)', async () => {
      const tx = mockTransaction();
      tx.quota.findUnique.mockResolvedValue(mockQuota(10, 50));

      const p2025Error = new Prisma.PrismaClientKnownRequestError(
        'Record to update not found',
        { code: 'P2025', clientVersion: '5.0.0' },
      );
      tx.quota.update.mockRejectedValue(p2025Error);

      await expect(
        service.deductInTx(tx as never, userId, 5),
      ).rejects.toThrow(BusinessException);

      try {
        await service.deductInTx(tx as never, userId, 5);
      } catch (e) {
        expect(e).toBeInstanceOf(BusinessException);
        expect((e as BusinessException).businessCode).toBe(40901);
        expect((e as BusinessException).message).toContain('操作冲突');
      }
    });
  });
});
