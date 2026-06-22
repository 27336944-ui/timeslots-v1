export class DayFreeSlot {
  date!: string;
  freeSlots!: Array<{ start: string; end: string }>;
}

export class NamecardResponseDto {
  totalHours!: number;
  freeHours!: number;
  busyHours!: number;
  avgBlockDuration!: number;
  weeklyHeatmap!: DayFreeSlot[];
}
