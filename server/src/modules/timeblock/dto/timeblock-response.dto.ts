export class TimeBlockResponseDto {
  id!: string;
  userId!: string;
  title!: string;
  /** @deprecated use triggerTime + startDate/endDate */
  startTime!: string;
  /** @deprecated use triggerTime + startDate/endDate */
  endTime!: string;
  triggerTime: string | null = null;
  startDate: string | null = null;
  endDate: string | null = null;
  status!: string;
  location: string | null = null;
  description: string | null = null;
  category: string = 'life';
  categoryId: string | null = null;
  source: string | null = null;
  sourceId: string | null = null;
  recurrence: string = 'none';
  recurrenceEndAt: string | null = null;
  recurrenceGroupId: string | null = null;
  contacts: string | null = null;
  weather: string | null = null;
  taskId: string | null = null;
  nature: string = 'PUBLIC';
  circleId: string | null = null;
  rigidity: string | null = null;
  bufferBefore: number | null = null;
  bufferAfter: number | null = null;
  anchorType: string | null = null;
  createdAt!: string;
  updatedAt!: string;
}
