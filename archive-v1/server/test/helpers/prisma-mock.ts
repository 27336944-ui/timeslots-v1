/**
 * Prisma Mock 基础设施（用于 Service 单测）。
 *
 * 结构设计：
 * - `client.*` — 模拟 `PrismaService.$extends` 暴露的扩展客户端（带软删拦截）
 * - 顶层 `quota / quotaTransaction / circleMember` — 模拟 `$transaction` 回调内的 `tx.*`（默认客户端）
 * - `$transaction` — 被 `mockTransaction()` 劫持，回调中注入 `tx` mocks
 *
 * 用法：
 * ```typescript
 * const module = await Test.createTestingModule({
 *   providers: [
 *     QuotaService,
 *     { provide: PrismaService, useValue: mockPrisma },
 *   ],
 * }).compile();
 * ```
 */
export const mockPrisma = {
  $transaction: jest.fn(),
  client: {
    circleMember: {
      findUnique: jest.fn(),
    },
  },
};

/**
 * 模拟 Prisma `$transaction` 回调，注入 tx mocks。
 *
 * @returns tx 对象（与回调入参一致）
 */
export interface MockTx {
  quota: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  quotaTransaction: {
    create: jest.Mock;
  };
  timeBlock: {
    create: jest.Mock;
  };
}

export const mockTransaction = (): MockTx => {
  const tx: MockTx = {
    quota: {
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({}),
    },
    quotaTransaction: {
      create: jest.fn().mockResolvedValue({}),
    },
    timeBlock: {
      create: jest.fn().mockResolvedValue({ id: 'event-1' }),
    },
  };
  mockPrisma.$transaction.mockImplementation(
    async (cb: (tx: MockTx) => Promise<unknown>) => cb(tx),
  );
  return tx;
};
