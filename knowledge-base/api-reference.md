# TimeSlots v1 — 后端接口文档

> 来源: 从 server/src/modules/ controllers 和 DTO 自动提取
> 最后更新: 2026-06-20（核对 controllers，补 Health + AI 控制器拆分说明）
> Base URL: `http://localhost:7777/api/v1`
> 响应格式: 成功 `{ code: 0, message: "success", data: T }`；失败 `{ code: <5位业务码>, message: <error>, data: null, path, timestamp }`
> 鉴权: 除标注 `(Public)` 的端点外，全部需 JWT（`Authorization: Bearer <token>`），由 `JwtAuthGuard` 强制

## 健康 (Health) — Public

### GET /health
- 返回: `{ status: 'ok' }`
- 用途: 探活，DB 不可达时仍返回 200（`PrismaService.onModuleInit` try/catch 不阻塞启动）

### GET /health/info
- 返回: 版本/运行环境信息

## 认证 (Auth)

### POST /auth/login
- 描述: Dev 模式直接 userId 登录
- Body: `{ userId: string (UUID) }`
- 返回: `{ accessToken: string, user: { id, nickname, avatar } }`

### POST /auth/wx-login
- 描述: 微信 code2session 登录
- Body: `{ code: string }`
- 返回: `{ accessToken: string, user: { id, nickname, avatar } }`

### PATCH /auth/profile
- 描述: 更新个人资料
- Body: `{ nickname?: string, avatar?: string }`
- 返回: `{ id, nickname, avatar }`

### GET /auth/settings | PATCH /auth/settings
- 描述: 获取/更新用户设置
- Body (PATCH): `{ dayStartsAt?, reminderLeadMinutes?, defaultNature?, defaultDuration?, defaultCategory?, weekStartsOn?, age?, maritalStatus?, spouseName?, residence?, company?, occupation? }`

### DELETE /auth/account
- 描述: 注销账号（7 天冷静期）
- 返回: `{ deleted: boolean, restoreToken: string }`

### POST /auth/restore
- 描述: 恢复已注销账号（公开端点）
- Body: `{ userId: string, restoreToken: string }`

### POST /auth/migrate-dev-data | POST /auth/delete-dev-data
- 描述: 数据迁移/清空
- Body: `{ devUserId: string }`

## 时间块 (TimeBlock)

### POST /time-blocks
- 描述: 创建时间块
- Body: `{ title, startTime, endTime, triggerTime?, startDate?, endDate?, status?, location?, description?, category?, recurrence?, recurrenceEndAt?, contacts?, weather?, taskId?, nature?, circleId?, categoryId?, source?, sourceId?, rigidity?, bufferBefore?, bufferAfter? }`
- 返回: `TimeBlockResponseDto`

### GET /time-blocks/my
- 返回: `TimeBlockResponseDto[]`

### GET /time-blocks/by-date/:date
- 描述: 按日期查询 (YYYY-MM-DD)

### GET /time-blocks/by-date-range?start=X&end=Y&limit=N
- 描述: 日期范围查询（按日期分组）
- 返回: `Record<string, TimeBlockResponseDto[]>`

### GET /time-blocks/by-task/:taskId

### POST /time-blocks/check-conflicts
- Body: `{ startTime: string, endTime: string, excludeId?: string }`
- 返回: `ConflictInfo[]`

### GET /time-blocks/gaps?date=YYYY-MM-DD
- 描述: 获取空闲时段
- 返回: `GapDto[]` — `[{ startTime, endTime, durationMinutes }]`

### POST /time-blocks/place-flexible
- 描述: 弹性任务放入空闲时段
- Body: `{ taskId: string, startTime: string, endTime: string }`
- 返回: `TimeBlockResponseDto`

### DELETE /time-blocks/:id/unplace
- 描述: 弹性任务放回任务池
- 返回: `{ deleted: boolean }`

### POST /time-blocks/share-card (JWT)
- Body: `{ date: string }`
- 返回: `ShareCardResponseDto`

### GET /time-blocks/share-card/:token (Public)

### POST /time-blocks/share-card/:token/respond (Public)
- Body: `{ startTime: string, endTime: string, userName?: string }`

### GET /time-blocks/stats?start=X&end=Y
- 返回: `TimeBlockStatsDto`

### GET /time-blocks/namecard?date=X
- 描述: 生成周名片（忙闲概览）
- 返回: `NamecardResponseDto`

### GET /time-blocks/:id | PATCH /time-blocks/:id | DELETE /time-blocks/:id

## 任务 (Task)

### POST /tasks
- Body: `{ title, goal?, steps?, status?, category?, categoryId?, startDate?, dueAt?, triggerTime?, estimatedDuration? }`
- 返回: `TaskResponseDto`

### POST /tasks/from-text
- Body: `{ text: string, createAs?: 'task' | 'timeblock' }`

### GET /tasks/my?limit=N&offset=N
### GET /tasks/my/stats | GET /tasks/my/category/:category

### GET /tasks/:id | PATCH /tasks/:id | DELETE /tasks/:id
### POST /tasks/:id/complete
- Body: `{ completedNote: string, retrospective: string }`

## 步骤 (Step)

### POST /steps
- Body: `{ taskId, text, sortOrder?, estimatedMinutes?, status?, dependsOnId? }`

### GET /steps/by-task/:taskId | GET /steps/:id | PATCH /steps/:id | DELETE /steps/:id
### POST /steps/:id/schedule
- Body: `{ startTime: string, endTime: string }`

## 分类 (Category)

### POST /categories | GET /categories/my | GET /categories/:id | PATCH /categories/:id | DELETE /categories/:id

## 圈子 (Circle)

### POST /circles | GET /circles/my | GET /circles/:id | PATCH /circles/:id | DELETE /circles/:id
### POST /circles/:id/invite | POST /circles/join/:code | POST /circles/:circleId/leave
### DELETE /circles/:circleId/members/:memberId | POST /circles/:circleId/members
### GET /circles/:circleId/availability?date=X

## 提醒 (Reminder)

### POST /reminders
- Body: `{ blockId: string, leadMinutes: 0|5|15|30|60|120|1440 }`

### GET /reminders/my | GET /reminders/block/:blockId | GET /reminders/:id | PATCH /reminders/:id | DELETE /reminders/:id

## 模板 (Template)

### POST /templates | GET /templates?type=X | GET /templates/:id | PATCH /templates/:id | DELETE /templates/:id
### POST /templates/:id/apply
- Body: `{ date: string }`

## 审批 (Approval)

### POST /approvals
- Body: `{ blockId, recipients: [{ contactType: 'friend'|'phone'|'qr', contactValue? }] }`

### GET /approvals/my-initiated | GET /approvals/my-pending | GET /approvals/:id
### PATCH /approvals/:requestId/recipients/:recipientId
- Body: `{ action: 'approve'|'reject' }`
### POST /approvals/:requestId/recipients/:recipientId/resend
### POST /approvals/:id/cancel | POST /approvals/:requestId/bind
### GET /approvals/shared/:token (Public)

## 委托 (Delegation)

### POST /delegations | GET /delegations/my | GET /delegations/:id
### PATCH /delegations/:id/respond | POST /delegations/:id/deliver

## 分享/隐身 (Share)

### GET /share/recipients | POST /share/recipients | PATCH /share/recipients/:id | DELETE /share/recipients/:id
### GET /share/stealth | POST /share/stealth (enable/disable)

## AI (MiniMax M3)

> ⚠️ AI 端点分布在**两个 controller**（都挂 `/api/v1/ai` 前缀）：
> - `server/src/modules/ai/ai.controller.ts` — `suggest-slots`（规则算法，不走 LLM）
> - `server/src/modules/llm/llm.controller.ts` — `parse` / `decompose`（受保护模块 `server/src/modules/llm/**`，改需 CHANGE）

### POST /ai/parse
- 描述: 自然语言解析为结构化日程（创建/修改/取消预览）
- Body: `{ text: string, timezone?: string }`
- 超时: 8s；失败走 mock fallback（**不抛错**，前端切手动表单）
- 受 §6 LLM 手动降级安全网约束

### POST /ai/decompose (SSE 流式)
- 描述: 任务拆解为依赖步骤，打字机效果
- Body: `{ title, goal?, occupation?, residence? }`
- 返回: `text/event-stream`，每条 `data: {...}`
- 前端状态机: `idle → streaming → done / error`（`src/stores/llm.ts`）
- ⚠️ **前端注意**：`utils/request.ts` 不支持 SSE；调用 decompose 需用原生 `wx.request` + 手动解析 chunk（参考 `src/services/api.ts` 的 `decomposeTask` 实现）

### POST /ai/suggest-slots
- 描述: 基于**规则算法**（贪心）建议时间段，**不调 LLM**，不消耗额度
- Body: `{ date, steps: [{ id, text, estimatedMinutes?, dependsOnId? }] }`

## 搜索 (Search)

### GET /search?q=X
- 返回: `SearchResponseDto`

## 内部模块 (无 HTTP 端点)

| 模块 | 用途 |
|------|------|
| eventlog | 内部审计/事件日志（被 llm 等服务调用） |
| notification | 通知分发（推送/订阅消息） |
| visibility | 可见性/访问控制逻辑（时间块服务内部调用） |

## DTO 定义

### TimeBlockResponseDto
| 字段 | 类型 | 备注 |
|------|------|------|
| id | UUID | |
| userId | UUID | |
| title | string | |
| startTime | string | ISO8601 |
| endTime | string | ISO8601 |
| status | string | todo/in_progress/done |
| location | string\|null | |
| description | string\|null | |
| category | string | default: life |
| categoryId | string\|null | |
| source | string\|null | manual/step/approval/flexible |
| sourceId | string\|null | |
| recurrence | string | default: none |
| recurrenceEndAt | string\|null | |
| contacts | string\|null | |
| weather | string\|null | |
| taskId | string\|null | |
| nature | string | default: PUBLIC |
| circleId | string\|null | |
| rigidity | string\|null | absolute/relative |
| bufferBefore | number\|null | 分钟 |
| bufferAfter | number\|null | 分钟 |
| triggerTime | string\|null | |
| startDate | string\|null | |
| endDate | string\|null | |
| createdAt | string | |
| updatedAt | string | |

### TaskResponseDto
| 字段 | 类型 |
|------|------|
| id | UUID |
| userId | UUID |
| title | string |
| goal | string\|null |
| steps | array\|null |
| status | string |
| category | string |
| categoryId | string\|null |
| startDate | string\|null |
| dueAt | string\|null |
| triggerTime | string\|null |
| completedNote | string\|null |
| retrospective | string\|null |
| improvements | string\|null |
| estimatedDuration | number\|null |
| createdAt | string |
| updatedAt | string |
