import type { CircleItem, Circle } from '../../../types/api';
import { errorMsg } from '../../../utils/error';

function buildCircleTree(circles: Circle[]): CircleItem[] {
  const map = new Map<string, CircleItem>();
  const roots: CircleItem[] = [];
  const childrenMap = new Map<string | null, CircleItem[]>();

  for (const c of circles) {
    const item: CircleItem = {
      id: c.id,
      name: c.name,
      level: c.level,
      parentId: c.parentId,
      sortOrder: c.sortOrder,
      isFixed: c.isFixed,
      isDefault: c.isDefault,
      description: c.description,
      memberCount: c.memberCount,
      myRole: c.myRole,
      children: [],
    };
    map.set(c.id, item);
    const pk = c.parentId ?? '__root__';
    if (!childrenMap.has(pk)) childrenMap.set(pk, []);
    childrenMap.get(pk)!.push(item);
  }

  for (const c of circles) {
    const parentKey = c.parentId ?? '__root__';
    if (parentKey === '__root__') {
      roots.push(map.get(c.id)!);
    } else {
      const parent = map.get(parentKey);
      if (parent) {
        parent.children.push(map.get(c.id)!);
      } else {
        roots.push(map.get(c.id)!);
      }
    }
  }

  roots.sort((a, b) => a.sortOrder - b.sortOrder);
  for (const r of roots) {
    r.children.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  return roots;
}


interface ClassificationsPageData {
  showCatPicker: boolean;

  // Circle data
  circleTrees: CircleItem[];
  circleLoading: boolean;
  circleEditing: boolean;
  circleCreateName: string;
  circleCreateParentId: string | null;
  circleJoining: boolean;
  circleJoinCode: string;
  circleExpanded: Record<string, boolean>;

  // Member dialog
  showMemberDialog: boolean;
  memberCircleId: string;
  memberCircleName: string;
  memberInput: string;
  members: Array<{ id: string; userId: string; nickname: string; role: string; displayUserId: string }>;
  addingMembers: boolean;
}


interface ClassificationsPageMethods {
  onLoad: () => void;
  loadCircles: () => Promise<void>;
  onOpenCatPicker: () => void;
  onCloseCatPicker: () => void;
  onToggleCircleExpand: (e: WechatMiniprogram.TouchEvent) => void;
  onShowCreateCircle: (e: WechatMiniprogram.TouchEvent) => void;
  onHideCircleCreate: () => void;
  onCircleCreateNameInput: (e: WechatMiniprogram.Input) => void;
  onConfirmCircleCreate: () => Promise<void>;
  onShowJoin: () => void;
  onHideJoin: () => void;
  onCircleJoinCodeInput: (e: WechatMiniprogram.Input) => void;
  onConfirmJoin: () => Promise<void>;
  onCircleTap: (e: WechatMiniprogram.TouchEvent) => void;
  onManageMembers: (e: WechatMiniprogram.TouchEvent) => Promise<void>;
  onHideMemberDialog: () => void;
  onMemberInput: (e: WechatMiniprogram.Input) => void;
  onAddMembers: () => Promise<void>;
  onRemoveMember: (e: WechatMiniprogram.TouchEvent) => Promise<void>;
  onLeaveCircle: (e: WechatMiniprogram.TouchEvent) => Promise<void>;
  onDeleteCircle: (e: WechatMiniprogram.TouchEvent) => Promise<void>;
}


Page<ClassificationsPageData, ClassificationsPageMethods>({
  data: {
    showCatPicker: false,

    circleTrees: [],
    circleLoading: false,
    circleEditing: false,
    circleCreateName: '',
    circleCreateParentId: null,
    circleJoining: false,
    circleJoinCode: '',
    circleExpanded: {},

    showMemberDialog: false,
    memberCircleId: '',
    memberCircleName: '',
    memberInput: '',
    members: [],
    addingMembers: false,
  },

  onLoad() {
    this.loadCircles();
  },

  onOpenCatPicker() {
    this.setData({ showCatPicker: true });
  },

  onCloseCatPicker() {
    this.setData({ showCatPicker: false });
  },

  async loadCircles() {
    this.setData({ circleLoading: true });
    try {
      const { getMyCircles } = await import('../../../services/api');
      const circles: Circle[] = await getMyCircles();
      const trees = buildCircleTree(circles);
      this.setData({ circleTrees: trees });
    } catch (e) {
      wx.showToast({ title: errorMsg(e) || '加载失败', icon: 'none' });
    } finally {
      this.setData({ circleLoading: false });
    }
  },

  // ========== 圈层分类：展开/收起 ==========
  onToggleCircleExpand(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    const key = `circleExpanded.${id}`;
    this.setData({ [key]: !this.data.circleExpanded[id] });
  },

  // ========== 圈层分类：创�?==========
  onShowCreateCircle(e: WechatMiniprogram.TouchEvent) {
    const parentId = e.currentTarget.dataset.parentid as string | undefined;
    this.setData({ circleEditing: true, circleCreateName: '', circleCreateParentId: parentId || null });
  },

  onHideCircleCreate() {
    this.setData({ circleEditing: false, circleCreateName: '', circleCreateParentId: null });
  },

  onCircleCreateNameInput(e: WechatMiniprogram.Input) {
    this.setData({ circleCreateName: e.detail.value });
  },

  async onConfirmCircleCreate() {
    if (!this.data.circleCreateName.trim()) {
      wx.showToast({ title: '分组名称不能为空', icon: 'none' });
      return;
    }
    try {
      const { createCircle, getMyCircles } = await import('../../../services/api');
      const data: { name: string; parentId?: string } = { name: this.data.circleCreateName.trim() };
      if (this.data.circleCreateParentId) {
        data.parentId = this.data.circleCreateParentId;
      }
      await createCircle(data);
      wx.showToast({ title: '已创建', icon: 'success' });
      this.setData({ circleEditing: false, circleCreateName: '', circleCreateParentId: null });
      const circles: Circle[] = await getMyCircles();
      this.setData({ circleTrees: buildCircleTree(circles) });
    } catch (e) {
      wx.showToast({ title: errorMsg(e) || '创建失败', icon: 'none' });
    }
  },

  // ========== 圈层分类：加�?==========
  onShowJoin() {
    this.setData({ circleJoining: true, circleJoinCode: '' });
  },

  onHideJoin() {
    this.setData({ circleJoining: false });
  },

  onCircleJoinCodeInput(e: WechatMiniprogram.Input) {
    this.setData({ circleJoinCode: e.detail.value });
  },

  async onConfirmJoin() {
    if (!this.data.circleJoinCode.trim()) {
      wx.showToast({ title: '邀请码不能为空', icon: 'none' });
      return;
    }
    try {
      const { joinCircleByCode, getMyCircles } = await import('../../../services/api');
      await joinCircleByCode(this.data.circleJoinCode.trim());
      wx.showToast({ title: '已加入', icon: 'success' });
      this.setData({ circleJoining: false });
      const circles: Circle[] = await getMyCircles();
      this.setData({ circleTrees: buildCircleTree(circles) });
    } catch (e) {
      wx.showToast({ title: errorMsg(e) || '加入失败', icon: 'none' });
    }
  },

  // ========== 圈层分类：操�?==========
  onCircleTap(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    wx.navigateTo({ url: `/pages/collab/detail/index?id=${id}` });
  },

  async onManageMembers(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    const name = e.currentTarget.dataset.name as string;
    try {
      wx.showLoading({ title: '加载中...' });
      const { getCircleDetail } = await import('../../../services/api');
      const detail = await getCircleDetail(id);
      const members = (detail.members || []).map((m) => ({
        id: m.id,
        userId: m.userId,
        nickname: m.nickname,
        role: m.role,
        displayUserId: m.userId ? m.userId.slice(0, 8) : '---',
      }));
      wx.hideLoading();
      this.setData({
        showMemberDialog: true,
        memberCircleId: id,
        memberCircleName: name,
        memberInput: '',
        members,
      });
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: errorMsg(e) || '加载失败', icon: 'none' });
    }
  },

  onHideMemberDialog() {
    this.setData({ showMemberDialog: false, memberCircleId: '', memberCircleName: '', memberInput: '', members: [], addingMembers: false } as unknown as Partial<ClassificationsPageData>);
  },

  onMemberInput(e: WechatMiniprogram.Input) {
    this.setData({ memberInput: e.detail.value });
  },

  async onAddMembers() {
    const input = this.data.memberInput.trim();
    if (!input) {
      wx.showToast({ title: '请输入用户ID', icon: 'none' });
      return;
    }
    const userIds = input.split(/[\s,;，；\n]+/).filter(Boolean);
    if (userIds.length === 0) {
      wx.showToast({ title: '请输入有效的用户 ID', icon: 'none' });
      return;
    }
    this.setData({ addingMembers: true });
    try {
      const { addCircleMembers, getCircleDetail, getMyCircles } = await import('../../../services/api');
      await addCircleMembers(this.data.memberCircleId, userIds);
      wx.showToast({ title: `已添加${userIds.length} 位成员`, icon: 'success' });
      const detail = await getCircleDetail(this.data.memberCircleId);
      const members = (detail.members || []).map((m) => ({
        id: m.id,
        userId: m.userId,
        nickname: m.nickname,
        role: m.role,
        displayUserId: m.userId ? m.userId.slice(0, 8) : '---',
      }));
      this.setData({ members, memberInput: '' });
      const circles: Circle[] = await getMyCircles();
      this.setData({ circleTrees: buildCircleTree(circles) });
    } catch (e) {
      wx.showToast({ title: errorMsg(e) || '添加失败', icon: 'none' });
    } finally {
      this.setData({ addingMembers: false });
    }
  },

  async onRemoveMember(e: WechatMiniprogram.TouchEvent) {
    const memberId = e.currentTarget.dataset.memberid as string;
    const res = await wx.showModal({ title: '移除成员', content: '确定要移除此成员吗？' });
    if (!res.confirm) return;
    try {
      wx.showLoading({ title: '移除中...' });
      const { removeCircleMember, getCircleDetail, getMyCircles } = await import('../../../services/api');
      await removeCircleMember(this.data.memberCircleId, memberId);
      wx.hideLoading();
      wx.showToast({ title: '已移除', icon: 'success' });
      const detail = await getCircleDetail(this.data.memberCircleId);
      const members = (detail.members || []).map((m) => ({
        id: m.id,
        userId: m.userId,
        nickname: m.nickname,
        role: m.role,
        displayUserId: m.userId ? m.userId.slice(0, 8) : '---',
      }));
      this.setData({ members });
      const circles: Circle[] = await getMyCircles();
      this.setData({ circleTrees: buildCircleTree(circles) });
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: errorMsg(e) || '移除失败', icon: 'none' });
    }
  },

  async onLeaveCircle(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    const res = await wx.showModal({ title: '退出分组', content: '确定退出该分组吗？' });
    if (!res.confirm) return;
    try {
      const { leaveCircle, getMyCircles } = await import('../../../services/api');
      await leaveCircle(id);
      wx.showToast({ title: '已退出', icon: 'success' });
      const circles: Circle[] = await getMyCircles();
      this.setData({ circleTrees: buildCircleTree(circles) });
    } catch (e) {
      wx.showToast({ title: errorMsg(e) || '操作失败', icon: 'none' });
    }
  },

  async onDeleteCircle(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    const res = await wx.showModal({ title: '删除分组', content: '确定删除该分组吗？（仅圈主可操作）' });
    if (!res.confirm) return;
    try {
      const { deleteCircle, getMyCircles } = await import('../../../services/api');
      await deleteCircle(id);
      wx.showToast({ title: '已删除', icon: 'success' });
      const circles: Circle[] = await getMyCircles();
      this.setData({ circleTrees: buildCircleTree(circles) });
    } catch (e) {
      wx.showToast({ title: errorMsg(e) || '删除失败', icon: 'none' });
    }
  },
});
