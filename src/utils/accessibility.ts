/**
 * 无障碍工具：字号适配 + 高对比度检测
 */

/** 微信字体大小档次映射为缩放系数 */
const SCALE_MAP: Record<string, number> = {
  standard: 1.0,
  large: 1.15,
  extralarge: 1.3,
  huge: 1.5,
};

/**
 * 获取当前系统字体缩放系数
 * 读微信 fontSizeSetting（standard / large / extralarge / huge）
 * 返回 1.0（标准）到 1.5（巨大）之间的倍数
 */
export function getFontScale(): number {
  try {
    const info = wx.getSystemInfoSync();
    const setting: string = (info as any).fontSizeSetting || 'standard';
    return SCALE_MAP[setting] ?? 1.0;
  } catch {
    return 1.0;
  }
}

/**
 * 判断是否为高对比度模式
 */
export function isHighContrast(): boolean {
  try {
    const info = wx.getSystemInfoSync();
    return !!(info as any).highContrastEnabled;
  } catch {
    return false;
  }
}
