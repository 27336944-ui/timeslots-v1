import { getTimeBlockStats } from '../../../services/api';
import { getTaskStats } from '../../../services/api';
import type { TimeBlockStats, TaskStats } from '../../../types/api';
import { formatDate } from '../../../utils/date';
import { errorMsg } from '../../../utils/error';

function getDefaultRange(): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  return { start: formatDate(start), end: formatDate(end) };
}

interface StatsPageData {
  rangeStart: string;
  rangeEnd: string;
  tbStats: TimeBlockStats | null;
  taskStats: TaskStats | null;
  loading: boolean;
  rangeLabel: string;
  categoryLabels: Record<string, string>;
  catBars: Array<{ key: string; label: string; value: number; pct: number }>;
}

interface StatsPageMethods {
  onLoad: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onRangeStartChange: (e: WechatMiniprogram.CustomEvent) => void;
  onRangeEndChange: (e: WechatMiniprogram.CustomEvent) => void;
}

Page<StatsPageData, StatsPageMethods>({
  data: {
    rangeStart: '',
    rangeEnd: '',
    tbStats: null,
    taskStats: null,
    loading: false,
    rangeLabel: '最近 7 天',
    categoryLabels: { work: '工作', life: '生活', private: '自有' },
    catBars: [],
  },

  async onLoad() {
    const { start, end } = getDefaultRange();
    this.setData({ rangeStart: start, rangeEnd: end, rangeLabel: `${start} ~ ${end}` });
    await this.onRefresh();
  },

  async onRefresh() {
    this.setData({ loading: true });
    try {
      const { rangeStart, rangeEnd } = this.data;
      const [tbStats, taskStats] = await Promise.all([
        getTimeBlockStats(rangeStart, rangeEnd),
        getTaskStats(),
      ]);
      const catBars = tbStats.totalHours > 0
        ? Object.entries(tbStats.byCategory).map(([key, value]) => ({
            key,
            label: this.data.categoryLabels[key] || key,
            value,
            pct: (value / tbStats.totalHours) * 100,
          }))
        : [];
      this.setData({ tbStats, taskStats, catBars });
    } catch (e) {
      wx.showToast({ title: errorMsg(e), icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onRangeStartChange(e: WechatMiniprogram.CustomEvent) {
    const val = e.detail.value as string;
    this.setData({ rangeStart: val, rangeLabel: `${val} ~ ${this.data.rangeEnd}` });
  },

  onRangeEndChange(e: WechatMiniprogram.CustomEvent) {
    const val = e.detail.value as string;
    this.setData({ rangeEnd: val, rangeLabel: `${this.data.rangeStart} ~ ${val}` });
  },
});
