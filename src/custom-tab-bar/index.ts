interface CustomTabBarData {
  selected: number
  list: { pagePath: string; text: string; icon: string }[]
}

type CustomTabBarMethods = {
  onTabTap(e: WechatMiniprogram.CustomEvent<{ index: string }>): void
}

Component<CustomTabBarData, Record<string, never>, CustomTabBarMethods>({
  data: {
    selected: 0,
    // TODO: 替换为 SVG/PNG 图标（汉字图标仅临时方案）
    list: [
      { pagePath: '/pages/schedule/index', text: '日程', icon: '日' },
      { pagePath: '/pages/collab/index', text: '协作', icon: '协' },
      { pagePath: '/pages/tasks/index', text: '任务', icon: '务' },
      { pagePath: '/pages/mine/index', text: '我的', icon: '我' },
    ],
  },
  methods: {
    onTabTap(e) {
      const index = parseInt(e.currentTarget.dataset.index, 10)
      const item = this.data.list[index]
      if (item) {
        wx.switchTab({ url: item.pagePath })
      }
    },
  },
})
