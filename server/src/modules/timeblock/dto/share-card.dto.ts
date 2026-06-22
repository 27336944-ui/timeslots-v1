import { IsString, IsOptional, Matches } from 'class-validator';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class CreateShareCardDto {
  @IsString()
  @Matches(DATE_REGEX)
  date!: string;
}

export class TimeSlotDto {
  start!: string;
  end!: string;
}

export class ShareCardRespondDto {
  @IsString()
  startTime!: string;

  @IsString()
  endTime!: string;

  @IsOptional()
  @IsString()
  userName?: string;
}

export class ShareCardResponseDto {
  token!: string;
  userName!: string;
  date!: string;
  busySlots!: TimeSlotDto[];
  freeSlots!: TimeSlotDto[];
  responses!: ShareCardRespondResponse[];
  createdAt!: string;
}

export class ShareCardRespondResponse {
  startTime!: string;
  endTime!: string;
  userName!: string;
  createdAt!: string;
}
