import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { blockStore } from '../../stores/block-store';
import type { MyTimeBlock } from '../../types/block';

interface HourSlot {
  hour: number;
  label: string;
  blocks: HourBlockItem[];
}

interface HourBlockItem {
  id: string;
  title: string;
  timeRange: string;
  timeRangeShort: string;
  nature: string;
  startHour: number;
  startMinute: number;
}

interface SchedulePageData {
  dateLabel: string;
  currentView: 'day' | 'week' | 'month';
  viewOptions: { key: string; label: string; variant: string }[];
  hours: HourSlot[];
  items: MyTimeBlock[];
  loading: boolean;
}

interface SchedulePageMethods {
  onLoad(): void;
  onShow(): void;
  onPullDownRefresh(): void;
  onTapView(e: WechatMiniprogram.TouchEvent): void;
  onTapAdd(): void;
  onTapBlock(e: WechatMiniprogram.TouchEvent): void;
  loadBlocks(): Promise<void>;
  bucketize(blocks: MyTimeBlock[]): HourSlot[];
}

const viewOptions: SchedulePageData['viewOptions'] = [
  { key: 'day', label: '日', variant: 'default' },
  { key: 'week', label: '周', variant: 'default' },
  { key: 'month', label: '月', variant: 'default' },
];

const fmtTime = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const natureClass = (nature: string): string => {
  const m: Record<string, string> = { PUBLIC: 'work', PRIVATE: 'private', CIRCLE_ONLY: 'circle' };
  return m[nature] ?? 'private';
};

let bindings: ReturnType<typeof createStoreBindings> | null = null;

Page<SchedulePageData, SchedulePageMethods>({
  data: {
    dateLabel: '',
    currentView: 'day',
    viewOptions,
    hours: [],
    items: [],
    loading: false,
  },

  onLoad() {
    const now = new Date();
    const dateLabel = `${now.getMonth() + 1}月${now.getDate()}日 · 周${'日一二三四五六'[now.getDay()]}`;
    this.setData({ dateLabel });

    bindings = createStoreBindings(this, {
      store: blockStore,
      fields: ['items', 'loading'],
      actions: [],
    });
  },

  onUnload() {
    bindings?.destroyStoreBindings();
    bindings = null;
  },

  onShow() {
    void this.loadBlocks();
  },

  async onPullDownRefresh() {
    await this.loadBlocks();
    wx.stopPullDownRefresh();
  },

  onTapView(e: WechatMiniprogram.TouchEvent) {
    const key = e.currentTarget.dataset.key as 'day' | 'week' | 'month';
    this.setData({ currentView: key });
  },

  onTapAdd() {
    void wx.showToast({ title: 'AI 录入 (M2)', icon: 'none' });
  },

  onTapBlock(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    void wx.showToast({ title: `Block ${id} (M2)`, icon: 'none' });
  },

  async loadBlocks() {
    try {
      await blockStore.fetchAll();
      this.setData({ hours: this.bucketize(blockStore.items) });
    } catch (err) {
      console.error('loadBlocks failed:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  bucketize(blocks: MyTimeBlock[]): HourSlot[] {
    const out: HourSlot[] = [];
    for (let h = 0; h < 24; h++) {
      const hourBlocks = blocks
        .filter((b) => new Date(b.startTime).getHours() === h)
        .map((b) => ({
          id: b.id,
          title: b.title,
          timeRange: `${fmtTime(b.startTime)} - ${fmtTime(b.endTime)}`,
          timeRangeShort: fmtTime(b.startTime),
          nature: natureClass(b.nature),
          startHour: new Date(b.startTime).getHours(),
          startMinute: new Date(b.startTime).getMinutes(),
        }));
      if (hourBlocks.length > 0) {
        out.push({
          hour: h,
          label: `${h.toString().padStart(2, '0')}:00`,
          blocks: hourBlocks,
        });
      }
    }
    return out;
  },
});
