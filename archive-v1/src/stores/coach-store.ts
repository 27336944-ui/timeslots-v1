import { observable } from 'mobx-miniprogram';
import { api } from '../services/api';

export interface CoachCardView {
  id: string;
  weekStart: string;
  type: 'weekly' | 'daily';
  insights: Record<string, unknown>;
  metrics: CoachMetrics | null;
  createdAt: string;
  feedbacks: CoachFeedbackView[];
}

export interface CoachFeedbackView {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface CoachMetrics {
  fragmentation: { count: number; severity: string };
  deviation: { rate: number; isSignificant: boolean };
  focus: { ratio: number; isHealthy: boolean; totalWorkMinutes: number; focusedMinutes: number };
}

export const coachStore = observable({
  cards: [] as CoachCardView[],
  loading: false,
  error: null as string | null,

  async fetchCards() {
    this.loading = true;
    this.error = null;
    try {
      this.cards = await api.get<CoachCardView[]>('/coach/cards');
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Unknown error';
      this.cards = [];
    } finally {
      this.loading = false;
    }
  },

  async generateCard(startDate?: string, endDate?: string): Promise<CoachCardView | null> {
    try {
      const card = await api.post<CoachCardView>('/coach/cards/generate', { startDate, endDate });
      await this.fetchCards();
      return card;
    } catch {
      return null;
    }
  },

  async submitFeedback(cardId: string, rating: number, comment?: string): Promise<CoachFeedbackView | null> {
    try {
      const fb = await api.post<CoachFeedbackView>(`/coach/cards/${cardId}/feedback`, { rating, comment });
      const card = this.cards.find((c) => c.id === cardId);
      if (card) {
        card.feedbacks.unshift(fb);
      }
      return fb;
    } catch {
      return null;
    }
  },
});
