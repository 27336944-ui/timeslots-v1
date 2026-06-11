
Component({
  options: { styleIsolation: 'isolated' },

  properties: {
    
    rowCount: { type: Number, value: 3 },
    
    showAvatar: { type: Boolean, value: false },
    
    avatarShape: { type: String, value: 'circle' },
  },
});
