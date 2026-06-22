import { IsISO8601 } from 'class-validator';

export class ScheduleStepDto {
  @IsISO8601()
  startTime!: string;

  @IsISO8601()
  endTime!: string;
}
