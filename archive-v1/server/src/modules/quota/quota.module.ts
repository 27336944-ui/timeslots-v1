import { Module } from '@nestjs/common';
import { QuotaService } from './quota.service';

/**
 * AI 点数模块。
 *
 * 提供 `QuotaService`（优先扣当月 + 乐观锁防超卖 + 流水审计），供 `EventModule` 注入。
 *
 * @remarks 不暴露 Controller；点数操作通过 `EventService` 事务内 `deductInTx` 完成。
 */
@Module({
  providers: [QuotaService],
  exports: [QuotaService],
})
export class QuotaModule {}
