import type { CategoryItem } from '../types/api';

export interface CategoryDef {
  id: string;
  label: string;
  color: string;
}

export const FIXED_CATEGORY_DEFS: CategoryDef[] = [
  { id: 'work', label: '工作', color: '#10B981' },
  { id: 'life', label: '生活', color: '#3B82F6' },
  { id: 'private', label: '自有', color: '#F59E0B' },
];

export const CATEGORY_OPTIONS = FIXED_CATEGORY_DEFS.map((c) => ({
  label: c.label,
  value: c.id,
}));

export const CATEGORY_LABELS: Record<string, string> = {};
for (const c of FIXED_CATEGORY_DEFS) {
  CATEGORY_LABELS[c.id] = c.label;
}

export function buildFixedCategoryTrees(): CategoryItem[] {
  return FIXED_CATEGORY_DEFS.map((def, idx) => ({
    id: def.id,
    name: def.label,
    level: 0,
    parentId: null,
    sortOrder: idx,
    isFixed: true,
    isDefault: false,
    color: def.color,
    children: [
      {
        id: `${def.id}-default`,
        name: '默认',
        level: 1,
        parentId: def.id,
        sortOrder: 0,
        isFixed: false,
        isDefault: true,
        color: def.color,
        children: [],
      },
    ],
  }));
}
