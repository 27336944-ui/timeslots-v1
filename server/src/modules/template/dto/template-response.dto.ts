export class TemplateResponseDto {
  id!: string;
  userId!: string;
  name!: string;
  type!: string;
  title!: string;
  goal!: string | null;
  priority!: string | null;
  categoryId!: string | null;
  estimatedMinutes!: number | null;
  defaultDuration!: number | null;
  defaultNature!: string | null;
  config!: string | null;
  sortOrder!: number;
  isSystem!: boolean;
  createdAt!: string;
  updatedAt!: string;
}