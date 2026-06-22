import { HttpException, HttpStatus } from '@nestjs/common';


export const ErrorCodes = {
  // 400 — 参数错误
  VALIDATION_FAILED: 40001,
  INVALID_DATE: 40002,
  INVALID_CATEGORY: 40003,
  EMPTY_TITLE: 40004,

  // 401 — 未授权
  TOKEN_MISSING: 40101,
  TOKEN_EXPIRED: 40102,
  USER_NOT_FOUND: 40103,

  // 403 — 权限不足
  ACCOUNT_DELETED: 40301,
  ACCOUNT_PENDING_DELETE: 40302,
  FORBIDDEN: 40303,
  RESTORE_TOKEN_INVALID: 40304,
  RESTORE_EXPIRED: 40305,

  // 404 — 资源不存在
  EVENT_NOT_FOUND: 40401,
  USER_NOT_EXISTS: 40402,
  TASK_NOT_FOUND: 40403,
  STEP_NOT_FOUND: 40404,

  // 409 — 冲突
  CONCURRENT_MODIFICATION: 40901,
  DUPLICATE_ENTRY: 40902,

  // 500 — 系统异常
  INTERNAL_ERROR: 50000,
  DB_ERROR: 50001,
} as const;


export class BusinessException extends HttpException {
  constructor(
    public readonly businessCode: number,
    message: string,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, httpStatus);
  }
}
