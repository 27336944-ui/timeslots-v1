import { AuthGuard } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

/**
 * JWT 鉴权 Guard。
 *
 * 委托 Passport JWT Strategy 验证 Bearer token，解析 payload 中的 userId。
 * 验证通过后 `request.user = { userId }`，由 `@CurrentUser('userId')` 提取。
 *
 * @see JwtStrategy (modules/auth/strategies/jwt.strategy.ts)
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
