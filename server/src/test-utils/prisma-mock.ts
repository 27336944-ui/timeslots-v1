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
const THIRD_UUID = '770e8400-e29b-41d4-a716-446655440002';


function createModelMock(overrides: Record<string, unknown> = {}) {
  return {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findFirstOrThrow: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    upsert: jest.fn(),
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

  const client = {
    user,
    timeBlock,
    task,
    circle,
    circleMember,
    reminder,
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
  } as unknown as MockTransaction;
}


export const MOCK_DATE_STR = '2026-06-11';
export const MOCK_DATETIME_STR = '2026-06-11T08:00:00.000Z';

export { DEFAULT_UUID, OTHER_UUID, THIRD_UUID, NOW };
