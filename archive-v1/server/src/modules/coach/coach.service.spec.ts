import { Test, TestingModule } from '@nestjs/testing';
import { CoachService } from './coach.service';
import { PrismaService } from '../../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';

describe('CoachService', () => {
  let service: CoachService;

  const mockFindManyCards = jest.fn();
  const mockFindFirstCard = jest.fn();
  const mockUpsertCard = jest.fn();
  const mockCreateFeedback = jest.fn();
  const mockFindManyBlocks = jest.fn();
  const mockTransaction = jest.fn((cb: (tx: any) => any) => cb({}));

  const mockPrisma = {
    client: {
      coachCard: {
        findMany: mockFindManyCards,
        findFirst: mockFindFirstCard,
        upsert: mockUpsertCard,
      },
      coachFeedback: {
        create: mockCreateFeedback,
      },
      timeBlock: {
        findMany: mockFindManyBlocks,
      },
    },
    $transaction: mockTransaction,
  } as unknown as PrismaService;

  const mockLlm = { chatSync: jest.fn() } as unknown as LlmService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoachService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: LlmService, useValue: mockLlm },
      ],
    }).compile();

    service = module.get<CoachService>(CoachService);
  });

  describe('listCards', () => {
    it('returns empty array when no cards', async () => {
      mockFindManyCards.mockResolvedValue([]);
      const cards = await service.listCards('u1');
      expect(cards).toEqual([]);
    });
  });

  describe('getCard', () => {
    it('throws 404 when card not found', async () => {
      mockFindFirstCard.mockResolvedValue(null);
      await expect(service.getCard('u1', 'c1')).rejects.toThrow('教练报告不存在');
    });
  });

  describe('submitFeedback', () => {
    it('creates feedback successfully', async () => {
      mockFindFirstCard.mockResolvedValue({ id: 'c1', userId: 'u1' } as any);
      mockCreateFeedback.mockResolvedValue({
        id: 'f1',
        cardId: 'c1',
        rating: 4,
        comment: 'Great',
        createdAt: new Date(),
      } as any);

      const fb = await service.submitFeedback('u1', 'c1', { rating: 4, comment: 'Great' });
      expect(fb.rating).toBe(4);
      expect(fb.comment).toBe('Great');
    });

    it('throws 404 when card not found', async () => {
      mockFindFirstCard.mockResolvedValue(null);
      await expect(service.submitFeedback('u2', 'c1', { rating: 3 })).rejects.toThrow('教练报告不存在');
    });
  });

  describe('generateWeekly', () => {
    it('creates card with metrics from time blocks', async () => {
      const now = new Date('2026-06-08T10:00:00Z');
      jest.useFakeTimers({ now });

      mockFindManyBlocks.mockResolvedValue([
        {
          id: 'b1',
          startTime: new Date('2026-06-01T09:00'),
          endTime: new Date('2026-06-01T10:00'),
          nature: 'PUBLIC',
          actualDurationMinutes: null,
          isBusy: true,
        },
      ]);
      const metrics = {
        fragmentation: { count: 1, severity: 'medium' as const },
        deviation: { rate: 0, isSignificant: false },
        focus: { ratio: 0, isHealthy: false, totalWorkMinutes: 60, focusedMinutes: 0 },
      };
      mockUpsertCard.mockResolvedValue({
        id: 'c1',
        userId: 'u1',
        weekStart: new Date('2026-05-25'),
        insights: { type: 'weekly', summary: '' },
        metrics,
        createdAt: new Date(),
      } as any);

      const card = await service.generateWeekly('u1');
      expect(card.type).toBe('weekly');
      expect(card.metrics?.fragmentation).toEqual({ count: 1, severity: 'medium' });
      jest.useRealTimers();
    });
  });
});
