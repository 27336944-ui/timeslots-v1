import { observable, action } from 'mobx-miniprogram';
import {
  getMyCircles, createCircle as apiCreateCircle,
  deleteCircle as apiDeleteCircle, getCircleDetail as apiGetCircleDetail,
  generateInviteCode as apiGenerateInviteCode,
  joinCircleByCode as apiJoinCircleByCode,
  leaveCircle as apiLeaveCircle,
  removeCircleMember as apiRemoveCircleMember,
} from '../services/api';
import type { Circle } from '../types/api';


interface CircleStore {
  circles: Circle[];
  currentCircle: Circle | null;
  loading: boolean;
  error: string;
  fetchMyCircles: () => Promise<void>;
  createCircle: (name: string, description?: string) => Promise<Circle>;
  deleteCircle: (id: string) => Promise<void>;
  fetchCircleDetail: (id: string) => Promise<void>;
  generateInviteCode: (circleId: string) => Promise<string>;
  joinCircle: (code: string) => Promise<Circle>;
  removeMember: (circleId: string, memberId: string) => Promise<void>;
  leaveCircle: (circleId: string) => Promise<void>;
}


export const circleStore: CircleStore = observable({
  circles: [],
  currentCircle: null,
  loading: false,
  error: '',

  fetchMyCircles: action(async function (this: CircleStore) {
    this.loading = true;
    this.error = '';
    try {
      this.circles = await getMyCircles();
    } catch (e) {
      this.error = (e as Error).message || '加载失败';
      this.circles = [];
    } finally {
      this.loading = false;
    }
  }),

  createCircle: action(async function (this: CircleStore, name: string, description?: string) {
    const circle = await apiCreateCircle({ name, description });
    await this.fetchMyCircles();
    return circle;
  }),

  deleteCircle: action(async function (this: CircleStore, id: string) {
    await apiDeleteCircle(id);
    if (this.currentCircle?.id === id) {
      this.currentCircle = null;
    }
    await this.fetchMyCircles();
  }),

  fetchCircleDetail: action(async function (this: CircleStore, id: string) {
    this.loading = true;
    this.error = '';
    try {
      this.currentCircle = await apiGetCircleDetail(id);
    } catch (e) {
      this.error = (e as Error).message || '加载失败';
      this.currentCircle = null;
    } finally {
      this.loading = false;
    }
  }),

  generateInviteCode: action(async function (this: CircleStore, circleId: string) {
    const res = await apiGenerateInviteCode(circleId);
    if (this.currentCircle?.id === circleId) {
      this.currentCircle.inviteCode = res.inviteCode;
    }
    return res.inviteCode;
  }),

  joinCircle: action(async function (this: CircleStore, code: string) {
    const circle = await apiJoinCircleByCode(code);
    await this.fetchMyCircles();
    return circle;
  }),

  removeMember: action(async function (this: CircleStore, circleId: string, memberId: string) {
    await apiRemoveCircleMember(circleId, memberId);
    if (this.currentCircle?.id === circleId) {
      await this.fetchCircleDetail(circleId);
    }
  }),

  leaveCircle: action(async function (this: CircleStore, circleId: string) {
    await apiLeaveCircle(circleId);
    if (this.currentCircle?.id === circleId) {
      this.currentCircle = null;
    }
    await this.fetchMyCircles();
  }),
});
