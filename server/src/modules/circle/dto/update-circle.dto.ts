import { IsString, IsOptional, MaxLength, IsIn } from 'class-validator';


export class UpdateCircleDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn(['active', 'archived'])
  status?: string;
}
