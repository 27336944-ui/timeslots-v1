import { search } from '../../services/api';
import type { SearchResultItem } from '../../types/api';
import { errorMsg } from '../../utils/error';

const TYPE_LABEL: Record<string, string> = {
  timeblock: '日程',
  task: '任务',
  circle: '分组',
};

interface SearchPageData {
  keyword: string;
  results: SearchResultItem[];
  grouped: { type: string; label: string; items: SearchResultItem[] }[];
  searched: boolean;
  loading: boolean;
  TYPE_LABEL: Record<string, string>;
}

interface SearchPageMethods {
  onKeywordInput: (e: WechatMiniprogram.Input) => void;
  onSearch: () => Promise<void>;
  onResultTap: (e: WechatMiniprogram.TouchEvent) => void;
  onClear: () => void;
  onBackHome: () => void;
}

Page<SearchPageData, SearchPageMethods>({
  data: {
    keyword: '',
    results: [],
    grouped: [],
    searched: false,
    loading: false,
    TYPE_LABEL,
  },

  onKeywordInput(e: WechatMiniprogram.Input) {
    this.setData({ keyword: e.detail.value });
  },

  async onSearch() {
    const q = this.data.keyword.trim();
    if (!q) {
      wx.showToast({ title: '请输入搜索关键词', icon: 'none' });
      return;
    }
    this.setData({ loading: true });
    try {
      const res = await search(q);
      const grouped: { type: string; label: string; items: SearchResultItem[] }[] = [];
      for (const t of ['timeblock', 'task', 'circle']) {
        const items = res.results.filter((r) => r.type === t);
        if (items.length > 0) {
          grouped.push({ type: t, label: TYPE_LABEL[t] || t, items });
        }
      }
      this.setData({ results: res.results, grouped, searched: true });
    } catch (e) {
      wx.showToast({ title: errorMsg(e) || '搜索失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onResultTap(e: WechatMiniprogram.TouchEvent) {
    const index = Number(e.currentTarget.dataset.index);
    const item = this.data.results[index];
    if (!item) return;
    switch (item.type) {
      case 'timeblock':
        wx.navigateTo({ url: `/pages/schedule/detail/index?id=${item.id}` });
        break;
      case 'task':
        wx.navigateTo({ url: `/pages/tasks/task-detail/index?id=${item.id}` });
        break;
      case 'circle':
        wx.navigateTo({ url: `/pages/collab/detail/index?id=${item.id}` });
        break;
    }
  },

  onClear() {
    this.setData({ keyword: '', results: [], grouped: [], searched: false });
  },

  onBackHome() {
    wx.switchTab({ url: '/pages/schedule/index' });
  },
});
