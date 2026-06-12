const DEV_URL = 'http://localhost:7777';
const PROD_URL = 'https://api.timeslots.app';

function getBaseUrl(): string {
  try {
    const accountInfo = wx.getAccountInfoSync();
    const env = accountInfo.miniProgram.envVersion;
    if (env === 'release') {
      return PROD_URL;
    }
  } catch {
    // wx.getAccountInfoSync is available since base lib 2.10.0
  }
  return DEV_URL;
}

/** 微信订阅消息模板 ID（需在微信公众平台配置后替换） */
const SUBSCRIBE_TEMPLATE_IDS: string[] = [];

export const APP_CONFIG = {
  BASE_URL: getBaseUrl(),
  TOKEN_KEY: 'token',
  SUBSCRIBE_TEMPLATE_IDS,
};
