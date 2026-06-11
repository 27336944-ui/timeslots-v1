import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { calcFragmentation, calcDeviation, calcFocus } from './algorithms';
import type { BlockInput, FragmentationResult, DeviationResult, FocusResult } from './algorithms';

export interface CoachCardView {
  id: string;
  weekStart: string;
  type: 'weekly' | 'daily';
  insights: Record<string, unknown>;
  metrics: CoachMetricsJson | null;
  createdAt: string;
  feedbacks: CoachFeedbackView[];
}

export interface CoachFeedbackView {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface CoachMetricsJson {
  fragmentation: FragmentationResult;
  deviation: DeviationResult;
  focus: FocusResult;
}

@Injectable()
export class CoachService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly llmService: LlmService,
  ) {}

  async listCards(userId: string): Promise<CoachCardView[]> {
    const cards = await this.prisma.client.coachCard.findMany({
      where: { userId },
      include: {
        feedbacks: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { weekStart: 'desc' },
      take: 20,
    });

    return cards.map(this.toView);
  }

  async getCard(userId: string, id: string): Promise<CoachCardView> {
    const card = await this.prisma.client.coachCard.findFirst({
      where: { id, userId },
      include: {
        feedbacks: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!card) {
      throw new BusinessException(40401, '教练报告不存在');
    }
    return this.toView(card);
  }

  async submitFeedback(
    userId: string,
    cardId: string,
    data: { rating: number; comment?: string },
  ): Promise<CoachFeedbackView> {
    const card = await this.prisma.client.coachCard.findFirst({
      where: { id: cardId, userId },
    });
    if (!card) {
      throw new BusinessException(40401, '教练报告不存在');
    }

    const feedback = await this.prisma.client.coachFeedback.create({
      data: {
        cardId,
        rating: data.rating,
        comment: data.comment,
      },
    });

    return {
      id: feedback.id,
      rating: feedback.rating,
      comment: feedback.comment,
      createdAt: feedback.createdAt.toISOString(),
    };
  }

  async generateWeekly(userId: string): Promise<CoachCardView> {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    const daysSinceMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + 7; // previous week start
    const monday = new Date(now);
    monday.setDate(monday.getDate() - daysSinceMonday);
    monday.setUTCHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 7);

    const blocks = await this.loadBlocks(userId, monday, sunday);
    return this.createCard(userId, blocks, monday, 'weekly');
  }

  async generateDaily(userId: string): Promise<CoachCardView> {
    const now = new Date();
    const start = new Date(now);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const blocks = await this.loadBlocks(userId, start, end);
    return this.createCard(userId, blocks, start, 'daily');
  }

  private async loadBlocks(userId: string, from: Date, to: Date): Promise<BlockInput[]> {
    const rows = await this.prisma.client.timeBlock.findMany({
      where: {
        userId,
        startTime: { gte: from, lt: to },
        isDeleted: false,
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        nature: true,
        actualDurationMinutes: true,
        isBusy: true,
      },
      orderBy: { startTime: 'asc' },
    });

    return rows.map((r) => ({
      id: r.id,
      startTime: r.startTime,
      endTime: r.endTime,
      nature: r.nature,
      actualDurationMinutes: r.actualDurationMinutes,
      isBusy: r.isBusy,
    }));
  }

  private async createCard(
    userId: string,
    blocks: BlockInput[],
    weekStart: Date,
    type: 'weekly' | 'daily',
  ): Promise<CoachCardView> {
    const metrics: CoachMetricsJson = {
      fragmentation: calcFragmentation(blocks),
      deviation: calcDeviation(blocks),
      focus: calcFocus(blocks),
    };

    const insights: Record<string, unknown> = {
      type,
      summary: this.buildSummary(metrics),
    };

    const card = await this.prisma.client.coachCard.upsert({
      where: {
        coach_cards_user_week_uk: { userId, weekStart },
      },
      update: {
        insights: insights as Record<string, unknown>,
        metrics: metrics as unknown as Record<string, unknown>,
      },
      create: {
        userId,
        weekStart,
        insights: insights as Record<string, unknown>,
        metrics: metrics as unknown as Record<string, unknown>,
      },
    });

    return this.toView({
      ...card,
      feedbacks: [],
    });
  }

  private buildSummary(metrics: CoachMetricsJson): string {
    const parts: string[] = [];

    if (metrics.fragmentation.count > 0) {
      parts.push(`日程碎片程度: ${metrics.fragmentation.severity === 'high' ? '较高' : '中等'} (${metrics.fragmentation.count}个间隙)`);
    }

    if (metrics.deviation.isSignificant) {
      parts.push(`计划偏差率: ${Math.round(metrics.deviation.rate * 100)}%, 超出正常范围`);
    }

    if (metrics.focus.totalWorkMinutes > 0) {
      parts.push(`深度专注占比: ${Math.round(metrics.focus.ratio * 100)}%${metrics.focus.isHealthy ? ' ✅ 健康' : ' ⚠️ 偏低'}`);
    }

    if (parts.length === 0) {
      return '本周暂无足够数据生成报告。添加日程后将自动生成分析。';
    }

    return parts.join('；');
  }

  private toView(card: {
    id: string;
    weekStart: Date;
    insights: unknown;
    metrics: unknown;
    createdAt: Date;
    feedbacks: { id: string; rating: number; comment: string | null; createdAt: Date }[];
  }): CoachCardView {
    const type = this.detectType(card.insights);
    return {
      id: card.id,
      weekStart: card.weekStart.toISOString().slice(0, 10),
      type,
      insights: card.insights as Record<string, unknown>,
      metrics: card.metrics as CoachMetricsJson | null,
      createdAt: card.createdAt.toISOString(),
      feedbacks: card.feedbacks.map((f) => ({
        id: f.id,
        rating: f.rating,
        comment: f.comment,
        createdAt: f.createdAt.toISOString(),
      })),
    };
  }

  private detectType(insights: unknown): 'weekly' | 'daily' {
    if (insights && typeof insights === 'object') {
      const t = (insights as Record<string, unknown>).type;
      if (t === 'daily') return 'daily';
    }
    return 'weekly';
  }
}
