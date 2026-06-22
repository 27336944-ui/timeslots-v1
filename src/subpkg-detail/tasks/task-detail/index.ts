
import { taskStore } from '../../../stores/taskStore';
import type { TimeBlock, Step } from '../../../types/api';
import { getStepsByTask, createStep, deleteStep, getTaskById, getBlocksByTask, updateStep } from '../../../services/api';
import { toLocalDate, toLocalTime } from '../../../utils/date';
import { errorMsg } from '../../../utils/error';
import { CATEGORY_OPTIONS, CATEGORY_LABELS } from '../../../constants/categories';
import { logError } from '../../../utils/logError';

function recomputeBlocked(steps: FormStep[]): FormStep[] {
  return steps.map(s => {
    if (!s.dependsOnId) return { ...s, isBlocked: false };
    const dep = steps.find(d => d.id === s.dependsOnId);
    return { ...s, isBlocked: !dep || !dep.isDone };
  });
}


interface FormStep {
  id: string;
  text: string;
  isDone: boolean;
  sortOrder: number;
  dependsOnId: string | null;
  isBlocked: boolean;
}

interface TaskDetailPageData {
  mode: 'create' | 'edit' | 'view';
  taskId: string;
  formTitle: string;
  formGoal: string;
  formCategory: string;
  categoryOptions: { label: string; value: string }[];
  formSteps: FormStep[];
  newStepText: string;
  formStatus: string;
  formStartDate: string;
  formDueAt: string;
  formTriggerTime: string;
  formCompletedNote: string;
  formRetrospective: string;
  formImprovements: string;
  saving: boolean;
  viewTitle: string;
  viewGoal: string;
  viewCategory: string;
  viewCategoryLabel: string;
  viewStatus: string;
  viewStatusLabel: string;
  viewRawCategory: string;
  viewStartDate: string;
  viewDueAt: string;
  viewDueAtOverdue: boolean;
  viewTriggerTime: string;
  viewSteps: FormStep[];
  viewStepsDone: number;
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
  populateForm: (task: { id: string; title: string; goal: string | null; category: string; status: string; startDate: string | null; dueAt: string | null; triggerTime: string | null; steps: { text: string; isDone: boolean }[] | null; completedNote: string | null; retrospective: string | null; improvements: string | null }, steps?: Step[]) => void;
  onTitleInput: (e: WechatMiniprogram.Input) => void;
  onGoalInput: (e: WechatMiniprogram.Input) => void;
  onDueAtChange: (e: WechatMiniprogram.CustomEvent) => void;
  onStartDateChange: (e: WechatMiniprogram.CustomEvent) => void;
  onTriggerTimeChange: (e: WechatMiniprogram.CustomEvent) => void;
  onCategoryChange: (e: WechatMiniprogram.TouchEvent) => void;
  onCategorySegChange: (e: WechatMiniprogram.CustomEvent) => void;
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
  onDelegateStepTap: (e: WechatMiniprogram.TouchEvent) => void;
}

Page<TaskDetailPageData, TaskDetailPageMethods>({
  data: {
    mode: 'create',
    taskId: '',
    formTitle: '',
    formGoal: '',
    formCategory: 'life',
    categoryOptions: CATEGORY_OPTIONS,
    formSteps: [],
    newStepText: '',
    formStatus: 'pending',
    formStartDate: '',
    formDueAt: '',
    formTriggerTime: '',
    formCompletedNote: '',
    formRetrospective: '',
    formImprovements: '',
    saving: false,
    viewTitle: '',
    viewGoal: '',
    viewCategory: '',
    viewCategoryLabel: '',
    viewStatus: '',
    viewStatusLabel: '',
    viewDueAt: '',
    viewDueAtOverdue: false,
    viewRawCategory: '',
    viewStartDate: '',
    viewTriggerTime: '',
    viewSteps: [],
    viewStepsDone: 0,
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
      const [task, blocks, stepList] = await Promise.all([
        getTaskById(id), getBlocksByTask(id), getStepsByTask(id),
      ]);
      this.populateForm(task, stepList);
      const blockDisplays: TimeBlockDisplay[] = blocks.map(b => ({
        ...b,
        _timeRange: `${toLocalTime(b.startTime)} - ${toLocalTime(b.endTime)}`,
      }));
      const dueOverdue = !!(task.dueAt && task.status !== 'done' && new Date(`${task.dueAt}T23:59:59+08:00`) < new Date());
      const stepsDone = stepList.filter(s => s.status === 'done').length;
      this.setData({
        mode: 'view',
        viewTitle: task.title,
        viewGoal: task.goal || '',
        viewCategory: CATEGORY_LABELS[task.category] || task.category,
        viewCategoryLabel: CATEGORY_LABELS[task.category] || task.category,
        viewRawCategory: task.category,
        viewStatus: task.status,
        viewStatusLabel: task.status === 'pending' ? '待安排' : task.status === 'in_progress' ? '进行中' : '搞定了',
        viewStartDate: task.startDate ? toLocalDate(task.startDate) : '',
        viewDueAt: task.dueAt ? toLocalDate(task.dueAt) : '',
        viewDueAtOverdue: dueOverdue,
        viewTriggerTime: task.triggerTime ? toLocalTime(task.triggerTime) : '',
        viewSteps: stepList.map((s) => ({
          id: s.id,
          text: s.text,
          isDone: s.status === 'done',
          sortOrder: s.sortOrder,
          dependsOnId: s.dependsOnId ?? null,
          isBlocked: false,
        })),
        viewStepsDone: stepsDone,
        viewCompletedNote: task.completedNote || '',
        viewRetrospective: task.retrospective || '',
        viewImprovements: task.improvements || '',
        viewCreatedAt: toLocalDate(task.createdAt),
        taskBlocks: blockDisplays,
      });
    } catch (e) {
      logError('tasks_taskDetail', e);
      wx.showToast({ title: '任务不存在', icon: 'error' });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  },

  populateForm(task: { id: string; title: string; goal: string | null; category: string; status: string; startDate: string | null; dueAt: string | null; triggerTime: string | null; steps: { text: string; isDone: boolean }[] | null; completedNote: string | null; retrospective: string | null; improvements: string | null }, steps?: Step[]) {
    const raw: FormStep[] = (steps || task.steps || []).map((s, i) => ({
      id: 'id' in s ? s.id : `new_${i}`,
      text: s.text,
      isDone: 'isDone' in s ? s.isDone : (s as Step).status === 'done',
      sortOrder: 'sortOrder' in s ? (s as Step).sortOrder : i,
      dependsOnId: 'dependsOnId' in s ? (s as Step).dependsOnId ?? null : null,
      isBlocked: false,
    }));
    this.setData({
      taskId: task.id,
      formTitle: task.title,
      formGoal: task.goal || '',
      formCategory: task.category,
      formStatus: task.status,
      formStartDate: task.startDate ? toLocalDate(task.startDate) : '',
      formDueAt: task.dueAt ? toLocalDate(task.dueAt) : '',
      formTriggerTime: task.triggerTime ? toLocalTime(task.triggerTime) : '',
      formSteps: recomputeBlocked(raw),
      formCompletedNote: task.completedNote || '',
      formRetrospective: task.retrospective || '',
      formImprovements: task.improvements || '',
    });
  },

  onTitleInput(e: WechatMiniprogram.Input) { this.setData({ formTitle: e.detail.value }); },

  onGoalInput(e: WechatMiniprogram.Input) { this.setData({ formGoal: e.detail.value }); },

  onDueAtChange(e: WechatMiniprogram.CustomEvent) { this.setData({ formDueAt: e.detail.value }); },

  onStartDateChange(e: WechatMiniprogram.CustomEvent) { this.setData({ formStartDate: e.detail.value }); },

  onTriggerTimeChange(e: WechatMiniprogram.CustomEvent) { this.setData({ formTriggerTime: e.detail.value }); },

  onCategoryChange(e: WechatMiniprogram.TouchEvent) { this.setData({ formCategory: e.currentTarget.dataset.value as string }); },

  onCategorySegChange(e: WechatMiniprogram.CustomEvent) { this.setData({ formCategory: e.detail.value as string }); },

  onStatusChange(e: WechatMiniprogram.TouchEvent) { this.setData({ formStatus: e.currentTarget.dataset.value as string }); },

  onNewStepInput(e: WechatMiniprogram.Input) { this.setData({ newStepText: e.detail.value }); },

  onAddStep() {
    const text = this.data.newStepText.trim();
    if (!text) return;
    const newId = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const steps = recomputeBlocked([...this.data.formSteps, { id: newId, text, isDone: false, sortOrder: this.data.formSteps.length, dependsOnId: null, isBlocked: false }]);
    this.setData({ formSteps: steps, newStepText: '' });
  },

  onToggleStep(e: WechatMiniprogram.TouchEvent) {
    const stepId = e.currentTarget.dataset.stepId as string;
    const old = this.data.formSteps.find(s => s.id === stepId);
    if (!old || old.isBlocked) return;
    const toggled = { ...old, isDone: !old.isDone };
    if (toggled.isDone) {
      const unlocked = this.data.formSteps.filter(s => s.dependsOnId === toggled.id && s.isBlocked);
      if (unlocked.length > 0) {
        const names = unlocked.map(s => s.text).join('、');
        wx.showToast({ title: `依赖已解除：${names}`, icon: 'none' });
      }
    }
    const steps = this.data.formSteps.map(s => s.id === stepId ? toggled : s);
    this.setData({ formSteps: recomputeBlocked(steps) });
  },

  onRemoveStep(e: WechatMiniprogram.TouchEvent) {
    const stepId = e.currentTarget.dataset.stepId as string;
    const steps = this.data.formSteps.filter(s => s.id !== stepId);
    this.setData({ formSteps: steps });
  },

  onCompletedNoteInput(e: WechatMiniprogram.Input) { this.setData({ formCompletedNote: e.detail.value }); },

  onRetrospectiveInput(e: WechatMiniprogram.Input) { this.setData({ formRetrospective: e.detail.value }); },

  onImprovementsInput(e: WechatMiniprogram.Input) { this.setData({ formImprovements: e.detail.value }); },

  async onSave() {
    if (this.data.saving) return;
    const { formTitle, formGoal, formCategory, formStatus, formStartDate, formDueAt, formTriggerTime, formSteps, mode, taskId, formCompletedNote, formRetrospective, formImprovements } = this.data;

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
        status: formStatus,
        startDate: formStartDate || undefined,
        dueAt: formDueAt || undefined,
        triggerTime: formTriggerTime || undefined,
        completedNote: formCompletedNote || undefined,
        retrospective: formRetrospective || undefined,
        improvements: formImprovements || undefined,
      };

      if (mode === 'create') {
        const task = await taskStore.createTask(data as Parameters<typeof taskStore.createTask>[0]);
        for (let i = 0; i < formSteps.length; i++) {
          await createStep({ taskId: task.id, text: formSteps[i].text, sortOrder: i, status: formSteps[i].isDone ? 'done' : 'unscheduled' });
        }
        wx.showToast({ title: '已记下', icon: 'success' });
      } else {
        await taskStore.updateTask(taskId, data);
        const existingSteps = await getStepsByTask(taskId);
        for (const s of existingSteps) {
          if (!formSteps.some(fs => fs.id === s.id)) {
            await deleteStep(s.id);
          }
        }
        for (let i = 0; i < formSteps.length; i++) {
          const fs = formSteps[i];
          const existing = existingSteps.find(s => s.id === fs.id);
          if (existing) {
            if (existing.text !== fs.text || (existing.status === 'done') !== fs.isDone) {
              await updateStep(existing.id, { text: fs.text, status: fs.isDone ? 'done' : 'unscheduled' });
            }
          } else {
            await createStep({ taskId, text: fs.text, sortOrder: i, status: fs.isDone ? 'done' : 'pending' });
          }
        }
        wx.showToast({ title: '已保存', icon: 'success' });
      }
      setTimeout(() => wx.navigateBack(), 500);
    } catch (e) {
      wx.showToast({ title: errorMsg(e) || '出了点问题，再试一次', icon: 'none' });
    } finally {
      this.setData({ saving: false });
    }
  },

  onEditTap() {
    this.setData({ mode: 'edit' });
  },

  async onMarkDone() {
    if (this.data.saving) return;
    const { taskId, formSteps, formCompletedNote, formRetrospective } = this.data;
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
      const { completeTaskWithReview } = await import('../../../services/api');
      await completeTaskWithReview(taskId, formCompletedNote.trim(), formRetrospective.trim());
      this.setData({
        formStatus: 'done',
        viewStatus: 'done',
        viewDueAtOverdue: false,
      });
      wx.showToast({ title: '已标记完成', icon: 'success' });
    } catch (e) {
      wx.showToast({ title: errorMsg(e) || '出了点问题，再试一次', icon: 'none' });
    } finally {
      this.setData({ saving: false });
    }
  },

  async onDelete() {
    if (this.data.saving) return;
    const { taskId } = this.data;
    const res = await wx.showModal({ title: '确认移除', content: '移除了就不会出现在时间轴上', confirmColor: '#e74c3c' });
    if (!res.confirm) return;

    this.setData({ saving: true });
    try {
      await taskStore.deleteTask(taskId);
      wx.showToast({ title: '已删除', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (e) {
      wx.showToast({ title: errorMsg(e) || '删除失败', icon: 'none' });
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

  onDelegateStepTap(e: WechatMiniprogram.TouchEvent) {
    const stepIdx = e.currentTarget.dataset.stepIdx as number;
    const step = this.data.formSteps[stepIdx];
    if (!step || step.isDone) return;
    const createDelegationAndNavigate = async (recipientUserId: string) => {
      try {
        wx.showLoading({ title: '发起委托...' });
        const { delegationStore } = await import('../../../stores/delegationStore');
        const taskId = this.data.taskId;
        const result = await delegationStore.createDelegation({
          type: 'step_execution',
          stepId: step.id.startsWith('new_') ? undefined : step.id,
          taskId: taskId || undefined,
          recipientUserId,
          message: `请帮我完成步骤 ${step.text}`,
        });
        wx.hideLoading();
        wx.navigateTo({ url: `/pages/tasks/delegation-detail/index?id=${result.id}` });
      } catch (err) {
        wx.hideLoading();
        wx.showToast({ title: errorMsg(err) || '委托发起失败', icon: 'none' });
      }
    };
    wx.showModal({
      title: '委托步骤',
      content: `将步骤${step.text}"委托给谁？请输入对方 user ID`,
      editable: true,
      placeholderText: '输入对方 user ID',
      success: (res) => {
        if (res.confirm && res.content) {
          createDelegationAndNavigate(res.content.trim());
        }
      },
    });
  },
});
