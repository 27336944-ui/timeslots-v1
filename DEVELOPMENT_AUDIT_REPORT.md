# timeslots-v1 开发情况检查报告

> **⚠️ 本报告已过时**（基于 2026-06-10 早期版本计划，当时 v0.22-26 仍规划为"可见性/评论/RSVP"）
> 当前版本计划已改为**审批流优先**（v0.22-26），详见 `VERSION_PLAN.md` + `conversations/BATCH_PLAN.md`
> 本文件保留仅作历史参考，不反映当前架构决策

> 生成时间：2025-06-10
> 检查范围：前端 `src/` + 后端 `server/src/` + 配置文件
> 依据文档：`VERSION_PLAN.md` + `PRD.md` + `AGENTS.md`

---

## 一、当前开发进度总览

| 版本 | 事项 | 计划状态 | 实际状态 | 偏差 |
|------|------|----------|----------|------|
| v0.1 | 后端能跑（NestJS + Prisma + /health） | ✅ | ✅ 完成 | 无 |
| v0.2 | 前端骨架（src/ + tsconfig + WeUI + mobx） | ✅ | ✅ 完成 | 无 |
| v0.3 | 前后端连通（request.ts + health 卡片） | ✅ | ✅ 完成 | 无 |
| v0.4 | 设计系统（tokens + 4 组件） | ✅ | ✅ 完成 | 无 |
| v0.5 | 登录 dev 模式（JWT + /auth/login） | ✅ | ✅ 完成 | 无 |
| v0.6 | 我的页 + 登录/登出 | ⏳ | 🟡 部分完成 | 页面有，但缺少 tabBar |
| v0.7 | 时间块 CRUD 后端 | ✅ | ✅ 完成 | 无 |
| v0.8 | 按日期查后端 | ✅ | ✅ 后端完成 | 前端未接入 |
| v0.9 | 日程 Tab 时间轴 | ❌ | ❌ 未开始 | **严重滞后** |
| v0.10 | 新建/编辑/删除日程 | ❌ | ❌ 未开始 | **严重滞后** |
| v0.11~v0.29 | 后续全部版本 | ❌ | ❌ 未开始 | **严重滞后** |

**结论**：当前仅完成 v0.1~v0.8 的后端部分，前端仅实现了首页健康检查 + 我的页登录，**核心功能（日程时间轴、任务、协作）完全缺失**。

---

## 二、Bug 与问题清单（按严重程度）

### 🔴 P0 — 严重 Bug（阻塞功能/违反核心契约）

#### P0-1: 响应码契约不一致 — `HttpExceptionFilter` 返回 HTTP 状态码而非 5 位业务码
- **位置**：`server/src/common/filters/http-exception.filter.ts:38`
- **问题**：`code: status` 直接返回 HTTP 状态码（如 400、401、404、500），但 `AGENTS.md` §5.3.3 #12 和 `PRD.md` §13 要求 `code` 必须是 **5 位业务码**（如 40001、40101、40401、50000）
- **影响**：前端 `request.ts:41` 判断 `body.code === 0` 在成功时正确，但失败时 `code` 是 HTTP 状态码，与契约完全不符；前端无法正确识别业务错误类型
- **修复方向**：重构 `HttpExceptionFilter`，建立 HTTP 状态码 → 5 位业务码 的映射表；补充 Prisma P2002/P2025 → 40901 的映射

#### P0-2: `PrismaService` 缺少 `$extends` 软删拦截
- **位置**：`server/src/prisma/prisma.service.ts`
- **问题**：`AGENTS.md` §5.3.3 #8 明确要求使用 `PrismaClient.$extends` 注入 `where: { isDeleted: false }`，拦截 `findMany`/`findFirst`/`findUnique`/`count`。当前 `PrismaService` 只是简单的 `extends PrismaClient`，没有任何扩展逻辑
- **影响**：所有 Service 必须手动写 `isDeleted: false`，极易遗漏；`TimeBlockService.findById:85` 已手动写了，但其他未来模块可能遗漏，导致软删数据泄露
- **修复方向**：在 `PrismaService` 中实现 `$extends` 软删拦截；同步修改 `TimeBlockService` 去掉手动 `isDeleted: false`（让扩展自动处理）

#### P0-3: `app.json` 缺少 tabBar 配置，且仅注册 2 个页面
- **位置**：`src/app.json`
- **问题**：当前仅注册 `pages/index/index` 和 `pages/mine/index`，没有 `schedule`、`collab`、`tasks` 页面；没有 `tabBar` 配置
- **影响**：`VERSION_PLAN.md` v0.9 要求底部显示【日程】+【我的】两个 Tab，v0.15 解锁【任务】，v0.22 解锁【协作】。当前用户无法导航到任何核心功能页面
- **修复方向**：按版本计划逐步添加页面注册和 tabBar 配置；v0.9 阶段先加 `schedule` 和 `mine` 两个 tab

#### P0-4: 前端核心 stores 缺失 4 个
- **位置**：`src/stores/`
- **问题**：仅有 `authStore.ts` + `userStore.ts`，缺少 `block-store.ts`、`circle-store.ts`、`task-store.ts`、`coach-store.ts`
- **影响**：`PRD.md` §6.3 要求 6 个 stores 全部实现且数据绑定到 WXML；当前无法支撑日程/任务/协作/教练任何功能
- **修复方向**：按版本计划逐步创建：v0.9 创建 `block-store.ts`，v0.15 创建 `task-store.ts`，v0.22 创建 `circle-store.ts`

#### P0-5: 前端核心 services 缺失
- **位置**：`src/services/`
- **问题**：仅有 `api.ts`（healthCheck + login），缺少 time-block、task、circle、user 等 service
- **影响**：无法调用后端 API 进行任何业务操作
- **修复方向**：按版本计划逐步创建对应 service 文件

---

### 🟡 P1 — 中等问题（影响质量/违反规范）

#### P1-1: `TimeBlock` 的 `status` 字段没有枚举约束
- **位置**：`server/prisma/schema.prisma:35` + `server/src/modules/timeblock/dto/create-timeblock.dto.ts:18`
- **问题**：Schema 中 `status String @default("todo")`，但 `PRD.md` §4.3 定义枚举 `TimeBlockStatus = ACTIVE | COMPLETED | CANCELLED`，默认值应为 `ACTIVE`；DTO 中 `@IsString()` 没有限制取值范围
- **影响**：数据库可写入任意字符串状态值，与产品定义不一致；前端无法依赖固定枚举值做 UI 渲染
- **修复方向**：Schema 改为 `enum TimeBlockStatus { ACTIVE COMPLETED CANCELLED }`，默认 `ACTIVE`；DTO 增加枚举校验

#### P1-2: `HttpExceptionFilter` 名称与 PRD 不一致，且缺少 Prisma 错误码映射
- **位置**：`server/src/common/filters/http-exception.filter.ts`
- **问题**：`PRD.md` §5.2 要求的是 `AllExceptionsFilter`，当前文件名和类名是 `HttpExceptionFilter`；且没有处理 Prisma 的 `P2002`（唯一约束冲突）和 `P2025`（乐观锁/记录不存在）错误
- **影响**：Prisma 原生错误会直接暴露为 500，前端无法区分"重复创建"和"系统异常"
- **修复方向**：重命名为 `AllExceptionsFilter`（或确认功能等效）；增加 Prisma 错误码分支：`P2002` → 40901，`P2025` → 40901 或 40401

#### P1-3: 后端缺少 `config/` 目录和 Joi env 校验
- **位置**：`server/src/`
- **问题**：`AGENTS.md` §5.3.2 要求必须有 `config/` 目录做环境变量加载和 Joi schema 校验；当前 `.env` 直接由 `ConfigModule.forRoot()` 加载，没有 schema 校验
- **影响**：启动时如果 `JWT_SECRET` 缺失，`JwtStrategy` 会抛 `getOrThrow` 错误但信息不友好；`AGENTS.md` 强调的 `.allow('').optional()` 规则无法落实
- **修复方向**：新增 `server/src/config/configuration.ts` + `validation.ts`，用 Joi 校验所有 env 变量

#### P1-4: 后端模块严重缺失（仅 3 个模块，PRD 要求 13 个）
- **位置**：`server/src/modules/`
- **问题**：当前仅有 `auth/` + `timeblock/`，缺少 `user/`、`task/`、`task-group/`、`comment/`、`circle/`、`coach/`、`llm/`、`quota/`、`jobs/`、`reminder/` 等
- **影响**：`PRD.md` §5.1 列出的 13 个模块中，10 个未实现；后端 API 仅 2 个模块可用
- **修复方向**：按 `VERSION_PLAN.md` 版本顺序逐步开发：v0.13 task-group → v0.14 task → v0.20 circle → ...

#### P1-5: 前端 `sitemap.json` 包含 JSDoc 注释
- **位置**：`src/sitemap.json`
- **问题**：JSON 文件包含 `/** ... */` 注释，微信开发者工具在严格 JSON 解析模式下可能报错
- **影响**：可能导致编译警告或小程序搜索收录配置失效
- **修复方向**：移除所有注释，保持纯 JSON

#### P1-6: `authStore` 和 `request.ts` 的 `TOKEN_KEY` 各自定义，未统一
- **位置**：`src/stores/authStore.ts:5` + `src/utils/request.ts:8`
- **问题**：两处都定义了 `const TOKEN_KEY = 'token'`，虽然值相同，但没有统一引用 `storage.ts` 的常量
- **影响**：未来如果改 key 名，需要改两处，容易遗漏
- **修复方向**：在 `storage.ts` 或 `types/` 中统一导出 `TOKEN_KEY` 常量，两处都引用它

---

### 🟢 P2 — 小问题（建议优化）

#### P2-1: `request.ts` 的 `BASE_URL` 硬编码
- **位置**：`src/utils/request.ts:7`
- **问题**：`const BASE_URL = 'http://localhost:7777'` 写死，无法适配不同环境（开发/测试/生产）
- **修复方向**：改为从 `wx.getAccountInfoSync()` 或环境变量读取，或至少提供可覆盖机制

#### P2-2: `HealthController` 缺少 `@Controller('api/v1/health')` 前缀
- **位置**：`server/src/health/health.controller.ts:6`
- **问题**：类级别没有 `@Controller('api/v1/health')`，而是在方法上写 `@Get('api/v1/health')`
- **影响**：`@Get()` root 路径和 `@Get('api/v1/health')` 都在类根路径下，路由结构不统一；虽然功能正常，但不符合 NestJS 最佳实践
- **修复方向**：类加 `@Controller('api/v1/health')`，方法改为 `@Get()`

#### P2-3: `TimeBlockService.toResponse` 手动映射字段，缺少类型安全
- **位置**：`server/src/modules/timeblock/timeblock.service.ts:8-28`
- **问题**：`toResponse` 函数的参数类型是手写内联对象，没有使用 Prisma 生成的类型
- **修复方向**：使用 `Prisma.TimeBlockGetPayload<{}>` 或生成的 DTO 类型

#### P2-4: 前端 `app.ts` 过于简单，缺少全局错误捕获
- **位置**：`src/app.ts`
- **问题**：只有 `console.log('timeslots-v1 launched')`，没有 `wx.onError` 全局错误监听、没有 `wx.onUnhandledRejection` 捕获
- **修复方向**：增加全局错误处理，将未捕获异常上报或记录

#### P2-5: `mine/index.ts` 的 `onLogoutTap` 中 `wx.showModal` 的 `success` 回调没有 async/await
- **位置**：`src/pages/mine/index.ts:89`
- **问题**：`success` 是回调函数风格，内部调用 `authStore.clearToken()` 是同步的，但如果未来改为异步，容易出竞态
- **修复方向**：当前代码功能正确，但建议统一为 Promise 风格（`wx.showModal` 可包装为 Promise）

#### P2-6: 缺少测试文件
- **位置**：`server/test/` 或 `server/src/**/*.spec.ts`
- **问题**：`PRD.md` §9 声称有 95 tests / 12 suites，但当前项目中没有任何 `.spec.ts` 或 `.test.ts` 文件
- **修复方向**：按版本计划逐步补充单元测试，优先覆盖 auth 和 timeblock service

#### P2-7: `examples/page-template/index.ts` 仍是反例（`Page<{}, PageData>`）
- **位置**：`examples/page-template/index.ts`（受 §10 保护，只读）
- **问题**：`AGENTS.md` §5.2.2 #19 和 #22 明确要求 `Page<TData, TCustom>` 且接口名用 `<Name>PageData`，但黄金代码模板本身仍是错误写法
- **影响**：AI 生成新页面时如果参照此模板，会复制错误模式
- **修复方向**：需要人工更新 `examples/page-template/index.ts`（受保护文件，AI 不能改，需用户手动处理）

#### P2-8: `TimeBlockService.findByDate` 的日期范围使用 UTC，未考虑时区
- **位置**：`server/src/modules/timeblock/timeblock.service.ts:60`
- **问题**：`new Date(\`${date}T00:00:00.000Z\`)` 将输入日期视为 UTC，但用户在中国（Asia/Shanghai），"2024-06-10" 应该对应北京时间 00:00~24:00
- **影响**：查询结果可能偏移 8 小时，用户看到"今天"的日程不准确
- **修复方向**：按 `AGENTS.md` §5.3.3 #7，DB 存 UTC，但查询时应将用户日期转为 UTC 范围；或前端传带时区的 ISO 字符串

---

## 三、修订计划建议

### 阶段一：紧急修复（P0 Bug，1~2 天）

| 序号 | 任务 | 文件 | 验收标准 |
|------|------|------|----------|
| 1 | 重构 `AllExceptionsFilter`，实现 5 位业务码 | `server/src/common/filters/http-exception.filter.ts` | curl 测试：400 → code:40001，401 → code:40101，404 → code:40401，500 → code:50000 |
| 2 | `PrismaService` 添加 `$extends` 软删拦截 | `server/src/prisma/prisma.service.ts` | `findMany`/`findFirst`/`findUnique`/`count` 自动注入 `isDeleted:false`；tsc 0 错 |
| 3 | 修复 `TimeBlockService` 去掉手动 `isDeleted` | `server/src/modules/timeblock/timeblock.service.ts` | 删除所有手动 `isDeleted: false`；查询结果仍正确过滤软删数据 |
| 4 | 添加 `config/` + Joi env 校验 | `server/src/config/configuration.ts` + `validation.ts` | 启动时校验 `.env`；`JWT_SECRET` 缺失给出友好错误；`.allow('').optional()` 规则落实 |
| 5 | 修复 `sitemap.json` 移除注释 | `src/sitemap.json` | 纯 JSON，微信开发者工具无警告 |
| 6 | 统一 `TOKEN_KEY` 常量 | `src/utils/storage.ts` 或新增 `src/types/keys.ts` | `authStore` 和 `request.ts` 引用同一常量 |

### 阶段二：核心功能补齐（v0.6~v0.10，3~5 天）

| 版本 | 任务 | 关键交付物 |
|------|------|----------|
| v0.6 补完 | 我的页完善 + tabBar 基础 | `app.json` 加 tabBar（日程+我的）；`pages/mine/index` 完善头像/昵称/设置入口 |
| v0.8 前端 | 按日期查前端接入 | `services/time-block.ts` + `block-store.ts` 基础版；首页可跳转日程页 |
| v0.9 | **日程 Tab 时间轴** | `pages/schedule/index`（24h 时间轴 + 按小时分桶 + 下拉刷新）；`block-store.ts` 完整版 |
| v0.10 | 新建/编辑/删除日程 | `pages/schedule/create` 浮层 + `pages/schedule/detail`（编辑+删除）；前端 CRUD 走通 |

### 阶段三：后端模块扩展（v0.11~v0.22，5~7 天）

| 版本 | 任务 | 后端模块 | 前端页面 |
|------|------|----------|----------|
| v0.11 | 微信真实登录 | `auth` 模块加 `POST /auth/wx-login` | 我的页替换为 `wx.login` |
| v0.13 | 任务组后端 | `task-group` module | — |
| v0.14 | 任务后端 + 统计 | `task` module + `GET /tasks/my/stats` | — |
| v0.15 | **任务 Tab 前端** | — | `pages/tasks/index` + `task-store.ts`；解锁 tabBar【任务】 |
| v0.16 | 日程关联任务 | `timeblock` 加 `taskId` 字段 | 创建日程可选关联任务 |
| v0.20 | 圈子后端 | `circle` module | — |
| v0.21 | 邀请码 + 加入 | `circle` 加 invite/join/kick | — |
| v0.22 | **协作 Tab 前端** | — | `pages/collab/index` + `circle-store.ts`；解锁 tabBar【协作】 |

### 阶段四：高级功能（v0.23~v0.29，7~10 天）

| 版本 | 任务 | 说明 |
|------|------|------|
| v0.23 | 可见性 + 共享端点 | `TimeBlock` 加 `nature` + `circleId`；`EventVisibilityService` P0-P3 |
| v0.24 | 共享给我 Tab | `pages/collab/index` 子 Tab "共享给我" |
| v0.25 | 评论后端 | `comment` module + 权限矩阵 |
| v0.26 | 评论前端 | `pages/schedule/detail` 底部评论区 |
| v0.27 | RSVP 后端+前端 | `rsvp` module + 详情页三按钮 |
| v0.28 | 设置页 | `pages/mine/settings`：day_starts_at / 提醒 / 默认可见性 |
| v0.28.5 | 全局 UX 兜底 | 空状态插画 + 网络失败 Toast + 按钮防抖 + 骨架屏 |
| v0.29 | 内测收尾 | 隐私协议 + 全流程真机测试 |

---

## 四、关键决策建议

### 决策 1：先修 P0 Bug，再补功能
**建议**：在继续开发 v0.9 日程 Tab 之前，必须先修复 P0-1（响应码契约）和 P0-2（Prisma $extends）。这两个是基础设施级问题，如果后续模块基于错误契约开发，返工成本更高。

### 决策 2：Schema 状态枚举立即修正
**建议**：在开发 v0.9 之前，先将 `TimeBlock.status` 从 `String` 改为 `enum TimeBlockStatus { ACTIVE COMPLETED CANCELLED }`。如果拖到数据量大了再改，migration 成本更高。

### 决策 3：测试策略
**建议**：当前完全没有测试文件，建议在阶段二（v0.9~v0.10）结束时，至少补齐：
- `auth.service.spec.ts`（JWT 签发 + 登录）
- `timeblock.service.spec.ts`（CRUD + 软删 + 权限隔离）
- `event-visibility.service.spec.ts`（如果 v0.23 前实现）

### 决策 4：前端状态管理优先级
**建议**：`block-store.ts` 是 v0.9 的阻塞项，必须在日程页面开发前完成。`task-store.ts` 和 `circle-store.ts` 可以推迟到对应 Tab 解锁前再实现。

---

## 五、风险预警

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 响应码契约不修复，前端错误处理混乱 | 高 | 高 | 阶段一第 1 项优先执行 |
| Prisma 软删拦截缺失，导致已删数据泄露 | 中 | 高 | 阶段一第 2~3 项优先执行 |
| 时区处理不当，日程查询结果偏移 8h | 中 | 高 | v0.9 开发时统一用 UTC 查询 |
| 缺少测试，回归时易引入新 Bug | 高 | 中 | 每完成一个模块补对应测试 |
| 微信真实登录（v0.11）阻塞内测 | 中 | 中 | 提前准备微信开发者账号和 code2session 调试 |

---

*本报告仅做检查和分析，未修改任何源文件。*
