import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { approvalStore } from '../../stores/approvalStore';
import { authStore } from '../../stores/authStore';
import { weekNavData, weekNavMethods } from '../../behaviors/week-nav';
import type { ApprovalRequest, ApprovalPendingItem } from '../../types/approval';
import { errorMsg } from '../../utils/error';


interface CollabPageData {
  activeTab: string;
  processing: boolean;
  showSearch: boolean;
  searchKeyword: string;
  filteredPendingList: ApprovalPendingItem[];
  filteredInitiatedList: ApprovalRequest[];
  dateStr: string;
  selectedDay: string;
  weekDays: { dateStr: string; dayLabel: string; dateNum: number; isToday: boolean; lunarStr: string; festival: string | null }[];
  monthDays: { dateStr: string; dayNum: number; isToday: boolean; isCurrentMonth: boolean; lunarStr: string; festival: string | null }[];
  currentMonthStr: string;
  monthWeekDays: string[];
  weekStartsOn: number;
  showMonthCalendar: boolean;
}

interface CollabPageMethods {
  onTabPending: () => void;
  onTabInitiated: () => void;
  onApprovalTap: (e: WechatMiniprogram.TouchEvent) => void;
  onApprove: (e: WechatMiniprogram.TouchEvent) => Promise<void>;
  onReject: (e: WechatMiniprogram.TouchEvent) => Promise<void>;
  onPlusTap: () => void;
  onShareNamecard: () => void;
  onSearchTap: () => void;
  onSearchInput: (e: WechatMiniprogram.Input) => void;
  onSearchClose: () => void;
  onRefresh: () => Promise<void>;
  syncFilteredLists: () => void;
  noop: () => void;
  storeBindings?: { destroyStoreBindings: () => void };
  authBindings?: { destroyStoreBindings: () => void };
  initWeekNav: (centerDate?: string) => void;
  loadWeekInternal: (centerDate: string) => void;
  onWeekDayTap: (e: WechatMiniprogram.TouchEvent) => void;
}


Page<CollabPageData, CollabPageMethods>({
  data: {
    activeTab: 'pending',
    processing: false,
    showSearch: false,
    searchKeyword: '',
    filteredPendingList: [],
    filteredInitiatedList: [],
    ...weekNavData,
  },

  ...weekNavMethods,

  onLoad() {
    this.storeBindings = createStoreBindings(this, {
      store: approvalStore,
      fields: ['initiatedList', 'pendingList', 'loading', 'error'],
    });
    this.authBindings = createStoreBindings(this, {
      store: authStore,
      fields: ['isLoggedIn'],
    });
  },

  onShow() {
    (this as unknown as WechatMiniprogram.Page.TrivialInstance).getTabBar?.().setData({ selected: 1 });
    this.initWeekNav();
    if (authStore.isLoggedIn) {
      approvalStore.fetchMyPending();
      approvalStore.fetchMyInitiated();
      this.syncFilteredLists();
    }
  },

  syncFilteredLists() {
    this.setData({
      filteredPendingList: approvalStore.pendingList,
      filteredInitiatedList: approvalStore.initiatedList,
    });
  },

  onUnload() {
    this.storeBindings!.destroyStoreBindings();
    this.authBindings!.destroyStoreBindings();
  },

  onTabPending() {
    this.setData({ activeTab: 'pending' });
    approvalStore.fetchMyPending();
  },

  onTabInitiated() {
    this.setData({ activeTab: 'initiated' });
    approvalStore.fetchMyInitiated();
  },

  onApprovalTap(e: WechatMiniprogram.TouchEvent) {
    const requestId = e.currentTarget.dataset.requestId as string;
    const isPending = e.currentTarget.dataset.isPending === 'true';
    wx.navigateTo({
      url: `/pages/collab/approval-detail/index?id=${requestId}&pending=${isPending}`,
    });
  },

  async onApprove(e: WechatMiniprogram.TouchEvent) {
    if (this.data.processing) return;
    this.setData({ processing: true });
    const requestId = e.currentTarget.dataset.requestId as string;
    const recipientId = e.currentTarget.dataset.recipientId as string;
    try {
      wx.showLoading({ title: '处理中...' });
      await approvalStore.respondApproval(requestId, recipientId, 'approve');
      wx.vibrateShort({ type: 'light' });
      wx.showToast({ title: '已同意', icon: 'success' });
    } catch (err) {
      wx.showToast({ title: errorMsg(err) || '出了点问题，再试一次', icon: 'none' });
    } finally {
      wx.hideLoading();
      this.setData({ processing: false });
    }
  },

  async onReject(e: WechatMiniprogram.TouchEvent) {
    if (this.data.processing) return;
    this.setData({ processing: true });
    const requestId = e.currentTarget.dataset.requestId as string;
    const recipientId = e.currentTarget.dataset.recipientId as string;
    try {
      wx.showLoading({ title: '处理中...' });
      await approvalStore.respondApproval(requestId, recipientId, 'reject');
      wx.vibrateShort({ type: 'light' });
      wx.showToast({ title: '已拒绝', icon: 'none' });
    } catch (err) {
      wx.showToast({ title: errorMsg(err) || '出了点问题，再试一次', icon: 'none' });
    } finally {
      wx.hideLoading();
      this.setData({ processing: false });
    }
  },

  onPlusTap() {
    wx.navigateTo({ url: '/pages/collab/approval-create/index' });
  },

  onShareNamecard() {
    wx.navigateTo({ url: '/pages/mine/namecard/index' });
  },

  onSearchTap() {
    this.setData({ showSearch: true, searchKeyword: '' });
  },

  onSearchInput(e: WechatMiniprogram.Input) {
    const kw = e.detail.value.trim().toLowerCase();
    this.setData({ searchKeyword: kw });
    clearTimeout((this as unknown as { _searchTimer: ReturnType<typeof setTimeout> })._searchTimer);
    (this as unknown as { _searchTimer: ReturnType<typeof setTimeout> })._searchTimer = setTimeout(() => {
      if (kw) {
        const fp = approvalStore.pendingList.filter((item) =>
          [item.title || '', item.initiator?.nickname || '', item.description || ''].some((f) => f.toLowerCase().includes(kw))
        );
        const fi = approvalStore.initiatedList.filter((item) =>
          [item.title || '', item.description || ''].some((f) => f.toLowerCase().includes(kw))
        );
        this.setData({ filteredPendingList: fp, filteredInitiatedList: fi });
      } else {
        this.setData({ filteredPendingList: approvalStore.pendingList, filteredInitiatedList: approvalStore.initiatedList });
      }
    }, 300);
  },

  onSearchClose() {
    this.setData({ showSearch: false, searchKeyword: '' });
  },

  async onRefresh() {
    if (this.data.activeTab === 'pending') {
      await approvalStore.fetchMyPending();
    } else {
      await approvalStore.fetchMyInitiated();
    }
  },

  noop() {},
});
