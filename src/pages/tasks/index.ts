
import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { taskStore } from '../../stores/taskStore';
import { authStore } from '../../stores/authStore';
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
  showSearch: boolean;
  searchKeyword: string;
  swipeOffset: Record<string, number>;
  _touchStartX?: number;
  _touchStartY?: number;
  _touchTaskId?: string;
}

const CATEGORY_LABEL: Record<string, string> = { work: '工作', life: '生活', private: '私有' };

function enrichTask(t: Task): TaskDisplayItem {
  const now = new Date();
  let _isOverdue = false;
  let _dueLabel = '';
  if (t.dueAt) {
    const due = new Date(t.dueAt);
    _dueLabel = due.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
    _isOverdue = t.status !== 'done' && due < now;
  }
  const stepsArr = t.steps || [];
  const doneSteps = stepsArr.filter((s) => s.isDone).length;
  const progress = stepsArr.length > 0 ? Math.round((doneSteps / stepsArr.length) * 100) : 0;
  return {
    ...t,
    _categoryLabel: CATEGORY_LABEL[t.category] || t.category,
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
  storeBindings?: { destroyStoreBindings: () => void };
  authBindings?: { destroyStoreBindings: () => void };
  _touchStartX?: number;
  _touchStartY?: number;
  _touchTaskId?: string;
}

const CATEGORIES = [
  { key: '', label: '全部' },
  { key: 'work', label: '工作' },
  { key: 'life', label: '生活' },
  { key: 'private', label: '私有' },
];



Page<TasksPageData, TasksPageMethods>({
  data: {
    filterList: CATEGORIES,
    displayTasks: [],
    loadingTab: false,
    showSearch: false,
    searchKeyword: '',
    swipeOffset: {},
  },

  onLoad() {
    this.storeBindings = createStoreBindings(this, {
      store: taskStore,
      fields: ['tasks', 'stats', 'loading', 'error', 'currentCategory', 'currentFilter'],
    });
    this.authBindings = createStoreBindings(this, {
      store: authStore,
      fields: ['isLoggedIn'],
    });
  },

  onShow() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any  
    (this as any).getTabBar?.().setData({ selected: 2 });
    if (authStore.isLoggedIn) {
      taskStore.fetchTasks().then(() => this.refreshDisplay()).catch(() => {});
    }
  },

  onUnload() {
    this.storeBindings!.destroyStoreBindings();
    this.authBindings!.destroyStoreBindings();
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
    }).catch(() => {
      this.setData({ loadingTab: false });
    });
  },



  onTaskTouchStart(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    this._touchTaskId = id;
    this._touchStartX = e.touches[0].clientX;
    this._touchStartY = e.touches[0].clientY;
  },

  onTaskTouchMove(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    if (!id) return;
    const dx = e.touches[0].clientX - (this._touchStartX || 0);
    const clamped = Math.max(-80, Math.min(0, dx));
    this.setData({ [`swipeOffset.${id}`]: clamped });
  },

  onTaskTouchEnd(e: WechatMiniprogram.TouchEvent) {
    const id = this._touchTaskId;
    const sx = this._touchStartX;
    const sy = this._touchStartY;
    this._touchTaskId = undefined;
    this._touchStartX = undefined;
    this._touchStartY = undefined;
    if (id) {
      this.setData({ [`swipeOffset.${id}`]: 0 });
    }
    if (!id || !e.changedTouches[0]) return;
    const dx = e.changedTouches[0].clientX - (sx || 0);
    const dy = Math.abs(e.changedTouches[0].clientY - (sy || 0));
    if (dy > 30) return;
    if (dx < -60) {
      if (dx < -120) {
        wx.showModal({
          title: '确认删除',
          content: '删除后不可恢�?,
          confirmColor: '#DC2626',
          success: (m) => {
            if (m.confirm) {
              taskStore.deleteTask(id).then(() => {
                taskStore.fetchTasks().then(() => this.refreshDisplay());
              }).catch(() => {
                wx.showToast({ title: '删除失败', icon: 'none' });
              });
            }
          },
        });
      } else {
        taskStore.updateTask(id, { status: 'done' }).then(() => {
          wx.showToast({ title: '标记完成', icon: 'success', duration: 1000 });
          taskStore.fetchTasks().then(() => this.refreshDisplay());
        }).catch(() => {
          wx.showToast({ title: '操作失败', icon: 'none' });
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
  },
});
