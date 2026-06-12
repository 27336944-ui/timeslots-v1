import { IsString, IsISO8601, IsOptional, MinLength, MaxLength, IsIn, IsUUID } from 'class-validator';


export class CreateTimeBlockDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsISO8601()
  startTime!: string;

  @IsISO8601()
  endTime!: string;

  @IsOptional()
  @IsString()
  @IsIn(['todo', 'in_progress', 'done'])
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
  @IsIn(['high', 'medium', 'low'])
  priority?: string;

  @IsOptional()
  @IsIn(['work', 'life', 'private'])
  category?: string;

  @IsOptional()
  @IsIn(['none', 'daily', 'weekly', 'monthly', 'yearly'])
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
}
