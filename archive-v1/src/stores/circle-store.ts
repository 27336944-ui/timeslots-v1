import { observable } from 'mobx-miniprogram';
import { api } from '../services/api';
import type { CircleView } from '../types/circle';

/**
 * 圈子状态管理。
 */
export const circleStore = observable({
  items: [] as CircleView[],
  loading: false,
  error: null as string | null,

  /**
   * 获取我的圈子列表。
   */
  async fetchMine() {
    this.loading = true;
    this.error = null;
    try {
      this.items = await api.get<CircleView[]>('/circles/my');
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Unknown error';
      this.items = [];
    } finally {
      this.loading = false;
    }
  },

  /**
   * 创建圈子（自动成为 OWNER）。
   */
  async create(data: { name: string; description?: string }): Promise<CircleView | null> {
    try {
      const circle = await api.post<CircleView>('/circles', data);
      await this.fetchMine();
      return circle;
    } catch {
      return null;
    }
  },

  /**
   * 通过邀请码加入圈子。
   */
  async join(inviteCode: string): Promise<CircleView | null> {
    try {
      const circle = await api.post<CircleView>(`/circles/join/${inviteCode}`);
      await this.fetchMine();
      return circle;
    } catch {
      return null;
    }
  },

  /**
   * 删除圈子（仅 OWNER 可操作）。
   */
  async remove(id: string): Promise<boolean> {
    try {
      await api.del(`/circles/${id}`);
      this.items = this.items.filter((c) => c.id !== id);
      return true;
    } catch {
      return false;
    }
  },
});
