
import { healthCheck } from '../../services/api';


interface IndexPageData {
  loading: boolean;
  connected: boolean;
  dbStatus: string;
  backendVersion: string;
  error: string;
}


interface IndexPageMethods {
  checkHealth: () => Promise<void>;
  goToMine: () => void;
}

Page<IndexPageData, IndexPageMethods>({
  
  data: {
    loading: true,
    connected: false,
    dbStatus: '',
    backendVersion: '',
    error: '',
  },

  
  onLoad() {
    this.checkHealth();
  },

  
  async checkHealth() {
    this.setData({ loading: true, error: '' });
    try {
      const data = await healthCheck();
      this.setData({
        loading: false,
        connected: true,
        dbStatus: data.db,
        backendVersion: data.status,
      });
    } catch (e) {
      this.setData({
        loading: false,
        connected: false,
        error: (e as Error).message || '连接失败',
      });
    }
  },

  
  goToMine() {
    wx.navigateTo({ url: '/pages/mine/index' });
  },
});
