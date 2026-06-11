import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { taskStore } from '../../stores/task-store';
import type { TaskView } from '../../types/task';

interface TaskStats {
  today: number;
  week: number;
  overdue: number;
  total: number;
}

interface TaskGroupItem {
  id: string;
  name: string;
  count: number;
}

interface TasksPageData {
  currentGroup: string;
  groups: TaskGroupItem[];
  tasks: TaskView[];
  stats: TaskStats;
  loading: boolean;
}

interface TasksPageMethods {
  onLoad(): void;
  onShow(): void;
  onTapGroup(e: WechatMiniprogram.TouchEvent): void;
  onTapAdd(): void;
  loadAll(): Promise<void>;
  statsOf(items: TaskView[]): TaskStats;
  buildGroups(items: TaskView[]): TaskGroupItem[];
}

let bindings: ReturnType<typeof createStoreBindings> | null = null;
let _loadingTasks = false;

Page<TasksPageData, TasksPageMethods>({
  data: {
    currentGroup: 'todo',
    groups: [],
    tasks: [],
    stats: { today: 0, week: 0, overdue: 0, total: 0 },

    loading: false,
  },

  onLoad() {
    bindings = createStoreBindings(this, {
      store: taskStore,
      fields: ['tasks', 'loading'],
      actions: [],
    });
  },

  onUnload() {
    bindings?.destroyStoreBindings();
    bindings = null;
  },

  onShow() {
    if (_loadingTasks) {
      return;
    }
    _loadingTasks = true;
    this.loadAll().finally(() => {
      _loadingTasks = false;
    });
  },

  onTapGroup(e: WechatMiniprogram.TouchEvent) {
    const key = e.currentTarget.dataset.key as string;
    this.setData({ currentGroup: key });
  },

  onTapAdd() {
    void wx.showToast({ title: '新建任务 (M2)', icon: 'none' });
  },

  async loadAll() {
    try {
      await taskStore.fetchAll();
      const tasks = taskStore.tasks;
      this.setData({
        tasks,
        stats: this.statsOf(tasks),
        groups: this.buildGroups(tasks),
      });
    } catch (err) {
      console.error('loadAll failed:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  statsOf(items: TaskView[]): TaskStats {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    return {
      total: items.length,
      today: items.filter((t) => t.createdAt?.startsWith(today)).length,
      week: items.filter((t) => {
        const d = t.createdAt;
        if (!d) {
          return false;
        }
        return d >= weekStart.toISOString() && d <= weekEnd.toISOString();
      }).length,
      overdue: items.filter((t) => {
        const deadline = t.dueAt;
        return !!deadline && deadline < now.toISOString();
      }).length,
    };
  },

  buildGroups(items: TaskView[]): TaskGroupItem[] {
    const map = new Map<string, number>();
    for (const t of items) {
      const gid = t.taskGroupId ?? '__ungrouped';
      map.set(gid, (map.get(gid) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([id, count]) => ({
      id,
      name: id === '__ungrouped' ? '未分组' : id.slice(0, 8),
      count,
    }));
  },
});
