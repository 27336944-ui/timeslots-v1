import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class ParseDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  text!: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}
