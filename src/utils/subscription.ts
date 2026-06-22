import { logError } from './logError';

export type SubscribeScenario =
  | 'reminder'
  | 'approval_invite'
  | 'approval_result'
  | 'delegation_request'
  | 'delegation_complete'
  | 'step_unlock'
  | 'weekly_report';

const SUB_STORAGE_KEY = 'sub_';

function subKey(scenario: SubscribeScenario): string {
  return `${SUB_STORAGE_KEY}${scenario}`;
}

export const subscription = {
  hasAccepted(scenario: SubscribeScenario): boolean {
    try {
      const raw = wx.getStorageSync(subKey(scenario));
      return raw === true;
    } catch {
      return false;
    }
  },

  markAccepted(scenario: SubscribeScenario): void {
    try {
      wx.setStorageSync(subKey(scenario), true);
    } catch {
      console.warn(`[subscription] setStorageSync failed: ${scenario}`);
    }
  },

  markRejected(scenario: SubscribeScenario): void {
    try {
      wx.setStorageSync(subKey(scenario), false);
    } catch {
      console.warn(`[subscription] setStorageSync failed: ${scenario}`);
    }
  },

  async request(scenario: SubscribeScenario, tmplIds: string[]): Promise<boolean> {
    if (tmplIds.length === 0) {
      return true;
    }
    if (subscription.hasAccepted(scenario)) {
      return true;
    }
    try {
      const res = await wx.requestSubscribeMessage({ tmplIds });
      const accepted = Object.values(res).some((v) => v === 'accept');
      if (accepted) {
        subscription.markAccepted(scenario);
      } else {
        subscription.markRejected(scenario);
      }
      return accepted;
    } catch (err) {
      logError('[subscription] request failed', err);
      return false;
    }
  },
};
