import { IsString, IsArray, ValidateNested, IsISO8601, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';


export class StepSlotDto {
  @IsString()
  id!: string;

  @IsString()
  text!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedMinutes?: number;

  @IsOptional()
  @IsString()
  dependsOnId?: string;
}


export class SuggestSlotsRequestDto {
  userId!: string;

  @IsISO8601()
  date!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StepSlotDto)
  steps!: StepSlotDto[];
}


export class SlotSuggestionDto {
  stepId!: string;
  suggestedStart: string | null = null;
  suggestedEnd: string | null = null;
  reason!: string;
}


export class SuggestSlotsResponseDto {
  suggestions!: SlotSuggestionDto[];
}
