
Component({
  options: { styleIsolation: 'isolated' },

  properties: {
    
    title: { type: String, value: '' },
    
    desc: { type: String, value: '' },
    
    arrow: { type: Boolean, value: false },
    
    bordered: { type: Boolean, value: true },
  },

  methods: {
    
    onTap() {
      this.triggerEvent('tap');
    },
  },
});
