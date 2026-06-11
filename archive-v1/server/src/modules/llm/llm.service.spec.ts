import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LlmService } from './llm.service';
import { PrismaService } from '../../prisma/prisma.service';
import { QuotaService } from '../quota/quota.service';

const userId = '11111111-1111-1111-1111-111111111111';

describe('LlmService', () => {
  let service: LlmService;

  const client = {};
  const prismaMock = {
    client,
    $transaction: jest.fn((fn: (tx: any) => any) => fn(client)),
  };
  const quotaMock = {
    getBalance: jest.fn(),
    deductInTx: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LlmService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: QuotaService, useValue: quotaMock },
        {
          provide: ConfigService,
          useValue: { get: jest.fn((key: string) => key === 'minimax.apiKey' ? 'test-key' : undefined) },
        },
      ],
    }).compile();
    service = module.get<LlmService>(LlmService);
  });

  describe('chatSync', () => {
    it('点数不足时抛 40201', async () => {
      quotaMock.getBalance.mockResolvedValue({ permanentPoints: 0, monthlyPoints: 0, monthlyExpireAt: null });
      await expect(
        service.chatSync({ messages: [{ role: 'user', content: 'hi' }] }, userId),
      ).rejects.toMatchObject({ businessCode: 40201 });
    });

    it('MiniMax 未配置时抛 50001', async () => {
      quotaMock.getBalance.mockResolvedValue({ permanentPoints: 100, monthlyPoints: 0, monthlyExpireAt: null });
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          LlmService,
          { provide: PrismaService, useValue: prismaMock },
          { provide: QuotaService, useValue: quotaMock },
          { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(undefined) } },
        ],
      }).compile();
      const svc = module.get<LlmService>(LlmService);
      await expect(
        svc.chatSync({ messages: [{ role: 'user', content: 'hi' }] }, userId),
      ).rejects.toMatchObject({ businessCode: 50001 });
    });
  });

  describe('chat (Observable)', () => {
    it('点数不足时 Observable error 40201', (done) => {
      quotaMock.getBalance.mockResolvedValue({ permanentPoints: 0, monthlyPoints: 0, monthlyExpireAt: null });
      const obs = service.chat({ messages: [{ role: 'user', content: 'hi' }] }, userId);
      obs.subscribe({
        error: (err) => {
          expect(err.businessCode).toBe(40201);
          done();
        },
        complete: () => done(new Error('should not complete')),
      });
    });
  });
});
