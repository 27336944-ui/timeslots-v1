import type { ApiFailure, RequestConfig } from '../types/api';
import { RequestError } from '../types/api';

const BASE_URL = 'http://localhost:7777/api/v1';

/**
 * wx.request 兼容的 HTTP method 集合（**不含 PATCH**）。
 *
 * 官方 TS 类型 `wx.request.method` 仅支持 OPTIONS/GET/HEAD/POST/PUT/DELETE/TRACE/CONNECT。
 * 运行时网络层接受任意 method，所以业务侧 `RequestConfig.method` 保留完整 HTTP（含 PATCH）。
 * 调 `wx.request` 时必须显式 cast 到本类型，**禁止** `as any`。
 *
 * @see AGENTS §5.2.2 #21
 */
type WxRequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'HEAD' | 'TRACE' | 'CONNECT';

/**
 * wx.request 兼容的请求体类型。
 *
 * 官方类型 `wx.request.data` 是 `string | IAnyObject | ArrayBuffer`。
 * 业务侧 `RequestConfig.data` 接受任意 `unknown`（序列化时由 wx 内部处理）。
 * 传值时必须显式 cast 到本类型，**禁止** `as any`。
 *
 * @see AGENTS §5.2.2 #21
 */
type WxRequestData = string | object | ArrayBuffer;

/**
 * 后端统一响应体的最小子集（用于类型守卫）。
 *
 * 完整定义见 `types/api.ts` 的 `ApiSuccess<T>` / `ApiFailure`。
 */
interface ApiBodyShape {
  code: number;
  message: string;
  data?: unknown;
}

const hasApiShape = (b: unknown): b is ApiBodyShape =>
  typeof b === 'object' && b !== null && 'code' in b && 'message' in b;

const toApiFailure = (b: unknown, fallbackCode: number, fallbackMsg: string): ApiFailure => {
  if (hasApiShape(b)) {
    return { code: b.code, data: null, message: b.message };
  }
  return { code: fallbackCode, data: null, message: fallbackMsg };
};

const buildUrl = (url: string, params?: Record<string, string | number | boolean>): string => {
  if (!params) return url;
  const qs = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return url.includes('?') ? `${url}&${qs}` : `${url}?${qs}`;
};

/**
 * 统一的网络请求函数。所有前端 API 调用都走这里，**禁止**页面内直接 `wx.request`。
 *
 * 行为契约（Batch 3 PM 拍板）：
 * - 业务成功（HTTP 2xx 且 `code === 0`）：resolve 拆包后的 `data` 字段（已 cast 为 `T`）
 * - 业务/HTTP 失败（HTTP 非 2xx 或 `code !== 0`）：reject `RequestError(businessCode, message, httpStatus)`
 * - 网络失败（`wx.request` fail 回调）：reject `RequestError(-1, errMsg, 0)`
 *
 * 边界 cast 说明：见 `WxRequestMethod` / `WxRequestData`。
 *
 * @typeParam T - 期望的 `data` 字段类型
 * @param config - 请求配置（url / method / data / params / header / timeout）
 * @returns 成功时 resolve 拆包后的 `data` 字段（类型 `T`）
 * @throws {RequestError} HTTP 非 2xx / `code !== 0` / 网络失败
 * @example
 *   interface User { id: string; name: string }
 *   const user = await request<User>({ url: '/users/me', method: 'GET' });
 */
export const request = <T = unknown>(config: RequestConfig): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const url = buildUrl(config.url, config.params);
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;

    wx.request({
      url: fullUrl,
      method: (config.method ?? 'GET') as WxRequestMethod,
      data: config.data as WxRequestData | undefined,
      header: {
        'Content-Type': 'application/json',
        ...config.header,
      },
      timeout: config.timeout ?? 30000,
      success: (res) => {
        const body: unknown = res.data;
        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (hasApiShape(body)) {
            if (body.code === 0) {
              const data = 'data' in body ? body.data : body;
              resolve(data as T);
            } else {
              reject(new RequestError(body.code, body.message, res.statusCode));
            }
          } else {
            resolve(body as T);
          }
        } else {
          const failure = toApiFailure(body, res.statusCode, `HTTP ${res.statusCode}`);
          reject(new RequestError(failure.code, failure.message, res.statusCode));
        }
      },
      fail: (err) => {
        reject(new RequestError(-1, err.errMsg ?? 'Network error', 0));
      },
    });
  });

/**
 * GET 请求快捷方法。
 *
 * @typeParam T - 期望的 `data` 字段类型
 * @param url - 相对路径（如 `/users/me`）或绝对 URL
 * @param params - query 参数对象；自动 URL 编码
 * @returns resolve 拆包后的 `data`
 * @example
 *   const list = await get<TimeBlockVO[]>('/time-blocks', { date: '2026-06-07' });
 */
export const get = <T = unknown>(url: string, params?: Record<string, string | number | boolean>): Promise<T> =>
  request<T>({ url, method: 'GET', params });

/**
 * POST 请求快捷方法。
 *
 * @typeParam T - 期望的 `data` 字段类型
 * @param url - 相对路径或绝对 URL
 * @param data - 请求体（任意可序列化值）
 * @returns resolve 拆包后的 `data`
 */
export const post = <T = unknown>(url: string, data?: unknown): Promise<T> => request<T>({ url, method: 'POST', data });

/**
 * PUT 请求快捷方法。
 *
 * @typeParam T - 期望的 `data` 字段类型
 * @param url - 相对路径或绝对 URL
 * @param data - 请求体
 * @returns resolve 拆包后的 `data`
 */
export const put = <T = unknown>(url: string, data?: unknown): Promise<T> => request<T>({ url, method: 'PUT', data });

/**
 * PATCH 请求快捷方法。
 *
 * **注意**：wx.request 官方类型不含 PATCH，边界 cast 见 `WxRequestMethod`。
 *
 * @typeParam T - 期望的 `data` 字段类型
 * @param url - 相对路径或绝对 URL
 * @param data - 请求体
 * @returns resolve 拆包后的 `data`
 */
export const patch = <T = unknown>(url: string, data?: unknown): Promise<T> =>
  request<T>({ url, method: 'PATCH', data });

/**
 * DELETE 请求快捷方法。
 *
 * @typeParam T - 期望的 `data` 字段类型
 * @param url - 相对路径或绝对 URL
 * @returns resolve 拆包后的 `data`
 */
export const del = <T = unknown>(url: string): Promise<T> => request<T>({ url, method: 'DELETE' });
