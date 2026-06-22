import { observable, action } from 'mobx-miniprogram';
import { getStepsByTask as apiGetSteps, createStep as apiCreateStep, updateStep as apiUpdateStep, deleteStep as apiDeleteStep, scheduleStep as apiScheduleStep, decomposeTask } from '../services/api';
import { errorMsg } from '../utils/error';
import type { Step, DecomposeStepItem } from '../types/api';


interface StepStore {
  steps: Step[];
  decomposedSteps: DecomposeStepItem[];
  totalMinutes: number;
  rationale: string;
  loading: boolean;
  decomposing: boolean;
  error: string;
  currentTaskId: string;
  fetchSteps: (taskId: string) => Promise<void>;
  createStep: (data: { taskId: string; text: string; estimatedMinutes?: number; dependsOnId?: string }) => Promise<Step>;
  updateStep: (id: string, data: { text?: string; status?: string; dependsOnId?: string; estimatedMinutes?: number }) => Promise<void>;
  deleteStep: (id: string) => Promise<void>;
  scheduleStep: (id: string, startTime: string, endTime: string) => Promise<string>;
  decompose: (taskId: string, title: string, goal?: string) => Promise<void>;
  applyDecomposed: (taskId: string) => Promise<Step[]>;
  clearDecomposed: () => void;
  clearSteps: () => void;
}


export const stepStore: StepStore = observable({
  steps: [],
  decomposedSteps: [],
  totalMinutes: 0,
  rationale: '',
  loading: false,
  decomposing: false,
  error: '',
  currentTaskId: '',

  fetchSteps: action(async function (this: StepStore, taskId: string) {
    this.loading = true;
    this.error = '';
    this.currentTaskId = taskId;
    try {
      this.steps = await apiGetSteps(taskId);
    } catch (e) {
      this.error = errorMsg(e) || '加载步骤失败';
      this.steps = [];
    } finally {
      this.loading = false;
    }
  }),

  createStep: action(async function (this: StepStore, data: { taskId: string; text: string; estimatedMinutes?: number; dependsOnId?: string }) {
    const step = await apiCreateStep(data);
    this.steps = [...this.steps, step];
    return step;
  }),

  updateStep: action(async function (this: StepStore, id: string, data: { text?: string; status?: string; dependsOnId?: string; estimatedMinutes?: number }) {
    const updated = await apiUpdateStep(id, data);
    this.steps = this.steps.map((s) => (s.id === id ? updated : s));
  }),

  deleteStep: action(async function (this: StepStore, id: string) {
    await apiDeleteStep(id);
    this.steps = this.steps.filter((s) => s.id !== id);
  }),

  scheduleStep: action(async function (this: StepStore, id: string, startTime: string, endTime: string) {
    const result = await apiScheduleStep(id, { startTime, endTime });
    const stepIdx = this.steps.findIndex((s) => s.id === id);
    if (stepIdx !== -1) {
      this.steps[stepIdx].status = 'scheduled';
      this.steps[stepIdx].timeBlockId = result.timeBlockId;
      this.steps[stepIdx].scheduledDate = startTime;
    }
    return result.timeBlockId;
  }),

  decompose: action(async function (this: StepStore, _taskId: string, title: string, goal?: string) {
    this.decomposing = true;
    this.error = '';
    this.decomposedSteps = [];
    this.totalMinutes = 0;
    this.rationale = '';
    try {
      const events = await decomposeTask(title, goal);
      const steps: DecomposeStepItem[] = [];
      for (const evt of events) {
        if (evt.type === 'step') {
          steps.push(evt.data as unknown as DecomposeStepItem);
          this.decomposedSteps = [...steps];
        } else if (evt.type === 'done') {
          const doneData = evt.data as { totalMinutes: number; rationale: string };
          this.totalMinutes = doneData.totalMinutes || 0;
          this.rationale = doneData.rationale || '';
        }
      }
    } catch (e) {
      this.error = errorMsg(e) || 'AI 拆解失败';
    } finally {
      this.decomposing = false;
    }
  }),

  applyDecomposed: action(async function (this: StepStore, taskId: string) {
    const created: Step[] = [];
    const idMap = new Map<number, string>();

    const sorted = this.decomposedSteps.map((s, idx) => ({ ...s, originalIndex: idx }));
    const independent = sorted.filter((s) => s.dependsOnIndex === -1);
    const dependent = sorted.filter((s) => s.dependsOnIndex !== -1);

    for (const step of [...independent, ...dependent]) {
      const dependsOnId = step.dependsOnIndex !== -1 ? idMap.get(step.dependsOnIndex) ?? undefined : undefined;
      const createdStep = await apiCreateStep({
        taskId,
        text: step.text,
        estimatedMinutes: step.estimatedMinutes,
        dependsOnId,
      });
      created.push(createdStep);
      idMap.set(step.originalIndex, createdStep.id);
    }

    this.steps = [...this.steps, ...created];
    this.decomposedSteps = [];
    this.totalMinutes = 0;
    this.rationale = '';
    return created;
  }),

  clearDecomposed: action(async function (this: StepStore) {
    this.decomposedSteps = [];
    this.totalMinutes = 0;
    this.rationale = '';
  }),

  clearSteps: action(async function (this: StepStore) {
    this.steps = [];
    this.currentTaskId = '';
  }),
});