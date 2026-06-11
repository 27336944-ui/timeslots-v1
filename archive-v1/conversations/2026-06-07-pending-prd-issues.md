# 2026-06-07 PRD v1.0 待 reconcile 问题清单

> 用户指示："批次二产生的问题，还是和上次一样，先记下，后面一并补齐"
> 本文件汇总批次一、二、三评审中识别出的所有 P0/P1 问题，等用户拍板后统一处理。
> 配套文件：`2026-06-07-batch1-gap-and-plan.md`

## 1. 沿用：批次一 4 块硬骨头（见 batch1-gap-and-plan）

1. AGENTS.md reconcile（LLM 定位）
2. PRD 升 v1.0（4 Tab / AI 录入 / 隐私三态 / 双视图 / 复盘编辑 / 双轨账号）
3. Mock 数据层
4. 4 Tab 页面骨架 + tabBar

## 2. 批次二 P0 阻塞（4 项）

### 2.1 LLM 定位冲突
- 旧 AGENTS §6：LLM 是"增值功能"，核心 CRUD 不依赖 LLM
- 新 PRD §5/§7：AI 多模态录入是"核心差异化卖点"
- 必须 reconcile

### 2.2 数据模型缺实体
- §6 提到 `Group_ID` 但 `Group/Project/Task` 三者关系未定义
- 批次二 Day 1 就要建表

### 2.3 AI 聚类算法黑盒
- §6.1 说"语义相似度 / 时间相近 / 地点重合"
- 用什么模型？阈值？离线/异步？

### 2.4 AI 效率教练未定义
- §7.1 提"深度周报分析 10 点/次"，指标算法空白

## 3. 批次三 P0 阻塞（3 项，含 2 沿用）

### 3.1 Space / Group / Project / Task 实体未定义（新增）
- 批次二提 Group，批次三提 Space
- 是同一个实体还是不同？
- 累计 10 个新实体需要 ER 图

### 3.2 LLM 定位冲突（沿用 2.1）
- 批次三 §10 教练算法显然把 LLM 升为核心

### 3.3 M1-M6 节奏脱节再升级（沿用批次二节奏脱节）
- 批次三新增：灰度平台、加密方案、离线存储、埋点 sink、订阅消息、Activity Feed

## 4. 批次二 P1 决策（5 项）

| # | 决策点 | 选项 | 影响 |
|---|--------|------|------|
| 1 | §5 图像识别 | A) 百度 OCR+LLM 视觉 / B) wx.serviceMarket / C) 暂不实现 | 新依赖 + 成本 |
| 2 | §5 语音转文字 | A) wx.startRecord + wx.translateVoice / B) 第三方 ASR / C) LLM 多模态 | 精度 vs 成本 |
| 3 | §7.1 扣费粒度 | A) 解析 1 + 创建 1 = 2 点/次 / B) 合并 1 点/次 | 用户感知 + 防超卖 |
| 4 | §7.1 AI 外呼 | A) 阿里云语音 / B) 腾讯云 / C) 暂不实现 | 监管 + 集成 |
| 5 | §7.2 分布式锁 | A) Redis / B) PG advisory / C) 单实例先不锁 | 引入 M7 |

## 5. 批次三 P1 决策（5 项）

| # | 决策点 | 选项 | 影响 |
|---|--------|------|------|
| 1 | §9.2 完整权限矩阵 | A) 3 nature × 2 角色 / B) 3 × 2 × 2 操作 | 拦截器复杂度 |
| 2 | §9.3 Activity Feed 存储 | A) Event Sourcing / B) 单表+索引 | 时序 vs 简单 |
| 3 | §10.1 教练算法 | A) 规则引擎 / B) LLM 生成 | 成本 vs 灵活度 |
| 4 | §11 埋点 sink | A) 微信自带 / B) 第三方 / C) 自建 | 成本 vs 灵活度 |
| 5 | §12.1 离线存储 | A) 微信 Storage 10MB / B) 申请更大配额 / C) wx.cloud DB | 上限 vs 成本 |

## 6. 数据模型待补实体（10 个）

| 实体 | 来源 | 关键字段待定 |
|------|------|--------------|
| `User` | 已有（M1） | nature 推断规则 |
| `TimeBlock` | 需新增 | `nature` / `groupId` / `privacy` / `actualDuration` |
| `Space` | §9.1 | `owner/admin/member` 角色 |
| `Group` | §6.1（批次二） | 与 Space 是同一实体？ |
| `Project` | 隐含 | 父子 vs peer |
| `Task` | 隐含 | 父/子任务？ |
| `Comment` | §9.3 | 通知策略 |
| `RSVP` | §9.2 | `accept/decline/pending` |
| `CoachCard` | §10.2 | `feedback` 表（左右滑） |
| `Quota` / `Billing` | §7 | 点数模型 |

## 7. 待用户拍板汇总

按 §8.2 SOP Step 2，需先拍板：

1. **LLM 定位**：AGENTS 改 vs PRD 改
2. **数据模型**：10 个新实体的 ER 图
3. **路线图**：保留 M1-M6 + 补 M7/M8 vs 重画批次一/二/三/四
4. **M1-M6 → 批次映射**：原 6 个里程碑对应新几个批次？
5. **P1 决策**：上述 10 项决策（批次二 5 + 批次三 5）

## 8. PRD 主体完成度自评

| 维度 | 状态 |
|------|------|
| 4 Tab 信息架构 | ✅ |
| AI 多模态录入 | ✅（细节待 §2 决策） |
| 任务归集算法 | ✅（细节待 §2 决策） |
| 计费网关 | ✅（细节待 §2 决策） |
| 协作权限 | ✅（细节待 §2 决策） |
| AI 教练 | ✅（细节待 §2 决策） |
| 埋点字典 | ✅（细节待 §2 决策） |
| NFR | ✅（细节待 §2 决策） |
| **数据模型 ER** | ❌ |
| **AGENTS reconcile** | ❌ |
| **路线图对齐** | ❌ |
| **API 契约** | ❌ |

→ 主体已出齐，**收口 3 件事**才能开 M2：AGENTS reconcile + ER 图 + 路线图映射。

## 9. 后续触发条件

当用户说"开始 reconcile"、"开 M2"或"画 ER 图"时，回到本文件执行 §7 的 5 件事。

---

## 10. 附件评审（2026-06-07 追加：Wireframe Specs + API Contract Draft）

### 10.1 🔴 关键 P0：响应码契约冲突 ✅ 已决（2026-06-07）

附件顶部定义全局响应 `{code, msg, data}`，code=200 成功。

**M1 已实现**（受保护 §10）：
- `server/src/common/interceptors/transform.interceptor.ts` → `{code: 0, data, message: ''}`
- `server/src/common/filters/all-exceptions.filter.ts` → `{code, data: null, message, path, timestamp}`
- `src/utils/request.ts` (`hasApiShape` + `request<T>`) → `if (body.code === 0) resolve(data)`
- `src/types/api.ts` → `ApiSuccess<T> = { code: 0; data: T; message: '' }`
- 21 个 JSDoc 都引"code: 0"或"code !== 0"

**拍板决议**：**选项 B** —— M1 跟随附件
- `code: 0` → `code: 200`
- `message: ''` → `msg: 'success'`
- 失败时 `code = httpStatus`（PRD 1:1 映射约定）

**已落地**（2026-06-07）：
- 4 个核心文件改完，前端 + 后端 tsc 双 0 错
- AGENTS.md §5.3.3 新增 #12（错误码表：200/400/401/402/403/404/409/500）
- 受保护模块（§10）`request.ts` / `api.ts` / `transform.interceptor.ts` / `all-exceptions.filter.ts` 标记完成

### 10.2 🔴 沿用 P0（3 项）

1. LLM 定位冲突（沿用 §2.1）
2. ~~Space/Group/Project/Task ER 未画（沿用 §3.1）~~ ✅ 已决（2026-06-07）
3. AI 教练算法未 spec（沿用 §2.4）—— 附件 API 4 假设"group_id 聚合 events"，但教练 §10 怎么算"深度专注"仍未明

**ER 图拍板决议**（2026-06-07）：
- 11 实体：User（M1 升级）+ 10 新表（TimeBlock / Space / SpaceMember / Group / Comment / RSVP / CoachCard / CoachFeedback / Quota / QuotaTransaction / TrackingEvent）
- 关键设计：Group 是单独表（不是 TimeBlock 上的字符串）、Quota 1:1 User、Space/Group 二维解耦
- 落盘 `conversations/2026-06-07-data-model-v1-er.md`

### 10.3 🟡 附件 P1（4 项新增）

| # | 决策点 | 选项 | 拍板 | 影响 |
|---|--------|------|------|------|
| 1 | API 1 预扣 | A) 解析 0.5 + 创建 0.5 / B) 解析不扣 + 创建 1 / C) 解析 1 + 创建 0 | 待 | 防超卖 + 用户感知 |
| 2 | 鉴权端点 | A) Health/Auth `@Public()` / B) 全部走 token | 待 | 与 AGENTS §5.3.2 对齐 |
| 3 | API 2 分页/排序 | A) limit/offset + sortBy / B) 全量 | 待 | 性能（一天 50+ 条） |
| 4 | API 3 扣费并发 | ~~A) 分布式锁~~ / B) `UPDATE...RETURNING` / C) `SELECT FOR UPDATE` | **B + PG advisory** | AGENTS §5.3.3 #13 |

**SQL 漏洞**：API 3 注释的 `UPDATE user_quota SET ai_points = ai_points - 1 WHERE user_id = ? AND ai_points > 0` 在并发下不安全（read-modify-write 非原子）。

**拍板决议**（2026-06-07）：**PG advisory lock**（不引 Redis）
- 落 AGENTS §5.3.3 #13
- 用法：`SELECT pg_advisory_xact_lock(hashtextextended(<key>, 0))` 在 Prisma `$transaction` 内调用
- 事务结束自动释放

### 10.4 PRD 闭环度更新

| 维度 | 状态 |
|------|------|
| 4 Tab 信息架构 | ✅ |
| AI 多模态 | ✅ |
| 任务归集 | ✅ |
| 计费网关 | 🟡（SQL 并发已用 advisory lock 解决；预扣机制待 P1 #1）|
| 协作权限 | ✅ |
| 教练算法 | 🟡（指标有，算法未 spec） |
| 埋点 | ✅ |
| NFR | ✅ |
| Wireframe 核心交互 | ✅ |
| API 契约主体 | ✅ |
| **响应码/字段名契约** | ✅ 已决 |
| **数据模型 ER** | ✅ 已决 |
| **AGENTS reconcile** | 🟡 部分（§5.3.3 #12/#13 已加，LLM 定位待） |
| **路线图映射** | ❌ |
| **API 1 预扣机制** | ❌ |
| **鉴权端点矩阵** | ❌ |

→ 主体 ~80% 闭环，剩 2 项 P0（LLM 定位 + 教练算法）+ 累计 12 项 P1（已决 2）。

### 10.5 总 P0 累计（4 项，按依赖顺序）

1. ~~响应码契约~~ ✅ 已决
2. ~~ER 图~~ ✅ 已决
3. ~~LLM 定位~~ ✅ 已决（2026-06-07）
4. ~~AI 教练算法~~ ✅ 全闭（2026-06-07），含子项"工作"定义

**教练算法最终决议**（2026-06-07）：
- 碎片化指数：用户可调，默认 3+（30min < gap < 2h）
- 偏差率：>30% 触发
- 深度专注：≥ 2h 无冲突 run / 总 work 时长；≥60% 健康
- 私有冲突"算无冲突"但提醒（隐私尊重 + 透明度）
- "工作"如何定义：**已决 D = 用户可配置（基线 A = `nature='work'`）**
  - settings UI 4 选 1：`nature_work` / `nature_work_and_not_private` / `nature_work_and_open` / `privacy_open`
  - 存储：`User.coachSettings.workFilter` (jsonb)
  - 默认值：`nature_work`
- 详细 spec → `conversations/2026-06-07-coach-algorithm-spec.md`（含 §7 默认配置接口）
- AGENTS §6.7 同步更新
- ER 图 User.coachSettings 字段 + 关键设计决策 #7 同步（data-model-v1-er.md）

**M2-A 任务增量**：
- Prisma User.coachSettings: jsonb（默认值见 spec §7）
- 首次进入设置页时 UPSERT 默认配置

**LLM 定位拍板决议**（2026-06-07）：**AGENTS §6 改为对齐 PRD**
- §6 标题：增值功能 → 核心引擎 (Wow Engine)
- §6.1 定位：增值 → 核心差异化卖点；新增"手动降级始终可用"安全网
- §6.2 场景：加 AI 多模态/AI 教练/任务归集
- §6.3.4 内容安全：强化（强制脱敏 + 隐私拦截 + 审计日志）
- §6.3.5 成本控制：强化（三段式扣费：解析 0.5 + 创建 0.5 + 失败退扣；关联 PG advisory）
- §6.5 LLM 接入里程碑：M6 → M2-A
- §6.6 新增：手动降级路径（关键安全网）
- §9 自检"LLM 边界"项重定义

### 10.6 收口顺序（reconcile SOP）

```
Step 1: 拍板 4 项 P0
  → 响应码 B ✅
  → 10 实体 ER 图 ✅
  → LLM 定位 [待]
  → 教练算法 spec [待]

Step 2: 拍板 12 项 P1
  → 批次二 5 + 批次三 5 + 附件 4（其中 1 已决：B+advisory lock）
  → 剩余 12 项

Step 3: 写 API 契约 v1.1（含响应码 ✅ + 鉴权矩阵 + 预扣机制 + 错误码表）

Step 4: 写 AGENTS v1.3
  → §5.3.3 #12 错误码表 ✅
  → §5.3.3 #13 advisory lock ✅
  → §6 LLM 定位 [待]
  → §12 路线图 M1-M6 → 批次一/二/三/四 [待]

Step 5: PRD v1.0 落定，开 M2
```

---

## 12. TDD V1.0 评审（2026-06-07，用户提供）

### 12.1 🔴 4 个 Showstopper（技术栈冲突）

| # | TDD V1.0 | AGENTS §2 锁定 | 拍板 |
|---|----------|----------------|------|
| 1 | Spring Boot 3.x + JDK 21 | NestJS + TypeScript | **B 保留 NestJS+PG** |
| 2 | MySQL 8.0 | PostgreSQL 16 | 同上 |
| 3 | Redis 7.0（锁+缓存+限流） | 不引 Redis，用 PG advisory | **B PG advisory 单锁** |
| 4 | RocketMQ / RabbitMQ | 未引入 MQ | 同上（TDD 翻 TS 时降级为同步聚合） |

### 12.2 🔴 5 个 DDL 冲突

| # | TDD | AGENTS §5.4 / ER | 拍板 |
|---|-----|------------------|------|
| 5 | `id bigint unsigned` | `uuid @default(uuid())` | TDD 翻 Prisma 时改 |
| 6 | 无 `deleted_at` | 所有表必备 | 同上 |
| 7 | nature+is_busy 三态 | nature+privacy 二维 | 同上 |
| 8 | details_json AES 加密 | 无此策略 | **新引入 15，待拍** |
| 9 | status tinyint | ER 无 status | **新引入，待拍** |

### 12.3 🔴 5 个业务逻辑冲突

| # | TDD | AGENTS | 拍板 |
|---|-----|--------|------|
| 10 | 三重锁 | PG advisory 单锁 | **B PG advisory** |
| 11 | 5 位业务码 | HTTP 1:1 映射 | **B HTTP 1:1** |
| 12 | participants 字段 | RSVP 表 | TDD 翻 TS 时改 |
| 13 | VIRTUAL 虚拟列 | PG 用 STORED | TDD 翻 Prisma 时改 |
| 14 | 读超时 3000ms | 5000ms（PRD V1.0 §5.2） | TDD 翻 TS 时改 5000 |

### 12.4 🟡 5 个新引入（需单独拍板）

| # | 内容 | 拍板 |
|---|------|------|
| 15 | AES-256-GCM 加密 details_json | **待拍**（M2-A 阻塞：Prisma schema） |
| 16 | audit_logs 表 | **待拍**（合规，可缓到 M2-C） |
| 17 | 永久/当月点数分层 | **待拍**（M2-A 阻塞：Quota 表 schema） |
| 18 | 熔断器 5 次超时阈值 | **待拍**（LlmClient 接口可后置） |
| 19 | 注销虚拟 ID = 999999 | **待拍**（具体值，可缓到 M2-C） |

### 12.5 ✅ 5 个可采纳（与 AGENTS 兼容）

| # | 内容 | 落点 |
|---|------|------|
| 20 | §3.2 脱敏 P0/P1/P2/P3 策略 | AGENTS §5.3.2 + Prisma service 层 |
| 21 | §3.3 DLQ + 重试 + 前端降级 | MQ 拍板后入 AGENTS §6.3.4（不引 MQ 改为同步聚合 + 兜底） |
| 22 | §5.2 注销级联 SOP | ER Space 加 status + 注销用户虚拟 ID |
| 23 | §3.1 幂等性校验 traceId | 与 PRD V1.2 API 契约一致 |
| 24 | §4.1 熔断器模式 | 抽象成 LlmClient 接口的可选实现 |

### 12.6 TDD 翻 TS 工作分解（待用户拍板顺序）

TDD 全部翻 TS = 估 5-7 人天。**建议分 3 批**：

**Batch 1（M2-A 前置，1.5 天）**：
- §1 系统架构 → NestJS Module 依赖图
- §2 DDL → Prisma schema（11 实体，含 status / 加密字段 / 永久-当月点数 决策）
- §3.1 扣费算法 → Prisma `$transaction` + PG advisory
- §3.2 脱敏 → Prisma `findMany` hook + `eventVisibility()` service

**Batch 2（M2-B 前置，2 天）**：
- §3.3 MQ → **不引** 改同步聚合（Prisma transaction 内 `groupBy` + 缓存）
- §4.1 AI 超时/熔断 → LlmClient interface 实现
- §4.2 横幅 → PG 表 + cron（不引 Redis）
- §6 错误码 → 已落地

**Batch 3（M2-C 前置，1.5 天）**：
- §5.1 加密 → `@noble/ciphers` + env `KMS_KEY`
- §5.2 注销 → `@nestjs/schedule` cron job + audit_logs
- §9 AC 测试 → Jest e2e 测试套

### 12.7 待用户拍板

- 5 个新引入（15-19）的具体设计
- TDD 翻 TS 三批顺序是否同意
- 5 个可采纳（20-24）的 AGENTS 落点确认

---

## 11. UX review 追加（2026-06-07，用户提出 2 项）

### 11.1 🟡 UX-1: 归集推荐空状态引导

**问题**：用户首次使用（< 5 条日程）→ 归集推荐卡片为空 → 最糟糕的首次体验

**用户建议**：当日程 < 5 条时，用示例数据展示归集效果 + 引导继续创建

**受影响**：
- `src/pages/task/index.{wxml,ts,wxss}`（任务 Tab 首页）
- `src/services/task.ts`（归集 API 调用层）
- PRD §5 任务归集（需补空状态定义）

**待拍设计点**（4 选 1）：
1. **阈值**：5 条（与用户提一致）
2. **示例数据策略**：A 硬编码 / B 模板化 / C LLM 生成 / D 不做示例
3. **引导形态**：A 空状态卡片+CTA / B Toast / C 全屏 Onboarding / D 进度漏斗
4. **升级时机**：用户达到 5 条 → 示例自动消失 → 算法接管

**建议**（待用户确认）：
- 阈值 = 5
- 策略 = A 硬编码（工作/学习/生活各 1 个示例任务单）
- 形态 = A 空状态卡片 + 进度提示
- 升级 = 达到 5 条即切真实数据

**影响**：
- 实施阶段：M2-B（任务归集）
- AGENTS.md 是否需加 §5.2.2 通用规则"空状态需引导"：建议加

### 11.2 🟡 UX-2: 右滑采纳破坏性

**问题**："右滑自动将 AI 建议插入明日日程" = 高破坏性操作（误触 → 直接改真实日程）

**用户建议**：右滑 = 预览态 → 二次确认才写入

**受影响**：
- `src/pages/me/coach/`（教练 Tab）
- `src/components/coach-card/`（卡片组件）
- PRD §10.1 教练交互（需改描述）

**待拍设计点**（4 选 1）：
1. **交互流**：右滑 = 预览态（不写入）→ 二次确认 → 写入
2. **预览态内容**：建议文本 + 明日时间线 + 冲突高亮
3. **二次确认形态**：A 模态弹窗 / B 滑动距离 / C 长按 / D 双击
4. **撤销期**：写入后 5s Toast "已插入 [撤销]"
5. **"明日"边界**：按 `User.dayStartsAt` 切日界（与 coach-algorithm-spec §5.3 对齐）

**建议**（待用户确认）：
- 交互流 = 预览态 → 二次确认 → 写入
- 预览态 = 含时间线 + 冲突高亮
- 形态 = A 模态弹窗（最标准）
- 撤销期 = 5s Toast
- 日界 = `dayStartsAt`

**影响**：
- 实施阶段：M2-C（AI 教练）
- AGENTS.md 建议加 §5.2.2 通用规则 **#22 "重操作需要二次确认"**（适用范围：删除 / 批量改 / 跨日移动 / AI 建议采纳）

**待用户拍板**：
- UX-1 的 4 个 4 选 1 设计点
- UX-2 的 3 个 4 选 1 设计点
- 是否同意把 UX-1/UX-2 上升为 AGENTS.md 通用规则（§5.2.2 #22/#23）

