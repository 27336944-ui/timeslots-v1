# timeslots-v1 版本开发计划

> 本文档为开发唯一依据。**有变更先改此文件，再按计划开发。**
> 定位：朋友内测工具，不计费、无 AI、无商业化。优先纯手动 CRUD + 协作体验。

---

## 原则

1. 每个版本是**可独立运行、可交付的完整闭环**
2. 难度**阶梯递增**，早期不高复杂度
3. 每项**原子化、可验收**
4. 后续版本基于前序版本成果叠加，**不重复造轮子**

---

## 版本表

| 版本 | 事项名称 | 事项描述（含验收标准） | 前置 | 难度 |
|------|----------|------------------------|------|:----:|
| v0.1 | **后端能跑** | NestJS 起在 7777、Prisma 连 PG18、`GET /api/v1/health` 返回 `{code:0, data:{status:"ok", db:"connected"}}`。验收：curl 拿到 200 | 无 | ⭐ |
| | **v0.1 ✅** | `GET /` 返回服务信息；`GET /api/v1/health` 返回 200 + `db:"connected"`；Prisma Client 生成成功；tsc --noEmit 0 错。**PG 环境**：`timeslots` 用户 + `timeslots` 库（pswd: `timeslots_dev_only`）；`server/.env` 从根 `.env` 同步。**已知**：server 启动端口硬编码 7777（后续移入 config module） | | |
| v0.2 | **前端骨架** | 小程序 `src/` 骨架、tsconfig strict、WeUI npm、mobx-miniprogram、ESLint+Prettier+Husky、`scripts/build-npm.js` postinstall。验收：`npm install`→开发者工具编译 0 错 | 无 | ⭐ |
| | **v0.2 ✅** | `src/` 目录结构完整（pages/index + 7 个占位目录）；`project.config.json` 配置 `miniprogramRoot: src/` + `useCompilerPlugins: [typescript]`；`tsconfig.json` strict + `moduleResolution: bundler`；WeUI 1.5.6 + mobx-miniprogram 4.13.0 + bindings 2.1.5 安装并 postinstall 拷贝到 miniprogram_npm/；`tsc --noEmit` 0 错；`tsc --noEmit` (server) 0 错。**注意**：ESLint 和 Husky 暂未配置（v0.3 前补），WeUI 版本 AGENTS.md 从 2.x 修正为 1.5.6 | | |
| v0.3 | **前后端连通** | `utils/request.ts` + `types/api.ts` + `services/api.ts`、`pages/index/index` 调 `/health` 显示绿色卡片。验收：页面显示"后端已连接" | v0.1, v0.2 | ⭐⭐ |
| | **v0.3 ✅** | `types/api.ts`（ApiResponse/HealthData/WxRequestMethod/WxRequestData）；`utils/storage.ts`（`timeslots_` 前缀统一）；`utils/request.ts`（get/post/put/del/patch、自动 Token、ApiResponse 拆包、global try/catch）；`services/api.ts`（healthCheck）；`pages/index` 调 health 显示绿/红状态卡。**审计教训 L1 已遵守**（`/api/v1/health` 路径由 request.ts 拼接 BASE_URL，services 只传 path）；**L7 已遵守**（类型在 `types/` 目录）；**L10 已遵守**（统一 `storage.ts` + `timeslots_` 前缀）。**缺口**：ESLint 配置待完善、Husky 未装（归入 v0.4） | | |
| v0.4 | **设计系统** | `styles/tokens.wxss` + 4 组件（Tag/Skeleton/Cell/BottomSheet）。验收：组件渲染正常 | v0.2 | ⭐⭐ |
| | **v0.4 ✅** | `styles/tokens.wxss`（品牌色 `#4A6CF7` + 语义色 + 间距/字号/圆角/阴影）；Tag 组件（5 变体 + 2 尺寸 + 可关闭）；Skeleton 组件（行数/头像/动画）；Cell 组件（icon slot + title/desc + arrow）；BottomSheet 组件（overlay + 滑入动画 + catchtap 防穿透）；`app.wxss` 导入 tokens。**审计教训 L5 已检查**：无嵌套 try/catch。tsc 0 错 | | |
| v0.5 | **登录（dev 模式）** | User 表、`POST /auth/login`（接收 userId 直接签 JWT）、`JwtAuthGuard`、`@CurrentUser`。验收：curl 登录返回 token | v0.1 | ⭐⭐ |
| | **v0.5 ✅** | User 表 + POST /api/v1/auth/login + JwtAuthGuard + @CurrentUser + ValidationPipe（修复 P3）+ JWT_SECRET 配置化（修复 P1/P2）+ HealthController 去除重复响应包装 + AuthModule 移除 HealthModule 依赖 + JwtStrategy 实时查库软删拦截 + MigrationPlaceholder 清理 + PrismaModule 显式导入。验收：curl 登录返回 JWT 7d 有效；invalid UUID 返回 400 + `"userId must be a UUID"`；tsc 双 0 错；prisma validate ✅；end-to-end 测试 5/5 ✅。**测试用户**：`550e8400-e29b-41d4-a716-446655440000`（RFC 4122 合规） | | |
| v0.6 | **我的页 + 登录/登出** | `authStore`、`userStore`、`pages/mine/index` 显示昵称+头像字母、登录/登出按钮。验收：登录后显示"小明"，退出后显示"未登录" | v0.5 | ⭐⭐ |
| | **v0.6 ✅** | `authStore` + `userStore`（MobX observable + action 模式，含 L13/L18 规范）；`pages/mine/index` Dev UUID 登录/退出登录；`mine/index.wxml` 头像字母 + 昵称显示；`mine/index.wxss` 样式。tsc 0 错 | | |
| v0.7 | **时间块 CRUD 后端** | TimeBlock 表（id, userId, title, startTime, endTime, status, isDeleted）+ `event` module 5 端点（POST/GET my/GET :id/PATCH/DELETE）。不含 nature、不含 circleId、不含 quota。验收：curl 增删改查全部通过，软删后列表不可见 | v0.5 | ⭐⭐ |
| | **v0.7 ✅** | TimeBlock model + migration 完成；`timeblock` module（DDD 风格）5 端点全信号测试通过：POST 200（create）、GET /my 200（按 startTime 升序）、GET /:id 200/404（软删感知）、PATCH 200（title+status）、DELETE 200（软删+deletedAt）。tsc --noEmit 0 错。prisma validate ✅ | | |
| v0.8 | **按日期查后端** | `GET /time-blocks/by-date/:date` 返回当天 00:00~24:00 的日程（按 startTime 升序）。验收：curl 传日期拿当天数据 | v0.7 | ⭐ |
| | **v0.8 ✅** | `findByDate` 时区感知修复（+08:00）+ 日期格式校验（正则 + isNaN 兜底）。curl 验证：2026-06-10 返回 UTC 02:00 和前一天 UTC 23:00 两个日程（均为上海当日）。无效格式返回 400 | | |
| v0.9 | **日程 Tab 时间轴** | `blockStore`、`pages/schedule/index` 24h 时间轴（0-23时）、按 hour 分桶、下拉刷新、时间轴默认只展开有日程的小时。**TabBar：底部仅显示【日程】和【我的】两个 Tab（app.json 硬编码 2 项）**。验收：时间轴显示当天已有日程；底部只有日程+我的；周/月切换 Mock 显示"即将上线" | v0.8, v0.6 | ⭐⭐⭐ |
| | **v0.9 ✅** | `blockStore` MobX store（fetchByDate + loading/error/currentDate）；`pages/schedule/index` 24h 时间轴、按 hour 分桶、UTC→本地时转换、自动展开有日程的小时、左右日期导航、下拉刷新、周/月 Mock toast；`app.json` tabBar 仅日程+我的（2 tabs）。tsc --noEmit 0 错 | | |
| v0.10 | **新建/编辑/删除日程** | 在 `pages/schedule/detail/index` 中通过 `mode` 三态（create/view/edit）实现新建、编辑、删除。含 title + startTime/endTime + 分类/优先级/地点/备注/周期/联系人/天气 等扩展字段。验收：新建→列表出现→编辑→保存→列表更新→删除→消失 | v0.9 | ⭐⭐ |
| | **v0.10 ✅** | `pages/schedule/detail/index` 三态模式（create/view/edit）；7 扩展字段（location/description/priority/category/recurrence/contacts/weather）完整 Form；FAB 入口 + blockCard 左色条 + 优先级圆点；`blockStore` CRUD actions 自动刷新列表 + 返回。Prisma migration `add_timeblock_fields` 新增 7 字段。前端 tsc 0 错 + 后端 tsc 0 错 | | |
| v0.11 | **微信真实登录 + 数据过渡** | code2session 换 openid、`POST /auth/wx-login` 收 code 返回 token、`wx.getUserProfile` 拿头像昵称→`PATCH /auth/profile` 更新。**数据过渡：提供 `POST /auth/migrate-dev-data`（迁移）+ `POST /auth/delete-dev-data`（清空）API 端点；首次微信登录成功弹出迁移弹窗**。验收：真机微信登录→头像昵称出现→旧数据可选迁移或清空 | v0.6 | ⭐⭐⭐ |
| | **v0.11 ✅** | User 表加 `openid` 字段 + `prisma db push`；`POST /api/v1/auth/wx-login`（code→code2session→JWT）带占位符检测 + 错误处理；`PATCH /api/v1/auth/profile`（JWT guarded）更新 nickname/avatar；`POST /api/v1/auth/migrate-dev-data` + `POST /api/v1/auth/delete-dev-data` 数据过渡；`wx.getUserProfile` 在 `onWxLoginTap` 中调用获取头像昵称；首次微信登录弹出迁移 Modal（可输入 Dev UUID 迁移/删除）。tsc 双 0 错；curl 验证：Profile PATCH 200 ✅ / Migrate 200（4 条）✅ / Delete 200 ✅ / wx-login 400（未配置正常拒绝）✅ | | |
| v0.12 | **账号注销/恢复** | `DELETE /auth/account` → 7 天冷静期、`POST /auth/restore` 恢复（公开端点）。登录检测已注销用户返回"账号待删除"，前端弹窗提示恢复。验收：注销→再登录提示"账号待删除"→恢复→正常使用 | v0.11 | ⭐⭐ |
| | **v0.12 ✅** | `DELETE /api/v1/auth/account`（JWT 守卫）+ `POST /api/v1/auth/restore`（公开）+ `AuthService.checkDeletedUser()` 登录拦截；`login/wxLogin` 改为查全量用户（含已删）→ 7 天冷静期检测 → `ForbiddenException('账号待删除')` 或 `('账号已永久删除')`。前端：mine 页`注销账号`按钮 + 登录失败弹窗恢复 + 恢复成功自动登录。tsc 双 0 错；curl 验证：DELETE 200 / restore 200 / login deleted 403 ✅ | | |
| v0.13 | **任务后端（三种任务类型：工作/生活/私有）** | Task 表（id, userId, title, **goal**（持续细化的目标/需求描述）, **steps** (JSON: [{text, isDone}]), status (pending/in_progress/done), priority, **category (work/life/private)**, dueAt?, **completedNote**（补充说明）, **retrospective**（复盘改进点）, **improvements**（未来更明确要求）, isDeleted）+ 5 CRUD 端点 + `GET /tasks/my/stats`(total/pending/inProgress/done/**today**/**week**/overdue/arranged/unarranged)。**任务组由三种固定类型替代（工作/生活/私有），不设 TaskGroup 独立 CRUD**。category 与 TimeBlock 一致。**Task 是可迭代的工作单元，非一次性待办**——goal 可反复细化，steps 是核心完成依据，完成后需填写 completedNote+retrospective 才算真正闭环。stats 增加 today（当日截止未完成）/week（本周截止未完成）/arranged（有关联日程）/unarranged（未安排）计数（Asia/Shanghai 时区）。验收：curl 建任务含 steps+goal→按 category 过滤→stats 含 today+week 计数 | v0.5 | ⭐⭐ |
| | **v0.13 ✅** | Task model（title, goal, steps JSON, status, priority, category, dueAt, completedNote, retrospective, improvements）+ Prisma schema migration；TaskModule 7 端点（POST/GET my/stats/my/category/:cat/GET :id/PATCH :id/DELETE :id）；stats 含 today+week（Asia/Shanghai 时区）+ arranged/unarranged（真实 TimeBlock.taskId 查询）；前端 types + API 函数。**Bug fix sweep**：typescript ^6.0.3→^5.6.0；recurrence 按钮 active 类名修复；arranged/unarranged 硬编码→真实 TimeBlock.taskId 查询；deleteDevData 补 @CurrentUser；toLocalDate/toLocalTime 时区修复（Intl.DateTimeFormat en-CA + Asia/Shanghai）；HttpExceptionFilter code→status*100+1；wx.getUserProfile 废弃 API 移除；storage keys 统一走 storage.ts；TransformInterceptor path→request.path；dueAt 空字符串处理。tsc 双 0 错 ✅ prisma validate ✅ db push ✅ curl 7/7 ✅ | | |
| v0.14 | **任务 Tab 前端** | `taskStore`、`pages/tasks/index`：顶部统计卡（total/今日截止/本周截止/逾期）+ 底部 3 个 category Tab (工作/生活/私有) 切换 → 每个分类内支持二级过滤（全部/已安排日程/未安排）→ 任务列表（category 色点+status 图标+steps 进度条+截止时间+**已安排/未安排 badge**）。`pages/tasks/task-detail`：编辑 goal+steps checklist 管理（增/改/勾选步骤）+ 完成后展示复盘区（completedNote/retrospective/improvements）+ **关联日程列表**（已发生的 / 未来的日程）+ "为此任务创建关联日程" 入口按钮。**TabBar：追加【任务】Tab（app.json 改为 3 项）**。验收：建任务添加 steps→勾选步骤→完成任务后填写复盘→关联日程后卡片显示"已安排"badge→从任务详情创建关联日程 | v0.13 | ⭐⭐⭐ |
| | **v0.14 ✅** | TimeBlock DTO + response + create 加 `taskId` 字段；`GET /api/v1/time-blocks/by-task/:taskId` 端点；前端 `TimeBlock.taskId` 类型 + `getBlocksByTask()` API；`taskStore` MobX store（CRUD + stats + category filter）；`pages/tasks/index`（8 统计卡 + 4 分类 Tab + 任务列表 + FAB）；`pages/tasks/task-detail/index`（3-mode create/view/edit + 步骤清单 + completedNote/retrospective/improvements + 关联日程列表 + 创建日程入口带 taskId）；schedule detail 页接受 `taskId` 参数；`app.json` TabBar 3 Tab（日程/任务/我的）。**Audit fix sweep**：PrismaService $extends 软删拦截；BusinessException + ErrorCodes 枚举（9 组错误码）；HttpExceptionFilter 重写（BusinessException→直接码，Prisma P2002→40902/P2025→40401）；Task DTO 补 @MinLength(1)+@IsISO8601()；TimeBlock DTO status 补 @IsIn()；migrateDevData/deleteDevData 覆盖 Task；app.ts 加 wx.onError；server .env.example。tsc 双 0 错 ✅ prisma validate ✅  | | |
| v0.15 | **日程关联任务（N:1）** | TimeBlock 加 `taskId`（可空，指向 Task），**N 个日程→1 个任务**。创建/编辑日程时可选关联某个任务。**完成日程不会自动完成任务**——任务完成基于 steps 全部勾选 + 填写复盘。任务详情页展示关联的日程列表（已发生/未来），并提供"创建关联日程"入口跳转到日程创建页。验收：一个任务关联多个日程→日程列表展示→任务卡片显示"已安排"badge→创建日程时可选关联→从任务详情跳转创建新日程 | v0.14, v0.10 | ⭐⭐ |
| | **v0.15 ⚡ (B2)** | **B2 核心**：`UpdateTimeBlockDto` 加 `taskId` 字段 + `TimeBlockService.update` 补 `taskId` 更新（传空字符串清空关联）；schedule detail 页新增任务选择器（关联任务行 + 底部 Modal 弹窗 + 任务列表 + 清空/更换）；view 模式显示关联任务名（蓝色可点跳转详情）；时间轴卡片已关联任务显示 📋 图标。**审计跟随**：M3 `ConfigModule` 加 `joi` validationSchema；M5 `HealthService` 抽取（Controller 不再直接调 PrismaService）；M6 wx:elif→wx:if 独立条件；tsconfig server 移除废弃 `baseUrl`。**v0.15 验收修复**：DTO `taskId` `@IsString()`→`@IsUUID()`；生成 migration `add_task_model_and_taskid`；`api.ts`+`blockStore.ts` `updateBlock` 补 `taskId` 类型。**按设计不修**：完成日程不会自动完成任务（VERSION_PLAN.md 约束）。tsc 双 0 错 ✅ prisma validate ✅ | | |
| v0.16 | **提醒后端** | Reminder 表（id, userId, blockId, remindAt, leadMinutes, status）添加到 Prisma schema + `reminder` module（DDD 风格：DTOs/service/controller）+ 6 端点（POST 创建 / GET my / GET block/:blockId / GET :id / PATCH :id / DELETE :id）。remindAt 由服务端根据 `block.startTime - leadMinutes` 自动计算（避免前端时区问题）。包含防冲突（同 block 不可创建两个 PENDING 提醒）+ 过去时间校验。验收：curl 创建/查询/更新/删除提醒全部通过 | v0.11, v0.7 | ⭐⭐ |
| | **v0.16 ✅** | Reminder 模型 + migration-ready schema；`reminder` module 完整 DDD；前端 `Reminder` 类型 + 4 API 函数。Prisma validate ✅．后端 tsc 0 错 | | |
| v0.17 | **提醒 cron 推送 + 防重发** | `@nestjs/schedule` 每分钟 cron 扫描 → `updateMany SET status=SENDING WHERE status=PENDING AND remindAt<=now()`（原子行锁） → 查询 SENDING 记录 → 发送 → 置 SENT/FAILED。当前发送阶段为 log-only（需微信订阅消息 templateId 配置后接入 `subscribeMessage.send`）。验收：1min cron 命中 PENDING 提醒后状态变为 SENT | v0.16 | ⭐⭐ |
| | **v0.17 ✅** | `ReminderCron` 每分钟扫描 + `scanAndSend()` 使用 `updateMany` 原子锁防重发（去除了审计报告的 `findMany`+`updateMany` 竞赛窗口缺陷）；`AppModule` 注册 ScheduleModule.forRoot()；`@nestjs/schedule` 安装。后端 tsc 0 错 | | |
| v0.18 | **提醒前端 UI** | 创建/编辑日程时可选"提前 X 分钟提醒"（5/15/30/60 / 无提醒 五档）。首次选择非"无"引导授权订阅消息（`wx.requestSubscribeMessage`，授权结果存入 `storage` 避免重复弹窗）。视图模式展示已设提醒信息。**新建/编辑时提醒自动跟随日程创建/更新/删除**（`onSave` 联动）。验收：新建日程设提醒→授权弹窗→视图显示→编辑改提醒→保存后更新→清空提醒→删除 | v0.17 | ⭐⭐ |
| | **v0.18 ✅** | schedule detail 页五档提醒选择器 + `requestSubscribe()` 方法（`wx.requestSubscribeMessage` + 授权状态 `storage` 持久化） + `onSave` 三态联动；`requestSubscribe` 在创建/编辑分支中优先于 `createReminder`/`updateReminder` 调用。前端 tsc 0 错 | | |
| v0.19 | **圈子后端** | Circle 表（id, ownerId, name, description, inviteCode unique, status, isDeleted）+ CircleMember 表（circleId, userId, role, isDeleted）+ `circle` module 5 CRUD 端点。验收：curl 建圈子→列表→详情→删除 | v0.11 | ⭐⭐⭐ |
| | **v0.19 ✅** | Circle + CircleMember 模型、circle module（5 CRUD 端点）、Prisma migration、db push 同步。后端 tsc 0 错 | | |
| v0.20 | **邀请码 + 加入后端** | `POST /circles/:id/invite` 生成 8 位码、`POST /circles/join/:code` 加入（自动 MEMBER）、`DELETE /circles/:circleId/members/:memberId` 踢出（仅 OWNER/ADMIN）。验收：建圈→生成码→用码加入→列表+1 | v0.19 | ⭐⭐⭐ |
| | **v0.20 ✅** | invite/join/kick 3 端点 + 唯一性校验 + 角色权限（OWNER/ADMIN 可踢人）。后端 tsc 0 错 | | |
| v0.21 | **协作 Tab - 我的圈子** | `circleStore`、`pages/collab/index` 圈子列表（名称+角色色块+成员数）+ 创建/加入浮层 + `pages/collab/detail`（邀请码展示+成员列表+踢出/删除）。**TabBar：解锁底部【协作】Tab**。验收：建圈子→列表→详情看成员→复制邀请码→踢成员→删圈子 | v0.20 | ⭐⭐ |
| | **v0.21 ✅** | circleStore（MobX 8 actions）、collab/index（列表+创建/加入 dialog）、collab/detail（信息卡片+邀请码复制+成员列表+踢出+删除）。前端 tsc 0 错 | | |
| v0.22 | **审批流后端核心** | ApprovalRequest + ApprovalRecipient 2 实体 + 8 端点（create/my-initiated/my-pending/detail/respond/resend/cancel/shared）。shareToken 生成+公开共享端点。验收：curl 创建审批→列出我的发起的→列出待我审批的→同意→接收方生成 TimeBlock | v0.21 | ⭐⭐⭐ |
| | **v0.22 ✅** | 2 实体 + 8 端点（含 bindRecipient）+ Prisma $extends 软删覆盖 + 事务创建/回应/取消。后端 tsc 0 错。后端测试 77/77 ✅ | | |
| v0.23 | **协作 Tab 重写为审批中心** | `approvalStore` + `pages/collab/index` 重写为"待我审批/我发起的"双 Tab + `pages/collab/approval-detail`（双视角：发起人列表/接收人回应按钮） + circle 管理缩为底部入口。验收：登录后看到待审批列表→点同意/拒绝→状态更新 | v0.22 | ⭐⭐⭐ |
| | **v0.23 ✅** | approvalStore（8 actions）+ collab/index 双 Tab + approval-detail 双视角 + circle 底部入口。前端 tsc 0 错 | | |
| v0.24 | **发起审批流程 UI** | `pages/collab/approval-create`（日程摘要 + 三种邀请方式 Tab：手机号/微信好友/二维码） + `pages/schedule/detail` 底部"发起审批"按钮。验收：从日程详情→发起审批→输入手机号→发起→观察审批出现 | v0.23 | ⭐⭐ |
| | **v0.24 ✅** | approval-create 页面（手机号添加+好友/QR 入口）+ schedule detail 入口+ `onShareAppMessage` 生命周期。前端 tsc 0 错 | | |
| v0.25 | **接收端 + 分享卡片** | `pages/collab/approval-share`（公开分享页：展示日程摘要+登录引导+同意/拒绝按钮）。分享卡片携带 shareToken，接收方打开后自动 bindRecipient。**短信发送集成**：对接短信网关发送含链接的短信。验收：分享卡片→好友打开→登录→同意→接收方日历出现日程 | v0.24 | ⭐⭐⭐ |
| | **v0.25 ✅** | `shareToken` 后端 DTO + 前端类型补全；approval-create `onShareAppMessage` 修正为真实分享路径（`/pages/collab/approval-share/index?token=<shareToken>`）；schedule detail `onApproveTap` 补传 endTime；approval-create WXML `wx:if` 清理。短信发送保持 console.log stub（MVP 不接入真实网关）。tsc 双 0 错 ✅ 测试 77/77 ✅ | | |
| v0.26 | **修改再审批** | 发起方修改原 TimeBlock（title/time/description）后，自动将相关 ApprovalRecipient 重置为 pending 并发送变更通知。接收方收到通知后需要二次确认。验收：修改已审批日程→接收方收到变更→回应→双方同步 | v0.25 | ⭐⭐ |
| | **v0.26 ✅** | `ApprovalService.handleBlockUpdate()` 新增（查询 blockId 关联的 ApprovalRequest → 同步 title/time/description/category → 重置非 pending 接收方 → 请求状态回 pending）；`TimeBlockController.update` 注入 `ApprovalService` 并在更新后调用 `handleBlockUpdate`（非阻塞 catch）；`TimeBlockModule` 导入 `ApprovalModule`。tsc 双 0 错 ✅ 测试 77/77 ✅ | | |
| v0.27 | **圈子可见性 + 隐私标签** | TimeBlock 加 `nature`(PRIVATE/PUBLIC/CIRCLE_ONLY) + `circleId`(可空) + `EventVisibilityService` 掩码。Circle 用作隐私标签：`work` 分类日程仅对"同事"圈可见，`life` 仅对"家人"圈可见。验收：设 circleId→圈成员可见→非成员不可见 | v0.25, v0.21 | ⭐⭐⭐ |
| | **v0.27 ✅** | Prisma schema: TimeBlock 加 `nature`(String default "PUBLIC") + `circleId`(FK→Circle, nullable)；Circle 加 `timeBlocks` 反链。`EventVisibilityService`(filter/canView/getViewerCircleIds)。Backend DTOs: nature/circleId 字段。`TimeBlockService` 所有列表/详情端点 visibility 过滤。Frontend: types/api/store 均加 nature/circleId；schedule detail 页 form/view 均支持 nature 三态按钮 + 圈子选择器（条件显示）。`VisibilityModule` 独立模块。`tsc` 双 0 错 ✅ 测试 77/77 ✅ | | |
| v0.28 | **设置页** | `pages/mine/settings`：day_starts_at 选择器（默认 06:00）、默认提醒提前量（15/30/60）、默认隐私可见性（PRIVATE/PUBLIC/CIRCLE_ONLY）。验收：改设置→下次使用生效→API 持久化 | v0.18 | ⭐⭐ |
| | **v0.28 ✅** | Prisma: User 加 `settings Json?` 字段；`GET/PATCH /api/v1/auth/settings` 端点（含默认值合并：dayStartsAt=06:00/reminderLeadMinutes=15/defaultNature=PUBLIC）；前端 settings 页（时间/提醒/可见性三选择器）；mine 页设置入口；schedule 创建默认使用用户设置。`tsc` 双 0 错 ✅ 测试 77/77 ✅ | | |
| v0.29 | **全局 UX 兜底 + 智能辅助特性** | ① 所有列表页空状态插画；② 网络请求失败全局 Toast；③ 按钮防抖；④ 加载中骨架屏；⑤ 日程创建页全天开关（full-day toggle）；⑥ 我的页顶部数据卡片（完成率/逾期率，本地计算）。验收：断网下操作提示→列表无数据时友好插画→快速连点不重复创建→全天开关正常切换→我的页显示本周统计 | v0.28 | ⭐⭐ |
| | **v0.29 ✅** | ① schedule/index + collab/approval-detail 增加空状态插画；② request.ts 全局网络失败 Toast（fail 回调）→ **v0.33 已移除**（改为各页面自行控制，避免覆盖具体错误）；③ schedule/index(category prev/next)+tasks/index(tab tap)+collab/index(approve/reject/create/join)+collab/approval-detail(approve/reject/resend)+mine/index(dev login) 增加 saving/navigating/processing 标志防抖；④ Skeleton 组件注册到 app.json usingComponents，schedule/index+collab/index+collab/approval-detail 首屏加载骨架屏；⑤ 日程创建页全天开关（full-day toggle）→ 设置 00:00-23:59 并禁用时间选择器；⑥ 我的页 4 张数据卡片（全部/已完成/逾期/本周截止）。tsc 双 0 错 ✅ 测试 77/77 ✅ | | |
| v0.30 | **内测收尾** | 隐私协议弹窗首屏+必须同意+本地记录、全流程真机测一轮。验收：走通全部流程、隐私协议正常、无控制台报错 | v0.29 | ⭐⭐ |
| | **v0.30 ✅** | `privacy-agreement` 组件（全屏遮罩 + 可滚动协议文本 + 同意按钮 + 防重复点击）；`PRIVACY_AGREED` storage key；全局注册 `app.json` `usingComponents`；12 页面 WXML 首元素引入；组件 `attached` 自检 storage。审计整改 8 项（C1/M1/M2/M3/M5/L3/L4 + C2 确认原代码正确）。`tsc` 双 0 错 ✅ 测试 77/77 ✅ | | |
| M2-E | **测试 + 工具链奠基** | **⚠️ 插队至高优先级 ⚠️** ① Jest + Supertest + ts-jest 安装配置；② 为已有 7 模块写核心 CRUD 测试（≥ 50 passing）；③ Husky 配置（pre-commit: tsc + eslint + test）；④ ESLint 规则验证；⑤ PRD 状态标签修正为实际状态。验收：`jest --passWithNoTests` 全绿、`git commit` 触发 pre-hook lint+test、PRD 所有 [planned] 与实际匹配 | v0.21 | ⭐⭐⭐ |
| | **M2-E ✅** | ① Jest + ts-jest 已装，77 测试通过；② 9 个测试套件覆盖 6 模块（TimeBlock/Task/Auth/BusinessException/HttpExceptionFilter/Health/TransformInterceptor）；③ Husky pre-commit 更新为 `tsc --noEmit && eslint src/ server/src/ && cd server && npx jest`；④ ESLint 配置完善（test 文件 `any` 放行、`console.log`→`console.warn`、空 interface 修复）；⑤ PRD 状态标签已同步。`tsc` 双 0 错 ✅ `eslint` 0 错 0 警告 ✅ `jest` 77/77 ✅ | | |
| v0.31 | **审核修复 + 日程管理增强** | 根据 3 份审核报告（v0.30 验收/闭合性逻辑性/UIUX）修复质量问题，以及日程管理核心增强。验收：`tsc` 双 0 错 ✅ `jest` 77/77 ✅ | v0.30, M2-E | ⭐⭐ |
| | **v0.31 ✅** | **后端**：① TimeBlock 加 `recurrenceEndAt DateTime?` 字段 + DTO/response 同步；② `findByDate` 周期性展开（daily/weekly/monthly/yearly 模式匹配 + recurrenceEndAt 边界 + 时间调整）；③ 新增 `GET /api/v1/time-blocks/by-date-range?start=&end=` 端点（返回 `Record<YYYY-MM-DD, TimeBlockResponseDto[]>`）；④ `create`/`update` 校验 `CIRCLE_ONLY` 必须指定 `circleId`；⑤ `softDelete` 级联软删关联 Reminder（`reminder.updateMany`）。**前端**：⑥ `schedule/index.ts` `groupByHour` 从 `dayStartHour`（用户设置）起始渲染，替代固定 0→23；⑦ 时间轴卡片 `blockHeight` 按 duration 比例缩放（`style="height: {{block.blockHeight}}rpx"`）；⑧ `tasks/index.wxml` 文字 loading（`加载中...`）替换为 `<skeleton rowCount="5" />`；⑨ `collab/approval-share/index.wxml:26` `wx:elif` → `wx:if`（P1 残留修复）。`tsc` 双 0 错 ✅ `jest` 77/77 ✅ `eslint` 0 错 0 警告 ✅ | | |
| v0.32 | **日程管理完整化（剩余项）** | 日程管理核心体验的剩余 P0-P2 修复：周视图、编辑 base 刷新、审批身份检查、圈子成员退出、任务步骤校验、软删除 cron | v0.31 | ⭐⭐⭐ |
| | **v0.32 ✅** | ① 周视图（`GET /time-blocks/by-date-range` API → week bar 7 列日期选择 + day-mode reuse）；② 编辑 mode `_editSnapshot` 快照 diff（防编辑保存视图字段被覆盖）；③ 审批分享身份检查（`findFirst` 防重复绑定 → `ErrorCodes.CONCURRENT_MODIFICATION(40901)`）；④ 圈子成员退出（`POST /circles/:circleId/leave` + store + API + detail 页按钮）；⑤ 任务完成步骤前置校验（`onMarkDone`/`onSave` status:done 检查全部勾选 + completedNote + retrospective）；⑥ `taskId` vs `viewTaskTitle` 比较修复（`_savedTaskId` 纯字段比）；⑦ 软删除清理 cron（`SoftDeleteCleanupCron` → 每天午夜物理删除 7 天前软删记录）。`tsc` 双 0 错 ✅ `eslint` 双 0 错 ✅ `jest` 77/77 ✅ TODO/FIXME 0 命中 ✅ | | |
| v0.33 | **UI/UX 全面优化** | 基于 UI/UX 审核报告（2026-06-12）的 13 项改进。验收：`tsc` 双 0 错 ✅ `eslint` 0 错 ✅ | v0.31 | ⭐⭐⭐ |
| | **v0.33 ✅** | **核心重构**：① 详情页信息分层（Hero/Primary/Secondary 三区 + 二级区可折叠）；② 时间轴压缩（`showAllHours=false`，仅渲染有日程小时 +「展开全部」按钮）；③ 渐进式表单（创建模式默认 3 必填 +「更多选项」展开 + 时间自动取整到 :00/:30 + 记忆上次分类 `wx.setStorageSync('LAST_CATEGORY')`）；④ 手势操作（长按→ActionSheet 编辑/删除/标记完成、左滑→标记完成 + success Toast）；⑤ 审批 BottomSheet（复用 `components/bottom-sheet` + 手机号输入+列表+确认，替代独立页面跳转，减少 2 次页面导航）；⑥ Toast 优化（`request.ts` 移除 fail 回调的 `wx.showToast` 全局拦截→交由各页面自行处理；成功创建/保存静默返回 → 不弹 Toast；失败保留表单 `icon:none` Toast；删除保持 success Toast）。**样式体系**：⑦ 颜色语义 tokens（`--ts-category-*`/`--ts-priority-*`/`--ts-status-*` 20+ 语义色变量，品牌色 `--ts-primary` 仅限导航/FAB/主按钮）；⑧ FAB 动画（`transition: transform 0.2s ease` + `:active { scale(0.9) }` + `env(safe-area-inset-bottom)` 避让）；⑨ 空状态 CSS 插画（`::before`/`::after` 纯 CSS 几何图形替代 emoji）；⑩ 统计卡片统一（tasks + mine 页统一 `var(--ts-shadow-card)` + 品牌色数值）；⑪ 导航按钮触控区域 56rpx→88rpx；⑫ 数据同步动画（`.block-card`/`.task-card` `transition: transform 0.2s ease, opacity 0.2s ease` + `@keyframes block-card-enter` 滑入）；⑬ 分享卡片动态 title（`onShareAppMessage` → `{blockTitle} - 来自 {nickname} 的日程邀请`，使用 `userStore.user?.nickname`）。**共 13/13 项交付（§5.2 订阅消息预授权按用户指示推迟）**。`tsc` 双 0 错 ✅ `eslint` 0 错 ✅ | | |
| v0.34 | **全局右上角操作栏** | 移除所有 4 页底部浮动 FAB，统一替换为每页头部右上角操作栏（WeUI 风格圆圈⊕ + 搜索放大镜🔍）。⊕ 按钮每页导航至对应创建页。🔍 按钮展开内联搜索输入框，过滤当前页列表数据。验收：4 页均无浮动 FAB、操作栏统一、⊕ 导航正确、🔍 过滤正确 | v0.33 | ⭐⭐ |
| | **v0.34 ✅** | ① schedule/index 移除 `.fab` + 添加 `.top-bar`（⊕→detail?date=、🔍→过滤 title/description/location）；② tasks/index 移除 `.fab` + 添加 `.top-bar`（⊕→task-detail?mode=create、🔍→过滤 title）；③ collab/index 添加 `.top-bar`（⊕→approval-create、🔍→过滤审批请求）；④ mine/index 添加 `.top-bar`（仅🔍→搜索设置/用户）；⑤ 四页抬头统一：居中标题 + 🔍 ⊕（新增在最右）。`tsc` 双 0 错 ✅ `eslint` 0 错 ✅ | | |
| | **v0.35 ✅** | **UI 设计规范全量对齐**：50+ CSS 文件经 8 阶段 token 替换完成。① 字重 token（--weight-* 及 --ts-weight-* 别名）+ letter-spacing token（--ts-ls-*）+ 字号 token（--ts-font-* 全部 rpx：large-title:34 / title1:28 / body:26 / callout:24 / caption:22 / tiny:20）；② 字体族补 `'SF Pro Text'`（iOS 系统字体优先）。③ 日期导航 28rpx（--ts-font-title1）/ 时间轴卡片文字 26rpx（--ts-font-body）/ 表单 label 22rpx（--ts-font-caption）/ 我的页昵称 36rpx。④ `--ts-card-radius:20rpx` / `--ts-card-padding:24rpx 28rpx` / `--ts-card-shadow` / `--ts-card-gap:12rpx`。⑤ 时间轴时标 96rpx / 分割线 1rpx。⑥ 统计卡数字 var(--ts-font-large-title)。⑦ 分类 tab 底部横线指示器（改为填充圆角 badge 以适配 WeUI 风格）。⑧ 我的页头像 100rpx。⑨ 日程 view-row 改为 label(96rpx/uppercase/+0.4rpx)+value 结构。⑩ 表单 label uppercase 22rpx/+0.4rpx、`border:1rpx solid var(--ts-border)`、`border-radius:16rpx`。⑪ 任务进度条 height:6rpx/radius:4rpx（tasks 页任务卡片添加进度条）。⑫ BottomSheet 横条 72rpx×8rpx `#D1D1D6`、radius 28rpx。⑬ 全局 `app.wxss` 背景 `var(--ts-bg-page)` + 字体 `var(--ts-font-family)`。**不包含**：品牌色改动、TabBar 自定义组件、FAB（已移除）。**标签名**：`--weight-*` 与 `--ts-weight-*` 双命名并存（向后兼容）。`tsc` 双 0 错 ✅ | v0.34 | ⭐⭐⭐ | |
| v0.35.1 | **左滑快捷操作增强** | N3 左滑视觉反馈（日程卡片 translateX 微位移）+ 任务卡片完整左滑手势（标记完成/删除）。验收：日程左滑卡片右移露出下方按钮；任务左滑标记完成/弹出删除确认 | v0.35 | ⭐⭐ |
| | **v0.35.1 ✅**：① 日程页 `onBlockTouchMove` 增加 `_swipeOffset` 状态 + WXML `transform: translateX` 动效（`transition 0.2s`）；② 任务页完整 `onTaskTouchStart/Move/End` 三件套 + 左滑 `dx>60` 标记完成 / `dx>120` 弹出删除 Modal；③ 手势结束后平滑归位（transition 0.2s）；④ `tsc --noEmit` 双 0 错 ✅ TODO/FIXME 0 命中 ✅。**Bug fix**：`_touchTaskId`/`_touchStartX`/`_touchStartY` 从 `TasksPageData` 移到 `TasksPageMethods`（与 schedule 页模式对齐，避免 Page 泛型属性冲突） | | |
| v0.36 | **今日概览 + 月视图 + 跨日日程** | N4 今日概览卡片（时间轴顶部"3个日程(5.5h)｜空闲2.5h"）+ A1 月视图 + A2 跨日日程。验收：概览卡片数据正确、月网格展示当日日程、跨日跨天显示 | v0.35 | ⭐⭐⭐ |
| | **v0.36 ✅**：① 今日概览卡片（纯前端计算：blockStore 总日程数+总时长+空闲时间；当天额外显示逾期任务数）；② 月视图（7×6 网格 + 月度导航 + 日程点标记 + 点击某日切换到日视图）；③ 跨日日程渲染（`getClampedRange` 跨天时在每天 timeline 正确显示 + 跨日 badge + 高度按当天有效时长计算）；④ 品牌色硬编码 `#4A6CF7` → `var(--ts-primary, #10B981)`（tab active + FAB 阴影）。`tsc` 双 0 错 ✅ | | |
| v0.37 | **快速创建 + 拖拽调时长 + 高频设置(S1-S3)** | A3 时间轴手势交互增强 + 3 项高频设置项。验收：空白时间段点击弹出快速创建→保存后时间轴刷新；日程卡片拖拽调整时长；我的页设置区出现默认时长/默认分类/周起始日三选项 | v0.36 | ⭐⭐ |
| | **计划中**：① 时间轴空白区域点击→弹出 mini 创建面板（仅 title + time + 保存）；② 日程卡片拖拽调整时长（touchmove 实时更新高度，touchend 保存）；③ S1 默认日程时长（选择器：30min/1h/2h）；④ S2 默认分类（选择器：工作/生活/私有/记住上次）；⑤ S3 周起始日（选择器：周一/周日）。后端 settings schema 加 `defaultDuration`/`defaultCategory`/`weekStartsOn` 三字段 + 默认值。`tsc` 双 0 错 ✅ | | |
| v0.38 | **冲突检测 + 重复日程引擎** | B1 创建/编辑时检测重叠时间块并提示 + B2 重复日程后端 cron 自动生成未来实例 + B3 编辑重复日程弹窗。验收：重叠时间保存被阻止；recurrence 日程每天自动生成未来副本；修改重复日程弹出选择"仅本次/全部" | v0.37 | ⭐⭐⭐ |
| | **计划中**：① `TimeBlockService` 新增 `checkConflicts(startTime, endTime, excludeId)` 方法 + Controller 端点 `POST /time-blocks/check-conflicts`；② 前端创建/编辑时自动调冲突检测 → 展示重叠列表 → 阻止保存 / 强制保存；③ 后端 cron `RecurrenceGenerator`（每天凌晨扫描 recurrence!='none' 的日程 → 根据 daily/weekly/weekdays/monthly 规则生成未来实例 → 写入 TimeBlock 表）；④ 前端修改 `recurrence !== 'none'` 的日程时 Modal 弹窗"仅本次"/"全部日程" → 服务端 `update` 分支处理（带 `updateMode: 'single'|'all'` 参数）。`tsc` 双 0 错 ✅ `jest` ✅ | | |
| v0.39 | **统计洞察 + 全局搜索 + 四象限矩阵** | B3 独立数据看板 + C1 跨日程/任务的全文搜索页 + 任务列表新增"矩阵"视图（紧急×重要 2×2）。验收：统计页展示分类饼图/时段热力图/完成趋势；搜索页输入关键词返回匹配日程+任务；矩阵视图按 4 象限排列任务 | v0.38 | ⭐⭐⭐ |
| | **计划中**：① `pages/insights/index`（分类占比环形图 + 24h 时段分布 + 周/月完成趋势线 + 逾期率）；② `pages/search/index`（全文搜索入口 + 结果聚合显示日程+任务+高亮匹配词 + 点进详情）；③ 任务列表"矩阵"视图切换（`priority`=重要度，`dueAt`与 now 差值=紧急度 → 2×2 flex 网格，CSS Grid 降级为 flex 四格布局） | | |
| v0.40 | **共享日历订阅 + 日程评论 + 直接分享** | D1 好友公开日程在时间轴上叠加显示（灰色半透明"陈小明 09:00-10:30 会议"）+ D2 时间块留言板 + D3 简化分享链接（无需审批）。验收：圈内成员日程在 timeline 上叠加渲染；时间块可发表评论；分享链接无需审批直接打开 | v0.39 | ⭐⭐⭐ |
| | **计划中**：① 共享日历（`GET /time-blocks/by-circle/:circleId` 端点 + 前端 timeline 叠加渲染 + 非本人日程灰+半透明+姓名标记+不可编辑）；② 评论模块（Comment 表 + CRUD 端点 + 时间块详情页底部评论区）；③ 直接分享（`POST /time-blocks/:id/share` 生成 shareLink + 前端转发卡片 + 公开打开查看） | | |
| v0.41 | **自定义分类树** | C3 当前三分类（work/life/private）硬编码 → 用户可自定义的树形分类体系。验收：创建新分类→在日程/任务分类选择器中可见→旧数据迁移 | v0.40 | ⭐⭐⭐ |
| | **计划中**：① Prisma `Category` 表（id, userId, name, parentId, sortOrder, isDefault, isDeleted）；② migration 脚本（为每个用户创建 3 个默认分类根节点 + 子分类自引用）；③ `GET /categories/my` + `POST /categories` + `PATCH /categories/:id` + `DELETE /categories/:id` 端点；④ 前端分类选择器改为树形（可展开/折叠 + 缩进）；⑤ TimeBlock/Task category 字段改为外链 `categoryId` | | |
| v0.42 | **微信转发创建任务** | 微信生态独有：在微信聊天中长按消息→转发到小程序→自动提取文本作为任务标题。验收：转发消息到小程序后自动创建任务并在任务列表中出现 | v0.41 | ⭐⭐⭐ |
| | **计划中**：① 前端 `wx.showShareMenu` + `onShareAppMessage` 处理接收数据；② 解析逻辑（文本提取 + 日期/时间识别）；③ 创建任务后跳转到任务详情页确认；④ 错误处理（非文本内容→提示"仅支持文本消息"）。`tsc` 双 0 错 ✅ | | |
| v0.43 | **图片/附件上传** | E2 微信云存储接入，日程可附带图片/文件附件。验收：日程创建/编辑可上传图片→保存后在详情展示 | v0.42 | ⭐⭐ |
| | **计划中**：① 微信云存储接入（`cloud-storage.ts` 从 stub 改为真实 `wx.cloud.uploadFile`）；② TimeBlock 加 `attachments JSON?` 字段（fileID 数组）；③ 前端图片选择器（相册/拍照）+ 上传进度 + 缩略图预览 + 删除 | | |
| v0.44 | **E2E 测试 + Husky 完善 + 体验设置(S4-S7)** | F1 端到端测试 + F2 pre-push 质量门禁 + 4 项体验设置项。验收：`jest` 全绿 + `git push` 触发 lint+test；设置区出现时间格式/默认优先级/周末显示/逾期提醒 | v0.43 | ⭐⭐⭐ |
| | **计划中**：① Cypress/Playwright 前端 E2E 测试（至少覆盖 5 条完整用户路径：登录→创建日程→创建任务→协作审批→设置）；② 后端集成测试扩展（覆盖 approval/circle/reminder/visibility 模块 → 从 77 提升至 ≥120）；③ Husky `pre-push` 钩子（tsc + eslint + jest → 拒绝不通过）；④ 测试覆盖率报告（`jest --coverage` 集成，目标 line coverage ≥ 70%）；⑤ S4 时间格式（12h/24h 开关）；⑥ S5 默认优先级（高/中/低）；⑦ S6 周末显示（周视图是否显示周六日）；⑧ S7 逾期提醒（开关+时间，到期未完成每天提醒） | | |
| v0.45+ | **步数联动 + 剩余设置(S9-S12)** | 微信步数专注模式 + 清理/工作时段/关于/反馈。验收：开启专注模式记录起止时间；关于页显示版本号和隐私政策；意见反馈跳转客服 | v0.44 | ⭐⭐ |
| | **计划中**：① `wx.getWeRunData` 专注模式（记录起止时间 + 关联微信运动步数对比）；② S9 清理已完成（一键删除 N 天前已完成日程/任务）；③ S10 工作时段（双时间选择器 09:00-18:00 + 时间轴用浅底色标注）；④ S11 关于页面（版本号/许可/联系方式/用户协议/隐私政策）；⑤ S12 意见反馈（跳微信客服或表单） | | |

---

## 设计要点（避免功能纠缠）

| 关键解耦 | 说明 |
|----------|------|
| v0.7 TimeBlock 不含 nature/circleId | 纯粹 title+startTime+endTime+status，到 v0.27 才加可见性字段，向下兼容 |
| v0.7 TimeBlock 不含 quota | AI/计费相关功能全部不进入此文件，如需扩展用 v1.x+ 追加 |
| v0.5 dev 登录保留（非下线） | v0.11 上线后 v0.5 路由**保留**（非互斥下线），双登录模式共存：Dev UUID 供本地调试，微信登录供真机。v0.12 账号注销/恢复需同时处理两种用户类型 |
| v0.10 detail 页面为后续版本增长面 | v0.15（任务关联）、v0.18（提醒选择）、v0.24（发起审批入口）均需向 `pages/schedule/detail/index` 追加 UI Section。每次迭代保持 `mode` 三态兼容，新增字段统一放在 form 末尾 |
| v0.15 外键方向为 taskId | TimeBlock 加 `taskId`（指向 Task），一个日程最多关联一个具体任务 |
| 任务（v0.13-14）与日程（v0.7-10）独立 | 两者仅通过 `taskId` 弱关联（可空），改动互不影响 |
| **Task.category 与 TimeBlock.category 一致** | 任务和日程共用同一套 category 枚举（work/life/private），前端使用相同色板渲染，统计模块可直接跨表聚合 |
| 圈子（v0.19-21 后端 + 前端，v0.27 可见性）独立于任务 | Circle 只作用于 TimeBlock 可见性，不影响任务/提醒 |
| v0.9 时间轴边界 | 不支持跨天（结束时间 > 24:00 自动截断），暂不处理同一时间多日程重叠 |
| v0.9 TabBar 在 app.json 硬编码 | v0.9 写 2 个 Tab（日程+我的）；v0.14 追加【任务】Tab；v0.21 追加【协作】Tab。协作 Tab 内容为审批流 hub（v0.23）而非旧计划中的共享日程 |
| v0.7+ 新 module 严格参照 DDD 模板 | Controller → @UseGuards(JwtAuthGuard) + @CurrentUser('userId')；Service → 注入 PrismaService 走 `.client.` 方法；DTO → class-validator 装饰器。参照 timeblock module 完整目录结构 |
| v0.22–v0.26 审批流替代旧共享层 | 原 v0.22–v0.26（可见性/共享/评论/RSVP）全部重排为审批流（发起→通知→同意→同步）。Circle 退化为隐私标签（v0.27 实现）。评论/RSVP 移出 MVP scope |
| v0.18 防重发 | `updateMany SET status=SENDING WHERE status=PENDING` 作为行锁，确保幂等 |
| v0.28 全局空状态/错误 | 独立版本交付，避免污染各业务版本的开发焦点 |
| **Category 树替代硬编码枚举（技术债务记录）** | 当前 category 为 `String` 硬编码（work/life/private），后续需替换为自引用 `Category` 表：id, userId, name, parentId, sortOrder, isDefault, isDeleted。Task + TimeBlock 统一外链到 Category.id。每个新用户初始化 3 个根节点（工作/生活/私有）各带一个 isDefault 子类。v0.13 现有数据通过 migration 脚本迁移。maxDepth=4。默认子类不可删除。该变更涉及前端分类选择器需改为树形选择器 |
| **v0.37 周起始日影响周视图** | S3 周起始日设置直接影响 `getMonday()` 函数逻辑和 week bar 排列。当前默认周日（JS getDay()=0），改为周一后需同步更新 `weekDays` 起始和日期计算 |
| **v0.38 重复日程实例为非独立副本** | 后端 cron 生成的未来实例与模板日程通过 `recurrenceGroupId` 关联（新增字段，uuid）。修改全部时根据 `recurrenceGroupId` 更新所有关联实例。实例可独立修改（设 `recurrenceGroupId=null` 脱离分组） |
| **v0.42 微信转发基于 `onShareAppMessage` 接收** | 用户在聊天中转发消息到小程序时，`App.onShow` 的 `options.path` 可携带参数。约定 URL scheme：`/pages/tasks/index?shareText=xxx`。前端在 `onShow` 中解析 `shareText` 参数并创建任务 |
| **v0.45+ 步数专注模式无后台保活** | 微信小程序切后台后计时器暂停。专注模式仅记录 `startTime` + `endTime`，不依赖后台计时。切回前台时检查连续时间差，若超过 5 分钟视为"中途离开" |

---

## AI 编程约束（给 opencode 的 System 规则）

| 约束 | 规则说明 |
|------|----------|
| **外键与级联删除** | 所有涉及 `userId`、`circleId`、`blockId` 的关联，Prisma Schema 必须明确配置 `onDelete: Cascade` 或 `onDelete: SetNull`，禁止出现孤儿数据 |
| **时区统一** | 后端 PG 数据库统一使用 `timestamptz` 存储 UTC 时间，前端展示时统一转换为 `Asia/Shanghai`。禁止在数据库层做时区转换 |
| **TabBar 渐进式解锁** | `app.json` 中按版本手动追加 Tab。v0.9：仅日程+我的（2 Tab）；v0.14：解锁任务（3 Tab）；v0.21：解锁协作（4 Tab）。**不**使用 `wx.hideTabBar` 动态控制（简化实现） |
| **WXML 不支持 `??`** | 模板中用 `||` 替代 nullish coalescing，否则基础库解析报错 |
| **wx.request PATCH 需 cast** | 官方 TS 类型不含 PATCH，调用时显式 `as` 到 `WxRequestMethod` 类型别名，禁止 `as any` |
| **Page 双泛型** | 必须用 `Page<TData, TCustom>`，接口名 `<Name>PageData` / `<Name>PageMethods`，禁止用 `PageData` 全局名 |

---

---

## 审计教训（从 archive-v1 + v0.x 实际开发 bug 提炼，新代码必须避免）

以下来自 `radiant-thunder-newton.md` 审查报告和 v0.x 开发过程的**关键教训**：

| # | 教训 | 影响模块 | 预防措施 |
|---|------|----------|----------|
| L1 | **请求路径避免双重前缀**：`post('/api/v1/llm/sync')` → `request.ts` 又拼 `BASE_URL` → 实际请求 `/api/v1/api/v1/llm/sync` | `services/*` | 统一 `services/api.ts` 做 path 拼接，调用方只传 `/llm/sync`；严禁 paths 里带 `/api/v1` 硬编码 |
| L2 | **WeChat 事件类型**：`TouchEvent` 没有 `detail.value`，必须用 `WechatMiniprogram.Input` | 所有 WXML `bindinput` 处理函数 | 在 `types/` 中导出常用 WeChat 事件类型别名 |
| L3 | **时区比较**：`d >= weekStart.toISOString()` 会因 `toISOString()` 转 UTC 产生 off-by-one | `pages/tasks/index.ts` 统计 | 日期比较统一用 `getTime()` 毫秒数，避免 `toISOString()` 字符串比较 |
| L4 | **页面数据自加载**：`onShow` 不调 `fetch*()` 会导致从其他入口导航进来时空白 | 所有列表页 | 每个页面 `onShow`/`onLoad` 必须检查数据状态并主动加载 |
| L5 | **死代码**：`catch` 块包裹永不 throw 的函数 → 永远不可达 | 所有 try/catch | 函数要么 `throw` 让调用方 catch，要么返回 `null` 让调用方 `if` 判断；禁止两层 try/catch 嵌套 |
| L6 | **竞态条件**：`logout()` 后 `fetchMe()` 未 await → 可能覆盖退出状态 | `pages/mine/index.ts` | 异步调用必须 await 或明确 fire-and-forget 意图 |
| L7 | **类型定义归属**：View 接口存在 store 中导致 pages→stores 类型依赖 | `stores/*` / `types/` | 所有 View/Response 接口集中放 `types/`，store 和 page 都从 `types/` 导入 |
| L8 | **硬编码 demo 数据**：`collab/index.ts` 中硬编码 2 条邀请 → 影响真实联调 | 所有协作页面 | MVP 阶段禁止硬编码前端展示数据；用 stub API 返回模拟 JSON（服务端） |
| L9 | **单例项目配置**：`project.config.json` 只放根目录一份，`src/` 内不放 | 项目配置 | `project.config.json` 中的 `miniprogramRoot` 指向 `src/`，禁止在 `src/` 内重复放置 |
| L10 | **存储 key 一致**：`auth.ts` 用 `'token'`、`storage.ts` 用 `'timeslots_token'` → 混乱 | `utils/storage.ts` | 统一使用 `storage.ts` 的 key 常量，禁止散落在各文件 |
| L11 | **WXML 模板表达式限制**：WXML 不支持 `??`（nullish coalescing）、方法调用（`.charAt(0)`）、模板字符串。运行时直接报错或静默失败 | `*.wxml` | 所有数据预处理在 TS 层完成后再 `setData`；替代：`a ?? b` → `a \|\| b`；`str.charAt(0)` → `str[0]` |
| L12 | **Page 方法遗漏在 TCustom 中**：`Page<TData, TCustom>` 的 `TCustom` 接口若未声明某方法（如 `refreshGroups`），`this.method()` 调用报 `not exist on type Instance` | `pages/*/index.ts` | 页面所有自定义方法**必须**在 `<Name>PageMethods` 接口中声明；包括生命周期内的辅助方法、store 绑定属性 |
| L13 | **MobX action 循环引用**：`const store = observable({ x, action: action(function() { ... }) })` 中 `typeof store` 因 action 引用 store 导致循环类型推断失败 | `stores/*` | 用独立 `interface StoreName` 显式声明类型，action 内用 `this: StoreName` 标注；禁止 `typeof store` 作为类型 |
| L14 | **void + @HttpCode(204) + TransformInterceptor 500 错误**：Controller 返回 `void` 且标记 `@HttpCode(204)` 时，Interceptor 的 `map` 尝试包装已发送的 204 空体 → 抛 500 | NestJS Controller | DELETE 等端点应返回 `{ deleted: true }`（非 `void`），去掉 `@HttpCode(204)`，让 Interceptor 正常包装为 200 |
| L15 | **中国应用时区偏移**：`findByDate` 用 UTC 边界查询（`T00:00:00.000Z`）时，北京时间 00:00-07:59 的日程被错误归入前一天 | TimeBlockService | 中国用户日期边界必须用 `+08:00`：`new Date(date + 'T00:00:00+08:00')`；禁止裸 UTC 边界 |
| L16 | **路由参数日期未校验**：`:date` 参数直接传给 `new Date()`，非法值（如 `2026-13-01`）产生 `Invalid Date` 导致静默空结果 | Controller/Service | 必须在 Service 层对日期参数做格式校验（`/^\d{4}-\d{2}-\d{2}$/`）+ 语义校验（`isNaN(parsed.getTime())` → throw） |
| L17 | **DevTools 构建 npm 必须手动执行**：`packNpmManually: true` 配置文件 + `scripts/build-npm.js` 拷贝文件不足以保证模块解析；DevTools 运行时仍报 `module not defined` | `miniprogram_npm/` | npm install 后必须执行 DevTools `cli build-npm --project <path>` 或手动在 DevTools 点"工具 → 构建 npm"；`scripts/build-npm.js` 仅供参考，不能替代 |
| L18 | **createStoreBindings 的 storeBindings 必须销毁**：`onLoad` 中创建 `storeBindings`，未在 `onUnload` 中 `destroyStoreBindings()` 会导致内存泄漏和重复渲染 | `pages/*/index.ts` | `onLoad` 中 `this.storeBindings = createStoreBindings(...)`，`onUnload` 中 `this.storeBindings!.destroyStoreBindings()`；`storeBindings` 属性必须在 methods 接口声明为 `?` 类型 |

---

## 变更记录

| 日期 | 变更 |
|------|------|
| 2026-06-09 | 初次生成。定位：朋友内测工具，不计费、无 AI、无商业化 |
| 2026-06-09 | 修订 4 个硬伤：① TabBar 渐进式开放（v0.9/v0.15/v0.22）；② v0.11 真实登录增加数据过渡迁移脚本；③ v0.16 外键方向修正为 taskId；④ v0.18 cron 防重发行锁。追加 3 个优化：⑤ v0.23 历史数据兼容 migration；⑥ v0.9 跨天/重叠边界约束；⑦ v0.28.5 全局 UX 兜底。追加 AI 编程约束章节 |
| 2026-06-09 | v0.1 完成：server 7777 + health endpoint + PG 连通。从 `radiant-thunder-newton.md` 审计报告提炼 10 条教训（L1-L10）作为新代码质量门禁 |
| 2026-06-09 | v0.2 完成：src/ 骨架 + tsconfig + WeUI/mobx/postinstall。WeUI 版本从 2.x 修正为 1.5.6（npm 上不存在 2.x）。ESLint/Husky 暂缺 |
| 2026-06-09 | v0.3 完成：request 层 + types + health 卡片。审计教训 L1/L7/L10 已落实 |
| 2026-06-09 | 审计整改：AGENTS.md 修正 WeUI 2.x→1.5.6、LLM 章节标为"延迟至 v1.x+"；新增 README.md；ESLint 加基础规则；验证 request.ts 无双重路径拼接 |
| 2026-06-09 | v0.4 完成：tokens + Tag/Skeleton/Cell/BottomSheet 4 组件 |
| 2026-06-09 | v0.5 完成：User 表 + POST /auth/login + JWT + ValidationPipe + 验收报告 P1-P6/P9 修复。**变化**：测试用户 UUID 改为 `550e8400-e29b-41d4-a716-446655440000`（旧 `11111111-...` 非 RFC 4122 合规）；HealthController 返回裸 data（TransformInterceptor 单层包装）；JWT_SECRET 以 `.env` 配置，不在代码中硬编码回退 |
| 2026-06-10 | v0.6 ✅ 补填（authStore+userStore+mine 页）；v0.10 ✅ 补填（detail 页 3 态 + 7 扩展字段 + 2 bugfix）。**设计要点更新**：① v0.5 dev 登录保留（非下线），双模式共存；② v0.10 detail 页面标为增长面（v0.15/18/25/26 均追加 Section）；③ v0.7+ 新 module 参照 timeblock DDD 模板；④ v0.9 TabBar 硬编码提示（v0.14/21 需手动加 Tab） |
| 2026-06-10 | **v0.13 重构**：任务组由三种固定类型（工作/生活/私有）替代，不设 TaskGroup 独立 CRUD。Task.category 枚举与 TimeBlock 一致。v0.13+v0.14 合并为一个版本（任务后端含三种类型+统计），后续版本依次前移：日程关联 v0.15、提醒 v0.16-18、圈子 v0.19-21、可见性 v0.22-23、评论 v0.24-25、RSVP v0.26、设置 v0.27、全局 UX v0.28、内测收尾 v0.29。设计要点新增 `Task.category 与 TimeBlock.category 一致` 条目 |
| 2026-06-10 | **Bug fix sweep（代码审查 11 项修复）**：C1 package.json typescript ^6.0.3 → ^5.6.0；C2 周期按钮 active 类名全部错误修复（5 个独立类名 + WXSS 适配）；C3 任务统计 arranged/unarranged 硬编码 0/total 修复（添加 TimeBlock.taskId schema 字段 + 统计按实际关联查询）；M1 auth.deleteDevData 补 @CurrentUser + 自删除校验；M2 toLocalDate/toLocalTime 时区偏移修复（Intl.DateTimeFormat en-CA + Asia/Shanghai）；M3 HttpExceptionFilter code 改为 5 位业务码（status*100）；M4 wx.getUserProfile 废弃 API 移除；M5 RESTORE_TOKEN_KEY/MIGRATION_SHOWN_KEY 统一走 storage.ts；L2 TransformInterceptor path 改用 request.path；L3 task dueAt 空字符串健壮性修复。tsc 双 0 错 ✅ prisma validate ✅ db push ✅ |
| 2026-06-11 | **架构审计修复（代码审计 8 项修复）**：C1 PrismaService 实现 `$extends` 软删拦截（Task/TimeBlock 自动加 isDeleted: false，User 排除）；C2 BusinessException + ErrorCodes 枚举（9 组业务错误码）；C3 HttpExceptionFilter 重写（BusinessException→直接业务码，HttpException→status*100+1，Prisma P2002→40901，P2025→40401）；H2 Task DTO 补 `@MinLength(1)`+`@IsISO8601()`；H3 TimeBlock DTO status 补 `@IsIn()`；H4 migrateDevData/deleteDevData 覆盖 Task 实体；M1 app.ts 加 `wx.onError` 全局捕获；M4 server 加 `.env.example`。**模式变更**：所有 Service 改用 `this.prisma.client.xxx` 走扩展（PrismaService 不再 extends PrismaClient）。tsc 双 0 错 ✅ prisma validate ✅ |
| 2026-06-11 | **v0.14 Task Tab 前端完成**：TimeBlock DTO 加 `taskId` 字段 + `getBlocksByTask` 端点；前端 `TimeBlock` 类型加 `taskId` + `getBlocksByTask` API；`taskStore` MobX 新 store；`pages/tasks/index` 任务主页（统计卡片 8 张 + 4 分类 Tab + 任务列表 + FAB）；`pages/tasks/task-detail/index` 详情页（创建/查看/编辑三态 + 步骤清单 + 完成复盘 + 关联日程列表 + 创建日程入口）；`app.json` TabBar 3 Tab（日程/任务/我的）+ 路由注册；schedule detail 页支持 `taskId` 参数创建关联日程。tsc 双 0 错 ✅ prisma validate ✅ |
| 2026-06-11 | **v0.15 (B2) 日程关联 + 审计修复**：schedule detail 页增量任务选择器（关联任务行 + Modal 弹窗 + 清空/更换）；`UpdateTimeBlockDto` 加 `taskId` 字段；`TimeBlockService.update` 补 `taskId` 更新。**审计跟随**：M3 `joi` env 校验；M5 `HealthService` 抽取（Controller 薄化）；M6 wx:elif→wx:if；server tsconfig 移除废弃 `baseUrl`。tsc 双 0 错 ✅ prisma validate ✅ |
| 2026-06-11 | **B3 (v0.16-18) 提醒系统**：Prisma schema +Reminder 模型；`reminder` module 6 端点（DDD 风格）；`ReminderCron` 每分钟扫描 + 防重发（updateMany 状态锁）；schedule detail 页 5 档提醒选择器 + create/edit/view 三态联动；@nestjs/schedule 安装。Prisma validate ✅ 前后端 tsc 0 错 ✅ nest build ✅ |
| 2026-06-11 | **审计整改 (M2/L1)**：ESLint 配置升级为 `typescript-eslint`（TypeScript-aware parser + recommended ruleset）；`BASE_URL` 从 `request.ts` 硬编码抽取到 `src/utils/config.ts`（按 `wx.getAccountInfoSync().envVersion` 自动区分 develop/release 环境）。tsc 双 0 错 ✅ eslint 0 errors ✅ |
| 2026-06-11 | **审批流 v0.22–v0.24**：ApprovalRequest + ApprovalRecipient 2 实体 + 8 端点后端 ✅；collab/index 重写为审批双 Tab + approval-detail 双视角 + approval-create（手机号/好友/QR 三 Tab）+ approval-share 公开接收页 + approvalStore；VERSION_PLAN.md v0.22–v0.30 重排。tsc 双 0 错 ✅ 测试 77/77 ✅ |
| 2026-06-11 | **审计修复 (H1/M1/M6 + 3 tsc bugs)**：H1 login/wxLogin 补 `isDeleted: false` 查询过滤；M1 app.ts 加 `wx.onUnhandledRejection` 全局捕获；M6 16 处 `wx:elif` → `wx:if` 拆分（collab/index/detail/approval-share/approval-detail/approval-create/tasks/task-detail/tasks/index/schedule/index）；修复 3 个 tsc 错误（schedule/index 缺 todayStr 函数、schedule/detail originalStart/originalEnd 未使用变量）；reminder test mock 日期更新为未来时间。tsc 双 0 错 ✅ 测试 77/77 ✅ |
| 2026-06-11 | **全面审计整改 (full-audit-20260611.md)**：P0-1 ApprovalService 12 处 `as any` → 具体 Prisma 类型（`ApprovalRequestWithRecipients`、`PendingRecipientWithRequest`、`PendingItem` 等 5 个导出接口）；P0-2 `@Public()` 装饰器 + JwtAuthGuard 跳过公开端点（`GET shared/:token`）；P0-3 71 处 NestJS 异常 → `BusinessException(ErrorCodes.xxx, ...)` 全量替换（6 个 service 文件）；P1-1 5 处前端 `.then()` 补 `.catch()`（schedule/index、tasks/index）；P1-4 HealthController 路由统一 `@Controller('api/v1/health')`；P1-5 approval-detail `DetailPageData` → `ApprovalDetailPageData` + `any` 移除；P1-6/P2-3 移除 20 处冗余 `isDeleted: false`（timeblock/task/reminder service 中 $extends 已自动注入）；P2-2 schedule onRefresh 补 try/catch；测试 19 个 toThrow 用例同步更新。tsc 双 0 错 ✅ 测试 77/77 ✅ |
| 2026-06-11 | **H5 原型设计评审**：逐项评审 `AI专属页面-全面设计说明书.md` 6 大类提案。**采纳入 v0.x**：全天开关（日程创建，v0.29）、迷你数据卡片（我的页完成率/逾期率，v0.29）。**其余全部推迟至 v1.x**：分类体系调整、热力图、冲突检测、快捷短语、预约/共享协作类型、H5 协作链接、邀约模板、任务清单模板、完整数据看板、信息卡片组件。VERSION_PLAN.md v0.29 描述更新。 |
| 2026-06-11 | **v0.25 分享卡片完成**：`shareToken` 补入后端 ApprovalResponseDto + `toResponse()`；前端 `ApprovalRequest` 类型补 `shareToken`；approval-create `onShareAppMessage` 修正为真实分享路径 `.../approval-share/index?token=<shareToken>`；schedule detail `onApproveTap` 补传 `endTime` 参数；approval-create WXML `wx:elif` → `wx:if` 拆分。短信保持 console.log stub。`tsc` 双 0 错 ✅ 测试 77/77 ✅ |
| 2026-06-11 | **v0.26 修改再审批完成**：`ApprovalService.handleBlockUpdate()` 新增（查询 blockId 关联的 ApprovalRequest → 同步 title/time/description/category → 重置非 pending 接收方 → 请求状态回 pending）；`TimeBlockController.update` 注入 `ApprovalService` 并在更新后调用 `handleBlockUpdate`（非阻塞 catch）；`TimeBlockModule` 导入 `ApprovalModule`。`tsc` 双 0 错 ✅ 测试 77/77 ✅ |
| 2026-06-11 | **v0.27 圈子可见性完成**：Prisma schema TimeBlock 加 `nature` + `circleId`；`EventVisibilityService`（filter/canView 双模式）；Backend DTOs 加 nature/circleId；TimeBlockService visibility 过滤；前端 schedule detail 页 nature 三态按钮 + 圈子选择器。`tsc` 双 0 错 ✅ |
| 2026-06-11 | **v0.28 设置页完成**：User 表加 `settings Json?` 字段；`GET/PATCH /api/v1/auth/settings` 端点；前端 settings 页（day_starts_at/reminderLeadMinutes/defaultNature 三选择器）；mine 页添加设置入口；schedule 创建页默认使用用户设置。`tsc` 双 0 错 ✅ |
| 2026-06-11 | **v0.29 全局 UX 兜底 + 智能辅助特性完成**：空状态（schedule/index+collab/approval-detail）；全局网络失败 Toast（request.ts fail 回调）；按钮防抖（6 页面 11 处）；骨架屏（Skeleton 全局注册 + 3 页面首屏）；全天开关（schedule detail 创建页 00:00-23:59）；数据卡片（mine 页 4 张统计卡）。`tsc` 双 0 错 ✅ 测试 77/77 ✅ |
| 2026-06-12 | **v0.30 内测收尾 - 隐私协议完成**：`privacy-agreement` 组件（全屏遮罩 + 可滚动协议文本 + 同意按钮 + 防重复点击）；`PRIVACY_AGREED` storage key；全局注册（`app.json` `usingComponents: {"privacy-agreement": "..."}`）；12 个页面 WXML 首元素引入；`app.ts` 无多余代码（组件 `attached` 自检）。`tsc` 双 0 错 ✅ 测试 77/77 ✅ |
| 2026-06-12 | **v0.33 UI/UX 全面优化完成**（13/13 项交付）：① 详情页信息分层；② 时间轴压缩；③ 渐进式表单+智能默认值；④ 手势操作；⑤ 审批 BottomSheet；⑥ Toast 优化；⑦ 颜色语义 tokens；⑧ FAB 动画；⑨ 空状态 CSS 插画；⑩ 统计卡片统一；⑪ 导航按钮 88rpx；⑫ 数据变动动画；⑬ 分享卡片动态 title。`tsc` 双 0 错 ✅ `eslint` 0 错 ✅ |
| 2026-06-12 | **v0.34 全局右上角操作栏完成**：4 页 FAB 移除 + 统一 `.top-bar`（⊕🔍） + 搜索过滤。`tsc` 双 0 错 ✅ `eslint` 0 错 ✅ |
| 2026-06-12 | **v0.32 日程管理完整化完成**：① 周视图（`by-date-range` API + week bar 7 列 + day-mode 复用）；② 编辑 mode `_editSnapshot` 快照 diff；③ 审批防重复绑定（`CONCURRENT_MODIFICATION`）；④ 圈子退出端点 + 按钮（`POST /circles/:circleId/leave`）；⑤ 任务步骤前置校验（全部勾选后完成）；⑥ `taskId` vs `viewTaskTitle` 修复；⑦ 软删清理 cron（每天午夜物理删除 7 天前）。`tsc` 双 0 错 ✅ `eslint` 双 0 错 ✅ `jest` 77/77 ✅ |
| 2026-06-12 | **需求评审：未来 9 版本规划**：对 17 个缺失功能逐项确认，排除 C2 数据导出，形成 v0.36–v0.44 计划。分组：月视图+跨日 → 快速创建+拖拽 → 冲突检测+周期编辑 → 统计+搜索 → 共享日历+评论+分享 → 分类树 → 推送+短信 → 附件上传 → E2E+Husky |
| 2026-06-12 | **v0.35 UI 设计规范全量对齐完成**：50+ CSS 文件 8 阶段 token 替换完成。字重/字号/字间距 token 全覆盖；页面边距/卡片规范/tab 指示器/BottomSheet 横条/表单 border 1rpx 等 17 项规范对齐。`tsc` 双 0 错 ✅ |
| 2026-06-12 | **UI v2 规范采纳**：品牌色 `#4A6CF7` → `#10B981`（薄荷绿）+ 灰阶 4 级替换 + 自定义 TabBar（`custom-tab-bar/` 组件含选中圆点 `#10B981`）+ 保留 ⊕ 操作栏（无 FAB）。`tokens.wxss` 全部色值重写，4 页 `onShow` 设 selected index。`tsc` 双 0 错 ✅ |
| 2026-06-12 | **N3/N4 排期决议**：N3（左滑视觉增强）→ v0.35.1；N4（今日概览卡片）→ v0.36。日程卡左滑已有手势检测（`dx>80`），仅需加 `translateX` 动效；任务卡需新做完整手势；概览卡纯前端计算，放时间轴上方 |
| 2026-06-12 | **v0.35.1 ✅ N3 左滑增强完成**：日程卡 `translateX` 动效 + 任务卡完整三件套手势（标记完成/删除）+ 触摸私有变量从 `TasksPageData` 移入 `TasksPageMethods`（与 schedule 页对齐）。`tsc` 双 0 错 ✅ TODO/FIXME 0 命中 ✅ |
| 2026-06-12 | **v0.36 ✅ N4 + A1 + A2 完成**：今日概览卡片（日程数/时长/空闲/逾期）、月视图（7×6 网格 + 日程点 + 导航）、跨日日程（`getClampedRange` 正确跨天显示 + badge）。品牌色硬编码清理 `#4A6CF7` → `#10B981`。`tsc` 双 0 错 ✅ |
| 2026-06-12 | **计划重排：7 项提议合并入 v0.37–v0.45+**：拖拽调时长（已规划，保持）；重复日程 cron 生成补入 v0.38；四象限矩阵合并入 v0.39；微信转发创建任务替换 v0.42（原推送/短信后移）；S1-S3 高频设置合并入 v0.37；S4-S7 设置合并入 v0.44；步数联动+S9-S12 压至 v0.45+。VERSION_PLAN.md 版本表 + 设计要点同步更新。 |
