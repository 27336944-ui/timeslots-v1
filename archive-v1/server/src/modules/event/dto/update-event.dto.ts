import { IsDateString, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { TimeBlockNature, TimeBlockStatus } from '@prisma/client';

/**
 * 更新日程 DTO（所有字段可选）。
 */
export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  title?: string;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsEnum(TimeBlockNature)
  nature?: TimeBlockNature;

  @IsOptional()
  @IsEnum(TimeBlockStatus)
  status?: TimeBlockStatus;
}
