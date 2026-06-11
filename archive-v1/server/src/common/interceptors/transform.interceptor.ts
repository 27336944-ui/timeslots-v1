import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * 成功响应的统一包装。
 *
 * 与 `AllExceptionsFilter` 错误响应（`code: 5位业务码`）结构一致：
 * - `code: 0` 表示成功（与业务错误码区分）
 * - `data` 承载实际业务数据
 * - `message` 固定为 'success'
 */
export interface ApiResponse<T> {
  code: 0;
  data: T;
  message: 'success';
}

/**
 * 全局响应拦截器。
 *
 * 把 controller 返回的任意 `T` 包装为 `{ code: 0, data: T, message: 'success' }`。
 * 错误响应由 `AllExceptionsFilter` 处理（`code` 为 5 位业务码）。
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data: T) => ({
        code: 0 as const,
        data,
        message: 'success' as const,
      })),
    );
  }
}
