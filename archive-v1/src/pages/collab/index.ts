import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { circleStore } from '../../stores/circle-store';
import { api } from '../../services/api';
import type { CircleView } from '../../types/circle';
import type { MyTimeBlock } from '../../types/block';

interface CircleCardItem {
  id: string;
  name: string;
  role: string;
  roleLabel: string;
  memberCount: number;
}

interface InviteCardItem {
  id: string;
  circleName: string;
  inviterName: string;
  sentAt: string;
}

interface SharedCardItem {
  id: string;
  title: string;
  timeRange: string;
  nature: string;
}

interface CollabPageData {
  currentSub: 'mine' | 'invites' | 'shared';
  subTabs: { key: string; label: string }[];
  circles: CircleCardItem[];
  invites: InviteCardItem[];
  shared: SharedCardItem[];
  items: CircleView[];
  loading: boolean;
}

interface CollabPageMethods {
  onLoad(): void;
  onShow(): void;
  onTapSub(e: WechatMiniprogram.TouchEvent): void;
  onTapCreate(): void;
  onTapCircle(e: WechatMiniprogram.TouchEvent): void;
  loadCircles(): Promise<void>;
  loadInvites(): Promise<void>;
  loadShared(): Promise<void>;
}

const roleLabels: Record<string, string> = {
  OWNER: '创建者',
  ADMIN: '管理员',
  MEMBER: '成员',
};

const subTabs: CollabPageData['subTabs'] = [
  { key: 'mine', label: '我的圈子' },
  { key: 'invites', label: '收到的邀请' },
  { key: 'shared', label: '共享给我' },
];

let bindings: ReturnType<typeof createStoreBindings> | null = null;
let _loadingCollab = false;

Page<CollabPageData, CollabPageMethods>({
  data: {
    currentSub: 'mine',
    subTabs,
    circles: [],
    invites: [],
    shared: [],
    items: [],
    loading: false,
  },

  onLoad() {
    bindings = createStoreBindings(this, {
      store: circleStore,
      fields: ['items', 'loading'],
      actions: [],
    });
  },

  onUnload() {
    bindings?.destroyStoreBindings();
    bindings = null;
  },

  onShow() {
    if (_loadingCollab) {
      return;
    }
    _loadingCollab = true;
    Promise.all([this.loadCircles(), this.loadInvites(), this.loadShared()]).finally(() => {
      _loadingCollab = false;
    });
  },

  onTapSub(e: WechatMiniprogram.TouchEvent) {
    const key = e.currentTarget.dataset.key as 'mine' | 'invites' | 'shared';
    this.setData({ currentSub: key });
  },

  onTapCreate() {
    void wx.showToast({ title: '创建圈子 (M2)', icon: 'none' });
  },

  onTapCircle(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    void wx.showToast({ title: `圈子 ${id}`, icon: 'none' });
  },

  async loadCircles() {
    await circleStore.fetchMine();
    this.setData({
      circles: circleStore.items.map((c) => ({
        id: c.id,
        name: c.name,
        role: c.role,
        roleLabel: roleLabels[c.role] ?? c.role,
        memberCount: c.memberCount,
      })),
    });
  },

  async loadInvites() {
    this.setData({
      invites: [
        { id: 'demo-1', circleName: '产品团队', inviterName: '张三', sentAt: '2026-06-08' },
        { id: 'demo-2', circleName: '健身小组', inviterName: '李四', sentAt: '2026-06-07' },
      ],
    });
  },

  async loadShared() {
    try {
      const blocks = await api.get<MyTimeBlock[]>('/time-blocks/shared');
      const shared = blocks.map((b) => ({
        id: b.id,
        title: b.title,
        timeRange: `${b.startTime.slice(5, 10)} ${b.startTime.slice(11, 16)}-${b.endTime.slice(11, 16)}`,
        nature: b.nature,
      }));
      this.setData({ shared });
    } catch {
      this.setData({ shared: [] });
    }
  },
});
