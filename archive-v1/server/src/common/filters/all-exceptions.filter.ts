import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { BusinessException } from '../exceptions/business.exception';

/**
 * 全局异常响应体。
 *
 * 字段对齐 PM 拍板的业务码契约：`code` = 业务错误码（5 位；与 HTTP 状态码解耦）。
 */
interface ErrorResponse {
  code: number;
  data: null;
  message: string;
  path: string;
  timestamp: string;
}

/**
 * 全局异常过滤器。
 *
 * 抹平三类异常的差异：
 * 1. `BusinessException` → 取 `businessCode` + `message`
 * 2. NestJS 内置 `HttpException`（如 `ValidationPipe` 抛的 400）→ `httpStatus * 100` 作为业务码占位
 * 3. Prisma `PrismaClientKnownRequestError`（P2002 / P2025）→ 映射为对应业务码
 *
 * 响应格式：
 * ```json
 * {
 *   "code": 40901,
 *   "data": null,
 *   "message": "操作冲突，请重试",
 *   "path": "/api/v1/events",
 *   "timestamp": "2026-06-07T..."
 * }
 * ```
 *
 * 错误码表（详见 AGENTS §5.3.3 #12）：
 * - 40001-40099 参数错误
 * - 40101-40199 未授权
 * - 40201-40299 余额不足
 * - 40301-40399 权限不足
 * - 40400-40499 资源不存在
 * - 40900-40999 冲突
 * - 50000-50099 系统异常
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  /**
   * 拦截所有异常并统一格式化。
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let businessCode = 50000;
    let message = '服务器内部错误';

    if (exception instanceof BusinessException) {
      httpStatus = exception.getStatus();
      businessCode = exception.businessCode;
      message = exception.message;
    } else if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const resp = exception.getResponse();
      if (typeof resp === 'object' && resp !== null && 'message' in resp) {
        const m = (resp as { message: unknown }).message;
        if (Array.isArray(m)) {
          message = m.length > 0 ? m.map((x) => String(x)).join('; ') : exception.message;
        } else {
          message = String(m);
        }
      } else {
        message = exception.message;
      }
      businessCode = httpStatus * 100;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        httpStatus = HttpStatus.CONFLICT;
        businessCode = 40900;
        message = '数据已存在';
      } else if (exception.code === 'P2025') {
        httpStatus = HttpStatus.NOT_FOUND;
        businessCode = 40400;
        message = '记录不存在';
      } else {
        message = `数据库错误: ${exception.code}`;
      }
    }

    if (httpStatus === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `Unhandled exception: ${(exception as Error)?.message ?? 'unknown'}`,
        (exception as Error)?.stack,
      );
    }

    const body: ErrorResponse = {
      code: businessCode,
      data: null,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(httpStatus).json(body);
  }
}
