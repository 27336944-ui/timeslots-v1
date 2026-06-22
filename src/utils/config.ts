import { storage } from './storage';
import { SERVER_URL } from './storage';
import { logError } from './logError';

const DEV_URL = 'http://localhost:7777';
const PROD_URL = 'https://api.timeslots.app';

function getBaseUrl(): string {
  const saved = storage.get<string>(SERVER_URL);
  if (saved) return saved;
  try {
    const accountInfo = wx.getAccountInfoSync();
    const env = accountInfo.miniProgram.envVersion;
    if (env === 'release') {
      return PROD_URL;
    }
    // 体验版也走生产环境（暂无独立 staging；待灰度上线后改为 staging 地址）
    if (env === 'trial') {
      return PROD_URL; // TODO: 替换为 STAGING_URL
    }
  } catch (e) {
    logError('config_getBaseUrl', e);
  }
  return DEV_URL;
}

/** 微信订阅消息模板 ID（需在微信公众平台配置后替换） */
const SUBSCRIBE_TEMPLATE_IDS: string[] = [];

/** 时间块时长选项 */
export const DURATION_OPTIONS = [
  { value: '30min', label: '30 分钟' },
  { value: '1h', label: '1 小时' },
  { value: '2h', label: '2 小时' },
];

export const APP_CONFIG = {
  getBaseUrl,
  TOKEN_KEY: 'token',
  SUBSCRIBE_TEMPLATE_IDS,
  APP_VERSION: '0.49',
};
