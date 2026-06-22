
Component({
  options: { styleIsolation: 'isolated' },

  properties: {
    visible: { type: Boolean, value: false },
    title: { type: String, value: '确认' },
    content: { type: String, value: '确定执行此操作吗？' },
    confirmText: { type: String, value: '确定' },
    cancelText: { type: String, value: '取消' },
    danger: { type: Boolean, value: false },
  },

  methods: {
    onConfirm() {
      this.triggerEvent('confirm');
      this.setData({ visible: false });
    },

    onCancel() {
      this.triggerEvent('cancel');
      this.setData({ visible: false });
    },

    onOverlayTap() {
      this.triggerEvent('cancel');
      this.setData({ visible: false });
    },
  },
});
