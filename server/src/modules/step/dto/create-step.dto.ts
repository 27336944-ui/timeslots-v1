import { IsString, IsOptional, IsInt, MinLength, IsUUID, Min } from 'class-validator';

export class CreateStepDto {
  @IsUUID()
  taskId!: string;

  @IsString()
  @MinLength(1)
  text!: string;

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
}
