Component({
  options: { styleIsolation: 'isolated' },

  properties: {
    text: {
      type: String,
      value: '',
    },
    type: {
      type: String,
      value: 'primary',
    },
    block: {
      type: Boolean,
      value: true,
    },
    loading: {
      type: Boolean,
      value: false,
    },
    disabled: {
      type: Boolean,
      value: false,
    },
    openType: {
      type: String,
      value: '',
    },
  },

  methods: {
    onTap() {
      if (this.data.disabled || this.data.loading) return;
      this.triggerEvent('tap');
    },
  },
});
