import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';

/**
 * 任务（Task）模块。
 *
 * 任务与日程（TimeBlock）区分：
 * - TimeBlock 有 startTime / endTime，绑定日历时间轴
 * - Task 仅有 dueAt / status，是轻量待办
 *
 * 路由：
 * - `POST   /api/v1/tasks`           创建任务
 * - `GET    /api/v1/tasks/my`        查询本人任务（支持 status / taskGroupId / dueFrom / dueTo 过滤）
 * - `GET    /api/v1/tasks/my/stats`  聚合统计（今日待办 / 本周到期 / 逾期）
 * - `GET    /api/v1/tasks/:id`       查询单条
 * - `PATCH  /api/v1/tasks/:id`       更新（状态、标题、优先级等）
 * - `DELETE /api/v1/tasks/:id`       软删除
 */
@Module({
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}
