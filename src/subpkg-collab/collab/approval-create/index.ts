/**
 * @deprecated 鏃ョ▼璇︽儏椤靛凡鍐呯疆 approval-sheet锛岀嫭绔嬮〉鍚庣画绉婚櫎銆?
 * 淇濈暀闃舵�碉細v0.49-v0.50锛屽緟鐙�绔嬮〉鐢ㄦ埛杩佺Щ鍚庢竻鐞嗐�?
 */
import { approvalStore } from '../../../stores/approvalStore';
import { userStore } from '../../../stores/userStore';
import type { RecipientInput } from '../../../types/approval';
import { errorMsg } from '../../../utils/error';


interface CreatePageData {
  blockId: string;
  blockTitle: string;
  blockStartTime: string;
  blockEndTime: string;
  contactTab: string;
  phoneInput: string;
  phoneList: string[];
  recipients: RecipientInput[];
  showShareHint: boolean;
  shareToken: string;
}

interface CreatePageMethods {
  onTabPhone: () => void;
  onTabFriend: () => void;
  onTabQR: () => void;
  onPhoneInput: (e: WechatMiniprogram.Input) => void;
  onAddPhone: () => void;
  onRemovePhone: (e: WechatMiniprogram.TouchEvent) => void;
  onSubmit: () => Promise<void>;
  onShareAppMessage: () => WechatMiniprogram.Page.ICustomShareContent;
  onBack: () => void;
}


Page<CreatePageData, CreatePageMethods>({
  data: {
    blockId: '',
    blockTitle: '',
    blockStartTime: '',
    blockEndTime: '',
    contactTab: 'phone',
    phoneInput: '',
    phoneList: [],
    recipients: [],
    showShareHint: false,
    shareToken: '',
  },

  onLoad(options: Record<string, string>) {
    const blockId = options.blockId as string;
    const title = options.title as string;
    const startTime = options.startTime as string;
    const endTime = options.endTime as string;
    this.setData({
      blockId,
      blockTitle: decodeURIComponent(title || ''),
      blockStartTime: decodeURIComponent(startTime || ''),
      blockEndTime: decodeURIComponent(endTime || ''),
    });
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    const token = this.data.shareToken;
    const nickname = userStore.user?.nickname || '好友';
    const title = this.data.blockTitle || '日程';
    if (token) {
      return {
        title: `${title} - 来自 ${nickname} 的日程邀请`,
        path: `/pages/collab/approval-share/index?token=${token}`,
      };
    }
    return {
      title: `${title} - 来自 ${nickname} 的日程邀请`,
      path: `/pages/collab/approval-create/index?blockId=${this.data.blockId}&title=${encodeURIComponent(this.data.blockTitle)}&startTime=${encodeURIComponent(this.data.blockStartTime)}&endTime=${encodeURIComponent(this.data.blockEndTime)}`,
    };
  },

  onBack() {
    wx.navigateBack();
  },

  onTabPhone() {
    this.setData({ contactTab: 'phone' });
  },

  onTabFriend() {
    this.setData({ contactTab: 'friend' });
  },

  onTabQR() {
    this.setData({ contactTab: 'qr' });
  },

  onPhoneInput(e: WechatMiniprogram.Input) {
    const val = e.detail.value;
    this.setData({ phoneInput: val });
    if (val.length === 11 && /^1\d{10}$/.test(val)) {
      this.onAddPhone();
    }
  },

  onAddPhone() {
    const phone = this.data.phoneInput.trim();
    if (!phone || phone.length < 11) {
      wx.showToast({ title: '请输入完整手机号', icon: 'none' });
      return;
    }
    if (this.data.phoneList.includes(phone)) {
      wx.showToast({ title: '该手机号已添加', icon: 'none' });
      return;
    }
    const newList = [...this.data.phoneList, phone];
    const newRecipients: RecipientInput[] = newList.map((p) => ({
      contactType: 'phone',
      contactValue: p,
    }));
    this.setData({
      phoneList: newList,
      recipients: newRecipients,
      phoneInput: '',
    });
  },

  onRemovePhone(e: WechatMiniprogram.TouchEvent) {
    const value = e.currentTarget.dataset.value as string;
    const newList = this.data.phoneList.filter((p) => p !== value);
    const newRecipients: RecipientInput[] = newList.map((p) => ({
      contactType: 'phone',
      contactValue: p,
    }));
    this.setData({
      phoneList: newList,
      recipients: newRecipients,
    });
  },

  async onSubmit() {
    const { blockId, recipients, contactTab } = this.data;
    const allRecipients = [...recipients];

    if (contactTab === 'friend') {
      allRecipients.push({ contactType: 'friend' });
    }
    if (contactTab === 'qr') {
      allRecipients.push({ contactType: 'qr' });
    }

    if (allRecipients.length === 0) {
      wx.showToast({ title: '请添加至少一位受邀人', icon: 'none' });
      return;
    }

    try {
      wx.showLoading({ title: '发起中...' });
      const result = await approvalStore.createApproval(blockId, allRecipients);
      wx.hideLoading();

      if (allRecipients.some((r) => r.contactType === 'friend')) {
        this.setData({ showShareHint: true, shareToken: result.shareToken });
        wx.showToast({ title: '邀请已发起', icon: 'success' });
      } else {
        wx.showToast({ title: '已发起邀请', icon: 'success' });
        wx.navigateBack();
      }
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: errorMsg(err) || '发起失败', icon: 'none' });
    }
  },
});
