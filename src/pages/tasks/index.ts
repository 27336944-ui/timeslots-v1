
import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { taskStore } from '../../stores/taskStore';
import { authStore } from '../../stores/authStore';
import type { Task } from '../../types/api';


interface TaskDisplayItem extends Task {
  _categoryLabel: string;
  _dueLabel: string;
  _isOverdue: boolean;
  _isDone: boolean;
}

interface TasksPageData {
  filterList: { key: string; label: string }[];
  displayTasks: TaskDisplayItem[];
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
  return {
    ...t,
    _categoryLabel: CATEGORY_LABEL[t.category] || t.category,
    _dueLabel,
    _isOverdue,
    _isDone: t.status === 'done',
  };
}


interface TasksPageMethods {
  onTabTap: (e: WechatMiniprogram.TouchEvent) => void;
  onTaskTap: (e: WechatMiniprogram.TouchEvent) => void;
  onCreateTap: () => void;
  onRefresh: () => Promise<void>;
  refreshDisplay: () => void;
  storeBindings?: { destroyStoreBindings: () => void };
  authBindings?: { destroyStoreBindings: () => void };
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
    if (authStore.isLoggedIn) {
      taskStore.fetchTasks().then(() => this.refreshDisplay());
    }
  },

  onUnload() {
    this.storeBindings!.destroyStoreBindings();
    this.authBindings!.destroyStoreBindings();
  },

  refreshDisplay() {
    this.setData({ displayTasks: taskStore.tasks.map(enrichTask) });
  },

  onTabTap(e: WechatMiniprogram.TouchEvent) {
    const category = e.currentTarget.dataset.category as string;
    taskStore.fetchByCategory(category).then(() => {
      this.refreshDisplay();
    });
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
