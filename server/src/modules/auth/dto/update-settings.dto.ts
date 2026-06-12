import { IsOptional, IsString, IsNumber, IsIn } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  dayStartsAt?: string;

  @IsOptional()
  @IsNumber()
  reminderLeadMinutes?: number;

  @IsOptional()
  @IsString()
  @IsIn(['PUBLIC', 'PRIVATE', 'CIRCLE_ONLY'])
  defaultNature?: string;
}
