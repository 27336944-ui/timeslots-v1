import { logError } from './utils/logError';
import { getFontScale, isHighContrast } from './utils/accessibility';

App({
  globalData: {
    pendingBlock: undefined as Record<string, unknown> | undefined,
  },
  onLaunch() {
    wx.onError((error: unknown) => {
      logError('Global Error', error);
    });
    wx.onUnhandledRejection((res) => {
      logError('Unhandled Rejection', res.reason);
    });
    wx.onPageNotFound(() => {
      wx.redirectTo({ url: '/pages/schedule/index' });
    });
    wx.onMemoryWarning(() => {
      wx.showToast({ title: '内存不足，请关闭其他小程序', icon: 'none' });
    });
    // Sync font scale from system settings
    wx.setStorageSync('fontScale', getFontScale());
    wx.setStorageSync('highContrast', isHighContrast());
  },
});
