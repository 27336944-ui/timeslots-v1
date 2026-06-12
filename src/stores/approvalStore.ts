import { observable, action } from 'mobx-miniprogram';
import {
  getMyInitiatedApprovals, getMyPendingApprovals,
  createApproval as apiCreateApproval,
  respondApproval as apiRespondApproval,
  cancelApproval as apiCancelApproval,
  getApprovalDetail as apiGetApprovalDetail,
  bindApprovalRecipient as apiBindRecipient,
} from '../services/api';
import type { ApprovalRequest, ApprovalPendingItem, RecipientInput } from '../types/approval';


interface ApprovalStore {
  initiatedList: ApprovalRequest[];
  pendingList: ApprovalPendingItem[];
  currentRequest: ApprovalRequest | null;
  loading: boolean;
  error: string;
  fetchMyInitiated: () => Promise<void>;
  fetchMyPending: () => Promise<void>;
  fetchDetail: (id: string) => Promise<void>;
  createApproval: (blockId: string, recipients: RecipientInput[]) => Promise<ApprovalRequest>;
  respondApproval: (requestId: string, recipientId: string, action: 'approve' | 'reject') => Promise<void>;
  cancelApproval: (id: string) => Promise<void>;
  bindRecipient: (requestId: string) => Promise<string>;
  clearCurrent: () => void;
}


export const approvalStore: ApprovalStore = observable({
  initiatedList: [],
  pendingList: [],
  currentRequest: null,
  loading: false,
  error: '',

  fetchMyInitiated: action(async function (this: ApprovalStore) {
    this.loading = true;
    this.error = '';
    try {
      const raw = await getMyInitiatedApprovals();
      this.initiatedList = raw.map((item) => {
        const total = item.recipients.length;
        const nonPending = item.recipients.filter(r => r.status !== 'pending').length;
        const approved = item.recipients.filter(r => r.status === 'approved').length;
        return { ...item, progressPercent: total > 0 ? (nonPending / total) * 100 : 0, approvedCount: approved };
      });
    } catch (e) {
      this.error = (e as Error).message || '加载失败';
      this.initiatedList = [];
    } finally {
      this.loading = false;
    }
  }),

  fetchMyPending: action(async function (this: ApprovalStore) {
    this.loading = true;
    this.error = '';
    try {
      this.pendingList = await getMyPendingApprovals();
    } catch (e) {
      this.error = (e as Error).message || '加载失败';
      this.pendingList = [];
    } finally {
      this.loading = false;
    }
  }),

  fetchDetail: action(async function (this: ApprovalStore, id: string) {
    this.loading = true;
    this.error = '';
    try {
      this.currentRequest = await apiGetApprovalDetail(id);
    } catch (e) {
      this.error = (e as Error).message || '加载失败';
      this.currentRequest = null;
    } finally {
      this.loading = false;
    }
  }),

  createApproval: action(async function (this: ApprovalStore, blockId: string, recipients: RecipientInput[]) {
    const result = await apiCreateApproval({ blockId, recipients });
    await this.fetchMyInitiated();
    return result;
  }),

  respondApproval: action(async function (this: ApprovalStore, requestId: string, recipientId: string, actionType: 'approve' | 'reject') {
    await apiRespondApproval(requestId, recipientId, actionType);
    await this.fetchMyPending();
    if (this.currentRequest?.id === requestId) {
      await this.fetchDetail(requestId);
    }
  }),

  cancelApproval: action(async function (this: ApprovalStore, id: string) {
    await apiCancelApproval(id);
    await this.fetchMyInitiated();
    if (this.currentRequest?.id === id) {
      this.currentRequest = null;
    }
  }),

  bindRecipient: action(async function (this: ApprovalStore, requestId: string) {
    const result = await apiBindRecipient(requestId);
    return result.recipientId;
  }),

  clearCurrent: action(function (this: ApprovalStore) {
    this.currentRequest = null;
  }),
});
