
Component({
  options: { styleIsolation: 'isolated' },

  properties: {
    
    visible: { type: Boolean, value: false },
    
    height: { type: String, value: '50vh' },
  },

  methods: {
    
    onOverlayTap() {
      this.triggerEvent('close');
    },

    
    onContentTap() {
      return;
    },
  },
});
