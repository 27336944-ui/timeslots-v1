import { request } from '../../utils/request';
import type { TimeBlockVO, TimeBlockListResponse } from '../../types/api';

interface PageData {
  title: string;
  loading: boolean;
  blocks: TimeBlockVO[];
  errorMessage: string | null;
}

Page<{}, PageData>({
  data: {
    title: '今日时段',
    loading: false,
    blocks: [],
    errorMessage: null,
  },

  onLoad() {
    void this.fetchBlocks();
  },

  onPullDownRefresh() {
    void this.fetchBlocks().finally(() => {
      wx.stopPullDownRefresh({});
    });
  },

  onTapCreate() {
    wx.navigateTo({ url: '/pages/time-block-detail/index?id=new' });
  },

  onTapRetry() {
    void this.fetchBlocks();
  },

  onTapBlock(event: WechatMiniprogram.CustomEvent) {
    const detail = event.detail as { id: string };
    wx.navigateTo({ url: `/pages/time-block-detail/index?id=${detail.id}` });
  },

  async fetchBlocks() {
    this.setData({ loading: true, errorMessage: null });
    try {
      const today = new Date().toISOString().slice(0, 10);
      const response = await request<TimeBlockListResponse>({
        url: '/api/v1/time-blocks',
        method: 'GET',
        data: { date: today },
      });
      this.setData({ blocks: response.items });
    } catch (err) {
      this.setData({
        errorMessage: err instanceof Error ? err.message : '加载失败',
      });
    } finally {
      this.setData({ loading: false });
    }
  },
});
