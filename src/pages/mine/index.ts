import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { authStore } from '../../stores/authStore';
import { userStore } from '../../stores/userStore';
import { storage } from '../../utils/storage';
import { APP_CONFIG } from '../../utils/config';
import { errorMsg } from '../../utils/error';
import { logError } from '../../utils/logError';
import { login, wxLogin, migrateDevData, deleteDevData, restoreAccount, deleteAccount, getTaskStats, getSettings } from '../../services/api';

const APP_VERSION = APP_CONFIG.APP_VERSION;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface MinePageData {
  userId: string;
  loading: boolean;
  wxLoading: boolean;
  showMigrationModal: boolean;
  devUserId: string;
  migrating: boolean;
  showRestoreModal: boolean;
  restoreUserId: string;
  restoring: boolean;
  stats: { total: number; done: number; overdue: number; weekDue: number } | null;
  personalTags: string[];
  personalTagsStr: string;
  appVersion: string;
  showSubpage: boolean;
  showLogoutModal: boolean;
  loggingOut: boolean;
  showDeleteModal: boolean;
  deleting: boolean;
}

interface MinePageMethods {
  storeBindings?: { destroyStoreBindings: () => void };
  userBindings?: { destroyStoreBindings: () => void };
  onLoad: () => void;
  onShow: () => void;
  onUnload: () => void;
  onUserIdInput: (e: WechatMiniprogram.Input) => void;
  onDevUserIdInput: (e: WechatMiniprogram.Input) => void;
  onLoginTap: () => Promise<void>;
  onWxLoginTap: () => Promise<void>;
  showMigrationDialog: () => void;
  onMigrateConfirm: () => Promise<void>;
  onMigrateSkip: () => Promise<void>;
  onRestoreTap: () => Promise<void>;
  onRestoreCancel: () => void;
  noop: () => void;
  onProfileCardTap: () => void;
  onBackFromProfile: () => void;
  onSettingsTap: () => void;
  onEditProfileTap: () => void;
  onNamecardTap: () => void;
  onClassificationsTap: () => void;
  onTransparencyTap: () => void;
  onAboutTap: () => void;
  onLogoutTap: () => void;
  confirmLogout: () => void;
  onCloseLogoutModal: () => void;
  onDeleteAccountTap: () => void;
  confirmDeleteAccount: () => Promise<void>;
  onCloseDeleteModal: () => void;
  onOverlayTap: (e: WechatMiniprogram.TouchEvent) => void;
  loadStats: () => Promise<void>;
  loadProfile: () => Promise<void>;
}

Page<MinePageData, MinePageMethods>({
  data: {
    userId: '',
    loading: false,
    wxLoading: false,
    showMigrationModal: false,
    devUserId: '',
    migrating: false,
    showRestoreModal: false,
    restoreUserId: '',
    restoring: false,
    stats: null,
    personalTags: [],
    personalTagsStr: '',
    appVersion: APP_VERSION,

    showSubpage: false,
    showLogoutModal: false,
    loggingOut: false,
    showDeleteModal: false,
    deleting: false,
  },

  onLoad() {
    this.storeBindings = createStoreBindings(this, {
      store: authStore,
      fields: ['token', 'isLoggedIn', 'wxLoggingIn'],
    });
    this.userBindings = createStoreBindings(this, {
      store: userStore,
      fields: ['user'],
    });
  },

  onShow() {
    (this as unknown as WechatMiniprogram.Page.TrivialInstance).getTabBar?.().setData({ selected: 3 });
    if (authStore.isLoggedIn) {
      this.loadStats();
      this.loadProfile();
    }
  },

  onUnload() {
    this.storeBindings!.destroyStoreBindings();
    this.userBindings!.destroyStoreBindings();
  },

  onUserIdInput(e: WechatMiniprogram.Input) {
    this.setData({ userId: e.detail.value });
  },

  onDevUserIdInput(e: WechatMiniprogram.Input) {
    this.setData({ devUserId: e.detail.value });
  },

  async onLoginTap() {
    if (this.data.loading) return;
    const id = this.data.userId.trim();
    if (!id) {
      wx.showToast({ title: '请输入用户 ID', icon: 'none' });
      return;
    }
    if (!UUID_RE.test(id)) {
      wx.showToast({ title: '请输入有效的用户 ID（UUID 格式）', icon: 'none' });
      return;
    }
    this.setData({ loading: true });
    try {
      const res = await login(id);
      authStore.setToken(res.accessToken);
      userStore.setUser(res.user);
      wx.showToast({ title: '欢迎回来', icon: 'success' });
      this.setData({ userId: '' });
    } catch (e) {
      const msg = errorMsg(e) || '登录失败';
      if (msg.includes('账号待删除')) {
        this.setData({ showRestoreModal: true, restoreUserId: id });
      } else {
        wx.showToast({ title: msg, icon: 'none' });
      }
    } finally {
      this.setData({ loading: false });
    }
  },

  async onWxLoginTap() {
    if (this.data.wxLoading) return;
    this.setData({ wxLoading: true });
    try {
      const { code } = await wx.login();
      if (!code) {
        throw new Error('获取 code 失败');
      }
      const res = await wxLogin(code);
      authStore.setToken(res.accessToken);
      userStore.setUser(res.user);

      wx.showToast({ title: '欢迎回来', icon: 'success' });
      this.showMigrationDialog();
    } catch (e) {
      const wxErr = e as WechatMiniprogram.GeneralCallbackResult;
      const msg = wxErr.errMsg || errorMsg(e) || '微信登录失败';
      wx.showToast({ title: msg, icon: 'none' });
    } finally {
      this.setData({ wxLoading: false });
    }
  },

  showMigrationDialog() {
    const shown = storage.get('migration_shown');
    if (shown) return;
    this.setData({ showMigrationModal: true, devUserId: '' });
  },

  async onMigrateConfirm() {
    const id = this.data.devUserId.trim();
    if (!id) {
      wx.showToast({ title: '请输入旧 Dev 用户 ID', icon: 'none' });
      return;
    }
    if (!UUID_RE.test(id)) {
      wx.showToast({ title: 'UUID 格式不正确', icon: 'none' });
      return;
    }
    this.setData({ migrating: true });
    try {
      await migrateDevData(id);
      wx.showToast({ title: '数据迁移成功', icon: 'success' });
      this.setData({ showMigrationModal: false });
      storage.set('migration_shown', true);
    } catch (e) {
      wx.showToast({ title: errorMsg(e) || '迁移失败', icon: 'none' });
    } finally {
      this.setData({ migrating: false });
    }
  },

  async onMigrateSkip() {
    const id = this.data.devUserId.trim();
    if (id && UUID_RE.test(id)) {
      this.setData({ migrating: true });
      try {
        await deleteDevData(id);
      } catch (e) {
        logError('mine deleteDevData', e);
      } finally {
        this.setData({ migrating: false });
      }
    }
    this.setData({ showMigrationModal: false });
    storage.set('migration_shown', true);
  },

  async onRestoreTap() {
    const id = this.data.restoreUserId.trim() || this.data.userId.trim();
    if (!UUID_RE.test(id)) {
      wx.showToast({ title: '无效的用户 ID', icon: 'none' });
      return;
    }
    const restoreToken = storage.get('restore_token');
    if (!restoreToken) {
      wx.showToast({ title: '未找到恢复令牌，请通过管理员恢复', icon: 'none' });
      return;
    }
    this.setData({ restoring: true });
    try {
      const res = await restoreAccount(id, restoreToken);
      storage.remove('restore_token');
      authStore.setToken(res.accessToken);
      userStore.setUser(res.user);
      wx.showToast({ title: '账号已恢复', icon: 'success' });
      this.setData({ showRestoreModal: false, restoreUserId: '' });
    } catch (e) {
      wx.showToast({ title: errorMsg(e) || '恢复失败', icon: 'none' });
    } finally {
      this.setData({ restoring: false });
    }
  },

  onRestoreCancel() {
    this.setData({ showRestoreModal: false, restoreUserId: '' });
  },

  noop() {},

  // ===== 子页导航 =====
  onProfileCardTap() {
    this.setData({ showSubpage: true });
  },

  onBackFromProfile() {
    this.setData({ showSubpage: false });
  },

  // ===== 功能入口（直接跳转，无需 ActionSheet） =====
  onSettingsTap() {
    wx.navigateTo({ url: '/pages/mine/settings/index' });
  },

  onEditProfileTap() {
    wx.navigateTo({ url: '/pages/mine/profile-settings/index' });
  },

  onNamecardTap() {
    wx.navigateTo({ url: '/pages/mine/namecard/index' });
  },

  onClassificationsTap() {
    wx.navigateTo({ url: '/pages/mine/classifications/index' });
  },

  onTransparencyTap() {
    wx.navigateTo({ url: '/pages/mine/transparency/index' });
  },

  onAboutTap() {
    wx.navigateTo({ url: '/pages/mine/about/index' });
  },

  // ===== 退出登录（子页内） =====
  onLogoutTap() {
    this.setData({ showSubpage: false, showLogoutModal: true });
  },

  confirmLogout() {
    if (this.data.loggingOut) return;
    this.setData({ loggingOut: true });
    authStore.clearToken();
    userStore.clearUser();
    wx.showToast({ title: '已退出', icon: 'success' });
    this.setData({ loggingOut: false, showLogoutModal: false });
  },

  onCloseLogoutModal() {
    this.setData({ showLogoutModal: false });
  },

  // ===== 注销账号（子页内） =====
  onDeleteAccountTap() {
    this.setData({ showSubpage: false, showDeleteModal: true });
  },

  async confirmDeleteAccount() {
    if (this.data.deleting) return;
    this.setData({ deleting: true });
    try {
      const result = await deleteAccount();
      storage.set('restore_token', result.restoreToken);
      authStore.clearToken();
      userStore.clearUser();
      wx.showToast({ title: '账号已注销', icon: 'success' });
      this.setData({ showDeleteModal: false, deleting: false });
    } catch (e) {
      wx.showToast({ title: errorMsg(e) || '注销失败', icon: 'none' });
      this.setData({ deleting: false });
    }
  },

  onCloseDeleteModal() {
    this.setData({ showDeleteModal: false });
  },

  // ===== 遮罩点击关闭 =====
  onOverlayTap(e: WechatMiniprogram.TouchEvent) {
    const target = e.currentTarget.dataset.target as string;
    if (target === 'logout') {
      this.setData({ showLogoutModal: false });
    } else if (target === 'delete') {
      this.setData({ showDeleteModal: false });
    }
  },

  // ===== 数据加载 =====
  async loadStats() {
    try {
      const s = await getTaskStats();
      this.setData({
        stats: { total: s.total, done: s.done, overdue: s.overdue, weekDue: s.week },
      });
    } catch (e) {
      logError('mine loadStats', e);
    }
  },

  async loadProfile() {
    try {
      const settings = await getSettings();
      const tags: string[] = [];
      if (settings.occupation) tags.push(settings.occupation);
      if (settings.company) tags.push(settings.company);
      if (settings.residence) tags.push(settings.residence);
      const tagsStr = tags.length > 0 ? tags.join(' · ') : '';
      this.setData({
        personalTags: tags,
        personalTagsStr: tagsStr,
      });
    } catch (e) {
      logError('mine loadProfile', e);
    }
  },
});
