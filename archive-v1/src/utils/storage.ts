/**
 * wx 本地存储的 key 前缀。所有 storage 操作自动加此前缀，避免与小程序内其他 key 冲突。
 */
const PREFIX = 'timeslots_';

/**
 * 本地存储 facade。所有 key 自动加 `timeslots_` 前缀。
 *
 * 错误处理：所有方法内部 try/catch，**失败静默**（不抛）。调用方需自行检查 `get` 返回值。
 */
export const storage = {
  /**
   * 读取本地存储。
   *
   * @typeParam T - 期望值类型（**仅类型断言，无运行时校验**）
   * @param key - 业务 key（不含前缀；前缀自动加）
   * @returns 值；若不存在 / 失败 / 值为空字符串 → `null`
   */
  get<T = unknown>(key: string): T | null {
    try {
      const raw = wx.getStorageSync(`${PREFIX}${key}`);
      if (raw === '' || raw === undefined) {
        return null;
      }
      return raw as T;
    } catch {
      return null;
    }
  },

  /**
   * 写入本地存储。
   *
   * @typeParam T - 值类型
   * @param key - 业务 key
   * @param value - 要写入的值（**必须可被 wx.setStorageSync 序列化**）
   */
  set<T = unknown>(key: string, value: T): void {
    try {
      wx.setStorageSync(`${PREFIX}${key}`, value);
    } catch {
      // ignore
    }
  },

  /**
   * 删除指定 key。
   *
   * @param key - 业务 key
   */
  remove(key: string): void {
    try {
      wx.removeStorageSync(`${PREFIX}${key}`);
    } catch {
      // ignore
    }
  },

  /**
   * 清空**所有**本地存储（**注意：会清掉本应用所有 key，不只是 timeslots_ 前缀**）。
   */
  clear(): void {
    try {
      wx.clearStorageSync();
    } catch {
      // ignore
    }
  },
};
