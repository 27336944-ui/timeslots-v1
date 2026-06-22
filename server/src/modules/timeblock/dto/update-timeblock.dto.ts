import { IsString, IsISO8601, IsOptional, MaxLength, IsIn, IsUUID, IsInt, Min } from 'class-validator';


export class UpdateTimeBlockDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsISO8601()
  startTime?: string;

  @IsOptional()
  @IsISO8601()
  endTime?: string;

  @IsOptional()
  @IsISO8601()
  triggerTime?: string;

  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @IsOptional()
  @IsString()
  @IsIn(['todo', 'done', 'overdue'])
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsIn(['work', 'life', 'private'])
  category?: string;

  @IsOptional()
  @IsIn(['none', 'daily', 'weekdays', 'weekly', 'monthly', 'yearly'])
  recurrence?: string;

  @IsOptional()
  @IsISO8601()
  recurrenceEndAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  contacts?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  weather?: string;

  @IsOptional()
  @IsUUID()
  taskId?: string;

  @IsOptional()
  @IsIn(['PRIVATE', 'PUBLIC', 'CIRCLE_ONLY'])
  nature?: string;

  @IsOptional()
  @IsUUID()
  circleId?: string;

  @IsOptional()
  @IsString()
  @IsIn(['single', 'all'])
  updateMode?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @IsIn(['manual', 'step', 'approval', 'flexible'])
  source?: string;

  @IsOptional()
  @IsString()
  sourceId?: string;

  @IsOptional()
  @IsIn(['absolute', 'relative'])
  rigidity?: string;

  @IsOptional()
  @IsIn(['meeting', 'commute', 'social', 'medical', 'other'])
  anchorType?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  bufferBefore?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bufferAfter?: number;
}
