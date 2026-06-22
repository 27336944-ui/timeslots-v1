import { approvalStore } from '../stores/approvalStore';

export const ApprovalFormBehavior = Behavior({
  data: {
    showApprovalSheet: false,
    approvalPhoneInput: '',
    approvalPhoneList: [] as string[],
  },

  methods: {
    onApproveTap() {
      this.setData({ showApprovalSheet: true, approvalPhoneInput: '', approvalPhoneList: [] });
    },

    onApprovalPhoneInput(e: WechatMiniprogram.Input) {
      this.setData({ approvalPhoneInput: e.detail.value });
    },

    onApprovalAddPhone() {
      const phone: string = (this.data as Record<string, unknown>).approvalPhoneInput as string || '';
      const trimmed = phone.trim();
      const phoneList: string[] = (this.data as Record<string, unknown>).approvalPhoneList as string[] || [];
      if (!trimmed || trimmed.length < 11) {
        wx.showToast({ title: '请输入完整手机号', icon: 'none' });
        return;
      }
      if (phoneList.includes(trimmed)) {
        wx.showToast({ title: '该手机号已添加', icon: 'none' });
        return;
      }
      this.setData({
        approvalPhoneList: [...phoneList, trimmed],
        approvalPhoneInput: '',
      });
    },

    onApprovalRemovePhone(e: WechatMiniprogram.TouchEvent) {
      const value = e.currentTarget.dataset.value as string;
      const phoneList: string[] = (this.data as Record<string, unknown>).approvalPhoneList as string[] || [];
      this.setData({ approvalPhoneList: phoneList.filter((p: string) => p !== value) });
    },

    onApprovalClose() {
      this.setData({ showApprovalSheet: false });
    },

    async onApprovalSubmit() {
      const blockId: string = (this.data as Record<string, unknown>).blockId as string || '';
      const phoneList: string[] = (this.data as Record<string, unknown>).approvalPhoneList as string[] || [];
      if (phoneList.length === 0) {
        wx.showToast({ title: '请添加至少一个手机号', icon: 'none' });
        return;
      }
      const recipients = phoneList.map((p: string) => ({ contactType: 'phone' as const, contactValue: p }));
      try {
        wx.showLoading({ title: '发起中...' });
        await approvalStore.createApproval(blockId, recipients);
        wx.hideLoading();
        this.setData({ showApprovalSheet: false });
        wx.showToast({ title: '已发起审批', icon: 'success', duration: 1500 });
      } catch (err) {
        wx.hideLoading();
        wx.showToast({ title: (err as Error).message || '发起失败', icon: 'none' });
      }
    },
  },
});
