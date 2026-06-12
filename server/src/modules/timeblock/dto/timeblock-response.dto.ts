export class TimeBlockResponseDto {
  id!: string;
  userId!: string;
  title!: string;
  startTime!: string;
  endTime!: string;
  status!: string;
  location: string | null = null;
  description: string | null = null;
  priority: string = 'medium';
  category: string = 'life';
  recurrence: string = 'none';
  recurrenceEndAt: string | null = null;
  contacts: string | null = null;
  weather: string | null = null;
  taskId: string | null = null;
  nature: string = 'PUBLIC';
  circleId: string | null = null;
  createdAt!: string;
  updatedAt!: string;
}
