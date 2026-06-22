export class StepResponseDto {
  id!: string;
  taskId!: string;
  sortOrder!: number;
  text!: string;
  estimatedMinutes: number | null = null;
  status!: string;
  dependsOnId: string | null = null;
  blocked: boolean = false;
  suggestedStart: string | null = null;
  suggestedEnd: string | null = null;
  timeBlockId: string | null = null;
  scheduledDate: string | null = null;
  completedAt: string | null = null;
  createdAt!: string;
  updatedAt!: string;
}
