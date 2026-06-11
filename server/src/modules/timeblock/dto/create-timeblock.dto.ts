import { IsString, IsISO8601, IsOptional, MinLength, MaxLength, IsIn } from 'class-validator';


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
  @IsString()
  @MaxLength(500)
  contacts?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  weather?: string;
}
