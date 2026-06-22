import { observable, action } from 'mobx-miniprogram';
import {
  getMyDelegations as apiGetMyDelegations,
  getDelegationDetail as apiGetDelegationDetail,
  createDelegation as apiCreateDelegation,
  respondDelegation as apiRespondDelegation,
  deliverDelegation as apiDeliverDelegation,
} from '../services/api';
import type { Delegation, DelegationListItem, CreateDelegationParams, RespondDelegationParams, DeliverDelegationParams } from '../types/delegation';
import { errorMsg } from '../utils/error';


interface DelegationStore {
  initiatedList: DelegationListItem[];
  receivedList: DelegationListItem[];
  currentDelegation: Delegation | null;
  loading: boolean;
  error: string;
  incomingCount: number;
  fetchMyDelegations: () => Promise<void>;
  fetchDetail: (id: string) => Promise<void>;
  createDelegation: (params: CreateDelegationParams) => Promise<Delegation>;
  respondDelegation: (id: string, params: RespondDelegationParams) => Promise<void>;
  deliverDelegation: (id: string, params: DeliverDelegationParams) => Promise<void>;
  clearCurrent: () => void;
}


export const delegationStore: DelegationStore = observable({
  initiatedList: [],
  receivedList: [],
  currentDelegation: null,
  loading: false,
  error: '',
  incomingCount: 0,

  fetchMyDelegations: action(async function (this: DelegationStore) {
    this.loading = true;
    this.error = '';
    try {
      const result = await apiGetMyDelegations();
      this.initiatedList = result.initiated;
      this.receivedList = result.received;
      this.incomingCount = result.received.filter(r => r.status === 'pending').length;
    } catch (e) {
      this.error = errorMsg(e) || '加载失败';
      this.initiatedList = [];
      this.receivedList = [];
      this.incomingCount = 0;
    } finally {
      this.loading = false;
    }
  }),

  createDelegation: action(async function (this: DelegationStore, params: CreateDelegationParams) {
    const result = await apiCreateDelegation(params);
    await this.fetchMyDelegations();
    return result;
  }),

  fetchDetail: action(async function (this: DelegationStore, id: string) {
    this.loading = true;
    this.error = '';
    try {
      this.currentDelegation = await apiGetDelegationDetail(id);
    } catch (e) {
      this.error = errorMsg(e) || '加载失败';
      this.currentDelegation = null;
    } finally {
      this.loading = false;
    }
  }),

  respondDelegation: action(async function (this: DelegationStore, id: string, params: RespondDelegationParams) {
    await apiRespondDelegation(id, params);
    await this.fetchMyDelegations();
  }),

  deliverDelegation: action(async function (this: DelegationStore, id: string, params: DeliverDelegationParams) {
    await apiDeliverDelegation(id, params);
    const updated = await apiGetDelegationDetail(id);
    this.currentDelegation = updated;
    await this.fetchMyDelegations();
  }),

  clearCurrent: action(function (this: DelegationStore) {
    this.currentDelegation = null;
  }),
});
