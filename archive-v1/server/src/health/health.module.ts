import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

/**
 * 健康检查 Module。
 *
 * 提供 `GET /api/v1/health` 探活端点（公开，跳过 JWT 鉴权）。
 */
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
