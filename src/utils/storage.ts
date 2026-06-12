


const PREFIX = 'timeslots_';

/** 用户是否已授权订阅消息（不拒绝即视为授权） */
export const REMINDER_SUBSCRIBED = 'reminder_subscribed';

/** 用户是否已同意隐私协议 */
export const PRIVACY_AGREED = 'privacy_agreed';


function key(k: string): string {
  return `${PREFIX}${k}`;
}


export const storage = {
  
  get<T = string>(k: string): T | null {
    try {
      const raw = wx.getStorageSync(key(k));
      return raw !== '' ? (raw as T) : null;
    } catch {
      
      return null;
    }
  },

  
  set(k: string, v: unknown): void {
    try {
      wx.setStorageSync(key(k), v);
    } catch {
      
      console.warn(`storage.set failed for key: ${k}`);
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
