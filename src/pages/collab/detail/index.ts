import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { circleStore } from '../../../stores/circleStore';
import { authStore } from '../../../stores/authStore';


interface DetailPageData {
  circleId: string;
}

interface DetailPageMethods {
  onCopyCode: () => void;
  onRegenerateCode: () => Promise<void>;
  onRemoveMember: (e: WechatMiniprogram.TouchEvent) => void;
  onLeaveCircle: () => Promise<void>;
  onDeleteCircle: () => Promise<void>;
  onRefresh: () => Promise<void>;
  storeBindings?: { destroyStoreBindings: () => void };
  authBindings?: { destroyStoreBindings: () => void };
}


Page<DetailPageData, DetailPageMethods>({
  data: {
    circleId: '',
  },

  onLoad(options: Record<string, string>) {
    this.storeBindings = createStoreBindings(this, {
      store: circleStore,
      fields: ['currentCircle', 'loading', 'error'],
    });
    this.authBindings = createStoreBindings(this, {
      store: authStore,
      fields: ['isLoggedIn'],
    });

    const id = options.id;
    if (id) {
      this.setData({ circleId: id });
      circleStore.fetchCircleDetail(id);
    }
  },

  onUnload() {
    this.storeBindings!.destroyStoreBindings();
    this.authBindings!.destroyStoreBindings();
  },

  onCopyCode() {
    const code = circleStore.currentCircle?.inviteCode;
    if (!code) return;
    wx.setClipboardData({
      data: code,
      success() {
        wx.showToast({ title: '邀请码已复制', icon: 'success' });
      },
    });
  },

  async onRegenerateCode() {
    try {
      wx.showLoading({ title: '刷新中...' });
      await circleStore.generateInviteCode(this.data.circleId);
      wx.hideLoading();
      wx.showToast({ title: '已刷新', icon: 'success' });
    } catch (e) {
      wx.showToast({ title: (e as Error).message || '刷新失败', icon: 'none' });
      wx.hideLoading();
    }
  },

  onRemoveMember(e: WechatMiniprogram.TouchEvent) {
    const memberId = e.currentTarget.dataset.memberid as string;
    wx.showModal({
      title: '移除成员',
      content: '确定要移除此成员吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '移除中...' });
            await circleStore.removeMember(this.data.circleId, memberId);
            wx.hideLoading();
            wx.showToast({ title: '已移除', icon: 'success' });
          } catch (err) {
            wx.showToast({ title: (err as Error).message || '移除失败', icon: 'none' });
            wx.hideLoading();
          }
        }
      },
    });
  },

  async onLeaveCircle() {
    wx.showModal({
      title: '退出圈子',
      content: '确定要退出此圈子吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '退出中...' });
            await circleStore.leaveCircle(this.data.circleId);
            wx.hideLoading();
            wx.showToast({ title: '已退出', icon: 'success' });
            wx.navigateBack();
          } catch (err) {
            wx.showToast({ title: (err as Error).message || '退出失败', icon: 'none' });
            wx.hideLoading();
          }
        }
      },
    });
  },

  async onDeleteCircle() {
    wx.showModal({
      title: '删除圈子',
      content: '确定要删除此圈子吗？此操作不可撤销。',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '删除中...' });
            await circleStore.deleteCircle(this.data.circleId);
            wx.hideLoading();
            wx.showToast({ title: '已删除', icon: 'success' });
            wx.navigateBack();
          } catch (err) {
            wx.showToast({ title: (err as Error).message || '删除失败', icon: 'none' });
            wx.hideLoading();
          }
        }
      },
    });
  },

  async onRefresh() {
    await circleStore.fetchCircleDetail(this.data.circleId);
  },
});
