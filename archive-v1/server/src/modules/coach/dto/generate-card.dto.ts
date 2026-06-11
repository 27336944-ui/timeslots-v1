import { IsDateString, IsOptional } from 'class-validator';

export class GenerateCardDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
