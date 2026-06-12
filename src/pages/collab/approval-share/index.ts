import { authStore } from '../../../stores/authStore';
import { approvalStore } from '../../../stores/approvalStore';
import { getApprovalByShareToken, respondApproval } from '../../../services/api';
import type { ApprovalShareInfo } from '../../../types/approval';


interface SharePageData {
  shareInfo: ApprovalShareInfo | null;
  isLoggedIn: boolean;
  showActions: boolean;
  responded: boolean;
  respondAction: string;
}

interface SharePageMethods {
  onLogin: () => void;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
}


Page<SharePageData, SharePageMethods>({
  data: {
    shareInfo: null,
    isLoggedIn: false,
    showActions: false,
    responded: false,
    respondAction: '',
  },

  async onLoad(options: Record<string, string>) {
    const token = options.token as string;
    const isLoggedIn = authStore.isLoggedIn;
    this.setData({ isLoggedIn });

    try {
      const info = await getApprovalByShareToken(token);
      this.setData({ shareInfo: info });
      if (isLoggedIn) {
        this.setData({ showActions: info.status === 'pending' || info.status === 'partial' });
      }
    } catch (err) {
      wx.showToast({ title: (err as Error).message || '加载失败', icon: 'none' });
    }
  },

  onLogin() {
    wx.switchTab({ url: '/pages/mine/index' });
  },

  async onApprove() {
    if (!this.data.shareInfo) return;
    try {
      wx.showLoading({ title: '处理中...' });
      const recipientId = await approvalStore.bindRecipient(this.data.shareInfo.id);
      await respondApproval(this.data.shareInfo.id, recipientId, 'approve');
      this.setData({ responded: true, respondAction: 'approve', showActions: false });
      wx.showToast({ title: '已同意', icon: 'success' });
    } catch (err) {
      wx.showToast({ title: (err as Error).message, icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  async onReject() {
    if (!this.data.shareInfo) return;
    try {
      wx.showLoading({ title: '处理中...' });
      const recipientId = await approvalStore.bindRecipient(this.data.shareInfo.id);
      await respondApproval(this.data.shareInfo.id, recipientId, 'reject');
      this.setData({ responded: true, respondAction: 'reject', showActions: false });
      wx.showToast({ title: '已拒绝', icon: 'none' });
    } catch (err) {
      wx.showToast({ title: (err as Error).message, icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },
});
