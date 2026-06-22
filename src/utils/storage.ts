import { obfuscate, deobfuscate } from './crypto';

const PREFIX = 'timeslots_';

/** 用户是否已同意隐私协议 */
export const PRIVACY_AGREED = 'privacy_agreed';
export const SERVER_URL = 'server_url';
export const REMINDER_SUBSCRIBED = 'reminder_subscribed';

/** 需要透明加解密的 key 列表 */
const ENCRYPTED_KEYS = ['token', 'restore_token'];

function key(k: string): string {
  return `${PREFIX}${k}`;
}

function shouldEncrypt(k: string): boolean {
  return ENCRYPTED_KEYS.includes(k);
}

export const storage = {

  get<T = string>(k: string): T | null {
    try {
      const raw = wx.getStorageSync(key(k));
      if (raw === '' || raw === null || raw === undefined) return null;
      if (shouldEncrypt(k)) {
        const decrypted = deobfuscate(raw as string);
        return decrypted ? (decrypted as T) : null;
      }
      return raw as T;
    } catch {
      return null;
    }
  },

  set(k: string, v: unknown): void {
    try {
      const value = shouldEncrypt(k) ? obfuscate(v as string) : v;
      wx.setStorageSync(key(k), value);
    } catch {
      if (k.toLowerCase().includes('token')) {
        wx.showModal({
          title: '存储失败',
          content: '请清理微信缓存后重试',
          showCancel: false,
        });
      } else {
        console.warn(`storage.set failed for key: ${k}`);
      }
    }
  },

  remove(k: string): void {
    try {
      wx.removeStorageSync(key(k));
    } catch {
      console.warn(`storage.remove failed for key: ${k}`);
    }
  },
};
