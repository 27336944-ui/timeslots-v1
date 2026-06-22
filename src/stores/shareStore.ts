import { observable, action } from 'mobx-miniprogram';
import {
  getShareRecipients as apiGetRecipients,
  createShareRecipient as apiCreateRecipient,
  updateShareRecipient as apiUpdateRecipient,
  removeShareRecipient as apiRemoveRecipient,
  getStealthStatus as apiGetStealth,
  setStealthMode as apiSetStealth,
  disableStealthMode as apiDisableStealth,
} from '../services/api';
import { errorMsg } from '../utils/error';
import type { ShareRecipient, CreateShareRecipientParams } from '../types/share';


interface ShareStore {
  recipients: ShareRecipient[];
  stealthEnabled: boolean;
  stealthExpiresAt: string | null;
  loading: boolean;
  error: string;
  fetchRecipients: () => Promise<void>;
  addRecipient: (params: CreateShareRecipientParams) => Promise<ShareRecipient>;
  updateRecipient: (id: string, params: Record<string, unknown>) => Promise<void>;
  removeRecipient: (id: string) => Promise<void>;
  fetchStealth: () => Promise<void>;
  enableStealth: (durationMinutes?: number) => Promise<void>;
  disableStealth: () => Promise<void>;
}


export const shareStore: ShareStore = observable({
  recipients: [],
  stealthEnabled: false,
  stealthExpiresAt: null,
  loading: false,
  error: '',

  fetchRecipients: action(async function (this: ShareStore) {
    this.loading = true;
    this.error = '';
    try {
      this.recipients = await apiGetRecipients();
    } catch (e) {
      this.error = errorMsg(e) || '加载失败';
      this.recipients = [];
    } finally {
      this.loading = false;
    }
  }),

  addRecipient: action(async function (this: ShareStore, params: CreateShareRecipientParams) {
    const r = await apiCreateRecipient(params);
    await this.fetchRecipients();
    return r;
  }),

  updateRecipient: action(async function (this: ShareStore, id: string, params: Record<string, unknown>) {
    await apiUpdateRecipient(id, params);
    await this.fetchRecipients();
  }),

  removeRecipient: action(async function (this: ShareStore, id: string) {
    await apiRemoveRecipient(id);
    await this.fetchRecipients();
  }),

  fetchStealth: action(async function (this: ShareStore) {
    try {
      const s = await apiGetStealth();
      this.stealthEnabled = s.enabled;
      this.stealthExpiresAt = s.expiresAt;
    } catch (e) {
      console.error('[shareStore] fetchStealth failed:', errorMsg(e));
    }
  }),

  enableStealth: action(async function (this: ShareStore, durationMinutes?: number) {
    const s = await apiSetStealth(durationMinutes);
    this.stealthEnabled = s.enabled;
    this.stealthExpiresAt = s.expiresAt;
  }),

  disableStealth: action(async function (this: ShareStore) {
    await apiDisableStealth();
    this.stealthEnabled = false;
    this.stealthExpiresAt = null;
  }),
});
