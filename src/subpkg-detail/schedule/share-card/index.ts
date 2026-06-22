import { createShareCard, getShareCard, respondToShareCard } from '../../../services/api';
import type { ShareCardRespondItem } from '../../../types/api';
import { logError } from '../../../utils/logError';

interface ShareCardPageData {
  token: string;
  userName: string;
  displayDate: string;
  selectedDate: string;
  shareUrl: string;
  busySlots: Array<{ startTime: string; endTime: string }>;
  freeSlots: Array<{ startTime: string; endTime: string }>;
  busyCount: number;
  freeCount: number;
  generating: boolean;
  responses: ShareCardRespondItem[];
  respondStart: string;
  respondEnd: string;
  respondName: string;
  responding: boolean;
  responded: boolean;
}

interface ShareCardPageMethods {
  onDateChange: (e: WechatMiniprogram.TouchEvent) => void;
  onGenerate: () => void;
  loadSharedCard: (token: string) => void;
  onRespondStartChange: (e: WechatMiniprogram.TouchEvent) => void;
  onRespondEndChange: (e: WechatMiniprogram.TouchEvent) => void;
  onRespondNameInput: (e: WechatMiniprogram.Input) => void;
  onRespond: () => void;
  _formatTime: (iso: string) => string;
}

Page<ShareCardPageData, ShareCardPageMethods>({
  data: {
    token: '',
    userName: '',
    displayDate: '',
    selectedDate: '',
    shareUrl: '',
    busySlots: [],
    freeSlots: [],
    busyCount: 0,
    freeCount: 0,
    generating: false,
    responses: [],
    respondStart: '10:00',
    respondEnd: '11:00',
    respondName: '',
    responding: false,
    responded: false,
  },

  onLoad(query: Record<string, string>) {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    this.setData({ selectedDate: `${y}-${m}-${d}` });

    if (query.token) {
      this.loadSharedCard(query.token);
    }
  },

  onDateChange(e: WechatMiniprogram.TouchEvent) {
    this.setData({ selectedDate: e.detail.value });
  },

  async onGenerate() {
    const date = this.data.selectedDate;
    if (!date) return;
    this.setData({ generating: true });
    try {
      const res = await createShareCard(date);
      this.setData({
        token: res.token,
        userName: res.userName,
        displayDate: date,
        shareUrl: `/pages/schedule/share-card/index?token=${res.token}`,
        busySlots: res.busySlots.map((s) => ({ startTime: this._formatTime(s.start), endTime: this._formatTime(s.end) })),
        freeSlots: res.freeSlots.map((s) => ({ startTime: this._formatTime(s.start), endTime: this._formatTime(s.end) })),
        busyCount: res.busySlots.length,
        freeCount: res.freeSlots.length,
        responses: res.responses || [],
      });
    } catch (e) {
      logError('schedule_shareCard', e);
      wx.showToast({ title: '生成失败', icon: 'none' });
    } finally {
      this.setData({ generating: false });
    }
  },

  async loadSharedCard(token: string) {
    try {
      const res = await getShareCard(token);
      this.setData({
        token: res.token,
        userName: res.userName,
        displayDate: res.date,
        busySlots: res.busySlots.map((s) => ({ startTime: this._formatTime(s.start), endTime: this._formatTime(s.end) })),
        freeSlots: res.freeSlots.map((s) => ({ startTime: this._formatTime(s.start), endTime: this._formatTime(s.end) })),
        busyCount: res.busySlots.length,
        freeCount: res.freeSlots.length,
        responses: res.responses || [],
      });
    } catch (e) {
      logError('schedule_shareCard', e);
      wx.showToast({ title: '卡片不存在或已过期', icon: 'none' });
    }
  },

  onRespondStartChange(e: WechatMiniprogram.TouchEvent) {
    this.setData({ respondStart: e.detail.value });
  },

  onRespondEndChange(e: WechatMiniprogram.TouchEvent) {
    this.setData({ respondEnd: e.detail.value });
  },

  onRespondNameInput(e: WechatMiniprogram.Input) {
    this.setData({ respondName: e.detail.value });
  },

  async onRespond() {
    const { token, respondStart, respondEnd, respondName } = this.data;
    if (!token) return;
    this.setData({ responding: true });
    try {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      const startTime = new Date(`${y}-${m}-${d}T${respondStart}:00+08:00`).toISOString();
      const endTime = new Date(`${y}-${m}-${d}T${respondEnd}:00+08:00`).toISOString();

      await respondToShareCard(token, { startTime, endTime, userName: respondName || undefined });
      this.setData({ responded: true, responding: false });
      wx.showToast({ title: '回应已提交', icon: 'success' });
    } catch (e) {
      logError('schedule_shareCard', e);
      this.setData({ responding: false });
      wx.showToast({ title: '提交失败', icon: 'none' });
    }
  },

  _formatTime(iso: string): string {
    const d = new Date(iso);
    const utcMs = d.getTime() + d.getTimezoneOffset() * 60000;
    const shanghai = new Date(utcMs + 8 * 3600000);
    return `${String(shanghai.getHours()).padStart(2, '0')}:${String(shanghai.getMinutes()).padStart(2, '0')}`;
  },
});
