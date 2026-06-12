
App({
  onLaunch() {
    wx.onError((error) => {
      console.error('[Global Error]', error.message);
    });
    wx.onUnhandledRejection((res) => {
      console.error('[Unhandled Rejection]', res.reason);
    });
  },
});
