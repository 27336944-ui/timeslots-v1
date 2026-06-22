export interface BlockDisplay {
  id: string;
  userId: string;
  title: string;
  startTime: string;
  endTime: string;
  triggerTime: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  location: string | null;
  description: string | null;
  category: string;
  recurrence: string;
  recurrenceEndAt: string | null;
  recurrenceGroupId: string | null;
  contacts: string | null;
  weather: string | null;
  taskId: string | null;
  nature: string;
  circleId: string | null;
  source: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  /** Computed display fields */
  localStart: string;
  localEnd: string;
  categoryClass: string;
  blockHeight: number;
  isCrossDay: boolean;
  sourceLabel: string;
}
