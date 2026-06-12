# timeslots-v1 产品需求文档 (PRD)

> 文档版本：v1.2（需求全景图 — 标记 [done] / [planned]）
> 状态：实际完成约 50%，剩余 [planned] 项目标注明确
> 适用范围：timeslots-v1 MVP

---

## 1. 产品定位

**一句话**：一款基于时间块（Time Block）的微信小程序日程管理工具，把待办和日历融合在一天 24 小时的时间轴上，LLM 作为核心引擎提供 AI 多模态录入 / 效率教练 / 任务归集 / 智能复盘 / 智能规划。

**核心差异化**：
1. **以时间块为骨架** — 一天划分为若干连续时段，每个时段承载一个具体事项
2. **待办和日程同源** — 每条 todo 可选关联到某个时间块，未关联的留在"收件箱"
3. **审批流协作** — 发起日程→分享卡片/短信给受邀人→对方同意后双方各生成独立日程
4. **微信生态无缝** — 微信一键登录、分享卡片、订阅消息提醒

---

## 2. 目标用户

- 25–40 岁城市职场人士
- 已有时间管理意识（如阅读过《深度工作》《搞定》等）
- 日常工作需要在多个角色/项目间切换
- 重度微信用户，期望低安装/低切换成本

---

## 3. 4 Tab 产品骨架（已实现）

客户端首页采用底部 4 Tab 导航（[done]）：

| Tab | 定位 | 一手数据 | 核心交互 |
|-----|------|----------|----------|
| **日程** | 用户主战场：日视图 24h 时间轴 + 日/周/月切换 | TimeBlock | 创建/编辑/查看/发起审批 |
| **协作** | 审批中心 + 圈子管理 | ApprovalRequest / Circle | 待我审批/我发起的/圈子 |
| **任务** | 跨日程的任务聚合 | Task | 列表/进度统计/步骤管理 |
| **我的** | 用户画像 + 账号设置 | User | 登录/注销/恢复 |

### 3.1 页面路由

| 路径 | 说明 | 状态 |
|------|------|------|
| `pages/schedule/index` | 日程首页（24h 时间轴 + view toggle） | ✅ [done] |
| `pages/schedule/detail` | 时间块详情（三态，含提醒选择器 + 任务关联 + 发起审批入口） | ✅ [done] |
| `pages/collab/index` | 协作首页（待我审批 / 我发起的 双 Tab + 圈子管理入口） | ✅ [done] |
| `pages/collab/approval-detail` | 审批详情（发起人：成员状态列表；接收人：同意/拒绝按钮） | ✅ [done] v0.22–0.23 |
| `pages/collab/approval-create` | 发起审批（手机号 / 微信好友 / 二维码 三 Tab） | ✅ [done] v0.24 |
| `pages/collab/approval-share` | 公开分享接收页（展示日程摘要 + 登录引导 + 回应） | ✅ [done] v0.25 |
| `pages/collab/detail` | 圈子详情（邀请码 + 成员列表 + 踢出/删除） | ✅ [done] |
| `pages/tasks/index` | 任务首页（统计卡 + 分类 Tab + 任务列表） | ✅ [done] |
| `pages/tasks/task-detail` | 任务详情（步骤清单 + 复盘区 + 关联日程） | ✅ [done] |
| `pages/mine/index` | 我的首页（头像 + 登录/登出 + 账号注销/恢复） | ✅ [done] |
| `pages/index/index` | M1 健康检查页 | ✅ [done] |
| `pages/mine/settings` | 设置页（day_starts_at / 默认提醒 / 默认可见性） | ⏳ [planned] v0.28 |
| `pages/mine/coach` | AI 教练历史页 | ⏳ [planned] M3-B |
| `pages/mine/quota` | 额度明细页 | ⏳ [planned] M5 |
| `pages/schedule/create` | AI 多模态新建块 | ⏳ [planned] M5 |

---

## 4. 数据模型（当前 8/12 实体已实现 [done]）

### 4.1 实体清单

| 实体 | 表名 | 关键字段 | 说明 | 状态 |
|------|------|----------|------|------|
| `User` | `users` | openid, nickname | 用户账号 | ✅ [done] |
| `TimeBlock` | `time_blocks` | userId, title, startTime, endTime, status, taskId, priority, category | 核心日程实体 | ✅ [done] |
| `Circle` | `circles` | ownerId, name, description, inviteCode (unique), status | 协作圈子（隐私标签） | ✅ [done] |
| `CircleMember` | `circle_members` | circleId, userId, role (OWNER/ADMIN/MEMBER) | 圈子成员 | ✅ [done] |
| `Task` | `tasks` | userId, title, goal, steps, status, priority, category, dueAt | 任务项 | ✅ [done] |
| `Reminder` | `reminders` | userId, blockId, remindAt, leadMinutes, status | 日程提醒 | ✅ [done] |
| `ApprovalRequest` | `approval_requests` | initiatorId, blockId, title, startTime, endTime, shareToken, status | 审批请求（反范式存日程副本） | ✅ [done] v0.22 |
| `ApprovalRecipient` | `approval_recipients` | requestId, contactType, contactValue, userId, status, blockId | 审批受邀人 | ✅ [done] v0.22 |
| `Comment` | — | — | 日程评论 | ❌ [cancelled] 移出 MVP |
| `RSVP` | — | — | 日程受邀确认 | ❌ [cancelled] 移出 MVP |
| `Quota` | — | — | AI 额度 | ⏳ [planned] M5 |
| `QuotaTransaction` | — | — | 额度流水 | ⏳ [planned] M5 |
| `CoachCard` | — | — | AI 教练报告卡 | ⏳ [planned] M3-B |
| `CoachFeedback` | — | — | 教练 RLHF 反馈 | ⏳ [planned] M3-B |
| `TaskGroup` | — | — | **已从 scope 移除**（category 替代） | ❌ [cancelled] |

### 4.2 核心规则

- **TimeBlock 是事实表** — 每条都是一段被占用的时间 [done]
- **Task 是视图** — 聚合相关 TimeBlock（通过 taskId）[done]
- **审批流** — 发起→分享卡片/短信→对方同意→双方各生成独立 TimeBlock（通过 sourceRequestId 关联）[done] v0.22–0.26
- **Circle 为隐私标签** — v0.27 实现：work 分类日程仅"同事"圈可见，life 仅"家人"圈可见 [planned]
- **软删双轨制** — `isDeleted Boolean` + `deletedAt DateTime?` [done]
- **Quota 双字段** — `permanentPoints` + `monthlyPoints` [planned] M5

### 4.3 枚举

| 枚举 | 实际形式 | 值 | 状态 |
|------|----------|---|------|
| `TimeBlockStatus` | String `@default("todo")` | "todo"/"done"/"cancelled" | ✅ [done] |
| `CircleStatus` | String `@default("active")` | "active"/"archived" | ✅ [done] |
| `CircleRole` | String `@default("MEMBER")` | "OWNER"/"ADMIN"/"MEMBER" | ✅ [done] |
| `ApprovalRequestStatus` | Prisma enum | pending/partial/completed/cancelled | ✅ [done] |
| `ContactType` | Prisma enum | friend/phone/qr | ✅ [done] |
| `ApprovalRecipientStatus` | Prisma enum | pending/approved/rejected/expired | ✅ [done] |
| `TaskStatus` | String `@default("pending")` | "pending"/"in_progress"/"done" | ✅ [done] |
| `TaskPriority` | String `@default("medium")` | "low"/"medium"/"high" | ✅ [done] |
| `TransactionType` | — | — | ⏳ [planned] M5 |

---

## 5. 后端架构（NestJS DDD — 已实现）

### 5.1 模块清单（9 个已注册）

| 模块 | 职责 | API 端点 | 状态 |
|------|------|----------|------|
| `health` | 健康检查（公开） | `GET /api/v1/health` | ✅ [done] |
| `auth` | JWT 登录 + 用户资料 + 注销/恢复 | `POST /login`, `PATCH /profile`, `DELETE /account` | ✅ [done] |
| `timeblock` | TimeBlock CRUD | `GET/POST /time-blocks`, `GET/PATCH/DELETE /time-blocks/:id` | ✅ [done] |
| `circle` | 圈子 CRUD + 邀请码 + 加入/踢出 | `GET/POST /circles`, `GET/PATCH/DELETE /circles/:id`, `POST /circles/:id/invite`, `POST /circles/join/:inviteCode` | ✅ [done] |
| `task` | 任务 CRUD + 统计 | `GET/POST /tasks`, `GET/PATCH/DELETE /tasks/:id`, `GET /tasks/my/stats` | ✅ [done] |
| `reminder` | 提醒 CRUD + cron | `GET/POST /reminders`, `PATCH/DELETE /reminders/:id` | ✅ [done] |
| `approval` | 审批流 CRUD + 分享 | `POST /approvals`, `GET /my-initiated`, `GET /my-pending`, `GET /:id`, `PATCH /:reqId/recipients/:recId`, `POST /resend`, `POST /cancel`, `GET /shared/:token`, `POST /bind` | ✅ [done] v0.22 |
| `prisma` | 全局 PrismaService（$extends 软删） | — | ✅ [done] |
| `jobs` | 定时任务 | — | ✅ [done]（仅 reminder cron） |
| `quota` | 额度管理 | — | ⏳ [planned] M5 |
| `llm` | MiniMax M3 代理 | — | ⏳ [planned] M5 |
| `coach` | AI 教练报告 + RLHF | — | ⏳ [planned] M3-B |

### 5.2 基础设施

| 组件 | 文件 | 说明 | 状态 |
|------|------|------|------|
| `BusinessException` | `common/exceptions/business-exception.ts` | 业务异常（5 位错误码） | ✅ [done] |
| `ErrorCodes` | `common/exceptions/business-exception.ts` | 预定义业务码 | ✅ [done] |
| `AllExceptionsFilter` | `common/filters/http-exception.filter.ts` | 全局异常 → `{code, message, data, path, timestamp}` | ✅ [done] |
| `TransformInterceptor` | `common/interceptors/transform.interceptor.ts` | 成功响应包装 | ✅ [done] |
| `JwtAuthGuard` | `common/guards/jwt-auth.guard.ts` | JWT 身份守卫 | ✅ [done] |
| `@CurrentUser` | `common/decorators/current-user.decorator.ts` | 从 JWT payload 提取 userId | ✅ [done] |
| `@Public` | — | 跳过 JWT 验证 | ⏳ [planned] |
| `EventVisibilityService` | — | 圈子隐私标签可见性掩码 | ⏳ [planned] v0.27 |

### 5.3 响应契约

所有 API 统一格式：`{code, message, data, path, timestamp}`

- 成功：`{code: 0, message: 'success', data: T}`
- 失败：`{code: <businessCode>, message: <error>, data: null, path, timestamp}`

错误码表（5 位，前 3 位 = HTTP × 100）：

| businessCode | HTTP | 含义 |
|-------------|------|------|
| 0 | 200 | 成功 |
| 40001-40099 | 400 | 参数错误 |
| 40101-40199 | 401 | 未授权 |
| 40301-40399 | 403 | 权限不足 |
| 40401-40499 | 404 | 资源不存在 |
| 40901-40999 | 409 | 冲突（乐观锁 P2025 / 重复创建 P2002） |
| 50000-50099 | 500 | 系统异常 |

---

## 6. 前端架构（微信原生小程序 — 已实现）

### 6.1 技术栈（已锁定）

| 层 | 选型 |
|----|------|
| 框架 | 微信原生小程序 + TypeScript 5.x（基础库 >= 3.3.0） |
| 状态管理 | mobx-miniprogram |
| UI | WeUI 1.5.6 + 自主设计系统（tokens.wxss） |
| 网络请求 | `src/utils/request.ts`（统一 Token 刷新 + 错误拦截） |
| 类型 | miniprogram-api-typings（**禁止**自定义 wx.* 的 .d.ts） |
| 源目录 | `src/`（project.config.json: miniprogramRoot） |

### 6.2 设计系统

| Token | 值 | 用途 |
|-------|-----|------|
| `--brand-primary` | `#4A6CF7` | 主色 |
| `--text-main` / `--text-secondary` / `--text-placeholder` | — | 文字层级 |
| `--bg-canvas` / `--bg-card` / `--bg-secondary` | — | 背景层级 |
| `--border-subtle` | — | 边框 |
| `--text-inverse` | — | 反色文字 |

自定义组件：`BottomSheet` / `Cell` / `Skeleton` / `Tag`（各带 README.md + styleIsolation: isolated）。

### 6.3 前端 Stores（6 [done] + 1 [planned]）

| Store | 文件 | 状态 |
|-------|------|------|
| `authStore` | `stores/authStore.ts` | ✅ [done] |
| `blockStore` | `stores/blockStore.ts` | ✅ [done] |
| `circleStore` | `stores/circleStore.ts` | ✅ [done] |
| `approvalStore` | `stores/approvalStore.ts` | ✅ [done] v0.23 |
| `taskStore` | `stores/taskStore.ts` | ✅ [done] |
| `userStore` | `stores/userStore.ts` | ✅ [done] |
| `coachStore` | — | ⏳ [planned] M3-B |

### 6.4 编码约束（AGENTS.md 强制执行）

- **严禁 `any`** → 用 `unknown` + 类型守卫
- **Page 双泛型** `Page<TData, TCustom>`，接口名 `XxxPageData` / `XxxPageMethods`
- **禁止 `PageData` 全局接口名冲突** → 用 `<Name>PageData` 形式
- **禁止 Taro / React / NutUI / px 单位**
- **WXML 用 `||` 替代 `??`**（WXML 不支持 nullish coalescing）
- **`wx.request` PATCH 需要 cast**（官方 TS method 类型不含 PATCH）
- **所有异步必须 `try/catch`** + fire-and-forget 用 `void` 前缀

---

## 7. 后端编码约束

| 规则 | 说明 |
|------|------|
| Controller 薄 | 仅处理 HTTP + 参数校验 + 调 service |
| Service 厚 | 业务逻辑全部在 service |
| DTO 严格 | class-validator 装饰器 |
| BusinessException | 统一 5 位错误码 |
| 跨用户隔离 | 所有查询显式 `where: { userId }` |
| 软删 | `isDeleted` + `deletedAt`；`PrismaService.$extends` 8 个读方法注入 `isDeleted: false` |
| 乐观锁 | `where: { id, version }` → P2025 → 40901 |
| Joi env | `.allow('').optional()` 防止空字符串拒绝 |

---

## 8. 测试覆盖（77 tests passing）

| 模块 | 状态 |
|------|------|
| BusinessException + ErrorCodes | ✅ 9 tests |
| TransformInterceptor | ✅ 4 tests |
| HttpExceptionFilter | ✅ 6 tests |
| AuthService | ✅ 8 tests |
| TimeBlockService | ✅ 12 tests |
| TaskService | ✅ 10 tests |
| CircleService | ✅ 14 tests |
| ReminderService | ✅ 10 tests |
| HealthService | ✅ 3 tests |
| **合计** | **✅ 77 tests (M2-E 目标 ≥ 50 已达成)** |

---

## 9. 技术栈总览

| 层 | 选型 | 部署 |
|----|------|------|
| 客户端 | 微信原生小程序 + TS + mobx-miniprogram | 微信小程序平台 |
| 后端 | NestJS + TypeScript + Prisma | 独立 Node.js 部署 |
| 数据库 | PostgreSQL 18（Windows native） | `localhost:5432` |
| 静态资源 | 微信云存储（wx.cloud） | 前端直传，fileID 入库 |
| 认证 | JWT + 微信 code2session | Dev: POST /auth/login |
| 推送 | 微信订阅消息 | 待 M3 |
| 工具链 | ESLint + Prettier + Husky（pre-commit: tsc） | |

---

## 10. 里程碑完成状态

| M# | 名称 | 关键交付 | 状态 |
|----|------|----------|------|
| M1 | 基建脚手架 | 前端 src/ + 后端 NestJS + Prisma + /health | ✅ [done] |
| M2-A | 后端核心模块 | health/auth/timeblock/task/reminder/circle/approval（7 模块 ~42 API） | ✅ [done] |
| M2-B | 前端 4 Tab 绑定 | 6 stores + 11 页面 + 4 组件 + 设计系统 | ✅ [done] |
| M2-C | 前端工具链 | ESLint 基本配置 + prettier | ✅ [done] |
| M2-D | Bug 修复 | 审计修复 | ✅ [done] |
| **M2-E** | **测试 + 工具链奠基** | **Jest + 77 tests + PRD 修正** | **✅ [done]** |
| M2-F (v0.22–0.26) | **审批流** | ApprovalRequest/Recipient 实体 + 9 端点 + 审批中心 Tab + 发起/接收页 + 修改再审批 | ✅ [done] (v0.25–26 收尾中) |
| M2-G (v0.27) | **圈子可见性** | TimeBlock 加 nature/circleId + EventVisibilityService 隐私标签 | ⏳ [planned] |
| M3-A (v0.28) | **设置页** | day_starts_at / 默认提醒 / 默认可见性 | ⏳ [planned] |
| M3-B (v0.29) | **全局 UX** | 空状态 / 网络错误 / 按钮防抖 / 骨架屏 | ⏳ [planned] |
| M3-C (v0.30) | **内测收尾** | 隐私协议 + 全流程真机测 | ⏳ [planned] |
| M4 | **微信云存储** | cloud-storage 接入 | ⏳ [planned] |
| M5 | **MiniMax 接入** | LLM API Key + 额度系统 + 多模态录入 | ⏳ [planned] |
| M6 | **推送 + 导出** | 订阅消息 + 数据导出 | ⏳ [planned] |

---

## 11. 当前已知限制

- **Husky pre-commit 未完善** — `.husky/pre-commit` 只有 `npm test`（根目录无 test script），未跑 tsc
- **`examples/` 目录不存在** — AGENTS.md §7 描述但未创建
- MiniMax API Key 未配置（`.env` placeholder）— LLM 端点待 M5
- 微信 `code2session` 未接入 — dev 模式直接接收 userId（M3-C）
- TimeBlock 缺 `nature`/`circleId` — 圈子隐私标签待 v0.27
- 分享卡片 shareToken 真实传递未完整实现（v0.25 收尾）
- 短信发送集成尚未对接真实网关（当前为 log-only）
- Cron 仅 reminder/min — 无 cleanup 物理删 cron
- 无前端 E2E 测试

---

## 12. 响应码契约

success: `{code: 0, message: 'success', data: T, path: string, timestamp: string}`
failure: `{code: <5-digit>, message: string, data: null, path: string, timestamp: string}`

| 码 | 含义 | 示例场景 |
|----|------|---------|
| 0 | 成功 | 正常 CRUD |
| 40001 | 参数校验失败 | class-validator 失败 |
| 40002 | 无效 ISO 日期 | 日期格式错误 |
| 40101 | JWT 缺失/过期 | 未登录 |
| 40201 | 额度不足 | AI 点数 < 扣减量 |
| 40301 | 无权访问 | 访问他人私有 TimeBlock |
| 40401 | 资源不存在 | id 不存在或已软删 |
| 40901 | 乐观锁冲突 | 并发修改 |
| 50001 | LLM 代理错误 | MiniMax 不可用 |
| 50000 | 未处理异常 | 兜底 |
