/**
 * 业务侧 HTTP method 集合（含 PATCH）。
 *
 * 与 `utils/request.ts` 的 `WxRequestMethod`（不含 PATCH）区分。
 *
 * @see AGENTS §5.2.2 #21
 */
export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * 网络请求配置。
 */
export interface RequestConfig {
  /** URL（相对路径走 BASE_URL，或绝对 URL） */
  url: string;
  /** HTTP method；默认 'GET' */
  method?: RequestMethod;
  /** 请求体（任意可序列化值） */
  data?: unknown;
  /** query 参数对象（GET 用） */
  params?: Record<string, string | number | boolean>;
  /** 额外 header；默认带 `Content-Type: application/json` */
  header?: Record<string, string>;
  /** 超时（ms）；默认 30000 */
  timeout?: number;
}

/**
 * 后端统一成功响应体（Batch 3 PM 拍板契约）。
 *
 * `code === 0` 表示业务成功；`data` 字段是真正的业务数据；`message` 固定为 'success'。
 */
export interface ApiSuccess<T> {
  code: 0;
  data: T;
  message: 'success';
}

/**
 * 后端统一失败响应体（Batch 3 PM 拍板契约）。
 *
 * 出现在业务失败（HTTP 4xx/5xx + code=businessCode）。
 * `code` 是 5 位业务错误码（详见 AGENTS §5.3.3 #12 错误码表），与 HTTP 状态码**解耦**。
 * `path` / `timestamp` 由全局 Filter 注入。
 */
export interface ApiFailure {
  /** 5 位业务错误码（0=成功；非 0=失败） */
  code: number;
  data: null;
  message: string;
  /** 请求路径（由 Filter 注入） */
  path?: string;
  /** ISO 时间戳（由 Filter 注入） */
  timestamp?: string;
}

/**
 * 后端统一响应体（成功或失败）。
 */
export type ApiBody<T> = ApiSuccess<T> | ApiFailure;

/**
 * 前端网络错误。
 *
 * 抛出场景：
 * - 业务失败（HTTP 4xx/5xx + body.code !== 0）→ `(businessCode, message, httpStatus)`
 * - 网络失败（wx.request fail 回调）→ `(-1, errMsg, 0)`
 *
 * @see AGENTS §5.3.3 #12
 */
export class RequestError extends Error {
  /**
   * @param code - 业务错误码（业务失败时 = body.code；网络失败为 -1）
   * @param message - 错误消息
   * @param status - HTTP 状态码（网络失败为 0）
   */
  constructor(
    public readonly code: number,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'RequestError';
  }
}
