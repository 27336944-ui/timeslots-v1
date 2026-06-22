import { IsString, IsOptional, IsIn, IsNumber, Min, Max, MinLength, MaxLength, IsUUID } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsIn(['task', 'timeblock'])
  type!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  goal?: string;

  @IsOptional()
  @IsString()
  @IsIn(['high', 'medium', 'low'])
  priority?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1440)
  estimatedMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1440)
  defaultDuration?: number;

  @IsOptional()
  @IsString()
  @IsIn(['PUBLIC', 'PRIVATE', 'CIRCLE_ONLY'])
  defaultNature?: string;

  @IsOptional()
  @IsString()
  config?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}