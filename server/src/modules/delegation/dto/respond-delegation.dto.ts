import { IsIn, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CandidateSlotDto } from './create-delegation.dto';

export class RespondDelegationDto {
  @IsIn(['accept', 'reject'])
  action!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CandidateSlotDto)
  acceptedSlot?: CandidateSlotDto;
}
