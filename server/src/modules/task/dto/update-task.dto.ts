
import { IsOptional, IsString, IsIn, IsArray, IsObject, MinLength, IsISO8601, IsNumber, Min } from 'class-validator';


export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  goal?: string;

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  steps?: { text: string; isDone: boolean }[];

  @IsOptional()
  @IsString()
  @IsIn(['pending', 'in_progress', 'done', 'overdue'])
  status?: string;

  @IsOptional()
  @IsString()
  @IsIn(['work', 'life', 'private'])
  category?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @IsISO8601()
  startDate?: string | null;

  @IsOptional()
  @IsString()
  @IsISO8601()
  dueAt?: string | null;

  @IsOptional()
  @IsString()
  @IsISO8601()
  triggerTime?: string | null;

  @IsOptional()
  @IsString()
  completedNote?: string;

  @IsOptional()
  @IsString()
  retrospective?: string;

  @IsOptional()
  @IsString()
  improvements?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  estimatedDuration?: number;
}
