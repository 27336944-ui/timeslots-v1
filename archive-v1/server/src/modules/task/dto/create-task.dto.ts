import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';
import { TaskPriority, TaskStatus } from '@prisma/client';

/**
 * 创建任务 DTO。
 *
 * 必填：`title`
 * 可选：`notes` / `priority` / `dueAt` / `taskGroupId` / `sortOrder`
 */
export class CreateTaskDto {
  @IsString()
  @Length(1, 200)
  title!: string;

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
