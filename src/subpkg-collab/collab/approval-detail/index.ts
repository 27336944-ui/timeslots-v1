import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { approvalStore } from '../../../stores/approvalStore';
import { errorMsg } from '../../../utils/error';
import { resendApproval } from '../../../services/api';
import type { ApprovalRequest } from '../../../types/approval';


interface ApprovalDetailPageData {
  currentRequest: ApprovalRequest | null;
  loading: boolean;
  approving: boolean;
  error: string;
}

interface ApprovalDetailPageMethods {
  onResend: (e: WechatMiniprogram.TouchEvent) => Promise<void>;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
  storeBindings?: { destroyStoreBindings: () => void };
}

Page<ApprovalDetailPageData, ApprovalDetailPageMethods>({
  data: {
    currentRequest: null,
    loading: false,
    approving: false,
    error: '',
  },

  onLoad(options: Record<string, string>) {
    this.storeBindings = createStoreBindings(this, {
      store: approvalStore,
      fields: ['currentRequest', 'loading', 'error'],
    });
    const id = options.id as string;
    approvalStore.fetchDetail(id);
  },

  onUnload() {
    approvalStore.clearCurrent();
    this.storeBindings!.destroyStoreBindings();
  },

  async onResend(e: WechatMiniprogram.TouchEvent) {
    if (this.data.approving) return;
    this.setData({ approving: true });
    const recipientId = e.currentTarget.dataset.recipientId as string;
    const requestId = approvalStore.currentRequest?.id;
    if (!requestId) return;
    try {
      wx.showLoading({ title: '补发中...' });
      await resendApproval(requestId, recipientId);
      wx.showToast({ title: '已补发', icon: 'success' });
    } catch (err) {
      wx.showToast({ title: errorMsg(err), icon: 'none' });
    } finally {
      wx.hideLoading();
      this.setData({ approving: false });
    }
  },

  async onApprove() {
    if (this.data.approving) return;
    this.setData({ approving: true });
    const req = approvalStore.currentRequest;
    if (!req || req.isInitiator) return;
    const myRecipient = req.recipients.find((r) => r.status === 'pending');
    if (!myRecipient) return;
    try {
      wx.showLoading({ title: '处理中...' });
      await approvalStore.respondApproval(req.id, myRecipient.id, 'approve');
      wx.showToast({ title: '已同意', icon: 'success' });
      wx.navigateBack();
    } catch (err) {
      wx.showToast({ title: errorMsg(err), icon: 'none' });
    } finally {
      wx.hideLoading();
      this.setData({ approving: false });
    }
  },

  async onReject() {
    if (this.data.approving) return;
    this.setData({ approving: true });
    const req = approvalStore.currentRequest;
    if (!req || req.isInitiator) return;
    const myRecipient = req.recipients.find((r) => r.status === 'pending');
    if (!myRecipient) return;
    try {
      wx.showLoading({ title: '处理中...' });
      await approvalStore.respondApproval(req.id, myRecipient.id, 'reject');
      wx.showToast({ title: '已拒绝', icon: 'none' });
      wx.navigateBack();
    } catch (err) {
      wx.showToast({ title: errorMsg(err), icon: 'none' });
    } finally {
      wx.hideLoading();
      this.setData({ approving: false });
    }
  },
});