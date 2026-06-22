import { getMyCircles, getCircleDetail, createCircle, joinCircleByCode, leaveCircle, deleteCircle, addCircleMembers, removeCircleMember } from '../../../services/api';
import type { Circle, CircleItem } from '../../../types/api';
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


interface CirclesPageData {
  trees: CircleItem[];
  loading: boolean;
  showCreate: boolean;
  createName: string;
  createParentId: string | null;
  showJoin: boolean;
  joinCode: string;
  expanded: Record<string, boolean>;
  showMemberDialog: boolean;
  memberCircleId: string;
  memberCircleName: string;
  memberInput: string;
  members: Array<{ id: string; userId: string; nickname: string; role: string; displayUserId: string }>;
  addingMembers: boolean;
}

interface CirclesPageMethods {
  onLoad: () => Promise<void>;
  onToggleExpand: (e: WechatMiniprogram.TouchEvent) => void;
  onShowCreate: (e: WechatMiniprogram.TouchEvent) => void;
  onHideCreate: () => void;
  onCreateNameInput: (e: WechatMiniprogram.Input) => void;
  onConfirmCreate: () => Promise<void>;
  onShowJoin: () => void;
  onHideJoin: () => void;
  onJoinCodeInput: (e: WechatMiniprogram.Input) => void;
  onConfirmJoin: () => Promise<void>;
  onCircleTap: (e: WechatMiniprogram.TouchEvent) => void;
  onManageMembers: (e: WechatMiniprogram.TouchEvent) => Promise<void>;
  onHideMemberDialog: () => void;
  onMemberInput: (e: WechatMiniprogram.Input) => void;
  onAddMembers: () => Promise<void>;
  onRemoveMember: (e: WechatMiniprogram.TouchEvent) => void;
  onLeaveCircle: (e: WechatMiniprogram.TouchEvent) => void;
  onDeleteCircle: (e: WechatMiniprogram.TouchEvent) => void;
}

Page<CirclesPageData, CirclesPageMethods>({
  data: {
    trees: [],
    loading: false,
    showCreate: false,
    createName: '',
    createParentId: null,
    showJoin: false,
    joinCode: '',
    expanded: {},
    showMemberDialog: false,
    memberCircleId: '',
    memberCircleName: '',
    memberInput: '',
    members: [],
    addingMembers: false,
  },

  async onLoad() {
    this.setData({ loading: true });
    try {
      const circles = await getMyCircles();
      const trees = buildCircleTree(circles);
      this.setData({ trees });
    } catch (e) {
      wx.showToast({ title: errorMsg(e) || '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onToggleExpand(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    const key = `expanded.${id}`;
    this.setData({ [key]: !this.data.expanded[id] });
  },

  onShowCreate(e: WechatMiniprogram.TouchEvent) {
    const parentId = e.currentTarget.dataset.parentid as string | undefined;
    this.setData({ showCreate: true, createName: '', createParentId: parentId || null });
  },

  onHideCreate() {
    this.setData({ showCreate: false, createName: '', createParentId: null });
  },

  onCreateNameInput(e: WechatMiniprogram.Input) {
    this.setData({ createName: e.detail.value });
  },

  async onConfirmCreate() {
    if (!this.data.createName.trim()) {
      wx.showToast({ title: '分组名称不能为空', icon: 'none' });
      return;
    }
    try {
      const data: { name: string; parentId?: string } = { name: this.data.createName.trim() };
      if (this.data.createParentId) {
        data.parentId = this.data.createParentId;
      }
      await createCircle(data);
      wx.showToast({ title: '已创建', icon: 'success' });
      this.setData({ showCreate: false, createName: '', createParentId: null });
      const circles = await getMyCircles();
      this.setData({ trees: buildCircleTree(circles) });
    } catch (e) {
      wx.showToast({ title: errorMsg(e) || '创建失败', icon: 'none' });
    }
  },

  onShowJoin() {
    this.setData({ showJoin: true, joinCode: '' });
  },

  onHideJoin() {
    this.setData({ showJoin: false });
  },

  onJoinCodeInput(e: WechatMiniprogram.Input) {
    this.setData({ joinCode: e.detail.value });
  },

  async onConfirmJoin() {
    if (!this.data.joinCode.trim()) {
      wx.showToast({ title: '邀请码不能为空', icon: 'none' });
      return;
    }
    try {
      await joinCircleByCode(this.data.joinCode.trim());
      wx.showToast({ title: '已加入', icon: 'success' });
      this.setData({ showJoin: false });
      const circles = await getMyCircles();
      this.setData({ trees: buildCircleTree(circles) });
    } catch (e) {
      wx.showToast({ title: errorMsg(e) || '加入失败', icon: 'none' });
    }
  },

  onCircleTap(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    wx.navigateTo({ url: `/pages/collab/detail/index?id=${id}` });
  },

  async onManageMembers(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    const name = e.currentTarget.dataset.name as string;
    try {
      wx.showLoading({ title: '加载中...' });
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
    this.setData({ showMemberDialog: false, memberCircleId: '', memberCircleName: '', memberInput: '', members: [], addingMembers: false } as unknown as Partial<CirclesPageData>);
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
      const circles = await getMyCircles();
      this.setData({ trees: buildCircleTree(circles) });
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
      await removeCircleMember(this.data.memberCircleId, memberId);
      wx.hideLoading();
      wx.showToast({ title: '已移除', icon: 'success' });
      const detail2 = await getCircleDetail(this.data.memberCircleId);
      const members = (detail2.members || []).map((m) => ({
        id: m.id,
        userId: m.userId,
        nickname: m.nickname,
        role: m.role,
        displayUserId: m.userId ? m.userId.slice(0, 8) : '---',
      }));
      this.setData({ members });
      const circles = await getMyCircles();
      this.setData({ trees: buildCircleTree(circles) });
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
      await leaveCircle(id);
      wx.showToast({ title: '已退出', icon: 'success' });
      const circles = await getMyCircles();
      this.setData({ trees: buildCircleTree(circles) });
    } catch (e) {
      wx.showToast({ title: errorMsg(e) || '操作失败', icon: 'none' });
    }
  },

  async onDeleteCircle(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    const res = await wx.showModal({ title: '删除分组', content: '确定删除该分组吗？（仅圈主可操作）' });
    if (!res.confirm) return;
    try {
      await deleteCircle(id);
      wx.showToast({ title: '已删除', icon: 'success' });
      const circles = await getMyCircles();
      this.setData({ trees: buildCircleTree(circles) });
    } catch (e) {
      wx.showToast({ title: errorMsg(e) || '删除失败', icon: 'none' });
    }
  },
});