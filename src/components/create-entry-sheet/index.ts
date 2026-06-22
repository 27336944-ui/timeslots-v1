type CreateType = 'voice' | 'image' | 'ai' | 'template' | 'manual';

interface EntryItem {
  type: CreateType;
  icon: string;
  label: string;
  desc: string;
  cls: string;
}

Component({
  options: { styleIsolation: 'isolated' },

  properties: {
    visible: {
      type: Boolean,
      value: false,
    },
    context: {
      type: String,
      value: 'schedule',
    },
  },

  data: {
    entries: [
      { type: 'voice', icon: '🎤', label: '语音识别', desc: '说出日程内容', cls: 'voice' },
      { type: 'image', icon: '📷', label: '图片识别', desc: '拍照或选图', cls: 'image' },
      { type: 'ai', icon: '✦', label: 'AI 智能拆解', desc: '任务自动拆分', cls: 'ai' },
      { type: 'template', icon: '☰', label: '选择模板', desc: '预设场景模板', cls: 'template' },
      { type: 'manual', icon: '✎', label: '手动输入', desc: '填写详情', cls: 'manual' },
    ] as EntryItem[],
  },

  methods: {
    onSelect(e: WechatMiniprogram.TouchEvent) {
      const type = e.currentTarget.dataset.type as CreateType;
      this.triggerEvent('select', { type, context: this.data.context });
    },
    onClose() {
      this.triggerEvent('close');
    },
    onOverlayTap() {
      this.triggerEvent('close');
    },
    onSheetTap() {
      return;
    },
  },
});
