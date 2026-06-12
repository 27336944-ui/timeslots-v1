
import { getSettings, updateSettings } from '../../../services/api';


const REMINDER_OPTIONS = [
  { value: 0, label: '无提醒' },
  { value: 5, label: '5 分钟前' },
  { value: 15, label: '15 分钟前' },
  { value: 30, label: '30 分钟前' },
  { value: 60, label: '1 小时前' },
];


interface SettingsPageData {
  dayStartsAt: string;
  reminderLeadMinutes: number;
  defaultNature: string;
  reminderIndex: number;
  reminderLabel: string;
  reminderOptions: { value: number; label: string }[];
  saving: boolean;
}

interface SettingsPageMethods {
  onDayStartsAtChange: (e: WechatMiniprogram.CustomEvent) => void;
  onReminderChange: (e: WechatMiniprogram.CustomEvent) => void;
  onNatureChange: (e: WechatMiniprogram.TouchEvent) => void;
  onSave: () => Promise<void>;
}


Page<SettingsPageData, SettingsPageMethods>({
  data: {
    dayStartsAt: '06:00',
    reminderLeadMinutes: 15,
    defaultNature: 'PUBLIC',
    reminderIndex: 2,
    reminderLabel: '15 分钟前',
    reminderOptions: REMINDER_OPTIONS,
    saving: false,
  },

  async onLoad() {
    try {
      const settings = await getSettings();
      const idx = REMINDER_OPTIONS.findIndex((o) => o.value === settings.reminderLeadMinutes);
      this.setData({
        dayStartsAt: settings.dayStartsAt,
        reminderLeadMinutes: settings.reminderLeadMinutes,
        defaultNature: settings.defaultNature,
        reminderIndex: idx >= 0 ? idx : 2,
        reminderLabel: idx >= 0 ? REMINDER_OPTIONS[idx].label : `${settings.reminderLeadMinutes} 分钟前`,
      });
    } catch {
      wx.showToast({ title: '加载设置失败', icon: 'none' });
    }
  },

  onDayStartsAtChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ dayStartsAt: e.detail.value });
  },

  onReminderChange(e: WechatMiniprogram.CustomEvent) {
    const idx = parseInt(e.detail.value, 10);
    const opt = REMINDER_OPTIONS[idx];
    if (opt) {
      this.setData({ reminderLeadMinutes: opt.value, reminderIndex: idx, reminderLabel: opt.label });
    }
  },

  onNatureChange(e: WechatMiniprogram.TouchEvent) {
    this.setData({ defaultNature: e.currentTarget.dataset.value as string });
  },

  async onSave() {
    if (this.data.saving) return;
    this.setData({ saving: true });
    try {
      const { dayStartsAt, reminderLeadMinutes, defaultNature } = this.data;
      await updateSettings({ dayStartsAt, reminderLeadMinutes, defaultNature });
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (e) {
      wx.showToast({ title: (e as Error).message || '保存失败', icon: 'none' });
    } finally {
      this.setData({ saving: false });
    }
  },
});
