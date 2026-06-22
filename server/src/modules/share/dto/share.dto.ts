import { IsOptional, IsString, IsIn, IsUUID, IsISO8601 } from 'class-validator';

export class CreateShareRecipientDto {
  @IsUUID()
  targetUserId!: string;

  @IsOptional()
  @IsString()
  @IsIn(['full', 'freebusy', 'invite_only'])
  level?: string;

  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}

export class UpdateShareRecipientDto {
  @IsOptional()
  @IsString()
  @IsIn(['full', 'freebusy', 'invite_only'])
  level?: string;

  @IsOptional()
  @IsString()
  @IsIn(['active', 'revoked'])
  status?: string;

  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}

export class StealthDto {
  @IsOptional()
  @IsString()
  @IsIn(['on', 'off'])
  action?: string;

  @IsOptional()
  durationMinutes?: number;
}

export class ShareRecipientResponseDto {
  id!: string;
  targetUserId!: string;
  targetName!: string;
  level!: string;
  status!: string;
  expiresAt: string | null = null;
  createdAt!: string;
}
