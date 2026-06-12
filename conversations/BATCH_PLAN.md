# Batch Plan — timeslots-v1 (v0.15 ~ v0.30)

> 本文档将 VERSION_PLAN.md 中的 v0.15~v0.30 按**增量批次执行**策略重组，每批独立可交付。
> 批次顺序按难度递增 + 业务依赖排列，后一批基于前一批成果叠加。
> **无 AI、无商业化、纯手动 CRUD + 协作工具。**
> **协作 = 审批流（发起→通知→同意→双方生成独立日程），Circle 退化为隐私标签（v0.27）。**

---

## 批次总览

| Batch | 版本 | 主题 | 难度 | 前置 |
|-------|------|------|:----:|------|
| **B2** | v0.15 | 日程关联完成（schedule-task picker） | ⭐ | v0.14 |
| **B3** | v0.16-18 | 提醒系统（后端+ cron + UI） | ⭐⭐⭐ | B2 |
| **B4** | v0.19-21 | 协作圈子（后端+ 邀请 + 前端） | ⭐⭐⭐ | B2 |
| **B5** | v0.22-26 | **审批流（实体+后端+前端+分享+修改再审批）** | ⭐⭐⭐ | B4 |
| **B6** | v0.27 | **圈子可见性（nature/circleId + 隐私标签）** | ⭐⭐⭐ | B5 |
| **B7** | v0.28-30 | **收尾（设置 + UX + 内测）** | ⭐⭐ | B6 |

---

## Batch 2: 日程关联完成 (v0.15)

### 背景
v0.14 已完成 TimeBlock 加 `taskId` + 后端 `by-task` 端点 + 任务详情页的关联日程列表和"创建关联日程"入口。剩余工作：**日程创建/编辑时可选关联任务**。

### 文件清单
| 文件 | 操作 | 说明 |
|------|------|------|
| `src/pages/schedule/detail/index.ts` | 修改 | 新增 `formTaskId` + 任务选择器交互 + 保存时传 `taskId` |
| `src/pages/schedule/detail/index.wxml` | 修改 | 新增任务选择器 UI（picker 或 modal 列表） |
| `src/pages/schedule/detail/index.wxss` | 修改 | 任务选择器样式 |
| `server/src/modules/timeblock/dto/update-timeblock.dto.ts` | 修 | 加 `taskId` 字段 |
| `server/src/modules/timeblock/timeblock.service.ts` | 修 | `update` 需补 `taskId` 更新 |

### 验收标准
- [ ] 创建日程时可选关联一个任务（弹出任务列表选一个）
- [ ] 编辑日程时可见已关联的任务，可更换或取消关联
- [ ] 保存后详情页显示关联任务名
- [ ] 任务详情页关联日程列表正常显示
- [ ] tsc 双 0 错 ✅

---

## Batch 3: 提醒系统 (v0.16-18)

### 背景
微信订阅消息提醒。用户创建日程时可设置提前 X 分钟提醒，cron 到点推送。

### 包含版本
- **v0.16** — 提醒后端：Reminder 表 + CRUD 4 端点
- **v0.17** — Cron 推送 + 防重发
- **v0.18** — 前端 UI：schedule detail + 授权弹窗

### 核心决策
- 防重发：`updateMany SET status=SENDING WHERE status=PENDING` 行锁
- 提醒消息用微信订阅消息（单次订阅，每次发前需用户点同意）

### 验收标准
- [ ] 创建 Reminder 成功入库
- [ ] cron 到点只推送一次（防重发验证）
- [ ] 创建日程时可选提醒档位
- [ ] 首次弹窗引导授权订阅消息
- [ ] 拒绝授权后不再弹窗
- [ ] tsc 双 0 错 ✅ | prisma validate ✅

---

## Batch 4: 协作圈子 (v0.19-21)

### 背景
协作基础。用户可以创建圈子、生成邀请码、其他人用码加入。

### 包含版本
- **v0.19** — 圈子后端：Circle + CircleMember 表 + 5 CRUD
- **v0.20** — 邀请码 + 加入后端
- **v0.21** — 协作 Tab 前端

### 核心决策
- Circle + CircleMember 独立模块
- 邀请码：8 位随机 + 唯一索引
- 角色：OWNER / ADMIN / MEMBER
- TabBar：v0.21 解锁【协作】Tab（4 Tab）

### 验收标准
- [ ] 创建圈子 → 生成 8 位邀请码
- [ ] 他人用邀请码加入 → 成员+1
- [ ] 圈子列表 + 详情页
- [ ] 踢出成员（OWNER/ADMIN）
- [ ] 协作 Tab 显示"我的圈子"
- [ ] tsc 双 0 错 ✅ | prisma validate ✅

---

## Batch 5: 审批流 (v0.22-26)

### 背景
协作 = 审批流，非圈子共享日程。用户发起审批（附日程摘要）→ 分享卡片/短信 → 对方同意 → 双方各生成独立 TimeBlock。

### 包含版本
- **v0.22** — 审批流后端：ApprovalRequest + ApprovalRecipient 2 实体 + 9 端点（含 bindRecipient）
- **v0.23** — 协作 Tab 重写为审批中心（待我审批 / 我发起的 双 Tab + approval-detail 双视角）
- **v0.24** — 发起审批 UI（approval-create 三 Tab + schedule detail 入口）
- **v0.25** — 接收端 + 分享卡片（approval-share 公开页 + shareToken 传递 + SMS log）
- **v0.26** — 修改再审批（发起方修改原 TimeBlock → 重置 recipient 为 pending → 二次确认）

### 核心决策
- 审批由旧版评论/RSVP 替代。Circle 退化为隐私标签（v0.27）
- ApprovalRecipient.contactType: `friend`/`phone`/`qr`。`friend` 类型通过 `bind` 端点绑定
- 同意后接收方获得独立 TimeBlock 副本（非共享记录）
- SMS 发送：MVP 阶段仅 log，不接真实网关
- 分享卡片携带 shareToken（UUID），公开 `GET /shared/:token` 可访问

### 新增文件
| 文件 | 说明 |
|------|------|
| `server/prisma/schema.prisma` | ApprovalRequest + ApprovalRecipient 2 实体 + 3 枚举 |
| `server/src/modules/approval/` | 完整 module（controller+service+4 DTOs）|
| `src/types/approval.ts` | 4 接口 |
| `src/services/api.ts` | 10 审批 API 函数 |
| `src/stores/approvalStore.ts` | MobX store（8 actions）|
| `src/pages/collab/index.*` | 重写为双 Tab |
| `src/pages/collab/approval-detail/*` | 审批详情（双视角）|
| `src/pages/collab/approval-create/*` | 发起审批（三 Tab）|
| `src/pages/collab/approval-share/*` | 公开分享接收页 |

### 修改文件
| 文件 | 说明 |
|------|------|
| `server/src/app.module.ts` | 挂 ApprovalModule |
| `server/src/prisma/prisma.service.ts` | SOFT_DELETE_MODELS +2 |
| `src/pages/schedule/detail/index.*` | 加"发起审批"按钮 |
| `src/app.json` | 注册 3 个新页面 |

### 验收标准
- [ ] POST /approvals 创建审批 → 返回 shareToken
- [ ] GET /approvals/my-initiated 列出发起的审批
- [ ] GET /approvals/my-pending 列出待审批的
- [ ] PATCH /approvals/:id/recipients/:recId 同意/拒绝
- [ ] 同意后接收方生成独立 TimeBlock（sourceRequestId）
- [ ] GET /approvals/shared/:token 公开查看日程摘要
- [ ] POST /approvals/shared/:token/bind 绑定 friend 类型接收人
- [ ] 修改日程后自动重置 pending + 通知
- [ ] tsc 双 0 错 ✅ | prisma validate ✅ | 测试 77/77 ✅

---

## Batch 6: 圈子可见性 + 隐私标签 (v0.27)

### 背景
TimeBlock 加 nature（PRIVATE/PUBLIC/CIRCLE_ONLY）和 circleId，实现隐私标签。Circle 用作隐私隔离：work 日程仅"同事"圈可见，life 仅"家人"圈可见。

### 核心决策
- `EventVisibilityService`：PRIVATE 仅本人 / PUBLIC 所有人可读 / CIRCLE_ONLY 圈成员可见
- Fail-Secure：未知 nature 按 PRIVATE 处理
- 旧数据迁移：全部 nature=PRIVATE, circleId=null

### 新增文件
| 文件 | 说明 |
|------|------|
| `server/src/modules/event-visibility.service.ts` | P0-P3 可见性掩码 |
| `server/prisma/migrations/` | 加 nature/circleId 字段 |

### 修改文件
| 文件 | 说明 |
|------|------|
| `server/prisma/schema.prisma` | TimeBlock 加 nature(PRIVATE/PUBLIC/CIRCLE_ONLY) + circleId(可空) |
| `server/src/modules/timeblock/timeblock.controller.ts` | GET /shared 过滤 |
| `server/src/modules/timeblock/timeblock.service.ts` | 可见性查询 |
| `src/pages/schedule/detail/index.ts` | 创建/编辑时选可见性类型 |
| `src/types/api.ts` | nature/circleId 字段 |
| `src/services/api.ts` | 可见性相关 |
| `src/pages/collab/index.*` | 恢复 Circle 管理入口 |

### 验收标准
- [ ] PRIVATE 日程：仅本人可见
- [ ] PUBLIC 日程：所有人可读
- [ ] CIRCLE_ONLY 日程：圈成员可读
- [ ] 非成员请求 CIRCLE_ONLY → 403
- [ ] 旧数据 nature=PRIVATE
- [ ] tsc 双 0 错 ✅ | prisma validate ✅

---

## Batch 7: 收尾 (v0.28-30)

### 背景
设置 + 全局 UX 兜底 + 全流程内测。

### 包含版本
- **v0.28** — 设置页（day_starts_at / 默认提醒 / 默认可见性）
- **v0.29** — 全局 UX（空状态 / 网络失败 / 按钮防抖 / 骨架屏）
- **v0.30** — 内测收尾（隐私协议 + 全流程验收）

### 核心决策
- 设置存 User settings（JSON 字段）
- 隐私协议弹窗首屏强制同意

### 新增文件
| 文件 | 说明 |
|------|------|
| `src/pages/mine/settings/index.*` | 设置页（4 文件）|
| `server/src/modules/settings/` | 设置模块 |

### 修改文件
| 文件 | 说明 |
|------|------|
| `server/prisma/schema.prisma` | User 加 settings JSON 字段 |
| `src/utils/request.ts` | 统一网络失败 toast |
| 所有列表页 | 空状态插画 + 骨架屏 |
| 所有表单页 | 按钮防抖 |

### 验收标准
- [ ] 设置 day_starts_at → 时间轴生效
- [ ] 设置默认提醒 → 创建日程默认勾选
- [ ] 设置默认可见性 → 创建日程默认
- [ ] 断网提示"网络异常"
- [ ] 空数据友好插画
- [ ] 按钮连点不重复创建
- [ ] 隐私协议首屏强制同意
- [ ] 全流程真机验收通过
- [ ] tsc 双 0 错 ✅

---

## 执行规范

### Safety Gates（参考 AGENTS.md §9）
```
[ ] 类型安全：无 any，新增接口已定义 TS 类型
[ ] 平台兼容：未使用 DOM/BOM/Taro，路由走 wx.*
[ ] 架构隔离：未违规修改受保护模块（AGENTS §10）
[ ] NestJS 分层：Controller 薄、Service 厚、DTO 验证完整
[ ] 错误处理：所有异步 try/catch，无静默失败
[ ] 死代码清理：无废弃 import / 注释代码
[ ] UI 规范：优先 WeUI、rpx 单位、styleIsolation
```

### AI 约束
| 约束 | 强制 |
|------|:----:|
| 禁止 Taro / `@tarojs/*` | ✅ |
| 禁止 `any` | ✅ |
| Page 双泛型 + `<Name>PageData` 命名 | ✅ |
| WXML 禁用 `??` / 方法调用 | ✅ |
| MobX `this: StoreName` 模式 | ✅ |
| Prisma `where: { isDeleted: false }` + `$extends` | ✅ |
| `BusinessException` + `ErrorCodes` | ✅ |
| `.client.xxx` 调用模式 | ✅ |
| 后端 DTO 必须有 class-validator | ✅ |
| `void` + `@HttpCode(204)` 冲突禁止 | ❌ 禁止 |
| `findByDate` 用 `+08:00` 边界 | ✅ |
| 日期参数 `regex` + `isNaN` 校验 | ✅ |

---

## 批次间依赖关系

```
B2 (v0.15 日程关联) ──────────────────────┐
                                          │
B3 (v0.16-18 提醒) ─── 独立 ─────────────┤
                                          │
B4 (v0.19-21 圈子) ─── 独立 ─────────────┤── 最终 B7 全流程验收
                                          │
B5 (v0.22-26 审批流) ─── 依赖 B4(邀请) ──┤
                                          │
B6 (v0.27 圈子可见性) ─ 依赖 B5 + B4 ────┘
```

- B5（审批流）依赖 B4（圈子）的 inviteCode/join 模式（bindRecipient 参考了 M2 流程）
- B6（圈子可见性）依赖 B4（圈子存在）+ B5（审批流完成后才做可见性）
- B7（收尾）依赖所有前序批次
