
import { IsOptional, IsString, IsIn, IsArray, IsObject } from 'class-validator';


export class UpdateTaskDto {
  @IsOptional()
  @IsString()
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
  @IsIn(['pending', 'in_progress', 'done'])
  status?: string;

  @IsOptional()
  @IsString()
  @IsIn(['high', 'medium', 'low'])
  priority?: string;

  @IsOptional()
  @IsString()
  @IsIn(['work', 'life', 'private'])
  category?: string;

  @IsOptional()
  @IsString()
  dueAt?: string | null;

  @IsOptional()
  @IsString()
  completedNote?: string;

  @IsOptional()
  @IsString()
  retrospective?: string;

  @IsOptional()
  @IsString()
  improvements?: string;
}
