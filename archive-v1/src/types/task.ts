export interface TaskView {
  id: string;
  title: string;
  notes: string | null;
  status: string;
  priority: string;
  dueAt: string | null;
  completedAt: string | null;
  sortOrder: number;
  taskGroupId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskStats {
  today: number;
  week: number;
  overdue: number;
}

export interface TaskGroupView {
  id: string;
  name: string;
  doneCount: number;
  totalCount: number;
  progress: number;
}
