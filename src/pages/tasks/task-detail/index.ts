
import { taskStore } from '../../../stores/taskStore';
import type { TimeBlock } from '../../../types/api';


function toLocalDate(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
}

function toLocalTime(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleTimeString('en-CA', { timeZone: 'Asia/Shanghai', hour12: false, hour: '2-digit', minute: '2-digit' });
}

const CATEGORY_LABEL: Record<string, string> = { work: '工作', life: '生活', private: '私有' };
const PRIORITY_LABEL: Record<string, string> = { high: '高', medium: '中', low: '低' };


interface TaskDetailPageData {
  mode: 'create' | 'edit' | 'view';
  taskId: string;
  formTitle: string;
  formGoal: string;
  formCategory: string;
  formPriority: string;
  formSteps: { text: string; isDone: boolean }[];
  newStepText: string;
  formStatus: string;
  dueAt: string;
  formCompletedNote: string;
  formRetrospective: string;
  formImprovements: string;
  saving: boolean;
  viewTitle: string;
  viewGoal: string;
  viewCategory: string;
  viewPriority: string;
  viewStatus: string;
  viewDueAt: string;
  viewDueAtOverdue: boolean;
  viewRawCategory: string;
  viewCompletedNote: string;
  viewRetrospective: string;
  viewImprovements: string;
  viewCreatedAt: string;
  taskBlocks: TimeBlockDisplay[];
}

interface TimeBlockDisplay extends TimeBlock {
  _timeRange: string;
}

interface TaskDetailPageMethods {
  loadTask: (id: string) => Promise<void>;
  populateForm: (task: { id: string; title: string; goal: string | null; category: string; priority: string; status: string; dueAt: string | null; steps: { text: string; isDone: boolean }[] | null; completedNote: string | null; retrospective: string | null; improvements: string | null }) => void;
  onTitleInput: (e: WechatMiniprogram.Input) => void;
  onGoalInput: (e: WechatMiniprogram.Input) => void;
  onDueAtChange: (e: WechatMiniprogram.CustomEvent) => void;
  onCategoryChange: (e: WechatMiniprogram.TouchEvent) => void;
  onPriorityChange: (e: WechatMiniprogram.TouchEvent) => void;
  onStatusChange: (e: WechatMiniprogram.TouchEvent) => void;
  onNewStepInput: (e: WechatMiniprogram.Input) => void;
  onAddStep: () => void;
  onToggleStep: (e: WechatMiniprogram.TouchEvent) => void;
  onRemoveStep: (e: WechatMiniprogram.TouchEvent) => void;
  onCompletedNoteInput: (e: WechatMiniprogram.Input) => void;
  onRetrospectiveInput: (e: WechatMiniprogram.Input) => void;
  onImprovementsInput: (e: WechatMiniprogram.Input) => void;
  onSave: () => Promise<void>;
  onEditTap: () => void;
  onMarkDone: () => Promise<void>;
  onDelete: () => Promise<void>;
  onCreateScheduleTap: () => void;
  onBlockTap: (e: WechatMiniprogram.TouchEvent) => void;
}

Page<TaskDetailPageData, TaskDetailPageMethods>({
  data: {
    mode: 'create',
    taskId: '',
    formTitle: '',
    formGoal: '',
    formCategory: 'life',
    formPriority: 'medium',
    formSteps: [],
    newStepText: '',
    formStatus: 'pending',
    dueAt: '',
    formCompletedNote: '',
    formRetrospective: '',
    formImprovements: '',
    saving: false,
    viewTitle: '',
    viewGoal: '',
    viewCategory: '',
    viewPriority: '',
    viewStatus: '',
    viewDueAt: '',
    viewDueAtOverdue: false,
    viewRawCategory: '',
    viewCompletedNote: '',
    viewRetrospective: '',
    viewImprovements: '',
    viewCreatedAt: '',
    taskBlocks: [],
  },

  onLoad(options: Record<string, string>) {
    if (options.mode === 'create') {
      this.setData({ mode: 'create' });
    } else if (options.id) {
      this.setData({ taskId: options.id, mode: 'view' });
      this.loadTask(options.id);
    }
  },



  async loadTask(id: string) {
    try {
      const { getTaskById, getBlocksByTask } = await import('../../../services/api');
      const [task, blocks] = await Promise.all([getTaskById(id), getBlocksByTask(id)]);
      this.populateForm(task);
      const blockDisplays: TimeBlockDisplay[] = blocks.map(b => ({
        ...b,
        _timeRange: `${toLocalTime(b.startTime)} - ${toLocalTime(b.endTime)}`,
      }));
      const dueOverdue = !!(task.dueAt && task.status !== 'done' && new Date(task.dueAt) < new Date());
      this.setData({
        mode: 'view',
        viewTitle: task.title,
        viewGoal: task.goal || '',
        viewCategory: CATEGORY_LABEL[task.category] || task.category,
        viewRawCategory: task.category,
        viewPriority: PRIORITY_LABEL[task.priority] || task.priority,
        viewStatus: task.status,
        viewDueAt: task.dueAt ? toLocalDate(task.dueAt) : '',
        viewDueAtOverdue: dueOverdue,
        viewCompletedNote: task.completedNote || '',
        viewRetrospective: task.retrospective || '',
        viewImprovements: task.improvements || '',
        viewCreatedAt: toLocalDate(task.createdAt),
        taskBlocks: blockDisplays,
      });
    } catch {
      wx.showToast({ title: '任务不存在', icon: 'error' });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  },

  populateForm(task: { id: string; title: string; goal: string | null; category: string; priority: string; status: string; dueAt: string | null; steps: { text: string; isDone: boolean }[] | null; completedNote: string | null; retrospective: string | null; improvements: string | null }) {
    this.setData({
      taskId: task.id,
      formTitle: task.title,
      formGoal: task.goal || '',
      formCategory: task.category,
      formPriority: task.priority,
      formStatus: task.status,
      dueAt: task.dueAt ? toLocalDate(task.dueAt) : '',
      formSteps: task.steps || [],
      formCompletedNote: task.completedNote || '',
      formRetrospective: task.retrospective || '',
      formImprovements: task.improvements || '',
    });
  },

  onTitleInput(e: WechatMiniprogram.Input) { this.setData({ formTitle: e.detail.value }); },

  onGoalInput(e: WechatMiniprogram.Input) { this.setData({ formGoal: e.detail.value }); },

  onDueAtChange(e: WechatMiniprogram.CustomEvent) { this.setData({ dueAt: e.detail.value }); },

  onCategoryChange(e: WechatMiniprogram.TouchEvent) { this.setData({ formCategory: e.currentTarget.dataset.value as string }); },

  onPriorityChange(e: WechatMiniprogram.TouchEvent) { this.setData({ formPriority: e.currentTarget.dataset.value as string }); },

  onStatusChange(e: WechatMiniprogram.TouchEvent) { this.setData({ formStatus: e.currentTarget.dataset.value as string }); },

  onNewStepInput(e: WechatMiniprogram.Input) { this.setData({ newStepText: e.detail.value }); },

  onAddStep() {
    const text = this.data.newStepText.trim();
    if (!text) return;
    const steps = [...this.data.formSteps, { text, isDone: false }];
    this.setData({ formSteps: steps, newStepText: '' });
  },

  onToggleStep(e: WechatMiniprogram.TouchEvent) {
    const idx = e.currentTarget.dataset.idx as number;
    const steps = this.data.formSteps.map((s, i) => i === idx ? { ...s, isDone: !s.isDone } : s);
    this.setData({ formSteps: steps });
  },

  onRemoveStep(e: WechatMiniprogram.TouchEvent) {
    const idx = e.currentTarget.dataset.idx as number;
    const steps = this.data.formSteps.filter((_, i) => i !== idx);
    this.setData({ formSteps: steps });
  },

  onCompletedNoteInput(e: WechatMiniprogram.Input) { this.setData({ formCompletedNote: e.detail.value }); },

  onRetrospectiveInput(e: WechatMiniprogram.Input) { this.setData({ formRetrospective: e.detail.value }); },

  onImprovementsInput(e: WechatMiniprogram.Input) { this.setData({ formImprovements: e.detail.value }); },

  async onSave() {
    if (this.data.saving) return;
    const { formTitle, formGoal, formCategory, formPriority, formStatus, dueAt, formSteps, mode, taskId, formCompletedNote, formRetrospective, formImprovements } = this.data;

    if (!formTitle.trim()) {
      wx.showToast({ title: '请输入标题', icon: 'none' });
      return;
    }

    if (formStatus === 'done' && mode !== 'create') {
      if (!formSteps.every(s => s.isDone)) {
        wx.showToast({ title: '请先完成所有步骤再标记完成', icon: 'none' });
        return;
      }
      if (!formCompletedNote.trim()) {
        wx.showToast({ title: '标记完成需填写补充说明', icon: 'none' });
        return;
      }
      if (!formRetrospective.trim()) {
        wx.showToast({ title: '标记完成需填写复盘改进点', icon: 'none' });
        return;
      }
    }

    this.setData({ saving: true });

    try {
      const data: Record<string, unknown> = {
        title: formTitle,
        goal: formGoal || undefined,
        category: formCategory,
        priority: formPriority,
        status: formStatus,
        steps: formSteps.length > 0 ? formSteps : undefined,
        dueAt: dueAt || undefined,
        completedNote: formCompletedNote || undefined,
        retrospective: formRetrospective || undefined,
        improvements: formImprovements || undefined,
      };

      if (mode === 'create') {
        await taskStore.createTask(data as Parameters<typeof taskStore.createTask>[0]);
        wx.showToast({ title: '创建成功', icon: 'success' });
      } else {
        await taskStore.updateTask(taskId, data);
        wx.showToast({ title: '保存成功', icon: 'success' });
      }
      setTimeout(() => wx.navigateBack(), 500);
    } catch (e) {
      wx.showToast({ title: (e as Error).message || '操作失败', icon: 'none' });
    } finally {
      this.setData({ saving: false });
    }
  },

  onEditTap() {
    this.setData({ mode: 'edit' });
  },

  async onMarkDone() {
    if (this.data.saving) return;
    const { formSteps, formCompletedNote, formRetrospective } = this.data;
    if (!formSteps.every(s => s.isDone)) {
      wx.showToast({ title: '请先完成所有步骤', icon: 'none' });
      return;
    }
    if (!formCompletedNote.trim()) {
      wx.showToast({ title: '请填写完成说明（补充说明）', icon: 'none' });
      return;
    }
    if (!formRetrospective.trim()) {
      wx.showToast({ title: '请填写复盘改进点', icon: 'none' });
      return;
    }
    this.setData({ saving: true });
    try {
      await taskStore.updateTask(this.data.taskId, { status: 'done' });
      this.setData({
        formStatus: 'done',
        viewStatus: 'done',
        viewDueAtOverdue: false,
      });
      wx.showToast({ title: '已标记完成', icon: 'success' });
    } catch (e) {
      wx.showToast({ title: (e as Error).message || '操作失败', icon: 'none' });
    } finally {
      this.setData({ saving: false });
    }
  },

  async onDelete() {
    if (this.data.saving) return;
    const { taskId } = this.data;
    const res = await wx.showModal({ title: '确认删除', content: '删除后不可恢复', confirmColor: '#e74c3c' });
    if (!res.confirm) return;

    this.setData({ saving: true });
    try {
      await taskStore.deleteTask(taskId);
      wx.showToast({ title: '已删除', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (e) {
      wx.showToast({ title: (e as Error).message || '删除失败', icon: 'none' });
    } finally {
      this.setData({ saving: false });
    }
  },

  onCreateScheduleTap() {
    const { taskId } = this.data;
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
    wx.navigateTo({ url: `/pages/schedule/detail/index?date=${dateStr}&taskId=${taskId}` });
  },

  onBlockTap(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    wx.navigateTo({ url: `/pages/schedule/detail/index?id=${id}` });
  },
});
