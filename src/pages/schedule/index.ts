
import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { blockStore } from '../../stores/blockStore';
import { taskStore } from '../../stores/taskStore';
import { authStore } from '../../stores/authStore';
import { getSettings } from '../../services/api';
import type { TimeBlock } from '../../types/api';


interface SchedulePageData {
  dateStr: string;
  hourGroups: HourGroup[];
  expandedHours: Record<number, boolean>;
  hasBlocks: boolean;
  navigating: boolean;
  dayStartHour: number;
  showAllHours: boolean;
  showSearch: boolean;
  searchKeyword: string;
  viewMode: 'day' | 'week' | 'month';
  selectedDay: string;
  currentWeekStart: string;
  weekDays: WeekDayInfo[];
  swipeOffset: Record<string, number>;
  overviewInfo: OverviewInfo;
  monthDays: MonthDayInfo[];
  currentMonthStr: string;
}

interface WeekDayInfo {
  dateStr: string;
  dayLabel: string;
  dateNum: number;
  isToday: boolean;
}

interface BlockDisplay extends TimeBlock {
  localStart: string;
  localEnd: string;
  categoryClass: string;
  priorityLabel: string;
  blockHeight: number;
  isCrossDay?: boolean;
}

interface OverviewInfo {
  blockCount: number;
  totalMinutes: number;
  freeMinutes: number;
  overdue: number;
}

interface MonthDayInfo {
  dateStr: string;
  dayNum: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  hasBlocks: boolean;
}

const CATEGORY_CLASS: Record<string, string> = { work: 'tag-work', life: 'tag-life', private: 'tag-private' };
const PRIORITY_LABEL: Record<string, string> = { high: '�?, medium: '�?, low: '�? };
const DAY_LABELS = ['�?, '一', '�?, '�?, '�?, '�?, '�?];

const MIN_CARD_HEIGHT = 60;
const HEIGHT_PER_MINUTE = 1.5;


function calcCardHeight(startTime: string, endTime: string, clampedMinutes?: number): number {
  const minutes = clampedMinutes ?? ((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000);
  return Math.max(MIN_CARD_HEIGHT, Math.round(minutes * HEIGHT_PER_MINUTE));
}

interface ClampedRange {
  startHour: number;
  startMin: number;
  endHour: number;
  endMin: number;
  totalMin: number;
  isCrossDay: boolean;
}

function getClampedRange(block: TimeBlock, dateStr: string): ClampedRange | null {
  const dateStart = new Date(dateStr + 'T00:00:00+08:00');
  const dateEnd = new Date(dateStr + 'T23:59:59+08:00');
  const blockStart = new Date(block.startTime);
  const blockEnd = new Date(block.endTime);
  if (blockEnd <= dateStart || blockStart >= dateEnd) return null;
  const effectiveStart = blockStart < dateStart ? dateStart : blockStart;
  const effectiveEnd = blockEnd > dateEnd ? dateEnd : blockEnd;
  const totalMin = (effectiveEnd.getTime() - effectiveStart.getTime()) / 60000;
  const fmt = (d: Date) => d.toLocaleTimeString('en-CA', { timeZone: 'Asia/Shanghai', hour12: false, hour: '2-digit', minute: '2-digit' });
  const [sh, sm] = fmt(effectiveStart).split(':').map(Number);
  const [eh, em] = fmt(effectiveEnd).split(':').map(Number);
  return { startHour: sh, startMin: sm, endHour: eh, endMin: em, totalMin, isCrossDay: blockStart < dateStart || blockEnd > dateEnd };
}

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


function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}


function groupByHour(blocks: TimeBlock[], dateStr: string, dayStartHour: number): HourGroup[] {
  const groups: HourGroup[] = [];
  for (let h = dayStartHour; h < 24; h++) {
    const hourBlocks: BlockDisplay[] = [];
    for (const b of blocks) {
      const range = getClampedRange(b, dateStr);
      if (!range || range.startHour !== h) continue;
      hourBlocks.push({
        ...b,
        localStart: toLocalTime(b.startTime),
        localEnd: toLocalTime(b.endTime),
        categoryClass: CATEGORY_CLASS[b.category] || 'tag-life',
        priorityLabel: PRIORITY_LABEL[b.priority] || '�?,
        blockHeight: calcCardHeight(b.startTime, b.endTime, range.totalMin),
        isCrossDay: range.isCrossDay,
      });
    }
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


function getCompactGroups(groups: HourGroup[]): HourGroup[] {
  const blockHours = groups.filter((g) => g.blocks.length > 0).map((g) => g.hour);
  if (blockHours.length === 0) return groups.slice(0, 1);
  const minHour = Math.min(...blockHours);
  const maxHour = Math.max(...blockHours);
  const start = Math.max(groups[0]?.hour ?? 0, minHour - 1);
  const end = Math.min(groups[groups.length - 1]?.hour ?? 23, maxHour + 1);
  return groups.filter((g) => g.hour >= start && g.hour <= end);
}


function getMonday(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00+08:00');
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dayN = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dayN}`;
}


function buildWeekDays(weekStart: string): WeekDayInfo[] {
  const today = todayStr();
  const days: WeekDayInfo[] = [];
  const base = new Date(weekStart + 'T00:00:00+08:00');
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayN = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${dayN}`;
    days.push({ dateStr, dayLabel: DAY_LABELS[i], dateNum: d.getDate(), isToday: dateStr === today });
  }
  return days;
}


interface SchedulePageMethods {
  refreshGroups: () => void;
  toggleHour: (e: WechatMiniprogram.TouchEvent) => void;
  toggleShowAll: () => void;
  prevDay: () => void;
  nextDay: () => void;
  loadToday: () => void;
  loadSettings: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onBlockTap: (e: WechatMiniprogram.TouchEvent) => void;
  onBlockTouchStart: (e: WechatMiniprogram.TouchEvent) => void;
  onBlockTouchMove: (e: WechatMiniprogram.TouchEvent) => void;
  onBlockTouchEnd: (e: WechatMiniprogram.TouchEvent) => void;
  onCreateTap: () => void;
  onSearchTap: () => void;
  onSearchInput: (e: WechatMiniprogram.Input) => void;
  onSearchClose: () => void;
  switchView: (e: WechatMiniprogram.TouchEvent) => void;
  prevWeek: () => void;
  nextWeek: () => void;
  onWeekDayTap: (e: WechatMiniprogram.TouchEvent) => void;
  loadWeek: (dateStr: string) => Promise<void>;
  updateOverview: () => void;
  prevMonth: () => void;
  nextMonth: () => void;
  loadMonth: (year: number, month: number) => Promise<void>;
  onMonthDayTap: (e: WechatMiniprogram.TouchEvent) => void;
  storeBindings?: { destroyStoreBindings: () => void };
  authBindings?: { destroyStoreBindings: () => void };
  _longPressTimer?: number;
  _touchStartX?: number;
  _touchStartY?: number;
  _touchBlockId?: string;
  _swipeCleanupTimer?: number;
  _weekBlocks?: Record<string, TimeBlock[]>;
}

Page<SchedulePageData, SchedulePageMethods>({
  data: {
    dateStr: '',
    hourGroups: [],
    expandedHours: {},
    hasBlocks: false,
    navigating: false,
    dayStartHour: 0,
    showAllHours: false,
    showSearch: false,
    searchKeyword: '',
    viewMode: 'day',
    selectedDay: '',
    currentWeekStart: '',
    weekDays: [],
    swipeOffset: {},
    overviewInfo: { blockCount: 0, totalMinutes: 0, freeMinutes: 0, overdue: 0 },
    monthDays: [],
    currentMonthStr: '',
  },

  onLoad() {
    this.storeBindings = createStoreBindings(this, {
      store: blockStore,
      fields: ['blocks', 'loading', 'currentDate', 'error'],
    });
    this.authBindings = createStoreBindings(this, {
      store: authStore,
      fields: ['isLoggedIn'],
    });
    this.loadSettings();
      this._weekBlocks = {};
  },

  onShow() {
    (this as any).setData({ selected: 0 });
    if (authStore.isLoggedIn) {
      const today = todayStr();
      if (blockStore.currentDate !== today || blockStore.blocks.length === 0) {
        this.loadToday();
      }
    }
  },

  onUnload() {
    this.storeBindings!.destroyStoreBindings();
    this.authBindings!.destroyStoreBindings();
  },

  async loadSettings() {
    try {
      const settings = await getSettings();
      const hour = parseInt(settings.dayStartsAt.split(':')[0], 10);
      this.setData({ dayStartHour: isNaN(hour) ? 6 : hour });
    } catch {
      this.setData({ dayStartHour: 6 });
    }
  },

  loadToday() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${day}`;
    this.setData({ dateStr, selectedDay: dateStr });
    taskStore.fetchStats().catch(() => {});
    blockStore.fetchByDate(dateStr).then(() => {
      this.refreshGroups();
    }).catch(() => {});
  },

  refreshGroups() {
    const kw = this.data.searchKeyword.toLowerCase();
    const currentDate = this.data.viewMode === 'week' ? this.data.selectedDay : this.data.dateStr;
    const source = this.data.viewMode === 'day'
      ? blockStore.blocks
      : ((this._weekBlocks || {})[currentDate] || []);
    const filtered = kw
      ? source.filter((b) =>
          [b.title, b.description || '', b.location || ''].some((f) => f.toLowerCase().includes(kw))
        )
      : source;
    const allGroups = groupByHour(filtered, currentDate, this.data.dayStartHour);
    const groups = this.data.showAllHours ? allGroups : getCompactGroups(allGroups);
    const expanded = autoExpandHours(groups);
    const hasBlocks = groups.some((g) => g.blocks.length > 0);
    this.setData({ hourGroups: groups, expandedHours: expanded, hasBlocks });
    this.updateOverview();
  },

  updateOverview() {
    const source = this.data.viewMode === 'week'
      ? ((this._weekBlocks || {})[this.data.selectedDay] || [])
      : blockStore.blocks;
    let totalMinutes = 0;
    for (const b of source) {
      const start = new Date(b.startTime);
      const end = new Date(b.endTime);
      totalMinutes += (end.getTime() - start.getTime()) / 60000;
    }
    const dayMinutes = 24 * 60;
    const isToday = (this.data.dateStr === todayStr() || this.data.selectedDay === todayStr());
    const overdue = isToday ? (taskStore.stats?.overdue ?? 0) : 0;
    this.setData({
      overviewInfo: {
        blockCount: source.length,
        totalMinutes: Math.round(totalMinutes),
        freeMinutes: Math.max(0, Math.round(dayMinutes - totalMinutes)),
        overdue,
      },
    });
  },

  toggleHour(e: WechatMiniprogram.TouchEvent) {
    const hour = e.currentTarget.dataset.hour as number;
    const key = `expandedHours[${hour}]`;
    this.setData({ [key]: !this.data.expandedHours[hour] });
  },

  toggleShowAll() {
    const showAll = !this.data.showAllHours;
    this.setData({ showAllHours: showAll });
    this.refreshGroups();
  },

  prevDay() {
    if (this.data.navigating) return;
    this.setData({ navigating: true });
    const d = new Date(this.data.dateStr + 'T00:00:00+08:00');
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${day}`;
    this.setData({ dateStr });
    blockStore.fetchByDate(dateStr).then(() => {
      this.refreshGroups();
      this.setData({ navigating: false });
    }).catch(() => {
      this.setData({ navigating: false });
    });
  },

  nextDay() {
    if (this.data.navigating) return;
    this.setData({ navigating: true });
    const d = new Date(this.data.dateStr + 'T00:00:00+08:00');
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${day}`;
    this.setData({ dateStr });
    blockStore.fetchByDate(dateStr).then(() => {
      this.refreshGroups();
      this.setData({ navigating: false });
    }).catch(() => {
      this.setData({ navigating: false });
    });
  },

  async onRefresh() {
    if (this.data.viewMode === 'week' && this.data.currentWeekStart) {
      const start = this.data.currentWeekStart;
      const end = this.data.weekDays[6]?.dateStr || start;
      this._weekBlocks = await blockStore.fetchByDateRange(start, end);
      this.refreshGroups();
      return;
    }
    const ds = this.data.dateStr || (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();
    try {
      await blockStore.fetchByDate(ds);
      if (this.data.dateStr) {
        this.refreshGroups();
      }
    } catch {}
  },

  onBlockTap(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    wx.navigateTo({ url: `/pages/schedule/detail/index?id=${id}` });
  },

  onBlockTouchStart(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    this._touchBlockId = id;
    this._touchStartX = e.touches[0].clientX;
    this._touchStartY = e.touches[0].clientY;
    this._longPressTimer = setTimeout(() => {
      this._longPressTimer = undefined;
      if (!this._touchBlockId) return;
      wx.showActionSheet({
        itemList: ['编辑', '删除', '标记完成'],
        success: (res) => {
          const bid = this._touchBlockId || '';
          if (res.tapIndex === 0) {
            wx.navigateTo({ url: `/pages/schedule/detail/index?id=${bid}&mode=edit` });
          } else if (res.tapIndex === 1) {
            wx.showModal({ title: '确认删除', content: '删除后不可恢�?, confirmColor: '#e74c3c', success: (m) => {
              if (m.confirm) {
                blockStore.deleteBlock(bid).then(() => {
                  this.loadToday();
                }).catch(() => {
                  wx.showToast({ title: '删除失败', icon: 'none' });
                });
              }
            }});
          } else if (res.tapIndex === 2) {
            blockStore.updateBlock(bid, { status: 'done' }).then(() => {
              this.loadToday();
            }).catch(() => {
              wx.showToast({ title: '操作失败', icon: 'none' });
            });
          }
        },
      });
    }, 600);
  },

  onBlockTouchMove(e: WechatMiniprogram.TouchEvent) {
    if (this._longPressTimer) {
      const dx = Math.abs(e.touches[0].clientX - (this._touchStartX || 0));
      const dy = Math.abs(e.touches[0].clientY - (this._touchStartY || 0));
      if (dx > 10 || dy > 10) {
        clearTimeout(this._longPressTimer);
        this._longPressTimer = undefined;
      }
    }
    const id = e.currentTarget.dataset.id as string;
    if (!id) return;
    const dx = e.touches[0].clientX - (this._touchStartX || 0);
    const clamped = Math.max(-60, Math.min(0, dx));
    this.setData({ [`swipeOffset.${id}`]: clamped });
  },

  onBlockTouchEnd(e: WechatMiniprogram.TouchEvent) {
    if (this._longPressTimer) {
      clearTimeout(this._longPressTimer);
      this._longPressTimer = undefined;
    }
    const id = this._touchBlockId;
    const sx = this._touchStartX;
    const sy = this._touchStartY;
    this._touchBlockId = undefined;
    this._touchStartX = undefined;
    this._touchStartY = undefined;
    if (id) {
      this.setData({ [`swipeOffset.${id}`]: 0 });
    }
    if (!id || !e.changedTouches[0]) return;
    const dx = Math.abs(e.changedTouches[0].clientX - (sx || 0));
    const dy = Math.abs(e.changedTouches[0].clientY - (sy || 0));
    if (dx > 80 && dy < 30) {
      blockStore.updateBlock(id, { status: 'done' }).then(() => {
        wx.showToast({ title: '标记完成', icon: 'success', duration: 1000 });
        this.loadToday();
      }).catch(() => {
        wx.showToast({ title: '操作失败', icon: 'none' });
      });
    }
  },

  onCreateTap() {
    const date = this.data.viewMode === 'week' ? this.data.selectedDay : this.data.dateStr;
    wx.navigateTo({ url: `/pages/schedule/detail/index?date=${date}` });
  },

  onSearchTap() {
    this.setData({ showSearch: true, searchKeyword: '' });
  },

  onSearchInput(e: WechatMiniprogram.Input) {
    const keyword = e.detail.value.trim().toLowerCase();
    this.setData({ searchKeyword: keyword });
    this.refreshGroups();
  },

  onSearchClose() {
    this.setData({ showSearch: false, searchKeyword: '' });
    this.refreshGroups();
  },

  async switchView(e: WechatMiniprogram.TouchEvent) {
    const mode = e.currentTarget.dataset.mode as 'day' | 'week' | 'month';
    if (mode === this.data.viewMode) return;
    if (mode === 'month') {
      const d = this.data.dateStr ? new Date(this.data.dateStr + 'T00:00:00+08:00') : new Date();
      await this.loadMonth(d.getFullYear(), d.getMonth() + 1);
      return;
    }
    this.setData({ viewMode: mode });
    if (mode === 'week') {
      const ws = getMonday(this.data.dateStr || todayStr());
      await this.loadWeek(ws);
    } else {
      this.refreshGroups();
    }
  },

  async loadWeek(weekStart: string) {
    const weekDays = buildWeekDays(weekStart);
    const end = weekDays[6].dateStr;
    this._weekBlocks = await blockStore.fetchByDateRange(weekStart, end);
    const selectedDay = weekDays.find((d) => d.isToday)?.dateStr || weekStart;
    this.setData({ currentWeekStart: weekStart, weekDays, selectedDay });
    this.refreshGroups();
  },

  prevWeek() {
    if (this.data.navigating) return;
    this.setData({ navigating: true });
    const d = new Date(this.data.currentWeekStart + 'T00:00:00+08:00');
    d.setDate(d.getDate() - 7);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    this.loadWeek(`${y}-${m}-${day}`).then(() => {
      this.setData({ navigating: false });
    }).catch(() => {
      this.setData({ navigating: false });
    });
  },

  nextWeek() {
    if (this.data.navigating) return;
    this.setData({ navigating: true });
    const d = new Date(this.data.currentWeekStart + 'T00:00:00+08:00');
    d.setDate(d.getDate() + 7);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    this.loadWeek(`${y}-${m}-${day}`).then(() => {
      this.setData({ navigating: false });
    }).catch(() => {
      this.setData({ navigating: false });
    });
  },

  onWeekDayTap(e: WechatMiniprogram.TouchEvent) {
    const dateStr = e.currentTarget.dataset.date as string;
    this.setData({ selectedDay: dateStr });
    this.refreshGroups();
  },

  prevMonth() {
    const d = new Date(this.data.currentMonthStr.replace('�?, '/').replace('�?, '/01'));
    d.setMonth(d.getMonth() - 1);
    this.loadMonth(d.getFullYear(), d.getMonth() + 1);
  },

  nextMonth() {
    const d = new Date(this.data.currentMonthStr.replace('�?, '/').replace('�?, '/01'));
    d.setMonth(d.getMonth() + 1);
    this.loadMonth(d.getFullYear(), d.getMonth() + 1);
  },

  async loadMonth(year: number, month: number) {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
    // 周一为起始日：getDay() 周日=0...周六=6 → 转换为 周一=0...周日=6
    const startDow = (firstDay.getDay() + 6) % 7;
    const gridStart = new Date(firstDay);
    gridStart.setDate(gridStart.getDate() - startDow);
    const days: MonthDayInfo[] = [];
    const today = todayStr();
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(d.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayN = String(d.getDate()).padStart(2, '0');
      days.push({
        dateStr: `${y}-${m}-${dayN}`,
        dayNum: d.getDate(),
        isToday: `${y}-${m}-${dayN}` === today,
        isCurrentMonth: d.getMonth() + 1 === month,
        hasBlocks: false,
      });
    }
    const blocksByDate = await blockStore.fetchByDateRange(startDate, endDate);
    for (const day of days) {
      if (day.isCurrentMonth && (blocksByDate[day.dateStr]?.length ?? 0) > 0) {
        day.hasBlocks = true;
      }
    }
    this.setData({ monthDays: days, currentMonthStr: `${year}�?{month}月`, viewMode: 'month' });
  },

  onMonthDayTap(e: WechatMiniprogram.TouchEvent) {
    const dateStr = e.currentTarget.dataset.date as string;
    this.setData({ dateStr, selectedDay: dateStr, viewMode: 'day' });
    blockStore.fetchByDate(dateStr).then(() => {
      this.refreshGroups();
    }).catch(() => {});
  },
});
