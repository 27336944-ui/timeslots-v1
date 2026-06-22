export class CategoryResponseDto {
  id!: string;
  userId!: string;
  name!: string;
  parentId: string | null = null;
  sortOrder!: number;
  isDefault!: boolean;
  color!: string;
  children: CategoryResponseDto[] = [];
  createdAt!: string;
  updatedAt!: string;
}
