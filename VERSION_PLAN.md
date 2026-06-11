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
| v0.9 | **日程 Tab 时间轴** | `blockStore`、`pages/schedule/index` 24h 时间轴（0-23时）、按 hour 分桶、下拉刷新、时间轴默认只展开有日程的小时。**TabBar：底部仅显示【日程】和【我的】两个 Tab，任务和协作隐藏（wx.hideTabBar 或自定义组件）**。验收：时间轴显示当天已有日程；底部只有日程+我的；周/月切换 Mock 显示"即将上线" | v0.8, v0.6 | ⭐⭐⭐ |
| | **v0.9 ✅** | `blockStore` MobX store（fetchByDate + loading/error/currentDate）；`pages/schedule/index` 24h 时间轴、按 hour 分桶、UTC→本地时转换、自动展开有日程的小时、左右日期导航、下拉刷新、周/月 Mock toast；`app.json` tabBar 仅日程+我的（2 tabs）。tsc --noEmit 0 错 | | |
| v0.10 | **新建/编辑/删除日程** | 在 `pages/schedule/detail/index` 中通过 `mode` 三态（create/view/edit）实现新建、编辑、删除。含 title + startTime/endTime + 分类/优先级/地点/备注/周期/联系人/天气 等扩展字段。验收：新建→列表出现→编辑→保存→列表更新→删除→消失 | v0.9 | ⭐⭐ |
| | **v0.10 ✅** | `pages/schedule/detail/index` 三态模式（create/view/edit）；7 扩展字段（location/description/priority/category/recurrence/contacts/weather）完整 Form；FAB 入口 + blockCard 左色条 + 优先级圆点；`blockStore` CRUD actions 自动刷新列表 + 返回。Prisma migration `add_timeblock_fields` 新增 7 字段。前端 tsc 0 错 + 后端 tsc 0 错 | | |
| v0.11 | **微信真实登录 + 数据过渡** | code2session 换 openid、`POST /auth/wx-login` 收 code 返回 token、`wx.getUserProfile` 拿头像昵称→`PATCH /auth/profile` 更新。**数据过渡：提供 `POST /auth/migrate-dev-data`（迁移）+ `POST /auth/delete-dev-data`（清空）API 端点；首次微信登录成功弹出迁移弹窗**。验收：真机微信登录→头像昵称出现→旧数据可选迁移或清空 | v0.6 | ⭐⭐⭐ |
| | **v0.11 ✅** | User 表加 `openid` 字段 + `prisma db push`；`POST /api/v1/auth/wx-login`（code→code2session→JWT）带占位符检测 + 错误处理；`PATCH /api/v1/auth/profile`（JWT guarded）更新 nickname/avatar；`POST /api/v1/auth/migrate-dev-data` + `POST /api/v1/auth/delete-dev-data` 数据过渡；`wx.getUserProfile` 在 `onWxLoginTap` 中调用获取头像昵称；首次微信登录弹出迁移 Modal（可输入 Dev UUID 迁移/删除）。tsc 双 0 错；curl 验证：Profile PATCH 200 ✅ / Migrate 200（4 条）✅ / Delete 200 ✅ / wx-login 400（未配置正常拒绝）✅ | | |
| v0.12 | **账号注销/恢复** | `DELETE /auth/account` → 7 天冷静期、`POST /auth/restore` 恢复（公开端点）。登录检测已注销用户返回"账号待删除"，前端弹窗提示恢复。验收：注销→再登录提示"账号待删除"→恢复→正常使用 | v0.11 | ⭐⭐ |
| | **v0.12 ✅** | `DELETE /api/v1/auth/account`（JWT 守卫）+ `POST /api/v1/auth/restore`（公开）+ `AuthService.checkDeletedUser()` 登录拦截；`login/wxLogin` 改为查全量用户（含已删）→ 7 天冷静期检测 → `ForbiddenException('账号待删除')` 或 `('账号已永久删除')`。前端：mine 页`注销账号`按钮 + 登录失败弹窗恢复 + 恢复成功自动登录。tsc 双 0 错；curl 验证：DELETE 200 / restore 200 / login deleted 403 ✅ | | |
| v0.13 | **任务后端（三种任务类型：工作/生活/私有）** | Task 表（id, userId, title, **goal**（持续细化的目标/需求描述）, **steps** (JSON: [{text, isDone}]), status (pending/in_progress/done), priority, **category (work/life/private)**, dueAt?, **completedNote**（补充说明）, **retrospective**（复盘改进点）, **improvements**（未来更明确要求）, isDeleted）+ 5 CRUD 端点 + `GET /tasks/my/stats`(total/pending/inProgress/done/**today**/**week**/overdue/arranged/unarranged)。**任务组由三种固定类型替代（工作/生活/私有），不设 TaskGroup 独立 CRUD**。category 与 TimeBlock 一致。**Task 是可迭代的工作单元，非一次性待办**——goal 可反复细化，steps 是核心完成依据，完成后需填写 completedNote+retrospective 才算真正闭环。stats 增加 today（当日截止未完成）/week（本周截止未完成）/arranged（有关联日程）/unarranged（未安排）计数（Asia/Shanghai 时区）。验收：curl 建任务含 steps+goal→按 category 过滤→stats 含 today+week 计数 | v0.5 | ⭐⭐ |
| v0.14 | **任务 Tab 前端** | `taskStore`、`pages/tasks/index`：顶部统计卡（total/今日截止/本周截止/逾期）+ 底部 3 个 category Tab (工作/生活/私有) 切换 → 每个分类内支持二级过滤（全部/已安排日程/未安排）→ 任务列表（category 色点+status 图标+steps 进度条+截止时间+**已安排/未安排 badge**）。`pages/tasks/task-detail`：编辑 goal+steps checklist 管理（增/改/勾选步骤）+ 完成后展示复盘区（completedNote/retrospective/improvements）+ **关联日程列表**（已发生的 / 未来的日程）+ "为此任务创建关联日程" 入口按钮。**TabBar：解锁底部【任务】Tab**。验收：建任务添加 steps→勾选步骤→完成任务后填写复盘→关联日程后卡片显示"已安排"badge→从任务详情创建关联日程 | v0.13 | ⭐⭐⭐ |
| v0.15 | **日程关联任务（N:1）** | TimeBlock 加 `taskId`（可空，指向 Task），**N 个日程→1 个任务**。创建/编辑日程时可选关联某个任务。**完成日程不会自动完成任务**——任务完成基于 steps 全部勾选 + 填写复盘。任务详情页展示关联的日程列表（已发生/未来），并提供"创建关联日程"入口跳转到日程创建页。验收：一个任务关联多个日程→日程列表展示→任务卡片显示"已安排"badge→创建日程时可选关联→从任务详情跳转创建新日程 | v0.14, v0.10 | ⭐⭐ |
| v0.16 | **提醒后端** | 微信订阅消息模板 + `POST /reminders` 创建提醒（targetBlockId, fireAt, leadMinutes）。验收：调接口创建成功 | v0.11, v0.7 | ⭐⭐ |
| v0.17 | **提醒 cron 推送 + 防重发** | 每分钟 cron 扫描 `Reminder WHERE status=PENDING AND fireAt<=now()`→调 `subscribeMessage.send`→置 SENT/FAILED。**防重发：使用 `updateMany WHERE status=PENDING AND fireAt<=now() SET status=SENDING` 作为行级锁；或 Prisma 事务+status 检查，确保多实例/多进程下同一提醒仅被发送一次**。验收：设置 5min 提醒→到点只收到一条微信通知 | v0.16 | ⭐⭐⭐ |
| v0.18 | **提醒前端 UI** | 创建日程时可选"提前 X 分钟提醒"（15/30/60 三档）、首次弹窗引导授权"允许订阅消息"。验收：勾选→到点收到唯一一条微信消息→拒绝授权后不再弹窗 | v0.17 | ⭐⭐ |
| v0.19 | **圈子后端** | Circle 表（id, ownerId, name, description, inviteCode unique, status, isDeleted）+ CircleMember 表（circleId, userId, role, isDeleted）+ `circle` module 5 CRUD 端点。验收：curl 建圈子→列表→详情→删除 | v0.11 | ⭐⭐⭐ |
| v0.20 | **邀请码 + 加入后端** | `POST /circles/:id/invite` 生成 8 位码、`POST /circles/join/:code` 加入（自动 MEMBER）、`DELETE /circles/:circleId/members/:memberId` 踢出（仅 OWNER/ADMIN）。验收：建圈→生成码→用码加入→列表+1 | v0.19 | ⭐⭐⭐ |
| v0.21 | **协作 Tab - 我的圈子** | `circleStore`、`pages/collab/index` 子 Tab"我的圈子"：列表（名称+角色色块+成员数）+ 创建浮层 + `pages/collab/circle-detail`（邀请码展示+成员列表）。**TabBar：解锁底部【协作】Tab**。验收：建圈子→列表→详情看成员 | v0.20 | ⭐⭐ |
| v0.22 | **可见性 + 共享端点 + 历史兼容** | TimeBlock 加 `nature`（PRIVATE/PUBLIC/CIRCLE_ONLY）+ `circleId`（可空）+ `EventVisibilityService` P0-P3 掩码 + `GET /time-blocks/shared`。**历史数据：编写 migration.sql 将 v0.7~v0.21 期间所有旧 TimeBlock 的 nature 默认设为 PRIVATE，circleId 设为 null，确保旧数据不泄露**。验收：CIRCLE_ONLY 日程→圈子成员在 /shared 可见→非成员 403；旧数据默认为 PRIVATE | v0.21, v0.7 | ⭐⭐⭐ |
| v0.23 | **共享给我 Tab** | `pages/collab/index` 子 Tab"共享给我"：调 `/shared` 渲染列表（title+timeRange+nature 标签）+ 点击进入只读详情。验收：共享日程在对方 Tab 出现、nature 标签正确显示 | v0.22 | ⭐⭐ |
| v0.24 | **评论后端** | Comment 表（id, blockId, authorId, content, parentId, isDeleted）+ 4 CRUD 端点 + 权限矩阵（PRIVATE 隐藏/ PUBLIC 可读仅被邀请者可写 / CIRCLE_ONLY 成员可读写）。验收：circle 日程下发评论→列表刷新→PRIVATE 日程报 403 | v0.22 | ⭐⭐⭐ |
| v0.25 | **评论前端** | `pages/schedule/detail` 底部评论区（评论列表+输入框+发送按钮+回复功能）、PRIVATE 日程隐藏评论区、PUBLIC 日程输入框禁用（仅可读）。验收：circle 日程可评论/回复→PRIVATE 无评论区→PUBLIC 可读不可写 | v0.24 | ⭐⭐ |
| v0.26 | **RSVP 后端+前端** | RSVP 表（id, blockId, attendeeId, status, unique blockId+attendeeId）+ 2 端点 + `pages/schedule/detail` RSVP 三按钮（确认/待定/取消）+ 参加人数统计显示。验收：点确认→按钮变绿→状态显示→其他人看到更新 | v0.22 | ⭐⭐ |
| v0.27 | **设置页** | `pages/mine/settings`：day_starts_at 选择器（默认 06:00）、默认提醒提前量（15/30/60）、默认隐私可见性（PRIVATE/PUBLIC/CIRCLE_ONLY）。验收：改设置→下次使用生效→API 持久化 | v0.18 | ⭐⭐ |
| v0.28 | **全局 UX 兜底** | ① 所有列表页空状态插画（暂无日程 / 暂无任务 / 暂无圈子 / 暂无评论）；② 网络请求失败全局 Toast（`request.ts` 统一拦截非 200 响应）；③ 按钮防抖（提交/创建/删除按钮连点仅生效一次）；④ 加载中骨架屏（复用 v0.4 Skeleton 组件）。验收：断网下操作提示"网络异常"→列表无数据时显示友好插画→快速连点不重复创建 | v0.27 | ⭐⭐ |
| v0.29 | **内测收尾** | 隐私协议弹窗首屏+必须同意+本地记录、全流程真机测一轮（登录→建日程→改状态→加任务→加圈子→共享→评论→提醒→设置→空状态→断网）。验收：走通全部流程、隐私协议正常、无控制台报错 | v0.28 | ⭐⭐ |

---

## 设计要点（避免功能纠缠）

| 关键解耦 | 说明 |
|----------|------|
| v0.7 TimeBlock 不含 nature/circleId | 纯粹 title+startTime+endTime+status，到 v0.23 才加可见性字段，向下兼容 |
| v0.7 TimeBlock 不含 quota | AI/计费相关功能全部不进入此文件，如需扩展用 v1.x+ 追加 |
| v0.5 dev 登录保留（非下线） | v0.11 上线后 v0.5 路由**保留**（非互斥下线），双登录模式共存：Dev UUID 供本地调试，微信登录供真机。v0.12 账号注销/恢复需同时处理两种用户类型 |
| v0.10 detail 页面为后续版本增长面 | v0.15（任务关联）、v0.18（提醒选择）、v0.25（评论区）、v0.26（RSVP）均需向 `pages/schedule/detail/index` 追加 UI Section。每次迭代保持 `mode` 三态兼容，新增字段统一放在 form 末尾 |
| v0.15 外键方向为 taskId | TimeBlock 加 `taskId`（指向 Task），一个日程最多关联一个具体任务 |
| 任务（v0.13-14）与日程（v0.7-10）独立 | 两者仅通过 `taskId` 弱关联（可空），改动互不影响 |
| **Task.category 与 TimeBlock.category 一致** | 任务和日程共用同一套 category 枚举（work/life/private），前端使用相同色板渲染，统计模块可直接跨表聚合 |
| 圈子（v0.20-27）独立于任务 | Circle 只作用于 TimeBlock 可见性，不影响任务/提醒 |
| v0.9 时间轴边界 | 不支持跨天（结束时间 > 24:00 自动截断），暂不处理同一时间多日程重叠 |
| v0.9 TabBar 在 app.json 硬编码 | v0.9 写 2 个 Tab（日程+我的）；v0.14 追加【任务】Tab；v0.21 追加【协作】Tab。每次更新需手动编辑 `app.json` + 创建对应 stub page |
| v0.7+ 新 module 严格参照 DDD 模板 | Controller → @UseGuards(JwtAuthGuard) + @CurrentUser('userId')；Service → 注入 PrismaService 走 `.client.` 方法；DTO → class-validator 装饰器。参照 timeblock module 完整目录结构 |
| v0.22 旧数据兼容 | migration.sql 将所有历史 TimeBlock.nature 默认洗为 PRIVATE |
| v0.18 防重发 | `updateMany SET status=SENDING WHERE status=PENDING` 作为行锁，确保幂等 |
| v0.28 全局空状态/错误 | 独立版本交付，避免污染各业务版本的开发焦点 |
| **Category 树替代硬编码枚举（技术债务记录）** | 当前 category 为 `String` 硬编码（work/life/private），后续需替换为自引用 `Category` 表：id, userId, name, parentId, sortOrder, isDefault, isDeleted。Task + TimeBlock 统一外链到 Category.id。每个新用户初始化 3 个根节点（工作/生活/私有）各带一个 isDefault 子类。v0.13 现有数据通过 migration 脚本迁移。maxDepth=4。默认子类不可删除。该变更涉及前端分类选择器需改为树形选择器 |

---

## AI 编程约束（给 opencode 的 System 规则）

| 约束 | 规则说明 |
|------|----------|
| **外键与级联删除** | 所有涉及 `userId`、`circleId`、`blockId` 的关联，Prisma Schema 必须明确配置 `onDelete: Cascade` 或 `onDelete: SetNull`，禁止出现孤儿数据 |
| **时区统一** | 后端 PG 数据库统一使用 `timestamptz` 存储 UTC 时间，前端展示时统一转换为 `Asia/Shanghai`。禁止在数据库层做时区转换 |
| **TabBar 动态控制** | 严禁在 `app.json` 中写死 4 个 Tab。必须通过 `wx.hideTabBar` / `wx.showTabBar` 或自定义 TabBar 组件，根据当前版本解锁的模块动态渲染（v0.9：仅日程+我的，v0.15：解锁任务，v0.22：解锁协作） |
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
