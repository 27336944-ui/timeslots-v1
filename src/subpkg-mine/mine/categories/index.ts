import { getMyCategories, createCategory, updateCategory, deleteCategory } from '../../../services/api';
import type { CategoryItem } from '../../../types/api';
import { errorMsg } from '../../../utils/error';

interface CategoriesPageData {
  trees: CategoryItem[];
  loading: boolean;
  editing: boolean;
  editId: string;
  editName: string;
  editColor: string;
  editParentId: string | null;
  expanded: Record<string, boolean>;
}

interface CategoriesPageMethods {
  onLoad: () => Promise<void>;
  onAddChild: (e: WechatMiniprogram.TouchEvent) => void;
  onBeginEdit: (e: WechatMiniprogram.TouchEvent) => void;
  onEditNameInput: (e: WechatMiniprogram.Input) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => Promise<void>;
  onDelete: (e: WechatMiniprogram.TouchEvent) => void;
  onToggleExpand: (e: WechatMiniprogram.TouchEvent) => void;
}

Page<CategoriesPageData, CategoriesPageMethods>({
  data: {
    trees: [],
    loading: false,
    editing: false,
    editId: '',
    editName: '',
    editColor: '#10B981',
    editParentId: null,
    expanded: {},
  },

  async onLoad() {
    this.setData({ loading: true });
    try {
      const cats = await getMyCategories();
      this.setData({ trees: cats });
    } catch (e) {
      wx.showToast({ title: errorMsg(e) || '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onAddChild(e: WechatMiniprogram.TouchEvent) {
    const parentId = e.currentTarget.dataset.parentid as string | undefined;
    this.setData({
      editing: true,
      editId: '',
      editName: '',
      editColor: '#10B981',
      editParentId: parentId || null,
    });
  },

  onBeginEdit(e: WechatMiniprogram.TouchEvent) {
    const item = e.currentTarget.dataset.item as CategoryItem;
    this.setData({
      editing: true,
      editId: item.id,
      editName: item.name,
      editColor: item.color || '#10B981',
      editParentId: item.parentId,
    });
  },

  onEditNameInput(e: WechatMiniprogram.Input) {
    this.setData({ editName: e.detail.value });
  },

  onCancelEdit() {
    this.setData({ editing: false, editId: '', editName: '', editParentId: null });
  },

  async onSaveEdit() {
    const { editId, editName, editColor, editParentId } = this.data;
    if (!editName.trim()) {
      wx.showToast({ title: '名称不能为空', icon: 'none' });
      return;
    }
    try {
      if (editId) {
        await updateCategory(editId, { name: editName.trim(), color: editColor });
      } else {
        await createCategory({ name: editName.trim(), parentId: editParentId || undefined });
      }
      wx.showToast({ title: editId ? '已更新' : '已创建', icon: 'success' });
      this.setData({ editing: false, editId: '', editName: '', editParentId: null });
      const cats = await getMyCategories();
      this.setData({ trees: cats });
    } catch (e) {
      wx.showToast({ title: errorMsg(e) || '操作失败', icon: 'none' });
    }
  },

  async onDelete(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    const res = await wx.showModal({ title: '删除分类', content: '确定删除该分类吗？' });
    if (!res.confirm) return;
    try {
      await deleteCategory(id);
      wx.showToast({ title: '已删除', icon: 'success' });
      const cats = await getMyCategories();
      this.setData({ trees: cats });
    } catch (e) {
      wx.showToast({ title: errorMsg(e) || '删除失败', icon: 'none' });
    }
  },

  onToggleExpand(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    const key = `expanded.${id}`;
    this.setData({ [key]: !this.data.expanded[id] });
  },
});
