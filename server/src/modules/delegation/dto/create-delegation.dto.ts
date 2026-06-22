import { IsIn, IsOptional, IsString, IsUUID, IsArray, ValidateNested, IsISO8601 } from 'class-validator';
import { Type } from 'class-transformer';

export class CandidateSlotDto {
  @IsISO8601()
  startTime!: string;

  @IsISO8601()
  endTime!: string;
}

export class CreateDelegationDto {
  @IsIn(['step_execution', 'appointment'])
  type!: string;

  @IsOptional()
  @IsUUID()
  stepId?: string;

  @IsOptional()
  @IsUUID()
  taskId?: string;

  @IsOptional()
  @IsUUID()
  blockId?: string;

  @IsOptional()
  @IsUUID()
  recipientUserId?: string;

  @IsOptional()
  @IsString()
  recipientPhone?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CandidateSlotDto)
  candidateSlots?: CandidateSlotDto[];

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsISO8601()
  deadline?: string;
}
