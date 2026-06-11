import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { coachStore } from '../../stores/coach-store';
import type { CoachCardView } from '../../stores/coach-store';

interface CoachDetailPageData {
  card: CoachCardView | null;
  loading: boolean;
  rating: number;
  feedbackComment: string;
}

interface CoachDetailPageMethods {
  onLoad(): void;
  onUnload(): void;
  onTapStar(e: WechatMiniprogram.TouchEvent): void;
  onInputComment(e: WechatMiniprogram.Input): void;
  onSubmitFeedback(): Promise<void>;
  onTapBack(): void;
}

let bindings: ReturnType<typeof createStoreBindings> | null = null;

Page<CoachDetailPageData, CoachDetailPageMethods>({
  data: {
    card: null,
    loading: true,
    rating: 0,
    feedbackComment: '',
  },

  onLoad() {
    bindings = createStoreBindings(this, {
      store: coachStore,
      fields: ['cards', 'loading'],
      actions: [],
    });
  },

  onUnload() {
    bindings?.destroyStoreBindings();
    bindings = null;
  },

  onShow() {
    const card = coachStore.cards[0];
    if (card) {
      this.setData({
        card,
        rating: card.feedbacks[0]?.rating ?? 0,
      });
    }
    this.setData({ loading: false });
  },

  onTapStar(e: WechatMiniprogram.TouchEvent) {
    const val = parseInt(e.currentTarget.dataset.value as string, 10);
    this.setData({ rating: val });
  },

  onInputComment(e: WechatMiniprogram.Input) {
    this.setData({ feedbackComment: e.detail.value });
  },

  async onSubmitFeedback() {
    const card = this.data.card;
    if (!card || this.data.rating < 1) {
      void wx.showToast({ title: '请先评分', icon: 'none' });
      return;
    }
    try {
      const fb = await coachStore.submitFeedback(card.id, this.data.rating, this.data.feedbackComment || undefined);
      if (fb) {
        this.setData({ card: { ...card, feedbacks: [fb, ...card.feedbacks] } });
        void wx.showToast({ title: '反馈已提交', icon: 'success' });
      }
    } catch {
      void wx.showToast({ title: '提交失败', icon: 'none' });
    }
  },

  onTapBack() {
    wx.navigateBack();
  },
});
