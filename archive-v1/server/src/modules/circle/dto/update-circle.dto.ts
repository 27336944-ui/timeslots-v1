import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateCircleDto {
  @IsOptional()
  @IsString()
  @Length(1, 50)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 2000)
  description?: string;
}
