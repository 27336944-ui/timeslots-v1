interface CustomTabBarData {
  selected: number
  list: { pagePath: string; text: string }[]
}

type CustomTabBarMethods = {
  onTabTap(e: WechatMiniprogram.CustomEvent<{ index: string }>): void
}

Component<CustomTabBarData, Record<string, never>, CustomTabBarMethods>({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/schedule/index', text: '日程' },
      { pagePath: '/pages/collab/index', text: '协作' },
      { pagePath: '/pages/tasks/index', text: '任务' },
      { pagePath: '/pages/mine/index', text: '我的' },
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
