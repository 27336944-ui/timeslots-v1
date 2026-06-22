import { IsString, IsNotEmpty, IsOptional, IsIn, MinLength } from 'class-validator';

export class ForwardCreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  text!: string;

  @IsOptional()
  @IsString()
  @IsIn(['task', 'timeblock'])
  createAs?: string;
}
