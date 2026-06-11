import { observable } from 'mobx-miniprogram';
import { api } from '../services/api';
import type { TaskView, TaskStats, TaskGroupView } from '../types/task';

/**
 * 任务状态管理。
 */
export const taskStore = observable({
  tasks: [] as TaskView[],
  groups: [] as TaskGroupView[],
  stats: { today: 0, week: 0, overdue: 0 } as TaskStats,
  loading: false,
  error: null as string | null,

  /**
   * 加载任务列表 + 任务组 + 统计数据。
   */
  async fetchAll() {
    this.loading = true;
    this.error = null;
    try {
      const [taskData, groupData] = await Promise.all([
        api.get<TaskView[]>('/tasks/my'),
        api.get<{ stats: TaskStats; groups: TaskGroupView[] }>('/task-groups/my'),
      ]);
      this.tasks = taskData;
      this.groups = groupData.groups;
      this.stats = groupData.stats;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Unknown error';
      this.tasks = [];
      this.groups = [];
      this.stats = { today: 0, week: 0, overdue: 0 };
    } finally {
      this.loading = false;
    }
  },

  /**
   * 创建新任务。
   */
  async create(data: {
    title: string;
    notes?: string;
    priority?: string;
    dueAt?: string;
    taskGroupId?: string;
  }): Promise<TaskView | null> {
    try {
      const task = await api.post<TaskView>('/tasks', data);
      await this.fetchAll();
      return task;
    } catch {
      return null;
    }
  },

  /**
   * 更新任务字段。
   */
  async update(
    id: string,
    data: Partial<{ title: string; status: string; priority: string; dueAt: string }>,
  ): Promise<boolean> {
    try {
      await api.patch<TaskView>(`/tasks/${id}`, data);
      await this.fetchAll();
      return true;
    } catch {
      return false;
    }
  },

  /**
   * 删除任务。
   */
  async remove(id: string): Promise<boolean> {
    try {
      await api.del(`/tasks/${id}`);
      this.tasks = this.tasks.filter((t) => t.id !== id);
      return true;
    } catch {
      return false;
    }
  },
});
