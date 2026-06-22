import { FIXED_CATEGORY_DEFS, CATEGORY_LABELS } from '../../constants/categories';
import type { CategoryItem } from '../../types/api';
import { errorMsg } from '../../utils/error';
import { getMyCategories, createCategory } from '../../services/api';
import { logError } from '../../utils/logError';

const LABEL_TO_VALUE: Record<string, string> = {};
for (const [k, v] of Object.entries(CATEGORY_LABELS)) {
  LABEL_TO_VALUE[v] = k;
}

interface CatDisplayItem {
  type: 'cat' | 'add';
  id: string;
  name?: string;
  color?: string;
  depth: number;
  isFixed?: boolean;
  isDefault?: boolean;
  parentId?: string | null;
  hasChildren?: boolean;
  original?: CategoryItem;
  rootValue?: string;
  fullLabel?: string;
}

function buildDisplayList(items: CategoryItem[], expanded: Record<string, boolean>, rootValueMap: Record<string, string>, depth = 0, inheritedRootValue = '', inheritedLabel = ''): CatDisplayItem[] {
  const result: CatDisplayItem[] = [];
  for (const item of items) {
    const rv = rootValueMap[item.id] || inheritedRootValue;
    const myLabel = inheritedLabel ? `${inheritedLabel} > ${item.name}` : item.name;
    result.push({
      type: 'cat',
      id: item.id,
      name: item.name,
      color: item.color,
      depth,
      isFixed: item.isFixed,
      isDefault: item.isDefault,
      parentId: item.parentId,
      hasChildren: item.children.length > 0,
      original: item,
      rootValue: rv,
      fullLabel: myLabel,
    });
    if (expanded[item.id]) {
      if (item.children.length > 0) {
        result.push(...buildDisplayList(item.children, expanded, rootValueMap, depth + 1, rv, myLabel));
      }
      result.push({
        type: 'add',
        id: `add-${item.id}`,
        depth: depth + 1,
        parentId: item.id,
      });
    }
  }
  return result;
}


Component({
  options: { styleIsolation: 'isolated' },

  properties: {
    visible: { type: Boolean, value: false },
    autoCloseOnSelect: { type: Boolean, value: true },
  },

  data: {
    catTrees: [] as CategoryItem[],
    catDisplayList: [] as CatDisplayItem[],
    catExpanded: {} as Record<string, boolean>,
    catLoading: false,
    catEditing: false,
    catEditId: '',
    catEditName: '',
    catEditParentId: null as string | null,
    selectedRoot: '',
    selectedLabel: '',
  },

  methods: {
    async loadCategories() {
      this.setData({ catLoading: true });
      try {
        const cats = await getMyCategories();
        if (cats.length > 0) {
          const expanded: Record<string, boolean> = {};
          for (const c of cats) { expanded[c.id] = true; }
          const rootMap: Record<string, string> = {};
          for (const root of cats) {
            rootMap[root.id] = LABEL_TO_VALUE[root.name] || root.name;
          }
          const displayList = buildDisplayList(cats, expanded, rootMap);
          this.setData({ catTrees: cats, catExpanded: expanded, catDisplayList: displayList });
          return;
        }
      } catch (e) { logError('category-picker', e); /* fall through */ }
      // Fallback: hardcoded roots
      const fallbackTrees: CategoryItem[] = FIXED_CATEGORY_DEFS.map((def, idx) => ({
        id: def.id,
        name: def.label,
        level: 0,
        parentId: null,
        sortOrder: idx,
        isFixed: true,
        isDefault: false,
        color: def.color,
        children: [{
          id: `${def.id}-default`,
          name: '默认',
          level: 1,
          parentId: def.id,
          sortOrder: 0,
          isFixed: false,
          isDefault: true,
          color: def.color,
          children: [],
        }],
      }));
      const expanded: Record<string, boolean> = { work: true, life: true, private: true };
      const rootMap: Record<string, string> = {};
      for (const def of FIXED_CATEGORY_DEFS) { rootMap[def.id] = def.id; }
      const displayList = buildDisplayList(fallbackTrees, expanded, rootMap);
      this.setData({ catTrees: fallbackTrees, catExpanded: expanded, catDisplayList: displayList });
    },

    onOverlayTap() {
      this.triggerEvent('close');
    },

    onToggleExpand(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string;
      const next = !this.data.catExpanded[id];
      const expanded = { ...this.data.catExpanded, [id]: next };
      const rootMap: Record<string, string> = {};
      for (const root of this.data.catTrees) {
        rootMap[root.id] = LABEL_TO_VALUE[root.name] || root.name;
      }
      wx.vibrateShort({ type: 'light' });
      this.setData({
        catExpanded: expanded,
        catDisplayList: buildDisplayList(this.data.catTrees, expanded, rootMap),
      });
    },

    onSelectCat(e: WechatMiniprogram.TouchEvent) {
      const rootValue = e.currentTarget.dataset.rootvalue as string;
      const fullLabel = e.currentTarget.dataset.labelfull as string;
      const name = e.currentTarget.dataset.name as string;
      if (!rootValue) return;
      this.triggerEvent('select', { value: rootValue, label: name, labelFull: fullLabel || name });
      if (this.data.autoCloseOnSelect) {
        this.triggerEvent('close');
      }
    },

    onAddChild(e: WechatMiniprogram.TouchEvent) {
      const parentId = e.currentTarget.dataset.parentid as string | undefined;
      this.setData({
        catEditing: true,
        catEditId: '',
        catEditName: '',
        catEditParentId: parentId || null,
      });
    },

    onEditNameInput(e: WechatMiniprogram.Input) {
      this.setData({ catEditName: e.detail.value });
    },

    onCancelEdit() {
      this.setData({ catEditing: false, catEditId: '', catEditName: '', catEditParentId: null });
    },

    async onConfirmEdit() {
      const name = this.data.catEditName.trim();
      if (!name) {
        wx.showToast({ title: '名称不能为空', icon: 'none' });
        return;
      }
      this.setData({ catLoading: true });
      try {
        await createCategory({ name, parentId: this.data.catEditParentId || undefined });
        this.setData({ catEditing: false, catEditId: '', catEditName: '', catEditParentId: null });
        const cats = await getMyCategories();
        const expanded: Record<string, boolean> = {};
        for (const c of cats) { expanded[c.id] = true; }
        const rootMap: Record<string, string> = {};
        for (const root of cats) {
          rootMap[root.id] = LABEL_TO_VALUE[root.name] || root.name;
        }
        this.setData({ catTrees: cats, catExpanded: expanded, catDisplayList: buildDisplayList(cats, expanded, rootMap) });
      } catch (e) {
        wx.showToast({ title: errorMsg(e) || '创建失败', icon: 'none' });
      } finally {
        this.setData({ catLoading: false });
      }
    },
  },

  observers: {
    visible(v: boolean) {
      if (v) this.loadCategories();
    },
  },
});
