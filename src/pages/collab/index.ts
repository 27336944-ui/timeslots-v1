import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { approvalStore } from '../../stores/approvalStore';
import { circleStore } from '../../stores/circleStore';
import { authStore } from '../../stores/authStore';
import type { ApprovalRequest, ApprovalPendingItem } from '../../types/approval';


interface CollabPageData {
  activeTab: string;
  circles: Array<{ id: string; name: string; description?: string; inviteCode: string; memberCount: number; myRole: string }>;
  showCircleDialog: boolean;
  dialogMode: 'create' | 'join';
  circleName: string;
  circleDesc: string;
  joinCode: string;
  processing: boolean;
  circleActionLoading: boolean;
  showSearch: boolean;
  searchKeyword: string;
  filteredPendingList: ApprovalPendingItem[];
  filteredInitiatedList: ApprovalRequest[];
}

interface CollabPageMethods {
  onTabPending: () => void;
  onTabInitiated: () => void;
  onApprovalTap: (e: WechatMiniprogram.TouchEvent) => void;
  onApprove: (e: WechatMiniprogram.TouchEvent) => Promise<void>;
  onReject: (e: WechatMiniprogram.TouchEvent) => Promise<void>;
  onPlusTap: () => void;
  onSearchTap: () => void;
  onSearchInput: (e: WechatMiniprogram.Input) => void;
  onSearchClose: () => void;
  onCircleManage: () => void;
  onCircleTap: (e: WechatMiniprogram.TouchEvent) => void;
  onShowCreateCircle: () => void;
  onShowJoinCircle: () => void;
  onCloseCircleDialog: () => void;
  onCircleNameInput: (e: WechatMiniprogram.Input) => void;
  onCircleDescInput: (e: WechatMiniprogram.Input) => void;
  onJoinCodeInput: (e: WechatMiniprogram.Input) => void;
  onCreateCircle: () => Promise<void>;
  onJoinCircle: () => Promise<void>;
  onRefresh: () => Promise<void>;
  syncFilteredLists: () => void;
  noop: () => void;
  storeBindings?: { destroyStoreBindings: () => void };
  authBindings?: { destroyStoreBindings: () => void };
  circleBindings?: { destroyStoreBindings: () => void };
}


Page<CollabPageData, CollabPageMethods>({
  data: {
    activeTab: 'pending',
    circles: [],
    showCircleDialog: false,
    dialogMode: 'create',
    circleName: '',
    circleDesc: '',
    joinCode: '',
    processing: false,
    circleActionLoading: false,
    showSearch: false,
    searchKeyword: '',
    filteredPendingList: [],
    filteredInitiatedList: [],
  },

  onLoad() {
    this.storeBindings = createStoreBindings(this, {
      store: approvalStore,
      fields: ['initiatedList', 'pendingList', 'loading', 'error'],
    });
    this.circleBindings = createStoreBindings(this, {
      store: circleStore,
      fields: ['circles'],
    });
    this.authBindings = createStoreBindings(this, {
      store: authStore,
      fields: ['isLoggedIn'],
    });
  },

  onShow() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any  
    (this as any).getTabBar?.().setData({ selected: 1 });
    if (authStore.isLoggedIn) {
      approvalStore.fetchMyPending();
      approvalStore.fetchMyInitiated();
      circleStore.fetchMyCircles();
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
    this.circleBindings!.destroyStoreBindings();
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
      wx.showLoading({ title: '处理�?..' });
      await approvalStore.respondApproval(requestId, recipientId, 'approve');
      wx.showToast({ title: '已同�?, icon: 'success' });
    } catch (err) {
      wx.showToast({ title: (err as Error).message || '操作失败', icon: 'none' });
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
      wx.showLoading({ title: '处理�?..' });
      await approvalStore.respondApproval(requestId, recipientId, 'reject');
      wx.showToast({ title: '已拒�?, icon: 'none' });
    } catch (err) {
      wx.showToast({ title: (err as Error).message || '操作失败', icon: 'none' });
    } finally {
      wx.hideLoading();
      this.setData({ processing: false });
    }
  },

  onPlusTap() {
    wx.navigateTo({ url: '/pages/collab/approval-create/index' });
  },

  onSearchTap() {
    this.setData({ showSearch: true, searchKeyword: '' });
  },

  onSearchInput(e: WechatMiniprogram.Input) {
    const kw = e.detail.value.trim().toLowerCase();
    this.setData({ searchKeyword: kw });
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
  },

  onSearchClose() {
    this.setData({ showSearch: false, searchKeyword: '' });
  },

  onCircleManage() {
    // 显示圈子管理对话�?    this.setData({ showCircleDialog: true, dialogMode: 'create', circleName: '', circleDesc: '', joinCode: '' });
  },

  onCircleTap(e: WechatMiniprogram.TouchEvent) {
    const circleId = e.currentTarget.dataset.circleId as string;
    wx.navigateTo({ url: `/pages/collab/detail/index?id=${circleId}` });
  },

  onShowCreateCircle() {
    this.setData({ dialogMode: 'create', circleName: '', circleDesc: '' });
  },

  onShowJoinCircle() {
    this.setData({ dialogMode: 'join', joinCode: '' });
  },

  onCloseCircleDialog() {
    this.setData({ showCircleDialog: false });
  },

  onCircleNameInput(e: WechatMiniprogram.Input) {
    this.setData({ circleName: e.detail.value });
  },

  onCircleDescInput(e: WechatMiniprogram.Input) {
    this.setData({ circleDesc: e.detail.value });
  },

  onJoinCodeInput(e: WechatMiniprogram.Input) {
    this.setData({ joinCode: e.detail.value.toUpperCase() });
  },

  async onCreateCircle() {
    if (this.data.circleActionLoading) return;
    this.setData({ circleActionLoading: true });
    const { circleName, circleDesc } = this.data;
    if (!circleName.trim()) {
      wx.showToast({ title: '请输入圈子名�?, icon: 'none' });
      return;
    }
    try {
      wx.showLoading({ title: '创建�?..' });
      await circleStore.createCircle(circleName.trim(), circleDesc.trim() || undefined);
      wx.hideLoading();
      wx.showToast({ title: '创建成功', icon: 'success' });
      this.onCloseCircleDialog();
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: (err as Error).message || '创建失败', icon: 'none' });
    } finally {
      this.setData({ circleActionLoading: false });
    }
  },

  async onJoinCircle() {
    if (this.data.circleActionLoading) return;
    this.setData({ circleActionLoading: true });
    const { joinCode } = this.data;
    if (!joinCode || joinCode.length !== 8) {
      wx.showToast({ title: '请输�?位邀请码', icon: 'none' });
      return;
    }
    try {
      wx.showLoading({ title: '加入�?..' });
      await circleStore.joinCircle(joinCode);
      wx.hideLoading();
      wx.showToast({ title: '加入成功', icon: 'success' });
      this.onCloseCircleDialog();
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: (err as Error).message || '加入失败', icon: 'none' });
    } finally {
      this.setData({ circleActionLoading: false });
    }
  },

  async onRefresh() {
    if (this.data.activeTab === 'pending') {
      await approvalStore.fetchMyPending();
    } else {
      await approvalStore.fetchMyInitiated();
    }
    await circleStore.fetchMyCircles();
  },

  noop() {},
});
