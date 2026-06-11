# timeslots-v1 产品需求文档 (PRD)

> 文档版本：v1.0（基于实际构建状态）
> 状态：已演进（从 M1 脚手架到 M2-A 后端全模块完成 + 前端 4 Tab 数据绑定）
> 适用范围：timeslots-v1 MVP（对外发布版本）

---

## 1. 产品定位

**一句话**：一款基于时间块（Time Block）的微信小程序日程管理工具，把待办和日历融合在一天 24 小时的时间轴上，LLM 作为核心引擎提供 AI 多模态录入 / 效率教练 / 任务归集 / 智能复盘 / 智能规划。

**核心差异化**：
1. **以时间块为骨架** — 一天划分为若干连续时段，每个时段承载一个具体事项
2. **待办和日程同源** — 每条 todo 可选关联到某个时间块，未关联的留在"收件箱"
3. **LLM 为 Wow Engine** — 自然语言 / 语音 / 图像 → 1 秒内生成结构化日程
4. **微信生态无缝** — 微信一键登录、订阅消息提醒、圈子协作

---

## 2. 目标用户

- 25–40 岁城市职场人士
- 已有时间管理意识（如阅读过《深度工作》《搞定》等）
- 日常工作需要在多个角色/项目间切换
- 重度微信用户，期望低安装/低切换成本

---

## 3. 4 Tab 产品骨架（已实现）

客户端首页采用底部 4 Tab 导航：

| Tab | 定位 | 一手数据 | 核心交互 |
|-----|------|----------|----------|
| **日程** | 用户主战场：日视图 24h 时间轴 + 日/周/月切换 | TimeBlock | 创建/编辑/查看 |
| **协作** | 圈子 + 共享日程 + 邀请 | Circle / RSVP | 圈子管理/加入/查看 |
| **任务** | 跨日程的任务聚合 | TaskGroup / Task | 列表/进度统计 |
| **我的** | 用户画像 + AI 教练 + 额度 + 账号设置 | User / Quota / CoachCard | 查看/设置/反馈 |

### 3.1 页面路由

| 路径 | 说明 | 状态 |
|------|------|------|
| `pages/schedule/index` | 日程首页（24h 时间轴 + view toggle） | ✅ 已实现 |
| `pages/collab/index` | 协作首页（3 子 Tab：我的圈子 / 收到的邀请 / 共享给我） | ✅ 已实现（stub 待 API 接入） |
| `pages/tasks/index` | 任务首页（顶部 3 统计卡 + 任务组筛选 + 任务列表） | ✅ 已实现 |
| `pages/mine/index` | 我的首页（头像/额度/教练卡/设置列表） | ✅ 已实现 |
| `pages/index/index` | M1 脚手架健康检查页 | ✅ 已实现（非 tab） |
| `pages/coach-detail/index` | AI 教练报告详情 + RLHF 评分 | ❌ 待实现 |
| `pages/schedule/detail` | 时间块详情（含评论） | ❌ 待实现 |
| `pages/schedule/create` | AI 多模态新建块 | ❌ 待实现 |
| `pages/tasks/group-detail` | 任务组详情 | ❌ 待实现 |
| `pages/mine/coach` | AI 教练历史页 | ❌ 待实现 |
| `pages/mine/quota` | 额度明细页 | ❌ 待实现 |
| `pages/mine/settings` | 设置页 | ❌ 待实现 |

---

## 4. 数据模型（已实现：12 实体 + 8 枚举）

### 4.1 实体清单

| 实体 | 表名 | 关键字段 | 说明 |
|------|------|----------|------|
| `User` | `users` | openid, nickname, coachSettings (jsonb) | 用户账号 + AI 教练配置 |
| `TimeBlock` | `time_blocks` | userId, title, startTime, endTime, nature, status, encryptedDetails (jsonb), taskGroupId, circleId | 核心日程实体 |
| `Circle` | `circles` | ownerId, name, description, inviteCode (unique), status | 协作圈子 |
| `CircleMember` | `circle_members` | circleId, userId, role (OWNER/ADMIN/MEMBER) | 圈子成员 |
| `TaskGroup` | `task_groups` | userId, name, color, notes | 任务组（个人所有） |
| `Task` | `tasks` | userId, taskGroupId, title, status, priority, dueAt | 任务项 |
| `Comment` | `comments` | blockId, authorId, content, parentId | 日程评论 |
| `RSVP` | `rsvps` | blockId, attendeeId, status | 日程受邀确认 |
| `Quota` | `quotas` | userId (unique), permanentPoints, monthlyPoints, monthlyExpireAt, version | AI 额度（乐观锁） |
| `QuotaTransaction` | `quota_transactions` | userId, type, amount, balanceAfter, description | 额度流水 |
| `CoachCard` | `coach_cards` | userId, weekStart (Date), insights (jsonb), metrics (jsonb) | AI 教练报告卡 |
| `CoachFeedback` | `coach_feedbacks` | cardId, rating (1-5), comment | 教练 RLHF 反馈 |

### 4.2 核心规则

- **TimeBlock 是事实表** — 每条都是一段被占用的时间
- **Task 是视图** — 聚合相关 TimeBlock（通过 taskGroupId）
- **TaskGroup 不支持圈子共享** — 简化为个人任务组
- **Circle 控制 TimeBlock 可见性** — nature: PRIVATE / PUBLIC / CIRCLE_ONLY
- **软删双轨制** — `isDeleted Boolean` + `deletedAt DateTime?`
- **Quota 双字段** — `permanentPoints`（永久）+ `monthlyPoints`（月）+ `monthlyExpireAt`

### 4.3 枚举

| 枚举 | 值 |
|------|----|
| `TimeBlockStatus` | ACTIVE, COMPLETED, CANCELLED |
| `TimeBlockNature` | PRIVATE, PUBLIC, CIRCLE_ONLY |
| `CircleStatus` | ACTIVE, ARCHIVED |
| `CircleRole` | OWNER, ADMIN, MEMBER |
| `RSVPStatus` | CONFIRMED, CANCELLED, TENTATIVE |
| `TransactionType` | DEDUCT, REFUND, GRANT, EXPIRE |
| `TaskStatus` | PENDING, IN_PROGRESS, DONE, CANCELLED |
| `TaskPriority` | LOW, MEDIUM, HIGH, URGENT |

---

## 5. 后端架构（NestJS DDD — 已实现）

### 5.1 模块清单（13 个已注册）

| 模块 | 职责 | API 端点 |
|------|------|----------|
| `health` | 健康检查（公开） | `GET /api/v1/health` |
| `auth` | JWT 登录 | `POST /api/v1/auth/login` |
| `user` | 用户资料 + 账号注销/恢复 | `GET/PATCH /users/me`, `DELETE /users/me`, `POST /users/me/restore` |
| `event` | TimeBlock CRUD（含额度扣减） | `GET/POST /time-blocks`, `GET/PATCH/DELETE /time-blocks/:id` |
| `circle` | 圈子 CRUD + 邀请码 + 加入/踢出 | `GET/POST /circles`, `GET/PATCH/DELETE /circles/:id`, `POST /circles/:id/invite`, `POST /circles/join/:inviteCode` |
| `task` | 任务 CRUD + 统计 | `GET/POST /tasks`, `GET/PATCH/DELETE /tasks/:id`, `GET /tasks/my/stats` |
| `task-group` | 任务组 CRUD | `GET/POST /task-groups`, `GET/PATCH/DELETE /task-groups/:id` |
| `comment` | 日程评论 CRUD | `GET/POST /time-blocks/:blockId/comments`, `PATCH/DELETE /comments/:id` |
| `coach` | AI 教练报告生成 + RLHF 反馈 | `GET /coach/cards`, `POST /coach/cards`, `POST /coach/cards/:id/feedback` |
| `llm` | MiniMax M3 代理（SSE 流式 + 同步） | `POST /llm/chat`, `POST /llm/sync` |
| `quota` | 额度管理（无 HTTP 端点，被 event 使用） | — |
| `jobs` | 定时任务（教练 cron + 物理删清理） | — |
| `prisma` | 全局 PrismaService（$extends 软删 + PrismaClient） | — |

### 5.2 基础设施

| 组件 | 文件 | 说明 |
|------|------|------|
| `BusinessException` | `common/exceptions/business.exception.ts` | 业务异常（5 位错误码） |
| `ErrorCodes` | `common/exceptions/business.exception.ts` | 9 个预定义业务码 |
| `AllExceptionsFilter` | `common/filters/all-exceptions.filter.ts` | 全局异常 → `{code, message, data, path, timestamp}` |
| `TransformInterceptor` | `common/interceptors/transform.interceptor.ts` | 成功响应包装 → `{code: 0, data, message: 'success'}` |
| `JwtAuthGuard` | `common/guards/jwt-auth.guard.ts` | JWT 身份守卫 |
| `@CurrentUser` | `common/decorators/user.decorator.ts` | 从 JWT payload 提取 userId |
| `@Public` | `common/decorators/public.decorator.ts` | 跳过 JWT 验证 |
| `EventVisibilityService` | `common/services/event-visibility.service.ts` | P0-P3 可见性掩码引擎 |
| `AvailabilityService` | `common/services/availability.service.ts` | 忙闲/空闲时段计算 |
| `EncryptionService` | `common/services/encryption.service.ts` | AES-256-GCM 加密（TimeBlock.encryptedDetails） |

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
| UI | WeUI 2.x + 自主设计系统（tokens.wxss） |
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

### 6.3 前端 Stores（6 个，均已实现且数据绑定到 WXML）

| Store | 关键 observables | 关键 actions |
|-------|-----------------|--------------|
| `auth.ts` | token, isLoggedIn | login(), logout() |
| `block-store.ts` | items (MyTimeBlock[]), loading | fetchAll(), fetchByDate(), create(), remove() |
| `circle-store.ts` | items (CircleView[]), loading | fetchMine(), create(), join(), remove() |
| `task-store.ts` | tasks, groups, stats, loading | fetchAll(), create(), update(), remove() |
| `coach-store.ts` | cards (CoachCardView[]), loading | fetchCards(), generateCard(), submitFeedback() |
| `user-store.ts` | profile, quota, loading | fetchMe(), update(), requestDelete(), restoreAccount() |

### 6.4 前端 Services（3 个）

| Service | 说明 |
|---------|------|
| `api.ts` | 统一 API 封装（get/post/patch/del，自动注入 Bearer Token） |
| `cloud-storage.ts` | 微信云存储接口（stub — deferred to M3） |
| `llm.ts` | MiniMax LLM 代理接口（HttpLLMClient + StubLLMClient fallback） |

### 6.5 编码约束（AGENTS.md 强制执行）

- **严禁 `any`** → 用 `unknown` + 类型守卫
- **Page 双泛型** `Page<TData, TCustom>`，接口名 `XxxPageData` / `XxxPageMethods`
- **禁止 `PageData` 全局接口名冲突** → 用 `<Name>PageData` 形式
- **禁止 Taro / React / NutUI / px 单位**
- **WXML 用 `||` 替代 `??`**（WXML 不支持 nullish coalescing）
- **`wx:elif` 链拆分为独立 `wx:if`**（基础库解析兼容性）
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
| 软删 | `isDeleted` + `deletedAt`；`PrismaService.$extends` 6 个读方法注入 `isDeleted: false` |
| 乐观锁 | `where: { id, version }` → P2025 → 40901 |
| AES-256-GCM | `EncryptionService` 加密 `TimeBlock.encryptedDetails` |
| Joi env | `.allow('').optional()` 防止空字符串拒绝 |

---

## 8. LLM 集成（核心引擎 — The Wow Engine）

### 8.1 定位

LLM 是产品的**核心差异化卖点**（非辅助功能）：
- **AI 多模态录入**是核心路径 — 自然语言 / 语音 / 图像 → 自动建日程
- **AI 效率教练**是粘性功能 — 周报 / 每日复盘 / 规划建议
- **手动降级始终可用** — LLM 不可用时引导用户走手动表单

### 8.2 场景

| 场景 | 说明 | 实现状态 |
|------|------|----------|
| AI 多模态录入 | 文本/语音/图像 → 自动建日程 | ❌ 待 MiniMax API Key |
| AI 效率教练 | 周报 + 每日复盘（3 算法） | ✅ CoachCard + 10 个 CoachCard 端点 |
| 任务智能归集 | 散落日程 → 聚合项目任务单 | 🔄 通过 TaskGroup 关联 |
| 智能复盘 | 一日/一周 → 结构化复盘 | ✅ CoachCard.insights |
| 智能规划 | 建议空档 | ❌ 待实现 |
| 对话微调 | 时间块详情页微调 | 🔄 LLM stub ready |

### 8.3 成本控制

- 单日上限：50 次/用户
- Token 上限：2000/次
- 扣费：1 点/次（解析预扣 0.5 + 创建实扣 0.5）
- 三段式扣费在同一个事务中（QuotaService.deductInTx + EventService.create）
- 失败/超时退扣

### 8.4 手动降级路径

| 触发场景 | 降级行为 |
|----------|----------|
| LLM 5s 未响应 | 提示"网络拥挤，请手动填写" |
| LLM 返回 5xx | FallbackException → 手动表单 |
| 额度 < 1 点 | 提示"额度不足，请手动创建或充值" |
| 内容审核不通过 | 提示"内容含敏感信息，请修改" |
| 用户主动取消 AI | 关闭面板，保留已输入文本 |

---

## 9. 测试覆盖（95 tests, 12 suites）

| 模块 | 测试文件 | 覆盖内容 |
|------|---------|----------|
| `auth` | `auth.service.spec.ts` | JWT 签发 |
| `user` | `user.service.spec.ts` | 资料 CRUD + 注销/恢复 |
| `event` | `event.service.spec.ts` | 创建（含额度扣减） |
| `circle` | `circle.service.spec.ts` | CRUD + 邀请码 + 加入 |
| `task` | `task.service.spec.ts` | CRUD + 过滤 + 统计 |
| `task-group` | `task-group.service.spec.ts` | CRUD |
| `comment` | `comment.service.spec.ts` | CRUD + 权限 |
| `quota` | `quota.service.spec.ts` | 扣费/退款/乐观锁 |
| `coach` | `coach.service.spec.ts` | 报告生成 + RLHF |
| `coach/algorithms` | `algorithms.spec.ts` | 碎片化/偏差/专注算法 |
| `llm` | `llm.service.spec.ts` | stubs |
| `visibility` | `event-visibility.service.spec.ts` | P0-P3 可见性 |

---

## 10. 技术栈总览

| 层 | 选型 | 部署 |
|----|------|------|
| 客户端 | 微信原生小程序 + TS + mobx-miniprogram | 微信小程序平台 |
| 后端 | NestJS + TypeScript + Prisma | 独立 Node.js 部署 |
| 数据库 | PostgreSQL 18（Windows native） | `localhost:5432` |
| 静态资源 | 微信云存储（wx.cloud） | 前端直传，fileID 入库 |
| LLM | MiniMax M3（通过 NestJS 代理） | 密钥在 env |
| 认证 | JWT + 微信 code2session | Dev: POST /auth/login |
| 推送 | 微信订阅消息 | 待 M3 |
| 工具链 | ESLint + Prettier + Husky（pre-commit: tsc + ESLint） | |

---

## 11. 里程碑完成状态

| M# | 名称 | 起始 | 关键交付 | 状态 |
|----|------|------|----------|------|
| M1 | 基建脚手架 | Day 1 | 前端 src/ + 后端 NestJS + Prisma + /health | ✅ |
| M2-A | 后端全模块 | Day 2-7 | 13 模块 + 38 API + 95 tests | ✅ |
| M2-B | 前端 4 Tab 绑定 | Day 3 | 6 stores + WXML 绑定点 + 设计系统 | ✅ |
| M2-C | 前端工具链 | Day 4 | ESLint + Prettier + Husky + build-npm | ✅ |
| M2-D | Bug 修复 | Day 5 | wxbug-v1 44 问题审计 + 10 关键修复 | ✅ |
| M3 | WeChat 鉴权 | 待排期 | code2session 替换 dev-mode 登录 | ❌ |
| M4 | 微信云存储 | 待排期 | cloud-storage 接入 | ❌ |
| M5 | MiniMax 接入 | 待排期 | LLM API Key + 多模态录入 | ❌ |
| M6 | 推送 + 导出 | 待排期 | 订阅消息 + 数据导出 | ❌ |

---

## 12. 当前已知限制

- MiniMax API Key 未配置（`.env` 空）— LLM 端点返回 50001
- 微信 `code2session` 未接入 — dev 模式直接接收 userId
- `src/utils/request.ts:65` — ESLint curly 规则残留（受 §10 保护）
- `examples/page-template/index.ts` — 仍用反例 `Page<{}, PageData>`（受 §10 保护）
- 协作 Tab"收到的邀请"和"共享给我" — 前端 stub（后端无对应端点）
- 教练报告详情页 — 未实现（mine 页仅展示汇总）
- Cron 任务（coach/cleanup） — 需 server 持续运行 + 时间测试
- 无前端 E2E 测试

---

## 13. 响应码契约

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
