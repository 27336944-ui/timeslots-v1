import { IsString, IsOptional, IsInt, MinLength, Min } from 'class-validator';

export class UpdateStepDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  text?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedMinutes?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  status?: string;

  @IsOptional()
  @IsString()
  dependsOnId?: string;

  @IsOptional()
  @IsString()
  suggestedStart?: string;

  @IsOptional()
  @IsString()
  suggestedEnd?: string;
}
