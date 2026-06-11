import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { userStore } from '../../stores/user-store';
import { authStore } from '../../stores/auth';
import { coachStore } from '../../stores/coach-store';
import type { UserProfile } from '../../types/user';
import type { CoachCardView } from '../../stores/coach-store';

interface CoachCardDisplay {
  id: string;
  type: string;
  focusScore: number;
  summary: string;
  insights: string[];
  userRating: number;
}

interface MinePageData {
  profile: UserProfile['profile'];
  avatarLetter: string;
  quota: UserProfile['quota'];
  settings: { id: string; icon: string; title: string; sub: string }[];
  isLoggedIn: boolean;
  loading: boolean;
  cards: CoachCardView[];
  latestCard: CoachCardDisplay | null;
  rating: number;
}

interface MinePageMethods {
  onLoad(): void;
  onUnload(): void;
  onShow(): void;
  onTapAction(e: WechatMiniprogram.TouchEvent): Promise<void>;
  loadData(): Promise<void>;
  onTapCard(e: WechatMiniprogram.TouchEvent): void;
  onTapGenerate(): void;
  onTapFeedback(e: WechatMiniprogram.TouchEvent): void;
  onInputRating(e: WechatMiniprogram.TouchEvent): void;
}

let userBindings: ReturnType<typeof createStoreBindings> | null = null;
let authBindings: ReturnType<typeof createStoreBindings> | null = null;
let coachBindings: ReturnType<typeof createStoreBindings> | null = null;
let _loadingMine = false;

Page<MinePageData, MinePageMethods>({
  data: {
    profile: { nickname: '加载中...', subtitle: '' },
    avatarLetter: '?',
    quota: { permanent: 0, monthly: 0, expiresLabel: '' },
    settings: [
      { id: 'coach', icon: '\u{1F916}', title: 'AI 效率教练', sub: '周报 / 复盘 / 规划' },
      { id: 'quota', icon: '\u26A1', title: '额度详情', sub: '查看消费记录' },
      { id: 'privacy', icon: '\u{1F512}', title: '隐私与可见性', sub: '默认可见性 / 私有日程' },
      { id: 'account', icon: '\u{1F464}', title: '账号设置', sub: '昵称 / 头像 / 注销' },
      { id: 'delete-account', icon: '\u{1F5D1}\uFE0F', title: '删除账号', sub: '7 天冷静期后可恢复' },
      { id: 'restore-account', icon: '\u21A9\uFE0F', title: '恢复账号', sub: '取消删除申请' },
    ],
    isLoggedIn: false,
    loading: false,
    cards: [],
    latestCard: null,
    rating: 0,
  },

  onLoad() {
    userBindings = createStoreBindings(this, {
      store: userStore,
      fields: ['profile', 'quota', 'loading'],
      actions: [],
    });
    authBindings = createStoreBindings(this, {
      store: authStore,
      fields: ['isLoggedIn'],
      actions: [],
    });
    coachBindings = createStoreBindings(this, {
      store: coachStore,
      fields: ['cards'],
      actions: [],
    });
  },

  onUnload() {
    userBindings?.destroyStoreBindings();
    userBindings = null;
    authBindings?.destroyStoreBindings();
    authBindings = null;
    coachBindings?.destroyStoreBindings();
    coachBindings = null;
  },

  onShow() {
    if (_loadingMine) {
      return;
    }
    _loadingMine = true;
    this.loadData().finally(() => {
      _loadingMine = false;
    });
  },

  async onTapAction(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    if (id === 'coach') {
      void wx.showToast({ title: 'AI 教练 (已集成)', icon: 'none' });
    } else if (id === 'quota') {
      void wx.showToast({ title: '额度详情', icon: 'none' });
    } else if (id === 'privacy') {
      void wx.showToast({ title: '隐私设置 (M2)', icon: 'none' });
    } else if (id === 'account' && this.data.isLoggedIn) {
      authStore.logout();
      userStore.fetchMe();
      this.setData({
        profile: { nickname: '未登录', subtitle: '' },
        avatarLetter: '?',
        quota: { permanent: 0, monthly: 0, expiresLabel: '' },
      });
      void wx.showToast({ title: '已退出', icon: 'success' });
    } else if (id === 'delete-account') {
      const res = await wx.showModal({
        title: '删除账号',
        content: '将进入 7 天冷静期，期间可恢复。确定要删除吗？',
      });
      if (res.confirm) {
        const ok = await userStore.requestDelete();
        void wx.showToast({ title: ok ? '删除已申请，7 天内可恢复' : '操作失败', icon: ok ? 'success' : 'none' });
      }
    } else if (id === 'restore-account') {
      void userStore.restoreAccount().then((ok) => {
        void wx.showToast({ title: ok ? '账号已恢复' : '恢复失败（无待恢复申请）', icon: ok ? 'success' : 'none' });
      });
    } else {
      void wx.showToast({ title: `${id}`, icon: 'none' });
    }
  },

  async loadData() {
    try {
      await userStore.fetchMe();
      this.setData({
        avatarLetter: userStore.profile.nickname.charAt(0).toUpperCase() || '?',
      });
      await coachStore.fetchCards();
      const raw = coachStore.cards[0];
      this.setData({
        latestCard: raw
          ? {
              id: raw.id,
              type: raw.type,
              focusScore: Math.round((raw.metrics?.focus.ratio ?? 0) * 100),
              summary: `碎片 ${raw.metrics?.fragmentation.count ?? 0} 次 · 偏差 ${raw.metrics?.deviation.isSignificant ? '显著' : '正常'}`,
              insights: Object.keys(raw.insights).slice(0, 3),
              userRating: raw.feedbacks[0]?.rating ?? 0,
            }
          : null,
      });
    } catch (err) {
      console.error('loadData failed:', err);
    }
  },

  onTapCard(_e: WechatMiniprogram.TouchEvent) {
    wx.navigateTo({ url: '/pages/coach-detail/index' });
  },

  async onTapGenerate() {
    try {
      const card = await coachStore.generateCard();
      if (card) {
        this.setData({
          latestCard: {
            id: card.id,
            type: card.type,
            focusScore: Math.round((card.metrics?.focus.ratio ?? 0) * 100),
            summary: `碎片 ${card.metrics?.fragmentation.count ?? 0} 次 · 偏差 ${card.metrics?.deviation.isSignificant ? '显著' : '正常'}`,
            insights: Object.keys(card.insights).slice(0, 3),
            userRating: card.feedbacks[0]?.rating ?? 0,
          },
        });
        void wx.showToast({ title: '教练报告已生成', icon: 'success' });
      } else {
        void wx.showToast({ title: '生成失败，请稍后重试', icon: 'none' });
      }
    } catch (err) {
      console.error('onTapGenerate failed:', err);
      void wx.showToast({ title: '生成失败', icon: 'none' });
    }
  },

  async onTapFeedback(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    const rating = parseInt(e.currentTarget.dataset.rating as string, 10);
    if (rating < 1 || rating > 5) {
      return;
    }
    try {
      await coachStore.submitFeedback(id, rating);
      void wx.showToast({ title: `评分 ${rating} 已提交`, icon: 'success' });
    } catch (err) {
      console.error('submitFeedback failed:', err);
      void wx.showToast({ title: '提交失败', icon: 'none' });
    }
  },

  onInputRating(e: WechatMiniprogram.TouchEvent) {
    const val = e.detail.value as string;
    this.setData({ rating: parseInt(val, 10) || 0 });
  },
});
