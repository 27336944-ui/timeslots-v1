# Batch Plan — timeslots-v1 (v0.15 ~ v0.29)

> 本文档将 VERSION_PLAN.md 中的 v0.15~v0.29 按**增量批次执行**策略重组，每批独立可交付。
> 批次顺序按难度递增 + 业务依赖排列，后一批基于前一批成果叠加。
> **无 AI、无商业化、纯手动 CRUD + 协作工具。**

---

## 批次总览

| Batch | 版本 | 主题 | 难度 | 前置 |
|-------|------|------|:----:|------|
| **B2** | v0.15 | 日程关联完成（schedule-task picker） | ⭐ | v0.14 |
| **B3** | v0.16-18 | 提醒系统（后端+ cron + UI） | ⭐⭐⭐ | B2 |
| **B4** | v0.19-21 | 协作圈子（后端+ 邀请 + 前端） | ⭐⭐⭐ | B2 |
| **B5** | v0.22-23 | 可见性 + 共享（nature + shared tab） | ⭐⭐⭐ | B4 |
| **B6** | v0.24-26 | 评论 + RSVP（后端+ 前端） | ⭐⭐⭐ | B5 |
| **B7** | v0.27-29 | 收尾（设置 + 全局 UX + 内测） | ⭐⭐ | B6 |

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
| `server/src/modules/timeblock/dto/create-timeblock.dto.ts` | ✅ 已有 | 无需修改（已有 `taskId` 字段） |
| `server/src/modules/timeblock/dto/update-timeblock.dto.ts` | 修 | 加 `taskId` 字段 |
| `server/src/modules/timeblock/timeblock.service.ts` | ✅ 已有 | `update` 需补 `taskId` 更新 |

### 验收标准
- [ ] 创建日程时可选关联一个任务（弹出任务列表选一个）
- [ ] 编辑日程时可见已关联的任务，可更换或取消关联
- [ ] 保存后详情页显示关联任务名
- [ ] 任务详情页关联日程列表正常显示
- [ ] tsc 双 0 错 ✅

### 审计教训对照（B2 必须遵守）
| 教训 | 本批次落实 |
|------|-----------|
| L2: 事件类型 | 任务选择器的 bindinput/交互用 `WechatMiniprogram.Input` / `TouchEvent` |
| L11: WXML 不支持 `??` | 用 `\|\|` 替代 |
| L12: Page 方法在 TCustom | 所有辅助方法在 `<Name>PageMethods` 声明 |
| L17: npm build | 涉及新 npm 包时需运行构建 npm |
| L18: storeBindings 销毁 | `onUnload` 需销毁 |

---

## Batch 3: 提醒系统 (v0.16-18)

### 背景
微信订阅消息提醒。用户创建日程时可设置提前 X 分钟提醒，cron 到点推送。

### 包含版本
- **v0.16** — 提醒后端：Reminder 表 + CRUD 4 端点
- **v0.17** — Cron 推送 + 防重发
- **v0.18** — 前端 UI：schedule detail + 授权弹窗

### 核心决策
- 防重发：`updateMany SET status=SENDING WHERE status=PENDING` 行锁（AGENTS §AI 编程约束）
- 提醒消息用微信订阅消息（单次订阅，每次发前需用户点同意）
- 三种档位：15/30/60min

### 新增文件
| 文件 | 说明 |
|------|------|
| `server/prisma/schema.prisma` | 加 Reminder 表 |
| `server/src/modules/reminder/` | 完整 module（DDD）：controller + service + DTOs |
| `server/src/jobs/reminder.cron.ts` | cron 扫描 + 推送 |
| `src/types/api.ts` | Reminder 类型 |
| `src/services/api.ts` | reminder API |
| `src/stores/reminderStore.ts` | MobX store |

### 修改文件
| 文件 | 说明 |
|------|------|
| `src/pages/schedule/detail/index.ts` | 新增"提前 X 分钟提醒"选择器 + 授权弹窗 |
| `src/pages/schedule/detail/index.wxml` | 提醒选项 UI |
| `server/src/app.module.ts` | 挂 ReminderModule + ScheduleModule |

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
协作基础。用户可以创建圈子、生成邀请码、其他人用码加入、圈内可见日程。

### 包含版本
- **v0.19** — 圈子后端：Circle + CircleMember 表 + 5 CRUD
- **v0.20** — 邀请码 + 加入后端
- **v0.21** — 协作 Tab 前端

### 核心决策
- Circle + CircleMember 独立模块（非 TimeBlock 子集）
- 邀请码：8 位随机 + 唯一索引
- 角色：OWNER / ADMIN / MEMBER
- TabBar：v0.21 解锁【协作】Tab（4 Tab）

### 新增文件
| 文件 | 说明 |
|------|------|
| `server/prisma/schema.prisma` | Circle + CircleMember 表 |
| `server/src/modules/circle/` | 完整 module |
| `src/pages/collab/index.*` | 协作 Tab（4 文件）|
| `src/pages/collab/circle-detail/index.*` | 圈子详情（4 文件）|
| `src/stores/circleStore.ts` | MobX store |

### 修改文件
| 文件 | 说明 |
|------|------|
| `src/app.json` | 加 `pages/collab/*` + 解锁协作 Tab |
| `src/types/api.ts` | Circle / CircleMember 类型 |
| `src/services/api.ts` | circle CRUD API |

### 验收标准
- [ ] 创建圈子 → 生成 8 位邀请码
- [ ] 他人用邀请码加入 → 成员+1
- [ ] 圈子列表 + 详情页
- [ ] 踢出成员（OWNER/ADMIN）
- [ ] 协作 Tab 显示"我的圈子"和"共享给我"子 Tab（共享给我置灰 stub）
- [ ] tsc 双 0 错 ✅ | prisma validate ✅

---

## Batch 5: 可见性 + 共享 (v0.22-23)

### 背景
TimeBlock 加 nature（PRIVATE/PUBLIC/CIRCLE_ONLY）和 circleId，实现可见性控制。旧数据默认 PRIVATE。

### 包含版本
- **v0.22** — 可见性后端 + 共享端点 + migration
- **v0.23** — 共享 Tab 前端

### 核心决策
- `EventVisibilityService`：P0-P3 掩码机制（自日程 → 掩码日程）
- Fail-Secure：未知 nature 按 PRIVATE 处理
- 历史 migration：旧记录 nature=PRIVATE, circleId=null

### 新增文件
| 文件 | 说明 |
|------|------|
| `server/src/modules/event-visibility.service.ts` | P0-P3 可见性计算 |
| `server/prisma/migrations/` | 加 nature/circleId 字段 |
| `src/pages/collab/index.ts` | "共享给我"子 Tab |

### 修改文件
| 文件 | 说明 |
|------|------|
| `server/src/modules/timeblock/timeblock.controller.ts` | 加 `GET /shared` |
| `server/src/modules/timeblock/timeblock.service.ts` | 加共享查询 |
| `server/src/modules/timeblock/dto/` | 加 nature/circleId |
| `src/pages/schedule/detail/index.ts` | 创建/编辑时选可见性类型 |
| `src/services/api.ts` | `getSharedBlocks()` |
| `src/stores/blockStore.ts` | `sharedBlocks` |

### 验收标准
- [ ] PRIVATE 日程：仅本人可见
- [ ] PUBLIC 日程：所有人可读
- [ ] CIRCLE_ONLY 日程：圈子成员在 `/shared` 可见
- [ ] 非成员请求 CIRCLE_ONLY → 403
- [ ] 旧数据 nature=PRIVATE
- [ ] Shared tab 显示 title + timeRange + nature
- [ ] tsc 双 0 错 ✅ | prisma validate ✅ | curl 验证 ✅

---

## Batch 6: 评论 + RSVP (v0.24-26)

### 背景
在日程上评论和回复、对日程表示参加/待定/取消。

### 包含版本
- **v0.24** — 评论后端 + 权限矩阵
- **v0.25** — 评论前端
- **v0.26** — RSVP 后端 + 前端

### 核心决策
- 权限：PRIVATE 隐藏、PUBLIC 可读仅邀请者可写、CIRCLE_ONLY 成员可读写
- RSVP 唯一约束：blockId + attendeeId

### 新增文件
| 文件 | 说明 |
|------|------|
| `server/prisma/schema.prisma` | Comment + RSVP 表 |
| `server/src/modules/comment/` | 完整 module |
| `server/src/modules/rsvp/` | 完整 module |
| `src/types/api.ts` | Comment / RSVP 类型 |
| `src/services/api.ts` | comment + rsvp API |
| `src/stores/commentStore.ts` | MobX store |

### 修改文件
| 文件 | 说明 |
|------|------|
| `src/pages/schedule/detail/index.ts` | 评论区 + RSVP 三按钮 |
| `src/pages/schedule/detail/index.wxml` | 评论/RSVP UI |
| `src/app.module.ts` | 挂 CommentModule + RsvpModule |

### 验收标准
- [ ] 发评论 → 列表刷新
- [ ] 回复评论（parentId）
- [ ] PRIVATE 日程无评论区
- [ ] PUBLIC 日程可读不可写
- [ ] CIRCLE_ONLY 成员可读写
- [ ] RSVP 三态切换 + 人数统计
- [ ] tsc 双 0 错 ✅

---

## Batch 7: 收尾 (v0.27-29)

### 背景
设置 + 全局 UX 兜底 + 全流程内测。

### 包含版本
- **v0.27** — 设置页（day_starts_at / 默认提醒 / 默认可见性）
- **v0.28** — 全局 UX（空状态 / 网络失败 / 按钮防抖 / 骨架屏）
- **v0.29** — 内测收尾（隐私协议 + 全流程验收）

### 核心决策
- 设置存 User Settings（JSON 字段）
- 隐私协议弹窗首屏强制同意

### 新增文件
| 文件 | 说明 |
|------|------|
| `src/pages/mine/settings/index.*` | 设置页（4 文件）|
| `src/pages/privacy/index.*` | 隐私协议页 |
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

## 执行规范（每批必须遵守）

### Safety Gates（参考 AGENTS.md §9）
```
自检报告:
[ ] 类型安全：无 any，新增接口已定义 TS 类型
[ ] 平台兼容：未使用 DOM/BOM/Taro，路由走 wx.*
[ ] 架构隔离：未违规修改受保护模块（AGENTS §10）
[ ] NestJS 分层：Controller 薄、Service 厚、DTO 验证完整
[ ] 错误处理：所有异步 try/catch，无静默失败
[ ] 死代码清理：无废弃 import / 注释代码
[ ] UI 规范：优先 WeUI、rpx 单位、styleIsolation
[ ] 大模型安全：N/A
[ ] LLM 边界：N/A
```

### AI 约束（AGENTS.md + 审计教训）
| 约束 | 强制 |
|------|:----:|
| 禁止 Taro / `@tarojs/*` | ✅ |
| 禁止 `any` | ✅ |
| 禁止 `miniprogram/` 目录 | ✅ |
| 所有请求走 `utils/request.ts` | ✅ |
| `Page<TData, TCustom>` 双泛型 | ✅ |
| `<Name>PageData` 命名 | ✅ |
| WXML 禁用 `??` / 方法调用 | ✅ |
| MobX `this: StoreName` 模式 | ✅ |
| Prisma `where: { isDeleted: false }` + `$extends` | ✅ |
| `BusinessException` + `ErrorCodes` | ✅ |
| `.client.xxx` 调用模式 | ✅ |
| 后端 DTO 必须有 class-validator | ✅ |
| `void` + `@HttpCode(204)` 冲突 | ❌ 禁止 |
| `findByDate` 用 `+08:00` 边界 | ✅ |
| 日期参数 `regex` + `isNaN` 校验 | ✅ |
| 存储 key 统一走 `storage.ts` | ✅ |

---

## 批次间依赖关系

```
B2 (v0.15 日程关联) ──────────────────────┐
                                          │
B3 (v0.16-18 提醒) ─── 独立 ──────────────┤
                                          │
B4 (v0.19-21 圈子) ─── 独立 ──────────────┤── 最终 B7 全流程验收
                                          │
B5 (v0.22-23 可见性) ─── 依赖 B4 ─────────┤
                                          │
B6 (v0.24-26 评论+RSVP) ─ 依赖 B5 ────────┘
```

- B3（提醒）和 B4（圈子）**互不依赖**，可交换顺序
- B5（可见性）**依赖 B4**（圈子），因为 CIRCLE_ONLY 需要 Circle 存在
- B6（评论+RSVP）**依赖 B5**（可见性），因为评论权限矩阵依赖 nature
- B7（收尾）依赖所有前序批次
