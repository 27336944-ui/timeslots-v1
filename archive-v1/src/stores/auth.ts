import { observable } from 'mobx-miniprogram';
import { post } from '../utils/request';

const storedToken = (() => {
  try {
    return wx.getStorageSync('token') || '';
  } catch {
    return '';
  }
})();

export const authStore = observable({
  token: storedToken,
  isLoggedIn: !!storedToken,

  async login(userId: string): Promise<void> {
    const res = await post<{ accessToken: string }>('/auth/login', { userId });
    this.token = res.accessToken;
    this.isLoggedIn = true;
    wx.setStorageSync('token', res.accessToken);
  },

  logout(): void {
    this.token = '';
    this.isLoggedIn = false;
    wx.removeStorageSync('token');
  },
});
