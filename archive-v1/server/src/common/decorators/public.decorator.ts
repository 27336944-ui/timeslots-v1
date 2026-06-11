import { SetMetadata } from '@nestjs/common';

/**
 * `@Public()` 装饰器使用的 metadata key。
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * 标记路由/控制器为**公开**（跳过 JWT 鉴权）。
 *
 * 用法：
 * ```typescript
 * @Public()
 * @Get('health')
 * check() { ... }
 * ```
 */
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC_KEY, true);
