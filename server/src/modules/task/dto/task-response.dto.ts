

export interface TaskResponseDto {
  id: string;
  userId: string;
  title: string;
  goal: string | null;
  steps: { text: string; isDone: boolean }[] | null;
  status: string;
  priority: string;
  category: string;
  dueAt: string | null;
  completedNote: string | null;
  retrospective: string | null;
  improvements: string | null;
  createdAt: string;
  updatedAt: string;
}
