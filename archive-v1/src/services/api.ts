import { request } from '../utils/request';
import type { RequestConfig } from '../types/api';

/**
 * 携带 JWT 的网络请求封装。
 * 自动从 storage 读取 token 注入 Authorization header。
 * @param config - 请求配置
 * @returns 泛型 T 的 Promise
 */
function withAuth<T>(config: RequestConfig): Promise<T> {
  let token = '';
  try {
    token = (wx.getStorageSync('token') as string) || '';
  } catch {
    /* ignore */
  }
  return request<T>({
    ...config,
    header: {
      ...config.header,
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * 统一 API 封装（GET / POST / PATCH / DELETE）。
 * 所有请求自动携带 Bearer token，响应自动拆包。
 */
export const api = {
  /** GET 请求。 */
  get: <T = unknown>(url: string, params?: Record<string, string | number | boolean>) =>
    withAuth<T>({ url, method: 'GET', params }),

  /** POST 请求。 */
  post: <T = unknown>(url: string, data?: unknown) => withAuth<T>({ url, method: 'POST', data }),

  /** PATCH 请求。 */
  patch: <T = unknown>(url: string, data?: unknown) => withAuth<T>({ url, method: 'PATCH', data }),

  /** DELETE 请求。 */
  del: <T = unknown>(url: string) => withAuth<T>({ url, method: 'DELETE' }),
};
