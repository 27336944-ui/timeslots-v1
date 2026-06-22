import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { shareStore } from '../../../stores/shareStore';
import { errorMsg } from '../../../utils/error';
import type { ShareRecipient } from '../../../types/share';


interface TransparencyPageData {
  recipients: ShareRecipient[];
  recipientInitials: Record<string, string>;
  loading: boolean;
  showAddDialog: boolean;
  addTargetUserId: string;
  addLevel: string;
  stealthEnabled: boolean;
  stealthExpiresAt: string | null;
  stealthRemaining: string;
}

interface TransparencyPageMethods {
  onAddTap: () => void;
  onTargetUserIdInput: (e: WechatMiniprogram.Input) => void;
  onLevelChange: (e: WechatMiniprogram.TouchEvent) => void;
  onConfirmAdd: () => Promise<void>;
  onCancelAdd: () => void;
  onRemoveRecipient: (e: WechatMiniprogram.TouchEvent) => Promise<void>;
  onLevelSelect: (e: WechatMiniprogram.TouchEvent) => Promise<void>;
  onToggleStealth: () => Promise<void>;
  onDialogInnerTap: () => void;
  computeInitials: () => void;
  computeStealthRemaining: () => void;
  storeBindings?: { destroyStoreBindings: () => void };
}

Page<TransparencyPageData, TransparencyPageMethods>({
  data: {
    recipients: [],
    recipientInitials: {},
    loading: false,
    showAddDialog: false,
    addTargetUserId: '',
    addLevel: 'freebusy',
    stealthEnabled: false,
    stealthExpiresAt: null,
    stealthRemaining: '',
  },

  onLoad() {
    this.storeBindings = createStoreBindings(this, {
      store: shareStore,
      fields: ['recipients', 'loading', 'stealthEnabled', 'stealthExpiresAt'],
    });
    shareStore.fetchRecipients();
    shareStore.fetchStealth();
    this.computeInitials();
    this.computeStealthRemaining();
  },

  computeInitials() {
    const initials: Record<string, string> = {};
    for (const r of this.data.recipients) {
      initials[r.id] = r.targetName ? r.targetName[0] : '?';
    }
    this.setData({ recipientInitials: initials });
  },

  onUnload() {
    this.storeBindings!.destroyStoreBindings();
  },

  onAddTap() {
    this.setData({ showAddDialog: true, addTargetUserId: '', addLevel: 'freebusy' });
  },

  onTargetUserIdInput(e: WechatMiniprogram.Input) {
    this.setData({ addTargetUserId: e.detail.value });
  },

  onLevelChange(e: WechatMiniprogram.TouchEvent) {
    this.setData({ addLevel: e.currentTarget.dataset.value as string });
  },

  async onConfirmAdd() {
    const uid = this.data.addTargetUserId.trim();
    if (!uid) {
      wx.showToast({ title: '请输入对方user ID', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '添加中...' });
    try {
      await shareStore.addRecipient({ targetUserId: uid, level: this.data.addLevel });
      this.setData({ showAddDialog: false });
      wx.showToast({ title: '已添加', icon: 'success' });
    } catch (e) {
      wx.showToast({ title: errorMsg(e), icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  onCancelAdd() {
    this.setData({ showAddDialog: false });
  },

  async onRemoveRecipient(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    const res = await wx.showModal({ title: '确认移除', content: '移除此共享关系？' });
    if (!res.confirm) return;
    wx.showLoading({ title: '移除中...' });
    try {
      await shareStore.removeRecipient(id);
      wx.showToast({ title: '已移除', icon: 'success' });
    } catch (e) {
      wx.showToast({ title: errorMsg(e), icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  async onLevelSelect(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    const levels = ['full', 'freebusy', 'invite_only'];
    const level = levels[Number(e.detail.value)] ?? 'freebusy';
    wx.showLoading({ title: '更新中...' });
    try {
      await shareStore.updateRecipient(id, { level });
      wx.showToast({ title: '已更新', icon: 'success' });
    } catch (e) {
      wx.showToast({ title: errorMsg(e), icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  async onToggleStealth() {
    wx.showLoading({ title: '处理中...' });
    try {
      if (this.data.stealthEnabled) {
        await shareStore.disableStealth();
        wx.showToast({ title: '已恢复可见', icon: 'success' });
      } else {
        await shareStore.enableStealth();
        wx.showToast({ title: '已隐身', icon: 'success' });
      }
      this.computeStealthRemaining();
    } catch (e) {
      wx.showToast({ title: errorMsg(e), icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  computeStealthRemaining() {
    const { stealthEnabled, stealthExpiresAt } = this.data;
    if (!stealthEnabled || !stealthExpiresAt) {
      this.setData({ stealthRemaining: '' });
      return;
    }
    const expireTime = new Date(stealthExpiresAt).getTime();
    const now = Date.now();
    const diff = expireTime - now;
    if (diff <= 0) {
      this.setData({ stealthRemaining: '已到期' });
      return;
    }
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    this.setData({
      stealthRemaining: `剩余 ${hours}:${String(minutes).padStart(2, '0')}`,
    });
  },

  onDialogInnerTap() { /* stop propagation */ },
});
