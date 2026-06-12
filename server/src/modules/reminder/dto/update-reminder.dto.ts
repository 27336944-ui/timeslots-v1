import { IsOptional, IsInt, IsIn, IsString, Min, Max } from 'class-validator';


export class UpdateReminderDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1440)
  @IsIn([0, 5, 15, 30, 60, 120, 1440])
  leadMinutes?: number;

  @IsOptional()
  @IsString()
  @IsIn(['PENDING', 'CANCELLED'])
  status?: string;
}
