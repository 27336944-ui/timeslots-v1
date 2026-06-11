interface TagData {
  text: string;
  active: boolean;
  variant: string;
  disabled: boolean;
}

interface TagMethods {
  onTap(): void;
  [key: string]: (...args: unknown[]) => unknown;
}

Component<TagData, Record<string, any>, TagMethods, never[]>({
  options: { styleIsolation: 'isolated' },
  properties: {
    text: { type: String, value: '' },
    active: { type: Boolean, value: false },
    variant: { type: String, value: 'default' },
    disabled: { type: Boolean, value: false },
  },
  data: {
    text: '',
    active: false,
    variant: 'default',
    disabled: false,
  },
  methods: {
    onTap() {
      if (this.data.disabled) {
        return;
      }
      this.triggerEvent('tap', { text: this.data.text });
    },
  },
});
