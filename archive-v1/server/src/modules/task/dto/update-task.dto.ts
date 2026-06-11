import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TaskPriority, TaskStatus } from '@prisma/client';

/**
 * 更新任务 DTO（所有字段可选）。
 *
 * 不依赖 `@nestjs/mapped-types`，直接定义避免引入额外依赖。
 *
 * 业务约定：若 `status` 改为 DONE，Service 层会自动写入 `completedAt = now()`；
 * 若改回非 DONE，会清空 `completedAt`。
 */
export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @Length(1, 200)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(1, 2000)
  notes?: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @IsOptional()
  @IsUUID()
  taskGroupId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  sortOrder?: number;
}
