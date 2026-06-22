import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { delegationStore } from '../../../stores/delegationStore';
import type { Delegation } from '../../../types/delegation';
import { errorMsg } from '../../../utils/error';


interface DelegationDetailPageData {
  delegation: Delegation | null;
  isInitiator: boolean;
  loading: boolean;
  deliverNote: string;
}

interface DelegationDetailPageMethods {
  onAccept: () => Promise<void>;
  onReject: () => Promise<void>;
  onDeliverNoteInput: (e: WechatMiniprogram.Input) => void;
  onDeliver: () => Promise<void>;
  storeBindings?: { destroyStoreBindings: () => void };
}


Page<DelegationDetailPageData, DelegationDetailPageMethods>({
  data: {
    delegation: null,
    isInitiator: false,
    loading: false,
    deliverNote: '',
  },

  onLoad(options: Record<string, string>) {
    this.storeBindings = createStoreBindings(this, {
      store: delegationStore,
      fields: ['currentDelegation', 'loading'],
    });
    delegationStore.fetchDetail(options.id as string);
  },

  onUnload() {
    delegationStore.clearCurrent();
    this.storeBindings!.destroyStoreBindings();
  },

  async onAccept() {
    wx.showLoading({ title: '处理中...' });
    try {
      await delegationStore.respondDelegation(this.data.delegation!.id, { action: 'accept' });
      await delegationStore.fetchDetail(this.data.delegation!.id);
      wx.showToast({ title: '已接受', icon: 'success' });
    } catch (e) {
      wx.showToast({ title: errorMsg(e), icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  async onReject() {
    wx.showLoading({ title: '处理中...' });
    try {
      await delegationStore.respondDelegation(this.data.delegation!.id, { action: 'reject' });
      await delegationStore.fetchDetail(this.data.delegation!.id);
      wx.showToast({ title: '已拒绝', icon: 'none' });
    } catch (e) {
      wx.showToast({ title: errorMsg(e), icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  onDeliverNoteInput(e: WechatMiniprogram.Input) {
    this.setData({ deliverNote: e.detail.value });
  },

  async onDeliver() {
    if (!this.data.deliverNote.trim()) {
      wx.showToast({ title: '请填写交付说明', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '交付中...' });
    try {
      await delegationStore.deliverDelegation(this.data.delegation!.id, { note: this.data.deliverNote.trim() });
      wx.showToast({ title: '已交付', icon: 'success' });
    } catch (e) {
      wx.showToast({ title: errorMsg(e), icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },
});
