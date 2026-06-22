
import { getSettings, updateSettings, deleteBlock } from '../../../services/api';
import { DURATION_OPTIONS, APP_CONFIG } from '../../../utils/config';
import { storage, SERVER_URL } from '../../../utils/storage';
import { errorMsg } from '../../../utils/error';
import { authStore } from '../../../stores/authStore';
import { userStore } from '../../../stores/userStore';
import { blockStore } from '../../../stores/blockStore';
import { approvalStore } from '../../../stores/approvalStore';
import { logError } from '../../../utils/logError';
const REMINDER_OPTIONS = [
  { value: 0, label: '不用提醒' },
  { value: 5, label: '5 分钟前' },
  { value: 15, label: '15 分钟前' },
  { value: 30, label: '30 分钟前' },
  { value: 60, label: '1 小时前' },
];

const CATEGORY_OPTIONS = [
  { value: 'work', label: '工作' },
  { value: 'life', label: '生活' },
  { value: 'private', label: '自有' },
  { value: 'last', label: '记住上次' },
];

const WEEK_START_OPTIONS = [
  { value: 1, label: '周一' },
  { value: 0, label: '周日' },
];


const MARITAL_OPTIONS = [
  { value: '', label: '不显示' },
  { value: 'single', label: '单身' },
  { value: 'married', label: '已婚' },
  { value: 'divorced', label: '离异' },
  { value: 'widowed', label: '丧偶' },
];

function findMaritalIndex(val: string): number {
  const idx = MARITAL_OPTIONS.findIndex((o) => o.value === val);
  return idx >= 0 ? idx : 0;
}

interface SettingsPageData {
  dayStartsAt: string;
  reminderLeadMinutes: number;
  defaultNature: string;
  reminderIndex: number;
  reminderLabel: string;
  reminderOptions: { value: number; label: string }[];
  saving: boolean;
  defaultDuration: string;
  defaultDurationIndex: number;
  defaultDurationLabel: string;
  defaultCategory: string;
  defaultCategoryIndex: number;
  defaultCategoryLabel: string;
  weekStartsOn: number;
  weekStartsOnIndex: number;
  weekStartsOnLabel: string;
  weeklyReportEnabled: boolean;
  weeklyReportTime: string;
  privacyFallback: string;
  DURATION_OPTIONS: { value: string; label: string }[];
  CATEGORY_OPTIONS: { value: string; label: string }[];
  WEEK_START_OPTIONS: { value: number; label: string }[];
  MARITAL_OPTIONS: { value: string; label: string }[];
  age: string;
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed' | '';
  maritalIndex: number;
  maritalLabel: string;
  spouseName: string;
  residence: string;
  company: string;
  occupation: string;
  serverUrl: string;
  showDevSettings: boolean;
}

interface SettingsPageMethods {
  onDayStartsAtChange: (e: WechatMiniprogram.CustomEvent) => void;
  onReminderChange: (e: WechatMiniprogram.CustomEvent) => void;
  onNatureChange: (e: WechatMiniprogram.TouchEvent) => void;
  onSave: () => Promise<void>;
  onDurationChange: (e: WechatMiniprogram.CustomEvent) => void;
  onCategoryChange: (e: WechatMiniprogram.CustomEvent) => void;
  onWeekStartsOnChange: (e: WechatMiniprogram.CustomEvent) => void;
  onAgeInput: (e: WechatMiniprogram.Input) => void;
  onMaritalChange: (e: WechatMiniprogram.CustomEvent) => void;
  onSpouseInput: (e: WechatMiniprogram.Input) => void;
  onResidenceInput: (e: WechatMiniprogram.Input) => void;
  onCompanyInput: (e: WechatMiniprogram.Input) => void;
  onOccupationInput: (e: WechatMiniprogram.Input) => void;
  onWeeklyReportToggle: () => void;
  onWeeklyReportTimeChange: (e: WechatMiniprogram.CustomEvent) => void;
  onPrivacyFallbackChange: (e: WechatMiniprogram.TouchEvent) => void;
  onUserAgreementTap: () => void;
  onPrivacyPolicyTap: () => void;
  onServerUrlInput: (e: WechatMiniprogram.Input) => void;
  onSaveServerUrl: () => void;
  onToggleDevSettings: () => void;
  clearAllData: () => Promise<void>;
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
    defaultDuration: '1h',
    defaultDurationIndex: 1,
    defaultDurationLabel: '1 小时',
    defaultCategory: 'last',
    defaultCategoryIndex: 3,
    defaultCategoryLabel: '记住上次',
    weekStartsOn: 1,
    weekStartsOnIndex: 0,
    weekStartsOnLabel: '周一',
    weeklyReportEnabled: true,
    weeklyReportTime: '08:30',
    privacyFallback: 'PUBLIC',
    DURATION_OPTIONS,
    CATEGORY_OPTIONS,
    WEEK_START_OPTIONS,
    MARITAL_OPTIONS,
    age: '',
    maritalStatus: '',
    maritalIndex: 0,
    maritalLabel: '不显示',
    spouseName: '',
    residence: '',
    company: '',
    occupation: '',
    serverUrl: APP_CONFIG.getBaseUrl(),
    showDevSettings: false,
  },

  async onLoad() {
    try {
      const settings = await getSettings();
      const ridx = REMINDER_OPTIONS.findIndex((o) => o.value === settings.reminderLeadMinutes);
      const didx = DURATION_OPTIONS.findIndex((o) => o.value === settings.defaultDuration);
      const cidx = CATEGORY_OPTIONS.findIndex((o) => o.value === settings.defaultCategory);
      const widx = WEEK_START_OPTIONS.findIndex((o) => o.value === settings.weekStartsOn);
      const midx = findMaritalIndex(settings.maritalStatus || '');
      this.setData({
        dayStartsAt: settings.dayStartsAt,
        reminderLeadMinutes: settings.reminderLeadMinutes,
        defaultNature: settings.defaultNature,
        reminderIndex: ridx >= 0 ? ridx : 2,
        reminderLabel: ridx >= 0 ? REMINDER_OPTIONS[ridx].label : `${settings.reminderLeadMinutes} 分钟前`,
        defaultDuration: settings.defaultDuration,
        defaultDurationIndex: didx >= 0 ? didx : 1,
        defaultDurationLabel: didx >= 0 ? DURATION_OPTIONS[didx].label : '1 小时',
        defaultCategory: settings.defaultCategory,
        defaultCategoryIndex: cidx >= 0 ? cidx : 3,
        defaultCategoryLabel: cidx >= 0 ? CATEGORY_OPTIONS[cidx].label : '记住上次',
        weekStartsOn: settings.weekStartsOn,
        weekStartsOnIndex: widx >= 0 ? widx : 0,
        weekStartsOnLabel: widx >= 0 ? WEEK_START_OPTIONS[widx].label : '周一',
        weeklyReportEnabled: settings.weeklyReportEnabled !== undefined ? settings.weeklyReportEnabled : true,
        weeklyReportTime: settings.weeklyReportTime || '08:30',
        privacyFallback: settings.privacyFallback || 'PUBLIC',
        age: settings.age !== undefined ? String(settings.age) : '',
        maritalStatus: (settings.maritalStatus || '') as '' | 'single' | 'married' | 'divorced' | 'widowed',
        maritalIndex: midx,
        maritalLabel: MARITAL_OPTIONS[midx].label,
        spouseName: settings.spouseName || '',
        residence: settings.residence || '',
        company: settings.company || '',
        occupation: settings.occupation || '',
      });
    } catch (e) {
      logError('mine_settings', e);
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

  onDurationChange(e: WechatMiniprogram.CustomEvent) {
    const idx = parseInt(e.detail.value, 10);
    const opt = DURATION_OPTIONS[idx];
    if (opt) {
      this.setData({ defaultDuration: opt.value, defaultDurationIndex: idx, defaultDurationLabel: opt.label });
    }
  },

  onCategoryChange(e: WechatMiniprogram.CustomEvent) {
    const idx = parseInt(e.detail.value, 10);
    const opt = CATEGORY_OPTIONS[idx];
    if (opt) {
      this.setData({ defaultCategory: opt.value, defaultCategoryIndex: idx, defaultCategoryLabel: opt.label });
    }
  },

  onWeekStartsOnChange(e: WechatMiniprogram.CustomEvent) {
    const idx = parseInt(e.detail.value, 10);
    const opt = WEEK_START_OPTIONS[idx];
    if (opt) {
      this.setData({ weekStartsOn: opt.value, weekStartsOnIndex: idx, weekStartsOnLabel: opt.label });
    }
  },

  onAgeInput(e: WechatMiniprogram.Input) {
    this.setData({ age: e.detail.value });
  },

  onMaritalChange(e: WechatMiniprogram.CustomEvent) {
    const idx = parseInt(e.detail.value, 10);
    const opt = MARITAL_OPTIONS[idx];
    if (opt) {
      this.setData({ maritalStatus: opt.value as '' | 'single' | 'married' | 'divorced' | 'widowed', maritalIndex: idx, maritalLabel: opt.label });
    }
  },

  onSpouseInput(e: WechatMiniprogram.Input) {
    this.setData({ spouseName: e.detail.value });
  },

  onResidenceInput(e: WechatMiniprogram.Input) {
    this.setData({ residence: e.detail.value });
  },

  onCompanyInput(e: WechatMiniprogram.Input) {
    this.setData({ company: e.detail.value });
  },

  onOccupationInput(e: WechatMiniprogram.Input) {
    this.setData({ occupation: e.detail.value });
  },

  onWeeklyReportToggle() {
    this.setData({ weeklyReportEnabled: !this.data.weeklyReportEnabled });
  },

  onWeeklyReportTimeChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ weeklyReportTime: e.detail.value });
  },

  onPrivacyFallbackChange(e: WechatMiniprogram.TouchEvent) {
    this.setData({ privacyFallback: e.currentTarget.dataset.value as string });
  },

  onUserAgreementTap() {
    wx.showToast({ title: '用户协议（待完善）', icon: 'none' });
  },

  onPrivacyPolicyTap() {
    wx.showToast({ title: '隐私政策（待完善）', icon: 'none' });
  },

  async onSave() {
    if (this.data.saving) return;
    this.setData({ saving: true });
    try {
      const { dayStartsAt, reminderLeadMinutes, defaultNature, defaultDuration, defaultCategory, weekStartsOn } = this.data;
      const { age, maritalStatus, spouseName, residence, company, occupation } = this.data;
      const { weeklyReportEnabled, weeklyReportTime, privacyFallback } = this.data;
      await updateSettings({
        dayStartsAt, reminderLeadMinutes, defaultNature, defaultDuration, defaultCategory, weekStartsOn,
        weeklyReportEnabled, weeklyReportTime, privacyFallback,
        ...(age ? { age: parseInt(age, 10) } : {}),
        ...(maritalStatus ? { maritalStatus: maritalStatus as 'single' | 'married' | 'divorced' | 'widowed' } : {}),
        ...(spouseName ? { spouseName } : {}),
        ...(residence ? { residence } : {}),
        ...(company ? { company } : {}),
        ...(occupation ? { occupation } : {}),
      });
      wx.showToast({ title: '已保存', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (e) {
      wx.showToast({ title: errorMsg(e) || '保存失败', icon: 'none' });
    } finally {
      this.setData({ saving: false });
    }
  },

  onServerUrlInput(e: WechatMiniprogram.Input) {
    this.setData({ serverUrl: e.detail.value });
  },

  onSaveServerUrl() {
    const url = this.data.serverUrl.trim();
    if (!url) {
      storage.remove(SERVER_URL);
    } else {
      storage.set(SERVER_URL, url);
    }
    wx.showToast({ title: '服务器地址已设置', icon: 'success' });
  },

  onToggleDevSettings() {
    this.setData({ showDevSettings: !this.data.showDevSettings });
  },

  async clearAllData() {
    const confirmed = await new Promise<boolean>((resolve) => {
      wx.showModal({
        title: '确认清除',
        content: '这将永久删除所有日程、审批和协作数据，且不可恢复。确定继续吗？',
        confirmText: '清除所有数据',
        confirmColor: '#e74c3c',
        success: (res) => resolve(res.confirm),
      });
    });
    if (!confirmed) return;
    this.setData({ clearing: true });
    try {
      // Delete all blocks, approvals, etc. via API
      const blocks = blockStore.blocks;
      for (const b of blocks) {
        await deleteBlock(b.id);
      }
      // Clear auth and stores
      authStore.clearToken();
      userStore.clearUser();
      blockStore.clearAll();
      approvalStore.clearAll();
      // Clear storage
      wx.clearStorageSync();
      wx.reLaunch({ url: '/pages/landing/ai-preview/index' });
    } catch (e) {
      logError('mine_settings', e);
      wx.showToast({ title: '清除失败', icon: 'none' });
    } finally {
      this.setData({ clearing: false });
    }
  },
});