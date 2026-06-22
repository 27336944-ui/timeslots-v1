
Component({
  options: { styleIsolation: 'isolated' },

  properties: {
    loading: { type: Boolean, value: false },
    empty: { type: Boolean, value: false },
    error: { type: Boolean, value: false },
    emptyText: { type: String, value: '暂无数据' },
    errorText: { type: String, value: '加载失败，请重试' },
    actionText: { type: String, value: '' },
  },

  methods: {
    onAction() {
      this.triggerEvent('action');
    },
  },
});
