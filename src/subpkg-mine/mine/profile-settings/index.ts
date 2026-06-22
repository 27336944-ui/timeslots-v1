import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { getSettings, updateSettings } from '../../../services/api';
import { userStore } from '../../../stores/userStore';
import { errorMsg } from '../../../utils/error';
import { logError } from '../../../utils/logError';

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

interface ProfileSettingsPageData {
  userAvatar: string;
  userNickname: string;
  userNicknameFirstChar: string;
  age: string;
  maritalStatus: '' | 'single' | 'married' | 'divorced' | 'widowed';
  maritalIndex: number;
  maritalLabel: string;
  spouseName: string;
  residence: string;
  company: string;
  occupation: string;
  saving: boolean;
  MARITAL_OPTIONS: { value: string; label: string }[];
}

interface ProfileSettingsMethods {
  userBindings?: { destroyStoreBindings: () => void };
  onAgeInput: (e: WechatMiniprogram.Input) => void;
  onMaritalChange: (e: WechatMiniprogram.CustomEvent) => void;
  onSpouseInput: (e: WechatMiniprogram.Input) => void;
  onResidenceInput: (e: WechatMiniprogram.Input) => void;
  onCompanyInput: (e: WechatMiniprogram.Input) => void;
  onOccupationInput: (e: WechatMiniprogram.Input) => void;
  onSave: () => Promise<void>;
  _syncUserFromStore: () => void;
  _loadSettings: () => Promise<void>;
}

Page<ProfileSettingsPageData, ProfileSettingsMethods>({
  data: {
    userAvatar: '',
    userNickname: '',
    userNicknameFirstChar: '',
    age: '',
    maritalStatus: '',
    maritalIndex: 0,
    maritalLabel: '不显示',
    spouseName: '',
    residence: '',
    company: '',
    occupation: '',
    saving: false,
    MARITAL_OPTIONS,
  },

  onLoad() {
    this.userBindings = createStoreBindings(this, {
      store: userStore,
      fields: ['user'],
    });
    this._syncUserFromStore();
    this._loadSettings();
  },

  onShow() {
    this._syncUserFromStore();
  },

  onUnload() {
    if (this.userBindings) {
      this.userBindings.destroyStoreBindings();
    }
  },

  _syncUserFromStore() {
    const user = userStore.user;
    if (user) {
      this.setData({
        userAvatar: user.avatar || '',
        userNickname: user.nickname || '',
        userNicknameFirstChar: user.nickname ? user.nickname[0] : '',
      });
    }
  },

  async _loadSettings() {
    try {
      const settings = await getSettings();
      const midx = findMaritalIndex(settings.maritalStatus || '');
      this.setData({
        age: settings.age !== undefined ? String(settings.age) : '',
        maritalStatus: (settings.maritalStatus || '') as '' | 'single' | 'married' | 'divorced' | 'widowed',
        maritalIndex: midx,
        maritalLabel: MARITAL_OPTIONS[midx]?.label || '不显示',
        spouseName: settings.spouseName || '',
        residence: settings.residence || '',
        company: settings.company || '',
        occupation: settings.occupation || '',
      });
    } catch (e) {
      logError('mine_profile-settings', e);
      // non-critical
    }
  },

  onAgeInput(e: WechatMiniprogram.Input) {
    this.setData({ age: e.detail.value });
  },

  onMaritalChange(e: WechatMiniprogram.CustomEvent) {
    const idx = parseInt(e.detail.value, 10);
    const opt = MARITAL_OPTIONS[idx];
    if (opt) {
      this.setData({
        maritalStatus: opt.value as '' | 'single' | 'married' | 'divorced' | 'widowed',
        maritalIndex: idx,
        maritalLabel: opt.label,
      });
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

  async onSave() {
    if (this.data.saving) return;
    this.setData({ saving: true });
    try {
      const { age, maritalStatus, spouseName, residence, company, occupation } = this.data;
      await updateSettings({
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
});
