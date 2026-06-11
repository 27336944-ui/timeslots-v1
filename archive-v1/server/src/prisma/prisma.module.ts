import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Prisma 全局 Module。
 *
 * 通过 `@Global()` 暴露 `PrismaService`，任何 Module 都能直接注入而无需 `imports: [PrismaModule]`。
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
