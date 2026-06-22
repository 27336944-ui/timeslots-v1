import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';


interface TokenCache {
  accessToken: string;
  expiresAt: number;
}


@Injectable()
export class WxAccessTokenService {
  private readonly logger = new Logger(WxAccessTokenService.name);
  private cache: TokenCache | null = null;
  private readonly appid: string;
  private readonly secret: string;

  constructor(private readonly config: ConfigService) {
    this.appid = this.config.get<string>('WX_APPID') || '';
    this.secret = this.config.get<string>('WX_SECRET') || '';
  }

  async getAccessToken(): Promise<string | null> {
    if (this.cache && Date.now() < this.cache.expiresAt) {
      return this.cache.accessToken;
    }

    if (!this.appid || !this.secret) {
      this.logger.warn('[WxAccessToken] WX_APPID or WX_SECRET not configured');
      return null;
    }

    try {
      const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appid}&secret=${this.secret}`;
      const res = await fetch(url);
      const data = await res.json() as { access_token?: string; expires_in?: number; errcode?: number; errmsg?: string };

      if (data.errcode || !data.access_token) {
        this.logger.error(`[WxAccessToken] fetch failed: ${data.errcode} ${data.errmsg}`);
        return null;
      }

      // 缓存 90 分钟（微信默认 2 小时，提前 30 分钟刷新）
      this.cache = {
        accessToken: data.access_token,
        expiresAt: Date.now() + 5400000,
      };
      return data.access_token;
    } catch (err) {
      this.logger.error('[WxAccessToken] fetch error', err);
      return null;
    }
  }
}
