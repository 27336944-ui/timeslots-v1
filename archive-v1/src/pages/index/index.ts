import { request } from '../../utils/request';
import type { RequestError } from '../../types/api';

/**
 * 后端 /health 端点的响应体（仅含 MVP 必需字段）。
 */
interface HealthData {
  status: 'ok';
  timestamp: string;
}

/**
 * 页面响应式数据。
 */
interface IndexPageData {
  /** 页面标题 */
  title: string;
  /** 页面副标题 */
  subtitle: string;
  /** 健康检查状态文本（ok / failed） */
  statusText: string;
  /** 状态样式类（ok / error / ''） */
  statusClass: 'ok' | 'error' | '';
  /** 后端 health 时间戳 */
  healthTimestamp: string;
  /** 错误消息（无错时为空字符串） */
  errorMessage: string;
  /** 是否正在检查中（按钮 loading 状态） */
  checking: boolean;
}

/**
 * 页面方法。
 *
 * 注意：`Page<TData, TCustom>` 第二个泛型是 TCustom（方法类型），不是 data。
 *
 * @see AGENTS §5.2.2 #19
 */
interface IndexPageMethods {
  /** 点击"重新检查"按钮 */
  onTapCheckHealth(): void;
  /** 调用后端 /health 并刷新页面状态 */
  checkHealth(): Promise<void>;
}

/**
 * M1 默认开发页：健康检查 demo。
 *
 * 用途：
 * 1. 验证前端 tsc + 后端 /health 端到端联通
 * 2. 给开发者一个可视化的"启动后端没？"指示
 *
 * M2+ 此页会被首页（时间轴）替换；本文件届时删除或保留作 dev tool。
 */
Page<IndexPageData, IndexPageMethods>({
  data: {
    title: '时光块',
    subtitle: 'M1 脚手架已就绪',
    statusText: '未检查',
    statusClass: '',
    healthTimestamp: '-',
    errorMessage: '',
    checking: false,
  },

  onLoad() {
    void this.checkHealth();
  },

  onTapCheckHealth() {
    void this.checkHealth();
  },

  async checkHealth() {
    this.setData({ checking: true, errorMessage: '' });
    try {
      const data = await request<HealthData>({ url: '/health' });
      this.setData({
        statusText: data.status,
        statusClass: 'ok',
        healthTimestamp: data.timestamp,
        checking: false,
      });
    } catch (err) {
      const e = err as RequestError;
      this.setData({
        statusText: 'failed',
        statusClass: 'error',
        healthTimestamp: '-',
        errorMessage: `[${e.code}] ${e.message}`,
        checking: false,
      });
    }
  },
});
