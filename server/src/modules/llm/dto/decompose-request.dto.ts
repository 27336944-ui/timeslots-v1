import { IsString, IsOptional, MinLength } from 'class-validator';

export class DecomposeRequestDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  goal?: string;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsString()
  residence?: string;
}
