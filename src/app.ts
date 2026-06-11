
App({
  onLaunch() {
    wx.onError((error) => {
      console.error('[Global Error]', error.message);
    });
  },
});
