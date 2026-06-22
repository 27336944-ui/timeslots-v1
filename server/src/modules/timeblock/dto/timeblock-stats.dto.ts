export class TimeBlockStatsDto {
  totalBlocks!: number;
  totalHours!: number;
  byCategory!: Record<string, number>;
  avgDurationMinutes!: number;
  dailyDistribution!: Record<string, number>;
}
