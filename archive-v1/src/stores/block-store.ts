import { observable } from 'mobx-miniprogram';
import { api } from '../services/api';
import type { MyTimeBlock, TimeBlockDetail } from '../types/block';

/**
 * 日程块状态管理。
 */
export const blockStore = observable({
  items: [] as MyTimeBlock[],
  loading: false,
  error: null as string | null,

  /**
   * 获取当前用户所有日程（列表预览，不含加密详情）。
   */
  async fetchAll() {
    this.loading = true;
    this.error = null;
    try {
      this.items = await api.get<MyTimeBlock[]>('/time-blocks/my');
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Unknown error';
      this.items = [];
    } finally {
      this.loading = false;
    }
  },

  /**
   * 按日期查询日程。
   * @param date - ISO 日期字符串 "YYYY-MM-DD"
   */
  async fetchByDate(date: string) {
    this.loading = true;
    this.error = null;
    try {
      this.items = await api.get<MyTimeBlock[]>(`/time-blocks/by-date/${date}`);
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Unknown error';
      this.items = [];
    } finally {
      this.loading = false;
    }
  },

  /**
   * 创建日程（自动扣 1 AI 额度）。
   * @returns 创建的完整 TimeBlock，失败返回 null
   */
  async create(data: {
    title: string;
    startTime: string;
    endTime: string;
    nature?: string;
  }): Promise<TimeBlockDetail | null> {
    try {
      const block = await api.post<TimeBlockDetail>('/time-blocks', data);
      await this.fetchAll();
      return block;
    } catch {
      return null;
    }
  },

  /**
   * 软删除日程。
   */
  async remove(id: string): Promise<boolean> {
    try {
      await api.del(`/time-blocks/${id}`);
      this.items = this.items.filter((b) => b.id !== id);
      return true;
    } catch {
      return false;
    }
  },
});
