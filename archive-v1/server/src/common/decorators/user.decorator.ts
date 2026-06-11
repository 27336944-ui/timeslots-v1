import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * 扩展 Request 类型，附加 `user` 字段（由 `JwtAuthGuard` 注入）。
 */
interface RequestWithUser extends Request {
  user?: Record<string, unknown>;
}

/**
 * 提取当前登录用户上下文的参数装饰器。
 *
 * - `@CurrentUser()` → 返回完整 user 对象
 * - `@CurrentUser('userId')` → 返回 `user.userId` 字段
 *
 * 依赖：`JwtAuthGuard` 必须先于 controller 方法执行。
 *
 * @example
 * ```typescript
 * @Controller('events')
 * @UseGuards(JwtAuthGuard)
 * export class EventController {
 *   @Post()
 *   create(@CurrentUser('userId') userId: string, @Body() dto: CreateEventDto) { ... }
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext): unknown => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user ?? {};
    return data ? user[data] : user;
  },
);
