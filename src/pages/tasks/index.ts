
import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { taskStore } from '../../stores/taskStore';
import { authStore } from '../../stores/authStore';
import { delegationStore } from '../../stores/delegationStore';
import { weekNavData, weekNavMethods } from '../../behaviors/week-nav';
import { initGesture, analyzeSwipe, SWIPE_ACTION_THRESHOLD, CANCEL_MOVE_THRESHOLD } from '../../utils/gesture';
import { CATEGORY_LABELS } from '../../constants/categories';
import { logError } from '../../utils/logError';
import type { Task } from '../../types/api';


interface TaskDisplayItem extends Task {
  _categoryLabel: string;
  _dueLabel: string;
  _isOverdue: boolean;
  _isDone: boolean;
  _progress: number;
}

interface TasksPageData {
  filterList: { key: string; label: string }[];
  displayTasks: TaskDisplayItem[];
  loadingTab: boolean;
  loadError: boolean;
  showSearch: boolean;
  searchKeyword: string;
  swipeOffset: Record<string, number>;
  incomingDelegationCount: number;
  dateStr: string;
  selectedDay: string;
  weekDays: { dateStr: string; dayLabel: string; dateNum: number; isToday: boolean; lunarStr: string; festival: string | null }[];
  monthDays: { dateStr: string; dayNum: number; isToday: boolean; isCurrentMonth: boolean; lunarStr: string; festival: string | null }[];
  currentMonthStr: string;
  monthWeekDays: string[];
  weekStartsOn: number;
  showMonthCalendar: boolean;
  showSwipeHint: boolean;
}


function enrichTask(t: Task): TaskDisplayItem {
  const now = new Date();
  const due = t.dueAt ? new Date(t.dueAt) : null;
  const _isOverdue = due ? (t.status !== 'done' && due < now) : false;
  const _dueLabel = due ? due.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' }) : '';
  // Prefer stepRows (Step table association), fall back to deprecated steps JSON
  const stepsArr = t.stepRows ?? t.steps ?? [];
  const doneSteps = stepsArr.filter((s) =>
    'isDone' in s ? (s as { isDone: boolean }).isDone : (s as { status: string }).status === 'done'
  ).length;
  const progress = stepsArr.length > 0 ? Math.round((doneSteps / stepsArr.length) * 100) : 0;
  return {
    ...t,
    _categoryLabel: CATEGORY_LABELS[t.category] || t.category,
    _dueLabel,
    _isOverdue,
    _isDone: t.status === 'done',
    _progress: progress,
  };
}


interface TasksPageMethods {
  onTabTap: (e: WechatMiniprogram.TouchEvent) => void;
  onTaskTap: (e: WechatMiniprogram.TouchEvent) => void;
  onCreateTap: () => void;
  onSearchTap: () => void;
  onSearchInput: (e: WechatMiniprogram.Input) => void;
  onSearchClose: () => void;
  onRefresh: () => Promise<void>;
  refreshDisplay: () => void;
  onTaskTouchStart: (e: WechatMiniprogram.TouchEvent) => void;
  onTaskTouchMove: (e: WechatMiniprogram.TouchEvent) => void;
  onTaskTouchEnd: (e: WechatMiniprogram.TouchEvent) => void;
  onDelegationBannerTap: () => void;
  storeBindings?: { destroyStoreBindings: () => void };
  authBindings?: { destroyStoreBindings: () => void };
  delegationBindings?: { destroyStoreBindings: () => void };
  _gesture?: ReturnType<typeof initGesture>;
  initWeekNav: (centerDate?: string) => void;
  dismissSwipeHint: () => void;
  loadWeekInternal: (centerDate: string) => void;
  onWeekDayTap: (e: WechatMiniprogram.TouchEvent) => void;
}

const CATEGORIES = [
  { key: '', label: '全部' },
  { key: 'work', label: '工作' },
  { key: 'life', label: '生活' },
  { key: 'private', label: '自有' },
];



Page<TasksPageData, TasksPageMethods>({
  data: {
    filterList: CATEGORIES,
    displayTasks: [],
    loadingTab: false,
    loadError: false,
    showSearch: false,
    searchKeyword: '',
    swipeOffset: {},
    incomingDelegationCount: 0,
    showSwipeHint: false,
    ...weekNavData,
  },

  ...weekNavMethods,

  onLoad() {
    this.storeBindings = createStoreBindings(this, {
      store: taskStore,
      fields: ['tasks', 'stats', 'loading', 'error', 'currentCategory', 'currentFilter'],
    });
    this.authBindings = createStoreBindings(this, {
      store: authStore,
      fields: ['isLoggedIn'],
    });
    this.delegationBindings = createStoreBindings(this, {
      store: delegationStore,
      fields: ['incomingCount'],
      transform: { incomingCount: 'incomingDelegationCount' },
    });
  },

  onShow() {
    (this as unknown as WechatMiniprogram.Page.TrivialInstance).getTabBar?.().setData({ selected: 2 });
    this.initWeekNav();
    if (authStore.isLoggedIn) {
      taskStore.fetchTasks().then(() => this.refreshDisplay()).catch((e) => logError('Tasks fetchTasks', e));
      delegationStore.fetchMyDelegations().catch((e) => logError('Tasks fetchDelegations', e));
    }
    // Swipe hint for first-time visitors
    try {
      const shown = wx.getStorageSync('ts_tasks_swipe_hint_shown');
      if (!shown) {
        this.setData({ showSwipeHint: true });
      }
    } catch { /* storage read — non-critical */ }
  },

  dismissSwipeHint() {
    this.setData({ showSwipeHint: false });
    try { wx.setStorageSync('ts_tasks_swipe_hint_shown', '1'); } catch { /* ignore */ }
  },

  onUnload() {
    this.storeBindings!.destroyStoreBindings();
    this.authBindings!.destroyStoreBindings();
    this.delegationBindings!.destroyStoreBindings();
  },

  refreshDisplay() {
    const kw = this.data.searchKeyword.toLowerCase();
    const items = kw
      ? taskStore.tasks.filter((t) => t.title.toLowerCase().includes(kw))
      : taskStore.tasks;
    this.setData({ displayTasks: items.map(enrichTask) });
  },

  onSearchTap() {
    this.setData({ showSearch: true, searchKeyword: '' });
  },

  onSearchInput(e: WechatMiniprogram.Input) {
    const keyword = e.detail.value.trim().toLowerCase();
    this.setData({ searchKeyword: keyword });
    this.refreshDisplay();
  },

  onSearchClose() {
    this.setData({ showSearch: false, searchKeyword: '' });
    this.refreshDisplay();
  },

  onTabTap(e: WechatMiniprogram.TouchEvent) {
    if (this.data.loadingTab) return;
    this.setData({ loadingTab: true });
    const category = e.currentTarget.dataset.category as string;
    taskStore.fetchByCategory(category).then(() => {
      this.refreshDisplay();
      this.setData({ loadingTab: false });
    }).catch((e) => {
      logError('Tasks onTabTap', e);
      this.setData({ loadingTab: false });
    });
  },



  onTaskTouchStart(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    this._gesture = initGesture(id, e.touches[0].clientX, e.touches[0].clientY);
  },

  onTaskTouchMove(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    if (!id || !this._gesture) return;
    const g = analyzeSwipe(this._gesture, e.touches[0].clientX, e.touches[0].clientY);
    const clamped = Math.max(-80, Math.min(0, g.dx));
    this.setData({ [`swipeOffset.${id}`]: clamped });
  },

  onTaskTouchEnd(e: WechatMiniprogram.TouchEvent) {
    const gst = this._gesture;
    this._gesture = undefined;
    if (!gst) return;
    const id = gst.targetId;
    this.setData({ [`swipeOffset.${id}`]: 0 });
    if (!e.changedTouches[0]) return;
    const result = analyzeSwipe(gst, e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    if (result.dy > CANCEL_MOVE_THRESHOLD) return;
    if (result.dx < -SWIPE_ACTION_THRESHOLD) {
      if (result.dx < -120) {
        wx.showModal({
          title: '确认删除',
          content: '移除了就不会出现在时间轴上',
          confirmColor: '#DC2626',
          success: (m) => {
            if (m.confirm) {
              taskStore.deleteTask(id).then(() => {
                taskStore.fetchTasks().then(() => {
                  this.refreshDisplay();
                  wx.showToast({ title: '已删除', icon: 'none', duration: 5000 });
                });
              }).catch((e) => {
                logError('Tasks deleteTask', e);
                wx.showToast({ title: '删除失败', icon: 'none' });
              });
            }
          },
        });
      } else {
        taskStore.updateTask(id, { status: 'done' }).then(() => {
          wx.showToast({ title: '标记完成', icon: 'success', duration: 1000 });
          taskStore.fetchTasks().then(() => this.refreshDisplay());
        }).catch((e) => {
          logError('Tasks updateTask done', e);
          wx.showToast({ title: '出了点问题，再试一次', icon: 'none' });
        });
      }
    }
  },

  onTaskTap(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    wx.navigateTo({ url: `/pages/tasks/task-detail/index?id=${id}` });
  },

  onCreateTap() {
    wx.navigateTo({ url: '/pages/tasks/task-detail/index?mode=create' });
  },

  async onRefresh() {
    await taskStore.fetchTasks();
    this.refreshDisplay();
    delegationStore.fetchMyDelegations().catch((e) => logError('Tasks fetchDelegations', e));
  },

  onDelegationBannerTap() {
    wx.navigateTo({ url: '/pages/collab/index' });
  },
});
