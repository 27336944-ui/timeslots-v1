

export interface TaskResponseDto {
  id: string;
  userId: string;
  title: string;
  goal: string | null;
  steps: { text: string; isDone: boolean }[] | null;
  status: string;
  category: string;
  categoryId: string | null;
  startDate: string | null;
  dueAt: string | null;
  triggerTime: string | null;
  completedNote: string | null;
  retrospective: string | null;
  improvements: string | null;
  estimatedDuration: number | null;
  createdAt: string;
  updatedAt: string;
}
