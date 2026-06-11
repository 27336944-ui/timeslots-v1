import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(1, 50)
  nickname?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'dayStartsAt 格式 HH:MM' })
  dayStartsAt?: string;

  @IsOptional()
  coachSettings?: Record<string, unknown>;
}
