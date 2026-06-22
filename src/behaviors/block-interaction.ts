import { blockStore } from '../stores/blockStore';
import { taskStore } from '../stores/taskStore';
import { todayStr } from '../utils/date';
import { errorMsg } from '../utils/error';
import { DURATION_OPTIONS } from '../utils/config';
import { groupByHour, autoExpandHours, getCompactGroups } from '../utils/block-grouper';
import { resizeBlockData, resizeBlockMethods } from './resize-block';
import { swipeBlockData, swipeBlockMethods } from './swipe-block';
import { longpressBlockData, longpressBlockMethods } from './longpress-block';
import type { BlockDisplay } from '../types/block';

export type { BlockDisplay } from '../types/block';

export const blockInteractionData = {
  hourGroups: [] as { hour: number; label: string; blocks: BlockDisplay[] }[],
  expandedHours: {} as Record<number, boolean>,
  hasBlocks: false,
  showAllHours: false,
  showSearch: false,
  searchKeyword: '',
  overviewInfo: { blockCount: 0, totalMinutes: 0, freeMinutes: 0, overdue: 0, totalHoursStr: '', freeHoursStr: '' },
  showQuickCreate: false,
  qcTitle: '',
  qcStartTime: '',
  qcDuration: '1h',
  qcDurationIndex: 1,
  qcDurationLabel: '1 小时',
  qcDate: '',
  qcSaving: false,
  qcDurationOptions: DURATION_OPTIONS,
  natureCounts: {} as Record<string, number>,
  activeNature: '',
  showRelationPanel: false,
  ...resizeBlockData,
  ...swipeBlockData,
  ...longpressBlockData,
};

export const blockInteractionMethods = {
  setQuickCreateDefaults(this: WechatMiniprogram.Page.TrivialInstance, defaultDuration: string, idx: number) {
    this.setData({
      qcDuration: defaultDuration,
      qcDurationIndex: idx >= 0 ? idx : 1,
      qcDurationLabel: idx >= 0 ? DURATION_OPTIONS[idx].label : '1 小时',
    });
  },

  refreshGroups(this: WechatMiniprogram.Page.TrivialInstance) {
    const kw = this.data.searchKeyword.toLowerCase();
    const currentDate = this.data.viewMode === 'week' ? this.data.selectedDay : this.data.dateStr;
    const data: Record<string, unknown> = this.data as Record<string, unknown>;
    const source = this.data.viewMode === 'day'
      ? blockStore.blocks
      : ((data._weekBlocks as Record<string, BlockDisplay[]>) || {})[currentDate] || [];

    const natureCounts: Record<string, number> = {};
    for (const b of source) {
      const n = b.nature || 'PUBLIC';
      natureCounts[n] = (natureCounts[n] || 0) + 1;
    }

    let filtered = kw
      ? source.filter((b) =>
          [b.title, b.description || '', b.location || ''].some((f) => f.toLowerCase().includes(kw)),
        )
      : source;

    if (this.data.currentCategory && this.data.currentCategory !== 'all') {
      filtered = filtered.filter((b) => b.category === this.data.currentCategory);
    }

    if (this.data.activeNature) {
      filtered = filtered.filter((b) => b.nature === this.data.activeNature);
    }

    const allGroups = groupByHour(filtered as BlockDisplay[], currentDate, this.data.dayStartHour);
    const groups = this.data.showAllHours ? allGroups : getCompactGroups(allGroups);
    const expanded = autoExpandHours(groups);
    const hasBlocks = groups.some((g) => g.blocks.length > 0);
    this.setData({ hourGroups: groups, expandedHours: expanded, hasBlocks, natureCounts });
    this.updateOverview();
  },

  updateOverview(this: WechatMiniprogram.Page.TrivialInstance) {
    const data: Record<string, unknown> = this.data as Record<string, unknown>;
    const source = this.data.viewMode === 'week'
      ? ((data._weekBlocks as Record<string, BlockDisplay[]>) || {})[this.data.selectedDay] || []
      : blockStore.blocks;
    let totalMinutes = 0;
    for (const b of source) {
      const start = new Date(b.startTime);
      const end = new Date(b.endTime);
      totalMinutes += (end.getTime() - start.getTime()) / 60000;
    }
    const dayMinutes = 24 * 60;
    const isToday = (this.data.dateStr === todayStr() || this.data.selectedDay === todayStr());
    const overdue = isToday ? (taskStore.stats?.overdue || 0) : 0;
    const totalMin = Math.round(totalMinutes);
    const freeMin = Math.max(0, Math.round(dayMinutes - totalMinutes));
    const fmtMinutes = (mins: number): string => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      if (h > 0 && m > 0) return `${h}h${m}min`;
      if (h > 0) return `${h}h`;
      return `${m}min`;
    };
    this.setData({
      overviewInfo: {
        blockCount: source.length,
        totalMinutes: totalMin,
        freeMinutes: freeMin,
        overdue,
        totalHoursStr: fmtMinutes(totalMin),
        freeHoursStr: fmtMinutes(freeMin),
      },
    });
  },

  toggleHour(this: WechatMiniprogram.Page.TrivialInstance, e: WechatMiniprogram.TouchEvent) {
    const hour = e.currentTarget.dataset.hour as number;
    const key = `expandedHours[${hour}]`;
    this.setData({ [key]: !this.data.expandedHours[hour] });
  },

  toggleShowAll(this: WechatMiniprogram.Page.TrivialInstance) {
    const showAll = !this.data.showAllHours;
    this.setData({ showAllHours: showAll });
    this.refreshGroups();
  },

  onBlockTap(this: WechatMiniprogram.Page.TrivialInstance, e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    wx.navigateTo({ url: `/pages/schedule/detail/index?id=${id}` });
  },

  onCreateTap(this: WechatMiniprogram.Page.TrivialInstance) {
    const date = this.data.viewMode === 'week' ? this.data.selectedDay : this.data.dateStr;
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(Math.ceil(now.getMinutes() / 30) * 30 % 60).padStart(2, '0');
    this.setData({
      showQuickCreate: true,
      qcDate: date,
      qcTitle: '',
      qcStartTime: `${h}:${m}`,
      qcDurationIndex: 0,
      qcDurationLabel: '1 小时',
    });
  },

  onCreateFull(this: WechatMiniprogram.Page.TrivialInstance) {
    const date = this.data.viewMode === 'week' ? this.data.selectedDay : this.data.dateStr;
    this.setData({ showQuickCreate: false });
    wx.navigateTo({ url: `/pages/schedule/detail/index?date=${date}` });
  },

  onSearchTap(this: WechatMiniprogram.Page.TrivialInstance) {
    this.setData({ showSearch: true, searchKeyword: '' });
  },

  onSearchInput(this: WechatMiniprogram.Page.TrivialInstance, e: WechatMiniprogram.Input) {
    const keyword = e.detail.value.trim().toLowerCase();
    this.setData({ searchKeyword: keyword });
    this.refreshGroups();
  },

  onSearchClose(this: WechatMiniprogram.Page.TrivialInstance) {
    this.setData({ showSearch: false, searchKeyword: '' });
    this.refreshGroups();
  },

  onEmptySlotTap(this: WechatMiniprogram.Page.TrivialInstance, e: WechatMiniprogram.TouchEvent) {
    const hour = e.currentTarget.dataset.hour as number;
    const dateStr = this.data.viewMode === 'week' ? this.data.selectedDay : this.data.dateStr;
    const startH = String(hour).padStart(2, '0');
    wx.navigateTo({ url: `/pages/schedule/detail/index?mode=create&date=${dateStr}&startTime=${startH}:00` });
  },

  onQcTitleInput(this: WechatMiniprogram.Page.TrivialInstance, e: WechatMiniprogram.Input) {
    this.setData({ qcTitle: e.detail.value });
  },

  onQcStartTimeChange(this: WechatMiniprogram.Page.TrivialInstance, e: WechatMiniprogram.CustomEvent) {
    this.setData({ qcStartTime: e.detail.value });
  },

  onQcDurationChange(this: WechatMiniprogram.Page.TrivialInstance, e: WechatMiniprogram.CustomEvent) {
    const idx = parseInt(e.detail.value, 10);
    const opt = DURATION_OPTIONS[idx];
    if (opt) {
      this.setData({ qcDuration: opt.value, qcDurationIndex: idx, qcDurationLabel: opt.label });
    }
  },

  async onQuickCreateSave(this: WechatMiniprogram.Page.TrivialInstance) {
    if (this.data.qcSaving) return;
    const title = this.data.qcTitle.trim();
    if (!title) {
      wx.showToast({ title: '请输入标题', icon: 'none' });
      return;
    }
    this.setData({ qcSaving: true });
    try {
      const { qcDate, qcStartTime, qcDuration } = this.data;
      const minutes = this.durationToMinutes(qcDuration);
      const start = new Date(qcDate + 'T' + qcStartTime + ':00+08:00');
      const end = new Date(start.getTime() + minutes * 60000);
      await blockStore.createBlock({
        title,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        status: 'pending',
        category: 'life',
        recurrence: 'none',
        nature: 'PUBLIC',
      });
      this.setData({ showQuickCreate: false, qcSaving: false });
      wx.showToast({ title: '已记下', icon: 'success', duration: 1000 });
      (this as unknown as { loadToday: () => void }).loadToday();
    } catch (e) {
      this.setData({ qcSaving: false });
      wx.showToast({ title: errorMsg(e) || '创建失败', icon: 'none' });
    }
  },

  onQuickCreateClose(this: WechatMiniprogram.Page.TrivialInstance) {
    this.setData({ showQuickCreate: false });
  },

  onNatureFilter(this: WechatMiniprogram.Page.TrivialInstance, e: WechatMiniprogram.CustomEvent) {
    const nature = e.detail.nature as string;
    this.setData({ activeNature: nature });
    this.refreshGroups();
  },

  onRelationToggle(this: WechatMiniprogram.Page.TrivialInstance) {
    this.setData({ showRelationPanel: true });
  },

  onRelationPanelClose(this: WechatMiniprogram.Page.TrivialInstance) {
    this.setData({ showRelationPanel: false });
  },

  noop() {},

  durationToMinutes(v: string): number {
    return { '30min': 30, '1h': 60, '2h': 120 }[v] ?? 30;
  },

  ...resizeBlockMethods,
  ...swipeBlockMethods,
  ...longpressBlockMethods,

  // Merged handlers override the spread versions to coordinate both behaviors
  onBlockTouchStart(this: WechatMiniprogram.Page.TrivialInstance, e: WechatMiniprogram.TouchEvent) {
    swipeBlockMethods.onBlockTouchStart.call(this, e);
    longpressBlockMethods.onBlockLongPressStart.call(this, e);
  },

  onBlockTouchMove(this: WechatMiniprogram.Page.TrivialInstance, e: WechatMiniprogram.TouchEvent) {
    swipeBlockMethods.onBlockTouchMove.call(this, e);
    longpressBlockMethods.onBlockLongPressMove.call(this, e);
  },

  onBlockTouchEnd(this: WechatMiniprogram.Page.TrivialInstance, e: WechatMiniprogram.TouchEvent) {
    swipeBlockMethods.onBlockTouchEnd.call(this, e);
    longpressBlockMethods.onBlockLongPressEnd.call(this);
  },
};
