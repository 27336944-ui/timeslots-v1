import { stepStore } from '../../../stores/stepStore';
import { errorMsg } from '../../../utils/error';
import type { DecomposeStepItem } from '../../../types/api';
import { logError } from '../../../utils/logError';

type SugAction = 'pending' | 'accept' | 'edit' | 'skip' | 'reject';

interface SuggestionInfo {
  stepId: string;
  suggestedStart: string | null;
  suggestedEnd: string | null;
  reason: string;
  stepText: string;
  sugAction: SugAction;
  customStart?: string;
  customEnd?: string;
}

interface AiDecomposePageData {
  title: string;
  goal: string;
  decomposing: boolean;
  error: string;
  decomposedSteps: DecomposeStepItem[];
  totalMinutes: number;
  rationale: string;
  createdTaskId: string;
  stepsCreated: boolean;
  suggesting: boolean;
  suggestions: SuggestionInfo[];
}

interface AiDecomposePageMethods {
  onTitleInput: (e: WechatMiniprogram.Input) => void;
  onGoalInput: (e: WechatMiniprogram.Input) => void;
  onDecompose: () => void;
  onApply: () => void;
  onRedo: () => void;
  onSuggestSlots: () => Promise<void>;
  onAcceptSuggestion: (e: WechatMiniprogram.TouchEvent) => void;
  onEditSuggestion: (e: WechatMiniprogram.TouchEvent) => void;
  onEditStartInput: (e: WechatMiniprogram.Input) => void;
  onEditEndInput: (e: WechatMiniprogram.Input) => void;
  onConfirmEdited: (e: WechatMiniprogram.TouchEvent) => void;
  onSkipSuggestion: (e: WechatMiniprogram.TouchEvent) => void;
  onRejectSuggestion: (e: WechatMiniprogram.TouchEvent) => void;
}

Page<AiDecomposePageData, AiDecomposePageMethods>({
  data: {
    title: '',
    goal: '',
    decomposing: false,
    error: '',
    decomposedSteps: [],
    totalMinutes: 0,
    rationale: '',
    createdTaskId: '',
    stepsCreated: false,
    suggesting: false,
    suggestions: [],
  },

  onTitleInput(e: WechatMiniprogram.Input) {
    this.setData({ title: e.detail.value });
  },

  onGoalInput(e: WechatMiniprogram.Input) {
    this.setData({ goal: e.detail.value });
  },

  async onDecompose() {
    const title = this.data.title.trim();
    if (!title) return;

    this.setData({ decomposing: true, error: '' });

    try {
      await stepStore.decompose('', title, this.data.goal || undefined);

      if (stepStore.error) {
        this.setData({ error: stepStore.error, decomposing: false });
        return;
      }

      this.setData({
        decomposedSteps: stepStore.decomposedSteps,
        totalMinutes: stepStore.totalMinutes,
        rationale: stepStore.rationale,
        decomposing: false,
        stepsCreated: false,
        suggestions: [],
      });
    } catch (e) {
      this.setData({
        error: errorMsg(e),
        decomposing: false,
      });
    }
  },

  async onApply() {
    if (this.data.decomposedSteps.length === 0) return;

    wx.showLoading({ title: '创建步骤中...' });

    try {
      const taskId = this.data.createdTaskId;

      const created = await stepStore.applyDecomposed(taskId || 'pending');

      wx.hideLoading();
      wx.showToast({ title: `已创建${created.length} 个步骤`, icon: 'success' });

      this.setData({
        decomposedSteps: [],
        totalMinutes: 0,
        rationale: '',
        stepsCreated: true,
      });
    } catch (e) {
      logError('tasks_aiDecompose', e);
      wx.hideLoading();
      wx.showToast({ title: '创建步骤失败', icon: 'none' });
    }
  },

  async onSuggestSlots() {
    const steps = stepStore.steps;
    if (steps.length === 0) return;

    this.setData({ suggesting: true });

    try {
      const today = new Date();
      const dateStr = today.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
      const { suggestSlots: apiSuggestSlots } = await import('../../../services/api');

      const result = await apiSuggestSlots(dateStr, steps.map(s => ({
        id: s.id,
        text: s.text,
        estimatedMinutes: s.estimatedMinutes ?? undefined,
        dependsOnId: s.dependsOnId ?? undefined,
      })));

      const suggestions: SuggestionInfo[] = result.suggestions.map(sug => ({
        stepId: sug.stepId,
        suggestedStart: sug.suggestedStart,
        suggestedEnd: sug.suggestedEnd,
        reason: sug.reason,
        stepText: steps.find(s => s.id === sug.stepId)?.text || '',
        sugAction: 'pending' as SugAction,
      }));

      this.setData({ suggestions, suggesting: false });
    } catch (e) {
      logError('tasks_aiDecompose', e);
      this.setData({ suggesting: false });
      wx.showToast({ title: '获取时间段建议失败', icon: 'none' });
    }
  },

  onAcceptSuggestion(e: WechatMiniprogram.TouchEvent) {
    const idx = e.currentTarget.dataset.idx as number;
    const sug = this.data.suggestions[idx];
    if (!sug.suggestedStart || !sug.suggestedEnd) return;
    stepStore.scheduleStep(sug.stepId, sug.suggestedStart, sug.suggestedEnd);
    const suggestions = [...this.data.suggestions];
    suggestions[idx] = { ...suggestions[idx], sugAction: 'accept' };
    this.setData({ suggestions });
  },

  onEditSuggestion(e: WechatMiniprogram.TouchEvent) {
    const idx = e.currentTarget.dataset.idx as number;
    const suggestions = [...this.data.suggestions];
    suggestions[idx] = { ...suggestions[idx], sugAction: 'edit', customStart: '', customEnd: '' };
    this.setData({ suggestions });
  },

  onEditStartInput(e: WechatMiniprogram.Input) {
    const idx = e.currentTarget.dataset.idx as number;
    const suggestions = [...this.data.suggestions];
    suggestions[idx] = { ...suggestions[idx], customStart: e.detail.value };
    this.setData({ suggestions });
  },

  onEditEndInput(e: WechatMiniprogram.Input) {
    const idx = e.currentTarget.dataset.idx as number;
    const suggestions = [...this.data.suggestions];
    suggestions[idx] = { ...suggestions[idx], customEnd: e.detail.value };
    this.setData({ suggestions });
  },

  onConfirmEdited(e: WechatMiniprogram.TouchEvent) {
    const idx = e.currentTarget.dataset.idx as number;
    const sug = this.data.suggestions[idx];
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
    const start = sug.customStart ? `${dateStr}T${sug.customStart}:00+08:00` : sug.suggestedStart;
    const end = sug.customEnd ? `${dateStr}T${sug.customEnd}:00+08:00` : sug.suggestedEnd;
    if (!start || !end) {
      wx.showToast({ title: '请输入时间', icon: 'none' });
      return;
    }
    stepStore.scheduleStep(sug.stepId, start, end);
    const suggestions = [...this.data.suggestions];
    suggestions[idx] = { ...suggestions[idx], sugAction: 'accept' };
    this.setData({ suggestions });
  },

  onSkipSuggestion(e: WechatMiniprogram.TouchEvent) {
    const idx = e.currentTarget.dataset.idx as number;
    const suggestions = [...this.data.suggestions];
    suggestions[idx] = { ...suggestions[idx], sugAction: 'skip' };
    this.setData({ suggestions });
  },

  onRejectSuggestion(e: WechatMiniprogram.TouchEvent) {
    const idx = e.currentTarget.dataset.idx as number;
    const suggestions = [...this.data.suggestions];
    suggestions[idx] = { ...suggestions[idx], sugAction: 'reject' };
    this.setData({ suggestions });
  },

  onRedo() {
    stepStore.clearDecomposed();
    this.setData({
      decomposedSteps: [],
      totalMinutes: 0,
      rationale: '',
      error: '',
      suggestions: [],
      stepsCreated: false,
    });
  },
});