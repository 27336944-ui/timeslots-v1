/**
 * 微信小程序 App() 入口。
 *
 * **禁止**在此处放业务逻辑——只做：
 * 1. 全局错误捕获（`wx.onError`）
 * 2. 全局数据初始化（`globalData`）
 * 3. 启动 / 前后台切换钩子
 *
 * 业务初始化放各 Store / Service 的 onLaunch 钩子里。
 */
App({
  /**
   * 全局共享数据。
   *
   * 类型 `Record<string, unknown>` 是有意为之——具体字段在各 Store / 模块里收紧。
   */
  globalData: {} as Record<string, unknown>,

  /**
   * 小程序启动钩子（仅触发一次）。
   *
   * 流程：
   * 1. 读取系统信息 → 存 `globalData`（用于后续 viewport 适配）
   * 2. 注册全局错误监听（**入参是 `ListenerError`，字段是 `message`，不是 `errMsg`**）
   *
   * @see AGENTS §5.2.2 #20
   */
  onLaunch() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      (this.globalData as Record<string, unknown>).systemInfo = systemInfo;
    } catch (err) {
      console.error('Failed to get system info:', err);
    }

    wx.onError((err) => {
      console.error('[GlobalError]', err.message);
    });
    wx.onUnhandledRejection((res) => {
      console.error('[GlobalUnhandledRejection]', res.reason);
    });
  },

  /** 小程序前台显示钩子（每次从后台切回触发）。 */
  onShow() {},

  /** 小程序后台隐藏钩子（每次切到后台触发）。 */
  onHide() {},
});
