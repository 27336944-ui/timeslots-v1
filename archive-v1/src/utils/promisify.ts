/**
 * wx.* 异步 API 的选项类型（success / fail + 任意业务参数）。
 */
interface WxCallOptions {
  success?: (res: unknown) => void;
  fail?: (err: { errMsg: string }) => void;
  [key: string]: unknown;
}

/**
 * wx.* 异步 API 的函数签名。
 */
type WxAsyncApi = (options: WxCallOptions) => void;

/**
 * 将 wx.* 异步 API 包装为 Promise 版本。
 *
 * 业务侧 `await promisify(wx.scanCode)({})` 等价于 `wx.scanCode({ success, fail })`。
 *
 * @typeParam T - resolve 时返回的 success res 类型
 * @param api - 要包装的 wx.* 异步 API
 * @returns 一个柯里化函数：传入 options，返回 `Promise<T>`
 * @example
 *   const scanCodeP = promisify<ScanCodeResult>(wx.scanCode);
 *   const res = await scanCodeP({ scanType: ['qrCode'] });
 */
export const promisify =
  <T = unknown>(api: WxAsyncApi) =>
  (options: Record<string, unknown> = {}): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      api({
        ...options,
        success: (res: unknown) => resolve(res as T),
        fail: (err: { errMsg: string }) => reject(new Error(err.errMsg)),
      });
    });
