import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * 业务异常基类。
 *
 * 三段式语义：
 * - `businessCode` — 5 位业务错误码（响应 JSON 的 `code` 字段）
 * - `httpStatus` — HTTP 状态码（与 `businessCode` 解耦，常用 1:1）
 * - `message` — 人类可读错误信息
 *
 * 响应格式由 `AllExceptionsFilter` 统一包装为：
 * `{ code: businessCode, message, data: null, timestamp, path }`
 *
 * 用法：
 * ```typescript
 * throw new BusinessException(40401, '日程不存在或已删除');
 * throw ErrorCodes.QUOTA_EXCEEDED;  // 预定义快捷
 * ```
 *
 * @see AGENTS §5.3.3 #12
 */
export class BusinessException extends HttpException {
  /**
   * @param businessCode - 5 位业务错误码
   * @param message - 错误消息
   * @param httpStatus - HTTP 状态码；默认 BAD_REQUEST
   */
  constructor(
    public readonly businessCode: number,
    message: string,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super({ businessCode, message }, httpStatus);
  }
}

/**
 * 预定义业务错误码常量。
 *
 * 编码规则：5 位数字，前 3 位 = HTTP 状态码 × 100。
 *
 * 用法：`throw ErrorCodes.QUOTA_EXCEEDED;`
 */
export const ErrorCodes = {
  // 400 Bad Request
  INVALID_INPUT: new BusinessException(40001, '输入参数无效', HttpStatus.BAD_REQUEST),
  AI_INPUT_INVALID: new BusinessException(40002, 'AI 解析输入无效', HttpStatus.BAD_REQUEST),

  // 401 Unauthorized
  UNAUTHORIZED: new BusinessException(40101, '未登录或登录已过期', HttpStatus.UNAUTHORIZED),

  // 402 Payment Required (额度不足专属)
  QUOTA_EXCEEDED: new BusinessException(40201, 'AI 额度不足，请充值或等待下月刷新', HttpStatus.PAYMENT_REQUIRED),
  QUOTA_ACCOUNT_NOT_FOUND: new BusinessException(40202, '额度账户不存在', HttpStatus.PAYMENT_REQUIRED),

  // 403 Forbidden
  PERMISSION_DENIED: new BusinessException(40301, '无权查看或操作该日程', HttpStatus.FORBIDDEN),

  // 404 Not Found
  EVENT_NOT_FOUND: new BusinessException(40401, '日程不存在或已删除', HttpStatus.NOT_FOUND),
  CIRCLE_NOT_FOUND: new BusinessException(40402, '分享圈不存在', HttpStatus.NOT_FOUND),
  USER_NOT_FOUND: new BusinessException(40403, '用户不存在', HttpStatus.NOT_FOUND),

  // 409 Conflict (并发冲突 / 乐观锁失败)
  CONCURRENT_MODIFICATION: new BusinessException(40901, '操作冲突，请重试', HttpStatus.CONFLICT),
  DUPLICATE_RESOURCE: new BusinessException(40902, '数据已存在', HttpStatus.CONFLICT),
} as const;
