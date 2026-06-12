import { IsUUID, IsInt, Min, Max, IsIn } from 'class-validator';


export class CreateReminderDto {
  @IsUUID()
  blockId!: string;

  @IsInt()
  @Min(0)
  @Max(1440)
  @IsIn([0, 5, 15, 30, 60, 120, 1440])
  leadMinutes!: number;
}
