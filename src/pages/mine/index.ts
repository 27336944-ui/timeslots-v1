
import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { authStore } from '../../stores/authStore';
import { userStore } from '../../stores/userStore';
import { login, wxLogin, migrateDevData, deleteDevData, deleteAccount, restoreAccount } from '../../services/api';
import { storage } from '../../utils/storage';


const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;


interface MinePageData {
  userId: string;
  loading: boolean;
  loggingOut: boolean;
  wxLoading: boolean;
  showMigrationModal: boolean;
  devUserId: string;
  migrating: boolean;
  showRestoreModal: boolean;
  restoreUserId: string;
  restoring: boolean;
}


interface MinePageMethods {
  onLoginTap: () => void;
  onLogoutTap: () => void;
  onWxLoginTap: () => void;
  onUserIdInput: (e: WechatMiniprogram.Input) => void;
  onDevUserIdInput: (e: WechatMiniprogram.Input) => void;
  onMigrateConfirm: () => void;
  onMigrateSkip: () => void;
  onDeleteAccountTap: () => void;
  onRestoreTap: () => void;
  onRestoreCancel: () => void;
  showMigrationDialog: () => void;
  storeBindings?: { destroyStoreBindings: () => void };
  userBindings?: { destroyStoreBindings: () => void };
}

Page<MinePageData, MinePageMethods>({
  data: {
    userId: '',
    loading: false,
    loggingOut: false,
    wxLoading: false,
    showMigrationModal: false,
    devUserId: '',
    migrating: false,
    showRestoreModal: false,
    restoreUserId: '',
    restoring: false,
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
      wx.showToast({ title: '登录成功', icon: 'success' });
      this.setData({ userId: '' });
    } catch (e) {
      const msg = (e as Error).message || '登录失败';
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

      wx.showToast({ title: '微信登录成功', icon: 'success' });
      this.showMigrationDialog();
    } catch (e) {
      const wxErr = e as WechatMiniprogram.GeneralCallbackResult;
      const msg = wxErr.errMsg || (e as Error).message || '微信登录失败';
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
      wx.showToast({ title: (e as Error).message || '迁移失败', icon: 'none' });
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
      } catch {
        // not critical if delete fails
      } finally {
        this.setData({ migrating: false });
      }
    }
    this.setData({ showMigrationModal: false });
    storage.set('migration_shown', true);
  },

  onDeleteAccountTap() {
    wx.showModal({
      title: '注销账号',
      content: '确定要注销账号吗？7 天内可以恢复，7 天后账号将永久删除。所有日程数据将被隐藏。',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          const result = await deleteAccount();
          storage.set('restore_token', result.restoreToken);
          authStore.clearToken();
          userStore.clearUser();
          wx.showToast({ title: '账号已注销', icon: 'success' });
        } catch (e) {
          wx.showToast({ title: (e as Error).message || '注销失败', icon: 'none' });
        }
      },
    });
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
      wx.showToast({ title: (e as Error).message || '恢复失败', icon: 'none' });
    } finally {
      this.setData({ restoring: false });
    }
  },

  onRestoreCancel() {
    this.setData({ showRestoreModal: false, restoreUserId: '' });
  },

  onLogoutTap() {
    if (this.data.loggingOut) return;
    this.setData({ loggingOut: true });
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          authStore.clearToken();
          userStore.clearUser();
          wx.showToast({ title: '已退出', icon: 'success' });
        }
      },
      complete: () => {
        this.setData({ loggingOut: false });
      },
    });
  },
});
