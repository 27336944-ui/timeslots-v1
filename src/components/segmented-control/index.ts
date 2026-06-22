interface SegmentedItem {
  label: string;
  value: string;
}

Component({
  options: { styleIsolation: 'isolated', multipleSlots: false },

  properties: {
    items: {
      type: Array,
      value: [] as SegmentedItem[],
    },
    value: {
      type: String,
      value: '',
    },
    disabled: {
      type: Boolean,
      value: false,
    },
  },

  methods: {
    onTap(e: WechatMiniprogram.TouchEvent) {
      if (this.data.disabled) return;
      const idx = e.currentTarget.dataset.idx as number;
      const item = (this.data.items as SegmentedItem[])[idx];
      if (!item || item.value === this.data.value) return;
      this.triggerEvent('change', { value: item.value, index: idx });
    },
  },
});
