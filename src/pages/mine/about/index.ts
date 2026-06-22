
import { APP_CONFIG } from '../../../utils/config';

const APP_VERSION = APP_CONFIG.APP_VERSION;

interface AboutPageData {
  appVersion: string;
}

interface AboutPageMethods {
  onCopyVersion: () => void;
  onUserAgreementTap: () => void;
  onPrivacyPolicyTap: () => void;
}

Page<AboutPageData, AboutPageMethods>({
  data: {
    appVersion: APP_VERSION,
  },

  onCopyVersion() {
    wx.setClipboardData({
      data: APP_VERSION,
      success: () => wx.showToast({ title: '版本号已复制', icon: 'success' }),
    });
  },

  onUserAgreementTap() {
    wx.showToast({ title: '用户协议（待完善）', icon: 'none' });
  },

  onPrivacyPolicyTap() {
    wx.showToast({ title: '隐私政策（待完善）', icon: 'none' });
  },
});