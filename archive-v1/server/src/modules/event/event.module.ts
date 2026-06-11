import { Module } from '@nestjs/common';
import { QuotaModule } from '../quota/quota.module';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { EventVisibilityService } from '../../common/services/event-visibility.service';
import { AvailabilityService } from '../../common/services/availability.service';
import { EncryptionService } from '../../common/services/encryption.service';

/**
 * 日程模块。
 *
 * 路由：
 * - `POST /api/v1/events` — 创建日程（自动扣 1 点 AI 额度）
 * - `GET  /api/v1/events/my` — 查询本人日程（显式 select 排除 encryptedDetails）
 *
 * 服务：
 * - `EventService` — 主业务（创建 + 列表）
 * - `EventVisibilityService` — P0-P3 可见性 + 数据脱敏
 * - `AvailabilityService` — 对外忙闲查询（差集算法）
 * - `EncryptionService` — AES-256-GCM 加密（AI 原始输入）
 *
 * 依赖：`QuotaModule`（AI 扣费）。
 */
@Module({
  imports: [QuotaModule],
  controllers: [EventController],
  providers: [
    EventService,
    EventVisibilityService,
    AvailabilityService,
    EncryptionService,
  ],
  exports: [EventService],
})
export class EventModule {}
