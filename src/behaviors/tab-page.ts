/**
 * TabBar page shared behavior — DRY's up storeBindings, getTabBar(), and isLoggedIn check.
 * Usage:
 *   behaviors: [tabPage(2)],  // 2 = tab index
 *   Page({ behaviors: [tabPage(2)], ... })
 */

import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { authStore } from '../stores/authStore';
import { logError } from '../utils/logError';

interface TabPageData {
  isLoggedIn: boolean;
}

export function tabPage(tabIndex: number) {
  return Behavior({
    data: {
      isLoggedIn: false,
    } as TabPageData,

    lifetimes: {
      attached() {
        (this as unknown as WechatMiniprogram.Page.TrivialInstance & { authBindings: { destroyStoreBindings: () => void } }).authBindings =
          createStoreBindings(this, {
            store: authStore,
            fields: ['isLoggedIn'],
          });
      },

      detached() {
        const page = this as unknown as WechatMiniprogram.Page.TrivialInstance & { authBindings: { destroyStoreBindings: () => void } };
        page.authBindings?.destroyStoreBindings();
      },
    },

    pageLifetimes: {
      show() {
        const page = this as unknown as WechatMiniprogram.Page.TrivialInstance;
        try {
          page.getTabBar?.()?.setData({ selected: tabIndex });
        } catch (e) {
          logError('tab-page', e);
          /* getTabBar not available (e.g., opened from wx.navigateTo) */
        }
      },
    },

    methods: {
      /** Returns true if user is logged in; shows toast and redirects if not. */
      ensureLogin(this: TabPageData): boolean {
        if (this.isLoggedIn) return true;
        wx.showToast({ title: '请先登录', icon: 'none' });
        wx.switchTab?.({ url: '/pages/mine/index' });
        return false;
      },
    },
  });
}
