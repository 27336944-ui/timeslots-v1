
import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { blockStore } from '../../stores/blockStore';
import type { TimeBlock } from '../../types/api';


interface SchedulePageData {
  dateStr: string;
  hourGroups: HourGroup[];
  expandedHours: Record<number, boolean>;
}

interface BlockDisplay extends TimeBlock {
  localStart: string;
  localEnd: string;
  categoryClass: string;
  priorityLabel: string;
}

const CATEGORY_CLASS: Record<string, string> = { work: 'tag-work', life: 'tag-life', private: 'tag-private' };
const PRIORITY_LABEL: Record<string, string> = { high: '高', medium: '中', low: '低' };

interface HourGroup {
  hour: number;
  label: string;
  blocks: BlockDisplay[];
}


function toHourLabel(h: number): string {
  return `${String(h).padStart(2, '0')}:00`;
}


function toLocalTime(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleTimeString('en-CA', { timeZone: 'Asia/Shanghai', hour12: false, hour: '2-digit', minute: '2-digit' });
}


function toLocalHour(isoStr: string): number {
  const d = new Date(isoStr);
  return parseInt(d.toLocaleTimeString('en-CA', { timeZone: 'Asia/Shanghai', hour12: false, hour: '2-digit', minute: '2-digit' }), 10);
}


function groupByHour(blocks: TimeBlock[]): HourGroup[] {
  const groups: HourGroup[] = [];
  for (let h = 0; h < 24; h++) {
    const hourBlocks: BlockDisplay[] = blocks
      .filter((b) => toLocalHour(b.startTime) === h)
      .map((b) => ({
        ...b,
        localStart: toLocalTime(b.startTime),
        localEnd: toLocalTime(b.endTime),
        categoryClass: CATEGORY_CLASS[b.category] || 'tag-life',
        priorityLabel: PRIORITY_LABEL[b.priority] || '中',
      }));
    groups.push({
      hour: h,
      label: toHourLabel(h),
      blocks: hourBlocks,
    });
  }
  return groups;
}


function autoExpandHours(groups: HourGroup[]): Record<number, boolean> {
  const expanded: Record<number, boolean> = {};
  for (const g of groups) {
    if (g.blocks.length > 0) {
      expanded[g.hour] = true;
    }
  }
  return expanded;
}


interface SchedulePageMethods {
  refreshGroups: () => void;
  toggleHour: (e: WechatMiniprogram.TouchEvent) => void;
  prevDay: () => void;
  nextDay: () => void;
  loadToday: () => void;
  showComingSoon: () => void;
  onRefresh: () => Promise<void>;
  onBlockTap: (e: WechatMiniprogram.TouchEvent) => void;
  onCreateTap: () => void;
  storeBindings?: { destroyStoreBindings: () => void };
}

Page<SchedulePageData, SchedulePageMethods>({
  data: {
    dateStr: '',
    hourGroups: [],
    expandedHours: {},
  },

  onLoad() {
    this.storeBindings = createStoreBindings(this, {
      store: blockStore,
      fields: ['blocks', 'loading', 'currentDate', 'error'],
    });
  },

  onShow() {
    this.loadToday();
  },

  onUnload() {
    this.storeBindings!.destroyStoreBindings();
  },

  loadToday() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${day}`;
    this.setData({ dateStr });
    blockStore.fetchByDate(dateStr).then(() => {
      this.refreshGroups();
    });
  },

  refreshGroups() {
    const groups = groupByHour(blockStore.blocks);
    const expanded = autoExpandHours(groups);
    this.setData({ hourGroups: groups, expandedHours: expanded });
  },

  toggleHour(e: WechatMiniprogram.TouchEvent) {
    const hour = e.currentTarget.dataset.hour as number;
    const key = `expandedHours[${hour}]`;
    this.setData({ [key]: !this.data.expandedHours[hour] });
  },

  prevDay() {
    const d = new Date(this.data.dateStr + 'T00:00:00+08:00');
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${day}`;
    this.setData({ dateStr });
    blockStore.fetchByDate(dateStr).then(() => {
      this.refreshGroups();
    });
  },

  nextDay() {
    const d = new Date(this.data.dateStr + 'T00:00:00+08:00');
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${day}`;
    this.setData({ dateStr });
    blockStore.fetchByDate(dateStr).then(() => {
      this.refreshGroups();
    });
  },

  async onRefresh() {
    const ds = this.data.dateStr || (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();
    await blockStore.fetchByDate(ds);
    if (this.data.dateStr) {
      this.refreshGroups();
    }
  },

  onBlockTap(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    wx.navigateTo({ url: `/pages/schedule/detail/index?id=${id}` });
  },

  onCreateTap() {
    const { dateStr } = this.data;
    wx.navigateTo({ url: `/pages/schedule/detail/index?date=${dateStr}` });
  },

  showComingSoon() {
    wx.showToast({ title: '即将上线', icon: 'none' });
  },
});
