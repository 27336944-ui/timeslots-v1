interface CellData {
  icon: string;
  title: string;
  value: string;
  showArrow: boolean;
}

interface CellMethods {
  onTap(): void;
  [key: string]: (...args: unknown[]) => unknown;
}

Component<CellData, Record<string, any>, CellMethods, never[]>({
  options: { styleIsolation: 'isolated' },
  properties: {
    icon: { type: String, value: '' },
    title: { type: String, value: '' },
    value: { type: String, value: '' },
    showArrow: { type: Boolean, value: true },
  },
  data: {
    icon: '',
    title: '',
    value: '',
    showArrow: true,
  },
  methods: {
    onTap() {
      this.triggerEvent('tap', { title: this.data.title });
    },
  },
});
