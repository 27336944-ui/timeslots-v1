import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';

/**
 * `/health` 端点的响应体。
 */
interface HealthData {
  status: 'ok';
  timestamp: string;
}

/**
 * 健康检查 controller。
 *
 * 提供 `GET /api/v1/health` 端点（公开探活）。
 *
 * **当前不触 DB**（M1 解耦）；M2 起视情况加 DB ping。
 */
@Controller('api/v1/health')
export class HealthController {
  /**
   * 健康检查端点。
   *
   * @returns `{ status: 'ok', timestamp: <ISO> }`
   */
  @Public()
  @Get()
  check(): HealthData {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
