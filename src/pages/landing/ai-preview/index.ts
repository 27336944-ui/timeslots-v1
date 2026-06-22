import { wxLogin } from '../../../services/api';
import { authStore } from '../../../stores/authStore';
import { logError } from '../../../utils/logError';

const PRESET_RESULTS: Record<string, { steps: { text: string; estimatedMinutes: number; dependsOnIndex: number }[]; rationale: string }> = {
  report: {
    steps: [
      { text: '收集销售数据和历史记录', estimatedMinutes: 30, dependsOnIndex: -1 },
      { text: '整理数据并制作分析图表', estimatedMinutes: 45, dependsOnIndex: 0 },
      { text: '撰写报告核心内容', estimatedMinutes: 60, dependsOnIndex: 1 },
      { text: '排版并检查格式', estimatedMinutes: 20, dependsOnIndex: 2 },
      { text: '提交并确认反馈', estimatedMinutes: 10, dependsOnIndex: 3 },
    ],
    rationale: '按照"资料收集→数据分析→内容撰写→格式调整→提交确认"的报告写作流程拆解，适合季度/月度汇报场景。',
  },
  meeting: {
    steps: [
      { text: '确定会议目标和议程', estimatedMinutes: 15, dependsOnIndex: -1 },
      { text: '邀请参与人并发送议程', estimatedMinutes: 10, dependsOnIndex: 0 },
      { text: '准备演示材料和背景资料', estimatedMinutes: 30, dependsOnIndex: 0 },
      { text: '主持讨论并记录关键结论', estimatedMinutes: 45, dependsOnIndex: 2 },
      { text: '发送会议纪要和跟进事项', estimatedMinutes: 15, dependsOnIndex: 3 },
    ],
    rationale: '采用"会前准备→邀请→材料→主持→跟进"的会议管理三段式结构，确保每个环节都有交付物。',
  },
  dev: {
    steps: [
      { text: '明确需求和技术方案设计', estimatedMinutes: 60, dependsOnIndex: -1 },
      { text: '搭建开发环境和数据结构', estimatedMinutes: 30, dependsOnIndex: 0 },
      { text: '实现核心业务逻辑', estimatedMinutes: 120, dependsOnIndex: 1 },
      { text: '编写单元测试并验证', estimatedMinutes: 45, dependsOnIndex: 2 },
      { text: '部署到测试环境并验收', estimatedMinutes: 30, dependsOnIndex: 3 },
    ],
    rationale: '采用标准工程化流程：设计→开发→测试→部署，每个阶段都有明确的可交付成果。',
  },
  household: {
    steps: [
      { text: '清点现有物品并列出购物清单', estimatedMinutes: 15, dependsOnIndex: -1 },
      { text: '集中采购所需物品', estimatedMinutes: 40, dependsOnIndex: 0 },
      { text: '分类收纳整理', estimatedMinutes: 30, dependsOnIndex: 1 },
      { text: '清洁打扫收尾', estimatedMinutes: 20, dependsOnIndex: 2 },
    ],
    rationale: '清单→采购→整理→清洁，合并同类项减少切换成本，考虑实际生活场景。',
  },
};

const FALLBACK = PRESET_RESULTS.report;


function classifyTask(title: string): keyof typeof PRESET_RESULTS {
  const t = title.toLowerCase();
  if (/报告|汇报|总结|分析|ppt|周报|月报|年报|销售/.test(t)) return 'report';
  if (/会议|meeting|议程|讨论|评审|头脑风暴/.test(t)) return 'meeting';
  if (/开发|编码|编程|实现|部署|测试|代码|api|数据库/.test(t)) return 'dev';
  if (/家务|打扫|收拾|整理|购物|买菜|搬家|清洗|做饭|装修/.test(t)) return 'household';
  return 'report';
}


interface AiPreviewPageData {
  inputText: string;
  loading: boolean;
  showResult: boolean;
  resultTitle: string;
  steps: { text: string; estimatedMinutes: number; dependsOnIndex: number }[];
  rationale: string;
}

interface AiPreviewPageMethods {
  onInput: (e: WechatMiniprogram.Input) => void;
  onDecompose: () => void;
  onRegister: () => void;
  onLogin: () => void;
}

Page<AiPreviewPageData, AiPreviewPageMethods>({
  data: {
    inputText: '',
    loading: false,
    showResult: false,
    resultTitle: '',
    steps: [],
    rationale: '',
  },

  onInput(e: WechatMiniprogram.Input) {
    this.setData({ inputText: e.detail.value });
  },

  onDecompose() {
    const text = this.data.inputText.trim();
    if (!text) return;

    this.setData({ loading: true, showResult: false });

    setTimeout(() => {
      const type = classifyTask(text);
      const result = PRESET_RESULTS[type] || FALLBACK;
      this.setData({
        loading: false,
        showResult: true,
        resultTitle: text,
        steps: result.steps,
        rationale: result.rationale,
      });
    }, 800);
  },

  async onRegister() {
    wx.showLoading({ title: '登录中...' });
    try {
      const { code } = await wx.login();
      const res = await wxLogin(code);
      authStore.setToken(res.accessToken);
      wx.hideLoading();
      wx.reLaunch({ url: '/pages/schedule/index' });
    } catch (e) {
      logError('landing_ai-preview', e);
      wx.hideLoading();
      wx.showToast({ title: '登录失败，请重试', icon: 'none' });
    }
  },

  onLogin() {
    wx.reLaunch({ url: '/pages/mine/index' });
  },
});
