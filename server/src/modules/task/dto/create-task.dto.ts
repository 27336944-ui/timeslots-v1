
import { IsString, IsOptional, IsIn, IsArray, IsObject, MinLength, IsISO8601 } from 'class-validator';


export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  title!: string;

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
  @IsISO8601()
  dueAt?: string | null;
}
