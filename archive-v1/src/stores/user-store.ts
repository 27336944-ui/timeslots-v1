import { observable } from 'mobx-miniprogram';
import { api } from '../services/api';
import type { UserProfile } from '../types/user';

export const userStore = observable({
  profile: { nickname: '加载中...', subtitle: '' } as UserProfile['profile'],
  quota: { permanent: 0, monthly: 0, expiresLabel: '' } as UserProfile['quota'],
  loading: false,
  error: null as string | null,

  async fetchMe() {
    this.loading = true;
    this.error = null;
    try {
      const data = await api.get<UserProfile>('/users/me');
      this.profile = data.profile;
      this.quota = data.quota;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      this.loading = false;
    }
  },

  async update(data: { nickname?: string; avatarUrl?: string; dayStartsAt?: string }) {
    this.loading = true;
    this.error = null;
    try {
      const res = await api.patch<UserProfile>('/users/me', data);
      this.profile = res.profile;
      this.quota = res.quota;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      this.loading = false;
    }
  },

  async requestDelete(): Promise<boolean> {
    try {
      await api.del<{ message: string }>('/users/me');
      this.profile = { nickname: '账号待删除', subtitle: '7 天内可恢复' };
      return true;
    } catch {
      return false;
    }
  },

  async restoreAccount(): Promise<boolean> {
    try {
      await api.post<{ message: string }>('/users/me/restore');
      await this.fetchMe();
      return true;
    } catch {
      return false;
    }
  },
});
