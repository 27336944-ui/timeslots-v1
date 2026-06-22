import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WxAccessTokenService } from './wx-access-token.service';


export interface SendNotificationOptions {
  userId: string;
  openid: string;
  scenario: NotificationScenario;
  page?: string;
  data: Record<string, string>;
}


export type NotificationScenario =
  | 'reminder'
  | 'approval_invite'
  | 'approval_result'
  | 'delegation_request'
  | 'delegation_complete'
  | 'step_unlock'
  | 'weekly_report';


const SCENARIO_TEMPLATE_ENV: Record<NotificationScenario, string> = {
  reminder: 'WX_TEMPLATE_REMINDER',
  approval_invite: 'WX_TEMPLATE_APPROVAL_INVITE',
  approval_result: 'WX_TEMPLATE_APPROVAL_RESULT',
  delegation_request: 'WX_TEMPLATE_DELEGATION_REQUEST',
  delegation_complete: 'WX_TEMPLATE_DELEGATION_COMPLETE',
  step_unlock: 'WX_TEMPLATE_STEP_UNLOCK',
  weekly_report: 'WX_TEMPLATE_WEEKLY_REPORT',
};


@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly wxToken: WxAccessTokenService,
  ) {}

  getTemplateId(scenario: NotificationScenario): string | null {
    const envKey = SCENARIO_TEMPLATE_ENV[scenario];
    const tid = this.config.get<string>(envKey);
    if (!tid) {
      this.logger.warn(`[Notification] templateId for ${scenario} not configured (${envKey})`);
      return null;
    }
    return tid;
  }

  async sendSubscribeMessage(options: SendNotificationOptions): Promise<boolean> {
    if (!options.openid) {
      this.logger.warn(`[Notification] skipping: no openid for userId=${options.userId}, scenario=${options.scenario}`);
      return false;
    }

    const templateId = this.getTemplateId(options.scenario);
    if (!templateId) return false;

    const accessToken = await this.wxToken.getAccessToken();
    if (!accessToken) {
      this.logger.warn(`[Notification] no access_token, falling back to log-only: ${options.scenario}`);
      this.logger.log(
        `[Notification] ${options.scenario} → userId=${options.userId} openid=${options.openid.substring(0, 4)}*** templateId=${templateId} data=${JSON.stringify(options.data)}`,
      );
      return false;
    }

    try {
      const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`;
      const body = {
        touser: options.openid,
        template_id: templateId,
        page: options.page || 'pages/index/index',
        data: this.buildSubscribeData(options.data),
        miniprogram_state: this.config.get<string>('NODE_ENV') === 'production' ? 'formal' : 'developer',
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json() as { errcode: number; errmsg: string };

      if (result.errcode !== 0) {
        this.logger.error(`[Notification] subscribeMessage.send failed: ${result.errcode} ${result.errmsg}`);
        return false;
      }

      this.logger.log(`[Notification] sent: ${options.scenario} → ${options.openid.substring(0, 4)}***`);
      return true;
    } catch (err) {
      this.logger.error(`[Notification] send failed: ${options.scenario} userId=${options.userId}`, err);
      return false;
    }
  }

  private buildSubscribeData(data: Record<string, string>): Record<string, { value: string }> {
    const result: Record<string, { value: string }> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = { value };
    }
    return result;
  }
}
