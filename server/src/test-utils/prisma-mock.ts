import type { PrismaClient } from '@prisma/client';


type PrismaClientMock = {
  [K in keyof PrismaClient]: PrismaClient[K] extends { findMany: (...args: unknown[]) => unknown }
    ? {
        findMany: ReturnType<typeof jest.fn>;
        findFirst: ReturnType<typeof jest.fn>;
        findUnique: ReturnType<typeof jest.fn>;
        findFirstOrThrow: ReturnType<typeof jest.fn>;
        findUniqueOrThrow: ReturnType<typeof jest.fn>;
        count: ReturnType<typeof jest.fn>;
        aggregate: ReturnType<typeof jest.fn>;
        create: ReturnType<typeof jest.fn>;
        update: ReturnType<typeof jest.fn>;
        updateMany: ReturnType<typeof jest.fn>;
        delete: ReturnType<typeof jest.fn>;
        deleteMany: ReturnType<typeof jest.fn>;
        upsert: ReturnType<typeof jest.fn>;
      }
    : PrismaClient[K];
};

type MockTransaction = {
  [K in keyof PrismaClient]: PrismaClient[K] extends { findMany: (...args: unknown[]) => unknown }
    ? {
        findMany: ReturnType<typeof jest.fn>;
        findFirst: ReturnType<typeof jest.fn>;
        findUnique: ReturnType<typeof jest.fn>;
        findFirstOrThrow: ReturnType<typeof jest.fn>;
        findUniqueOrThrow: ReturnType<typeof jest.fn>;
        count: ReturnType<typeof jest.fn>;
        aggregate: ReturnType<typeof jest.fn>;
        create: ReturnType<typeof jest.fn>;
        update: ReturnType<typeof jest.fn>;
        updateMany: ReturnType<typeof jest.fn>;
        delete: ReturnType<typeof jest.fn>;
        deleteMany: ReturnType<typeof jest.fn>;
        upsert: ReturnType<typeof jest.fn>;
      }
    : PrismaClient[K];
};


jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(),
}));


const NOW = new Date('2026-06-11T10:00:00.000Z');

const DEFAULT_UUID = '550e8400-e29b-41d4-a716-446655440000';
const OTHER_UUID = '660e8400-e29b-41d4-a716-446655440001';


function createModelMock(overrides: Record<string, unknown> = {}) {
  return {
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn().mockResolvedValue(null),
    findUnique: jest.fn().mockResolvedValue(null),
    findFirstOrThrow: jest.fn().mockResolvedValue(null),
    findUniqueOrThrow: jest.fn().mockResolvedValue(null),
    count: jest.fn().mockResolvedValue(0),
    aggregate: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    delete: jest.fn().mockResolvedValue({}),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    upsert: jest.fn().mockResolvedValue({}),
    ...overrides,
  };
}


export function createPrismaMock() {
  const user = createModelMock();
  const timeBlock = createModelMock();
  const task = createModelMock();
  const circle = createModelMock();
  const circleMember = createModelMock();
  const reminder = createModelMock();
  const category = createModelMock();
  const step = createModelMock();
  const approvalRequest = createModelMock();
  const approvalRecipient = createModelMock();
  const template = createModelMock();
  const shareRecipient = createModelMock();

  const client = {
    user,
    timeBlock,
    task,
    circle,
    circleMember,
    reminder,
    category,
    step,
    approvalRequest,
    approvalRecipient,
    template,
    shareRecipient,
    $transaction: jest.fn().mockImplementation(
      (arg: unknown) => {
        if (typeof arg === 'function') {
          const tx = createTxMock();
          return Promise.resolve(arg(tx));
        }
        if (Array.isArray(arg)) {
          return Promise.resolve(arg.map(() => ({})));
        }
        return Promise.resolve({});
      },
    ),
  } as unknown as PrismaClientMock;

  return {
    client,
    user,
    timeBlock,
    task,
    circle,
    circleMember,
    reminder,
    category,
    step,
    approvalRequest,
    approvalRecipient,
    template,
    shareRecipient,
    checkConnection: jest.fn().mockResolvedValue(true),
    isConnected: true,
    onModuleInit: jest.fn(),
  };
}


function createTxMock(): MockTransaction {
  return {
    user: createModelMock(),
    timeBlock: createModelMock(),
    task: createModelMock(),
    circle: createModelMock(),
    circleMember: createModelMock(),
    reminder: createModelMock(),
    category: createModelMock(),
    step: createModelMock(),
    approvalRequest: createModelMock(),
    approvalRecipient: createModelMock(),
    template: createModelMock(),
    shareRecipient: createModelMock(),
  } as unknown as MockTransaction;
}


export const MOCK_DATE_STR = '2026-06-11';

export { DEFAULT_UUID, OTHER_UUID, NOW };
