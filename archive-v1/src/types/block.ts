export interface MyTimeBlock {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  nature: string;
  status: string;
}

export interface TimeBlockDetail {
  id: string;
  userId: string;
  title: string;
  summary: string | null;
  startTime: string;
  endTime: string;
  status: string;
  nature: string;
  actualDurationMinutes: number | null;
  isAIGenerated: boolean;
  aiTraceId: string | null;
  isBusy: boolean;
  taskGroupId: string | null;
  circleId: string | null;
  createdAt: string;
  updatedAt: string;
}
