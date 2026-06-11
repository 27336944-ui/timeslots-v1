
import { observable, action } from 'mobx-miniprogram';
import { getMyTasks, getTaskStats, getTasksByCategory, createTask as apiCreateTask, updateTask as apiUpdateTask, deleteTask as apiDeleteTask, getBlocksByTask } from '../services/api';
import type { Task, TaskStats, TimeBlock } from '../types/api';


interface TaskStore {
  tasks: Task[];
  stats: TaskStats | null;
  loading: boolean;
  error: string;
  currentCategory: string;
  currentFilter: string;
  selectedTask: Task | null;
  taskBlocks: TimeBlock[];
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
}

export const taskStore: TaskStore = observable({
  tasks: [],
  stats: null,
  loading: false,
  error: '',
  currentCategory: '',
  currentFilter: 'all',
  selectedTask: null,
  taskBlocks: [],

  fetchTasks: action(async function (this: TaskStore) {
    this.loading = true;
    this.error = '';
    try {
      const [tasks, stats] = await Promise.all([getMyTasks(), getTaskStats()]);
      this.tasks = tasks;
      this.stats = stats;
    } catch (e) {
      this.error = (e as Error).message || '加载失败';
      this.tasks = [];
    } finally {
      this.loading = false;
    }
  }),

  fetchStats: action(async function (this: TaskStore) {
    try {
      this.stats = await getTaskStats();
    } catch {
      // not critical
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
      this.error = (e as Error).message || '加载失败';
      this.tasks = [];
    } finally {
      this.loading = false;
    }
  }),

  setFilter: action(function (this: TaskStore, filter: string) {
    this.currentFilter = filter;
  }),

  fetchTaskById: action(async function (this: TaskStore, id: string) {
    try {
      const [task, blocks] = await Promise.all([
        import('../services/api').then(m => m.getTaskById(id)),
        getBlocksByTask(id),
      ]);
      this.selectedTask = task;
      this.taskBlocks = blocks;
    } catch (e) {
      throw e;
    }
  }),

  fetchTaskBlocks: action(async function (this: TaskStore, taskId: string) {
    try {
      this.taskBlocks = await getBlocksByTask(taskId);
    } catch {
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
