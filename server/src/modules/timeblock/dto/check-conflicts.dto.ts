import { IsOptional, IsString, IsISO8601, IsUUID } from 'class-validator';

export class CheckConflictsDto {
  @IsISO8601()
  startTime!: string;

  @IsISO8601()
  endTime!: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  excludeId?: string;
}

export interface ConflictInfo {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
}
