import type { TimeBlockVO } from '../../types/api';

interface ComponentData {
  expanded: boolean;
}

interface ComponentProperties {
  block: TimeBlockVO | null;
  editable: boolean;
}

Component<ComponentData, ComponentProperties, {}>({
  options: {
    styleIsolation: 'isolated',
  },

  properties: {
    block: {
      type: Object,
      value: null,
    },
    editable: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    expanded: false,
  },

  methods: {
    onTap() {
      const { block } = this.data;
      if (!block) return;
      this.triggerEvent('tap', { id: block.id });
    },

    onLongPress() {
      const { block } = this.data;
      if (!block) return;
      this.triggerEvent('longpress', { id: block.id });
    },

    onToggleExpand() {
      this.setData({ expanded: !this.data.expanded });
    },
  },

  lifetimes: {
    attached() {
      this.setData({ expanded: false });
    },
  },
});
