
import { observable, action } from 'mobx-miniprogram';
import { getMyTasks, getTaskStats, getTasksByCategory, createTask as apiCreateTask, updateTask as apiUpdateTask, deleteTask as apiDeleteTask, getBlocksByTask } from '../services/api';
import { deduped } from '../utils/request-dedup';
import type { Task, TaskStats, TimeBlock } from '../types/api';
import { errorMsg } from '../utils/error';
import { logError } from '../utils/logError';


interface TaskStore {
  tasks: Task[];
  stats: TaskStats | null;
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string;
  currentCategory: string;
  currentFilter: string;
  selectedTask: Task | null;
  taskBlocks: TimeBlock[];
  lastFetchedAt: Record<string, number>;
  fetchTasks: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchByCategory: (category: string) => Promise<void>;
  setFilter: (filter: string) => void;
  fetchTaskById: (id: string) => Promise<void>;
  fetchTaskBlocks: (taskId: string) => Promise<void>;
  createTask: (data: {
    title: string; goal?: string; status?: string; priority?: string;
    category?: string; dueAt?: string; steps?: { text: string; isDone: boolean }[];
  }) => Promise<Task>;
  updateTask: (id: string, data: {
    title?: string; goal?: string; status?: string; priority?: string;
    category?: string; dueAt?: string; steps?: { text: string; isDone: boolean }[];
    completedNote?: string; retrospective?: string; improvements?: string;
  }) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  loadMoreTasks: () => Promise<void>;
}

export const taskStore: TaskStore = observable({
  tasks: [],
  stats: null,
  loading: false,
  refreshing: false,
  loadingMore: false,
  hasMore: true,
  error: '',
  currentCategory: '',
  currentFilter: 'all',
  selectedTask: null,
  taskBlocks: [],
  lastFetchedAt: {},

  fetchTasks: action(async function (this: TaskStore) {
    // SWR: 30s cache window — skip fetch if data is fresh
    const swrKey = 'fetchTasks';
    if (this.lastFetchedAt[swrKey] && (this.lastFetchedAt[swrKey] + 30000 > Date.now())) {
      return;
    }
    const hasData = this.tasks.length > 0;
    if (hasData) {
      this.refreshing = true;
    } else {
      this.loading = true;
    }
    this.error = '';
    try {
      const raw = await deduped('/tasks/my', () => getMyTasks());
      // Merge by id: new items added, existing updated, stale removed
      const newMap = new Map(raw.map((t) => [t.id, t]));
      const merged = this.tasks
        .filter((t) => newMap.has(t.id))
        .map((t) => {
          const fresh = newMap.get(t.id)!;
          return { ...t, ...fresh };
        });
      for (const t of raw) {
        if (!this.tasks.some((x) => x.id === t.id)) merged.push(t);
      }
      this.tasks = merged;
      this.lastFetchedAt[swrKey] = Date.now();
    } catch (e) {
      this.error = errorMsg(e) || '加载失败';
    }
    try {
      this.stats = await getTaskStats();
    } catch (e) {
      logError('taskStore fetchStats', e);
    } finally {
      this.loading = false;
      this.refreshing = false;
    }
  }),

  fetchStats: action(async function (this: TaskStore) {
    try {
      this.stats = await getTaskStats();
    } catch (e) {
      logError('taskStore fetchStats standalone', e);
    }
  }),

  loadMoreTasks: action(async function (this: TaskStore) {
    if (this.loadingMore || !this.hasMore) return;
    this.loadingMore = true;
    try {
      const raw = await deduped(`/tasks/my?limit=20&offset=${this.tasks.length}`, () => getMyTasks(20, this.tasks.length));
      if (raw.length < 20) this.hasMore = false;
      const newIds = new Set(raw.map((t) => t.id));
      const merged = this.tasks
        .filter((t) => !newIds.has(t.id))
        .concat(raw);
      this.tasks = merged;
    } catch (e) {
      // Silently fail on load-more
    } finally {
      this.loadingMore = false;
    }
  }),

  fetchByCategory: action(async function (this: TaskStore, category: string) {
    this.loading = true;
    this.error = '';
    this.currentCategory = category;
    try {
      if (category) {
        this.tasks = await getTasksByCategory(category);
      } else {
        await this.fetchTasks();
        return;
      }
    } catch (e) {
      this.error = errorMsg(e) || '加载失败';
    } finally {
      this.loading = false;
    }
  }),

  setFilter: action(function (this: TaskStore, filter: string) {
    this.currentFilter = filter;
  }),

  fetchTaskById: action(async function (this: TaskStore, id: string) {
    const [taskResult, blocksResult] = await Promise.allSettled([
      import('../services/api').then(m => m.getTaskById(id)),
      getBlocksByTask(id),
    ]);
    if (taskResult.status === 'fulfilled') {
      this.selectedTask = taskResult.value;
    } else {
      logError('[taskStore] fetchTaskById failed', taskResult.reason);
      this.selectedTask = null;
    }
    if (blocksResult.status === 'fulfilled') {
      this.taskBlocks = blocksResult.value;
    } else {
      logError('[taskStore] fetchTaskBlocks failed', blocksResult.reason);
      this.taskBlocks = [];
    }
  }),

  fetchTaskBlocks: action(async function (this: TaskStore, taskId: string) {
    try {
      this.taskBlocks = await getBlocksByTask(taskId);
    } catch (e) {
      logError('taskStore_updateTask', e);
      this.taskBlocks = [];
    }
  }),

  createTask: action(async function (this: TaskStore, data: {
    title: string; goal?: string; status?: string; priority?: string;
    category?: string; dueAt?: string; steps?: { text: string; isDone: boolean }[];
  }) {
    const task = await apiCreateTask(data);
    await this.fetchStats();
    return task;
  }),

  updateTask: action(async function (this: TaskStore, id: string, data: {
    title?: string; goal?: string; status?: string; priority?: string;
    category?: string; dueAt?: string; steps?: { text: string; isDone: boolean }[];
    completedNote?: string; retrospective?: string; improvements?: string;
  }) {
    const task = await apiUpdateTask(id, data);
    if (this.selectedTask?.id === id) {
      this.selectedTask = task;
    }
    await this.fetchStats();
    return task;
  }),

  deleteTask: action(async function (this: TaskStore, id: string) {
    await apiDeleteTask(id);
    this.selectedTask = null;
    this.taskBlocks = [];
    await this.fetchStats();
    await this.fetchTasks();
  }),
});
