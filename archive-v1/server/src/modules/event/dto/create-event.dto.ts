import { IsString, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { TimeBlockNature } from '@prisma/client';

/**
 * 创建日程的请求体。
 *
 * 字段对齐 PM 拍板的最小输入面：
 * - `title` + 时间 + nature（最少必要字段）
 * - `rawAiInput` 走服务端 AES-256-GCM 加密后存入 `encryptedDetails`
 *
 * 用户身份信息从 JWT（`@CurrentUser('userId')`）获取，不在 DTO 中传。
 */
export class CreateEventDto {
  @IsString()
  title!: string;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsEnum(TimeBlockNature)
  @IsOptional()
  nature?: TimeBlockNature = TimeBlockNature.PRIVATE;

  @IsString()
  @IsOptional()
  rawAiInput?: string;
}
