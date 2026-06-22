import { forwardCreateTask, aiParse } from '../../../services/api';
import type { ParseResult } from '../../../types/parse';
import { logError } from '../../../utils/logError';

interface ForwardCreatePageData {
  inputText: string;
  parsedTitle: string;
  parsedGoal: string;
  creating: boolean;
  created: boolean;
  createdTaskId: string;
  aiResult: ParseResult | null;
  aiParsing: boolean;
}

interface ForwardCreatePageMethods {
  onTextInput: (e: WechatMiniprogram.Input) => void;
  onCreateTask: () => void;
  onViewTask: () => void;
  _nlpTimer?: number;
}

Page<ForwardCreatePageData, ForwardCreatePageMethods>({
  data: {
    inputText: '',
    parsedTitle: '',
    parsedGoal: '',
    creating: false,
    created: false,
    createdTaskId: '',
    aiResult: null,
    aiParsing: false,
  },

  onTextInput(e: WechatMiniprogram.Input) {
    const text = e.detail.value;
    this.setData({ inputText: text, aiResult: null });
    if (this._nlpTimer) clearTimeout(this._nlpTimer);

    const lines = text.trim().split('\n').filter((l) => l.trim().length > 0);
    const parsedTitle = lines[0] || '';
    const parsedGoal = lines.slice(1).join('\n').trim() || '';
    this.setData({ parsedTitle, parsedGoal });

    if (!text.trim()) {
      this.setData({ aiParsing: false });
      return;
    }

    this.setData({ aiParsing: true });
    this._nlpTimer = setTimeout(async () => {
      try {
        const result = await aiParse(text);
        if (result && result.title) {
          this.setData({ aiResult: result, aiParsing: false });
        } else {
          this.setData({ aiParsing: false });
        }
      } catch (e) {
        logError('tasks_forwardCreate', e);
        this.setData({ aiParsing: false });
      }
    }, 600);
  },

  async onCreateTask() {
    const text = this.data.inputText.trim();
    if (!text) return;
    this.setData({ creating: true });
    try {
      const task = await forwardCreateTask(text);
      this.setData({ created: true, createdTaskId: task.id, creating: false });
      wx.showToast({ title: '任务已创建', icon: 'success' });
    } catch (e) {
      logError('tasks_forwardCreate', e);
      this.setData({ creating: false });
      wx.showToast({ title: '创建失败', icon: 'none' });
    }
  },

  onViewTask() {
    const id = this.data.createdTaskId;
    if (id) {
      wx.navigateTo({ url: `/pages/tasks/task-detail/index?id=${id}` });
    }
  },
});
