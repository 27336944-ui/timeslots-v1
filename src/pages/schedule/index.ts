import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { blockStore } from '../../stores/blockStore';
import { authStore } from '../../stores/authStore';
import { taskStore } from '../../stores/taskStore';
import { dayNavData, dayNavMethods } from '../../behaviors/day-nav';
import { blockInteractionData, blockInteractionMethods, BlockDisplay } from '../../behaviors/block-interaction';
import { getMyTasks, getMyBlocksByDate, getGaps, placeFlexible, GapItem } from '../../services/api';
import { todayStr } from '../../utils/date';
import { logError } from '../../utils/logError';


interface GapDisplay {
  idx: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  topRpx: number;
  heightRpx: number;
  label: string;
}

interface SchedulePageData {
  loading: boolean;
  error: string;
  loadError: boolean;
  dateStr: string;
  selectedDay: string;
  currentWeekStart: string;
  weekDays: { dateStr: string; dayLabel: string; dateNum: number; isToday: boolean; lunarStr: string; festival: string | null }[];
  monthDays: { dateStr: string; dayNum: number; isToday: boolean; isCurrentMonth: boolean; lunarStr: string; festival: string | null; blockFillPercent: number; fillLevel: number; fillPercent: number }[];
  currentMonthStr: string;
  monthWeekDays: string[];
  viewMode: 'week' | 'month';
  weekStartsOn: number;
  navigating: boolean;
  dayStartHour: number;
  filterList: { key: string; label: string }[];
  currentCategory: string;
  hourGroups: { hour: number; label: string; blocks: BlockDisplay[] }[];
  expandedHours: Record<number, boolean>;
  hasBlocks: boolean;
  showAllHours: boolean;
  showSearch: boolean;
  searchKeyword: string;
  swipeOffset: Record<string, number>;
  blocksEntered: boolean;
  overviewInfo: { blockCount: number; totalMinutes: number; freeMinutes: number; overdue: number; totalHoursStr: string; freeHoursStr: string };
  resizeHeights: Record<string, number>;
  _isResizing: boolean;
  natureCounts: Record<string, number>;
  activeNature: string;
  showActionSheet: boolean;
  showFloatingHint: boolean;
  nowLineTop: number;
  nowLabel: string;
  showMonthCalendar: boolean;
  _scrollTop: number;
  _touchStartY: number;
  headerDateStr: string;
  flexibleTasks: { id: string; title: string; estimatedDuration: number }[];
  flexibleBlockIds: string[];
  gaps: { startTime: string; endTime: string; durationMinutes: number }[];
  displayGaps: GapDisplay[];
  showTaskPool: boolean;
  draggedTask: { id: string; title: string; duration: number } | null;
  dragY: number;
  dragTargetHour: number;
  dragTargetGapIdx: number;
  dragErrorTaskId: string;
}

interface SchedulePageMethods {
  storeBindings?: { destroyStoreBindings: () => void };
  authBindings?: { destroyStoreBindings: () => void };
  nowTimer?: ReturnType<typeof setInterval>;
  floatingHintTimer?: ReturnType<typeof setTimeout>;

  onLoad(): void;
  onShow(): void;
  onHide(): void;
  onUnload(): void;
  onReachBottom(): void;

  loadToday(): void;
  loadSettings(): Promise<void>;
  prevDay(): void;
  nextDay(): void;
  loadWeek(centerDate: string): Promise<void>;
  prevWeek(): void;
  nextWeek(): void;
  onWeekDayTap(e: WechatMiniprogram.TouchEvent): void;
  prevMonth(): void;
  nextMonth(): void;
  loadMonth(year: number, month: number): Promise<void>;
  onMonthDayTap(e: WechatMiniprogram.TouchEvent): void;
  onTabTap(e: WechatMiniprogram.TouchEvent): void;
  openMonthCalendar(): void;
  dismissMonthCalendar(): void;
  onScroll(e: WechatMiniprogram.ScrollViewScroll): void;
  onTouchStart(e: WechatMiniprogram.TouchEvent): void;
  onTouchMove(e: WechatMiniprogram.TouchEvent): void;
  onTouchEnd(): void;

  setQuickCreateDefaults(defaultDuration: string, idx: number): void;
  refreshGroups(): void;
  updateOverview(): void;
  toggleHour(e: WechatMiniprogram.TouchEvent): void;
  toggleShowAll(): void;
  onBlockTap(e: WechatMiniprogram.TouchEvent): void;
  onBlockTouchStart(e: WechatMiniprogram.TouchEvent): void;
  onBlockTouchMove(e: WechatMiniprogram.TouchEvent): void;
  onBlockTouchEnd(e: WechatMiniprogram.TouchEvent): void;
  onPlusTap(): void;
  onActionSheetClose(): void;
  dismissFloatingHint(): void;
  initFloatingHint(): void;
  onVoiceInput(): void;
  onImageInput(): void;
  onManualInput(): void;
  onAIDecompose(): void;
  onTemplateApply(): void;
  noop(): void;
  onSearchTap(): void;
  onSearchInput(e: WechatMiniprogram.Input): void;
  onSearchClose(): void;
  onEmptySlotTap(e: WechatMiniprogram.TouchEvent): void;
  onCreateSelect(e: WechatMiniprogram.TouchEvent): void;
  onResizeStart(e: WechatMiniprogram.TouchEvent): void;
  onResizeMove(e: WechatMiniprogram.TouchEvent): void;
  onResizeEnd(): void;
  durationToMinutes(v: string): number;
  updateNowLine(): void;
  loadFlexibleTasks: () => Promise<void>;
  loadGaps: () => Promise<void>;
  onDragPoolStart: (e: WechatMiniprogram.TouchEvent) => void;
  onDragPoolMove: (e: WechatMiniprogram.TouchEvent) => void;
  onDragPoolEnd: () => void;
  onPoolTaskTap: (e: WechatMiniprogram.TouchEvent) => void;
  onToggleTaskPool: () => void;
}

Page<SchedulePageData, SchedulePageMethods>({
  data: {
    ...blockInteractionData,
    ...dayNavData,
    loading: false,
    error: '',
    loadError: false,
    showActionSheet: false,
    showFloatingHint: false,
    nowLineTop: -1,
    nowLabel: '',
    filterList: [{ key: 'all', label: '全部' }, { key: 'work', label: '工作' }, { key: 'life', label: '生活' }, { key: 'private', label: '自有' }],
    currentCategory: 'all',
    flexibleTasks: [],
    flexibleBlockIds: [],
    gaps: [],
    displayGaps: [],
    showTaskPool: true,
    draggedTask: null,
    dragY: 0,
    dragTargetHour: -1,
    dragTargetGapIdx: -1,
    dragErrorTaskId: '',
    blocksEntered: false,
  } as SchedulePageData,

  ...dayNavMethods,
  ...blockInteractionMethods,

  // Override day-navigation methods to reload flexible tasks
  loadToday(this: WechatMiniprogram.Page.TrivialInstance) {
    dayNavMethods.loadToday.call(this);
    this.loadFlexibleTasks();
    this.loadGaps();
  },

  prevDay(this: WechatMiniprogram.Page.TrivialInstance) {
    dayNavMethods.prevDay.call(this);
    // dateStr is already updated synchronously in prevDay
    this.loadFlexibleTasks();
    this.loadGaps();
  },

  nextDay(this: WechatMiniprogram.Page.TrivialInstance) {
    dayNavMethods.nextDay.call(this);
    this.loadFlexibleTasks();
    this.loadGaps();
  },

  async loadWeek(this: WechatMiniprogram.Page.TrivialInstance, centerDate: string) {
    await dayNavMethods.loadWeek.call(this, centerDate);
    this.loadFlexibleTasks();
    this.loadGaps();
  },

  onWeekDayTap(this: WechatMiniprogram.Page.TrivialInstance, e: WechatMiniprogram.TouchEvent) {
    // compact-header emits custom event with dateStr in e.detail
    const dateStr = ((e as unknown as { detail?: { dateStr?: string } }).detail?.dateStr) || '';
    if (dateStr) {
      this.loadWeek(dateStr);
    }
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
    (this as unknown as WechatMiniprogram.Page.TrivialInstance)._weekBlocks = {} as Record<string, unknown>;
    this.initFloatingHint();
  },

  initFloatingHint() {
    const key = 'ts_floating_hint_count';
    let count = 0;
    try { count = parseInt(wx.getStorageSync(key) || '0', 10); } catch (e) { logError('schedule_floating_hint', e) }
    if (count < 1) {
      this.floatingHintTimer = setTimeout(() => {
        this.setData({ showFloatingHint: true });
      }, 2000);
    }
  },

  dismissFloatingHint() {
    this.setData({ showFloatingHint: false });
    const key = 'ts_floating_hint_count';
    let count = 0;
    try { count = parseInt(wx.getStorageSync(key) || '0', 10); } catch (e) { logError('schedule_floating_hint', e) }
    wx.setStorageSync(key, String(count + 1));
  },

  onShow() {
    const tabBar = (this as unknown as WechatMiniprogram.Page.TrivialInstance).getTabBar?.();
    if (tabBar) tabBar.setData({ selected: 0 });
    this.updateNowLine();
    this.nowTimer = setInterval(() => this.updateNowLine(), 60000);
    try {
      this.loadToday();
      setTimeout(() => this.setData({ blocksEntered: true }), 400); // after entry animation
    } catch (e) {
      logError('Schedule loadToday', e);
      this.setData({ loadError: true, error: e instanceof Error ? e.message : String(e) });
    }
  },

  onHide() {
    if (this.nowTimer) { clearInterval(this.nowTimer); this.nowTimer = undefined; }
  },

  onReachBottom() {
    if (!authStore.isLoggedIn) return;
    taskStore.loadMoreTasks();
  },

  onUnload() {
    this.storeBindings?.destroyStoreBindings();
    this.authBindings?.destroyStoreBindings();
    if (this.nowTimer) { clearInterval(this.nowTimer); this.nowTimer = undefined; }
    if (this.floatingHintTimer) { clearTimeout(this.floatingHintTimer); this.floatingHintTimer = undefined; }
  },

  onPlusTap() {
    if (!authStore.isLoggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    // 仅"手动"可用时跳过创建面板，直接进入表单
    wx.navigateTo({ url: '/pages/schedule/detail/index?mode=create' });
    // TODO: 当 AI/语音/图片入口可用时，恢复 create-entry-sheet
    // this.setData({ showActionSheet: true });
  },

  onActionSheetClose() {
    this.setData({ showActionSheet: false });
  },

  onVoiceInput() {
    this.setData({ showActionSheet: false });
    wx.showToast({ title: '即将上线，敬请期待', icon: 'none' });
  },

  onImageInput() {
    this.setData({ showActionSheet: false });
    wx.showToast({ title: '即将上线，敬请期待', icon: 'none' });
  },

  onManualInput() {
    this.setData({ showActionSheet: false });
    wx.navigateTo({ url: '/pages/schedule/detail/index?mode=create' });
  },

  onAIDecompose() {
    this.setData({ showActionSheet: false });
    wx.navigateTo({ url: '/pages/tasks/ai-decompose/index' });
  },

  onTemplateApply() {
    this.setData({ showActionSheet: false });
    wx.navigateTo({ url: '/pages/templates/apply/index' });
  },

  onCreateSelect(e: WechatMiniprogram.CustomEvent) {
    const type = e.detail?.type as string;
    this.setData({ showActionSheet: false });
    switch (type) {
      case 'manual':
        wx.navigateTo({ url: '/pages/schedule/detail/index?mode=create' });
        break;
      case 'ai':
        wx.navigateTo({ url: '/pages/tasks/ai-decompose/index' });
        break;
      case 'voice':
        wx.showToast({ title: '功能开发中', icon: 'none' });
        break;
      case 'image':
        wx.showToast({ title: '功能开发中', icon: 'none' });
        break;
      case 'template':
        wx.navigateTo({ url: '/pages/templates/apply/index' });
        break;
      default:
        wx.showToast({ title: '功能开发中', icon: 'none' });
    }
  },

  updateNowLine() {
    const d = new Date();
    const h = d.getHours();
    const m = d.getMinutes();
    const visibleHours = this.data.hourGroups.map((g) => g.hour);
    const idx = visibleHours.indexOf(h);
    if (idx === -1) {
      if (this.data.nowLineTop !== -1) this.setData({ nowLineTop: -1 });
      return;
    }
    const top = idx * 80 + (m / 60) * 80;
    if (top === this.data.nowLineTop) return; // no change — skip setData
    const label = `现在 ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    this.setData({ nowLineTop: top, nowLabel: label });
  },

  onScroll(e: WechatMiniprogram.ScrollViewScroll) {
    this.data._scrollTop = (e as WechatMiniprogram.ScrollViewScroll).detail.scrollTop;
  },

  onTouchStart(e: WechatMiniprogram.TouchEvent) {
    (this as any)._touchStartY = e.touches[0].clientY;
  },

  onTouchMove(e: WechatMiniprogram.TouchEvent) {
    if (this.data.showMonthCalendar) return;
    if ((this as any)._scrollTop !== 0) return;
    const dy = e.touches[0].clientY - (this as any)._touchStartY;
    if (dy > 120) {
      this.openMonthCalendar();
    }
  },

  onTouchEnd() {
  },

  onTabTap(this: WechatMiniprogram.Page.TrivialInstance, e: WechatMiniprogram.TouchEvent) {
    const category = e.currentTarget.dataset.category as string;
    this.setData({ currentCategory: category });
    (this as unknown as WechatMiniprogram.Page.TrivialInstance).refreshGroups();
  },

  async loadFlexibleTasks(this: WechatMiniprogram.Page.TrivialInstance) {
    const dateStr = this.data.dateStr;
    try {
      const [tasks, blocks] = await Promise.all([
        getMyTasks(),
        getMyBlocksByDate(dateStr),
      ]);
      const flexibleBlocks = blocks.filter((b: { source: string | null }) => b.source === 'flexible');
      const placedTaskIds = new Set(flexibleBlocks.map((b: { taskId: string | null }) => b.taskId).filter(Boolean));
      const poolTasks = tasks
        .filter((t: { estimatedDuration: number | null; status: string; id: string; startDate: string | null }) => {
          if (t.estimatedDuration == null || t.status === 'done') return false;
          if (placedTaskIds.has(t.id)) return false;
          if (t.startDate) {
            const taskDate = t.startDate.slice(0, 10);
            if (taskDate !== dateStr) return false;
          }
          return true;
        })
        .map((t: { id: string; title: string; estimatedDuration: number | null }) => ({ id: t.id, title: t.title, estimatedDuration: t.estimatedDuration as number }));
      this.setData({
        flexibleTasks: poolTasks,
        flexibleBlockIds: [...placedTaskIds] as string[],
        showTaskPool: true,
      });
    } catch (e) {
      logError('schedule_loadTasks', e);
      this.setData({ flexibleTasks: [], showTaskPool: true });
    }
  },

  async loadGaps(this: WechatMiniprogram.Page.TrivialInstance) {
    const dateStr = this.data.dateStr;
    const dayStartHour = this.data.dayStartHour;
    try {
      const gaps: GapItem[] = await getGaps(dateStr);
      const displayGaps: GapDisplay[] = gaps.map((g: GapItem, idx: number) => {
        const startDate = new Date(g.startTime);
        const hoursFromStart = startDate.getHours() + startDate.getMinutes() / 60 - dayStartHour;
        const durMin = g.durationMinutes;
        const label = durMin >= 60
          ? `可用 ${Math.floor(durMin / 60)}h${durMin % 60 > 0 ? durMin % 60 + 'm' : ''}`
          : `可用 ${durMin}m`;
        return {
          idx,
          startTime: g.startTime,
          endTime: g.endTime,
          durationMinutes: durMin,
          topRpx: Math.max(0, hoursFromStart * 80),
          heightRpx: (durMin / 60) * 80,
          label,
        };
      });
      this.setData({ displayGaps });
    } catch (e) {
      logError('schedule_deleteBlock', e);
      this.setData({ displayGaps: [] });
    }
  },

  onDragPoolStart(this: WechatMiniprogram.Page.TrivialInstance, e: WechatMiniprogram.TouchEvent) {
    const { id, title, duration } = e.currentTarget.dataset as { id: string; title: string; duration: number };
    this.setData({ draggedTask: { id, title, duration }, dragY: e.touches[0].clientY, dragTargetGapIdx: -1 });
  },

  onDragPoolMove(this: WechatMiniprogram.Page.TrivialInstance, e: WechatMiniprogram.TouchEvent) {
    if (!this.data.draggedTask) return;
    this.setData({ dragY: e.touches[0].clientY });
    const timeline = wx.createSelectorQuery().select('.timeline');
    timeline.boundingClientRect((rect: { top: number }) => {
      const relativeY = e.touches[0].clientY - rect.top;
      const hourIndex = Math.floor(relativeY / 80);
      this.setData({ dragTargetHour: Math.max(0, Math.min(23, hourIndex)) });
      const gaps = this.data.displayGaps;
      let gapIdx = -1;
      for (const gap of gaps) {
        if (relativeY >= gap.topRpx && relativeY <= gap.topRpx + gap.heightRpx) {
          gapIdx = gap.idx;
          break;
        }
      }
      this.setData({ dragTargetGapIdx: gapIdx });
    }).exec();
  },

  onDragPoolEnd(this: WechatMiniprogram.Page.TrivialInstance) {
    const task = this.data.draggedTask;
    const gapIdx = this.data.dragTargetGapIdx;
    const gaps = this.data.displayGaps;
    if (!task) {
      this.setData({ draggedTask: null, dragTargetHour: -1, dragTargetGapIdx: -1 });
      return;
    }
    const dateStr = this.data.dateStr || todayStr();
    if (gapIdx < 0) {
      this.setData({ draggedTask: null, dragTargetHour: -1, dragTargetGapIdx: -1 });
      return;
    }
    const gap = gaps.find((g: GapDisplay) => g.idx === gapIdx);
    if (!gap) {
      this.setData({ draggedTask: null, dragTargetHour: -1, dragTargetGapIdx: -1 });
      return;
    }
    if (task.duration > gap.durationMinutes) {
      this.setData({ dragErrorTaskId: task.id, draggedTask: null, dragTargetHour: -1, dragTargetGapIdx: -1 });
      wx.showToast({ title: '该时段不够长，请选择更长时段', icon: 'none' });
      setTimeout(() => { this.setData({ dragErrorTaskId: '' }); }, 800);
      return;
    }
    const gapStart = new Date(gap.startTime);
    const startH = String(gapStart.getHours()).padStart(2, '0');
    const startM = String(gapStart.getMinutes()).padStart(2, '0');
    const startMinutes = gapStart.getHours() * 60 + gapStart.getMinutes();
    const endMinutes = startMinutes + task.duration;
    const endH = String(Math.floor(endMinutes / 60)).padStart(2, '0');
    const endM = String(endMinutes % 60).padStart(2, '0');
    const startTime = `${dateStr}T${startH}:${startM}:00+08:00`;
    const endTime = `${dateStr}T${endH}:${endM}:00+08:00`;
    this.setData({ draggedTask: null, dragTargetHour: -1, dragTargetGapIdx: -1 });
    placeFlexible({ taskId: task.id, startTime, endTime }).then(() => {
      wx.vibrateShort({ type: 'light' });
      wx.showToast({ title: '已安排', icon: 'success' });
      this.loadToday();
      this.loadFlexibleTasks();
      this.loadGaps();
    }).catch((e) => {
      logError('Schedule placeFlexible', e);
      wx.showToast({ title: '安排失败，请重试', icon: 'none' });
    });
  },

  onPoolTaskTap(this: WechatMiniprogram.Page.TrivialInstance, e: WechatMiniprogram.TouchEvent) {
    const { id, duration } = e.currentTarget.dataset as { id: string; duration: number };
    wx.showActionSheet({
      itemList: ['安排到今天', '暂不处理'],
      success: (res) => {
        if (res.tapIndex === 0) {
          const dateStr = this.data.dateStr || todayStr();
          const nowH = String(new Date().getHours()).padStart(2, '0');
          const endMin = duration || 60;
          const endH = String(parseInt(nowH, 10) + Math.floor(endMin / 60)).padStart(2, '0');
          const endM = String(endMin % 60).padStart(2, '0');
          placeFlexible({ taskId: id, startTime: `${dateStr}T${nowH}:00:00+08:00`, endTime: `${dateStr}T${endH}:${endM}:00+08:00` }).then(() => {
            wx.showToast({ title: '已安排', icon: 'success' });
            this.loadToday();
            this.loadFlexibleTasks();
            this.loadGaps();
          }).catch((e) => {
            logError('Schedule placeFlexible', e);
            wx.showToast({ title: '安排失败', icon: 'none' });
          });
        }
      },
    });
  },

  onToggleTaskPool(this: WechatMiniprogram.Page.TrivialInstance) {
    this.setData({ showTaskPool: !this.data.showTaskPool });
  },
});
