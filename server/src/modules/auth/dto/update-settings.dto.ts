import { IsOptional, IsString, IsNumber, IsIn, IsEnum, ValidateIf, MaxLength } from 'class-validator';

export enum MaritalStatus {
  SINGLE = 'single',
  MARRIED = 'married',
  DIVORCED = 'divorced',
  WIDOWED = 'widowed',
}

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

  @IsOptional()
  @IsString()
  @IsIn(['30min', '1h', '2h'])
  defaultDuration?: string;

  @IsOptional()
  @IsString()
  @IsIn(['work', 'life', 'private', 'last'])
  defaultCategory?: string;

  @IsOptional()
  @IsNumber()
  @IsIn([0, 1])
  weekStartsOn?: number;

  // Personal info for AI recommendation
  @IsOptional()
  @IsNumber()
  age?: number;

  @IsOptional()
  @IsEnum(MaritalStatus)
  maritalStatus?: MaritalStatus;

  @ValidateIf((o) => o.maritalStatus === MaritalStatus.MARRIED)
  @IsOptional()
  @IsString()
  @MaxLength(50)
  spouseName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  residence?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  company?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  occupation?: string;
}
