import { IsString, MinLength, MaxLength, IsOptional, IsUUID } from 'class-validator';


export class CreateCircleDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
