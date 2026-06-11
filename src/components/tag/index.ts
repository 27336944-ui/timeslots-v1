
Component({
  options: { styleIsolation: 'isolated' },

  properties: {
    
    text: { type: String, value: '' },
    
    type: { type: String, value: 'default' },
    
    size: { type: String, value: 'md' },
    
    closable: { type: Boolean, value: false },
  },

  methods: {
    
    onClose() {
      this.triggerEvent('close');
    },
  },
});
