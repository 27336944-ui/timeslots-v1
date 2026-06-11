import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateTaskGroupDto {
  @IsOptional()
  @IsString()
  @Length(1, 50)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 2000)
  notes?: string;

  @IsOptional()
  @IsString()
  color?: string;
}
