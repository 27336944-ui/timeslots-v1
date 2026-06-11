interface BottomSheetData {
  visible: boolean;
  title: string;
}

interface BottomSheetMethods {
  show(): void;
  hide(): void;
  onTapMask(): void;
  [key: string]: (...args: unknown[]) => unknown;
}

Component<BottomSheetData, Record<string, any>, BottomSheetMethods, never[]>({
  options: { styleIsolation: 'isolated' },
  properties: {
    visible: { type: Boolean, value: false },
    title: { type: String, value: '' },
  },
  data: { visible: false, title: '' },
  methods: {
    show() {
      this.setData({ visible: true });
      this.triggerEvent('show');
    },
    hide() {
      this.setData({ visible: false });
      this.triggerEvent('close');
    },
    onTapMask() {
      this.hide();
    },
  },
});
