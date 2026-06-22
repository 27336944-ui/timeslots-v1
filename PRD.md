# timeslots-v1 产品需求文档 (PRD)

> 文档版本：v1.4（需求全景图 — 标记 [done] / [planned]）
> 状态：实际完成约 50%，剩余 [planned] 项目标注明确
> 适用范围：timeslots-v1 MVP
> **本次更新（v1.4）**：融合 workspace 历史文档（PRD v4 / 竞品分析 v3 / 路线重审 / 闭环逻辑评估 / UIUX 建议）全部信息点，新增 §18–§26（用户画像/成功指标/竞品定位/共享三级/透明度面板/埋点/发布策略/降级预案/代码规则 L19-L24）。已开发技术内容（§3–§12）保持不变，产品逻辑层（§0–§2、§13–§17、§18–§26）大幅增强逻辑性与合理性论述。

---

## 0. 产品哲学（总纲）

### 0.1 核心命题

**一个优秀的日程管理软件，核心是解决"日程如何生成"的问题。**

市面上绝大多数日历/待办工具回答的是"如何记录日程"——它们假设用户已经知道要做什么，只提供一个格子让你填。但真实世界里，用户面对的困境是：**我的一天是怎么被填满的？这些事情都从哪来？我能不能看见时间的去向？**

timeslots 不做更好的日历，也不做更好的待办清单。它回答一个更根本的问题：**每一格日程，都来自一个明确的源头。** 产品通过三条生成路径 + 一条分类脊柱，让用户第一次能看清"我的时间被谁、以什么方式、填进了什么"。

### 0.2 三条日程生成路径 + 分类脊柱

```
                        ┌─────────────────────────────┐
                        │      日程（TimeBlock）        │
                        │   一天 24h 的具体时间占用      │
                        └──────────────┬──────────────┘
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            │                          │                          │
     【路径一：外部驱动】         【路径二：内部驱动】         【路径三：自发驱动】
       预约 / 审批 / 委托            任务 → 拆步骤 → 排时间          手动 / 自然语言 / 模板
   "别人影响我的日程"            "我的目标拆解成行动"            "我现在就要记一件事"

                        【脊柱：分类体系】
                  工作 / 生活 / 私人（固定三大类）
                  + 用户自建子类（4 级 ≤ 20/级）
                  贯穿三条路径的数据骨架
```

**为什么是三条路径，而不是更多或更少**：

这三条路径穷尽了日程的来源——任何一条日程，要么是别人要求的（外部驱动），要么是自己目标分解出来的（内部驱动），要么是当下临时要记的（自发驱动）。不存在第四种。把路径数量收敛到三条，是为了让产品决策有清晰的取舍准则：

**三条路径的产品决策准则**：
- 凡是强化这三条路径的，做（审批流 ✅、委托流、AI 拆步骤、任务子类、自然语言建日程）
- 凡是偏离这三条路径的，不做（AI 自动排程、云备份、多端同步、付费、AI 聊天助手）

**为什么分类是脊柱而不是第四条路径**：分类不生成日程，它给已生成的日程赋予语义。没有分类，三条路径生成的日程都是无差别的时间占用；有了分类，用户才能回答"我的时间花在了哪"——这是从"记录时间"升级到"理解时间"的关键。分类必须贯穿三条路径，作为统一的数据骨架，否则三条路径的数据无法聚合统计。

**锚点模型补充**：TimeBlock 在三路径中充当"刚性锚点"角色——有明确起止时点、需与他人对齐或有强约束的时间块。根据刚性等级分为 `ABSOLUTE`（不可调整，如已确认会议、挂号通勤）和 `RELATIVE`（可小范围协商，如非正式对接、朋友聚会）。不设"弹性任务"独立实体——低优先级事项不占用 TimeBlock，仅作为自由任务存于 Task 中，由用户自行决定执行时机。锚点默认叠加缓冲时间（`bufferBefore`/`bufferAfter`），用于覆盖会前准备、通勤等隐性耗时。这等价于将旧 priority 语义（高/中/低）重新表述为刚性等级（ABSOLUTE/RELATIVE/自由任务），不改变三路径 + 分类脊柱的架构。详见 §4.2 刚性锚点语义规则。

### 0.3 当前完成度体检

| 路径 | 完成度 | 核心缺口 | 战略意义 |
|------|:------:|----------|----------|
| 路径一（外部驱动） | 🟡 半通 | 审批 ✅ / 委托流 ❌ / 推送通知 ❌（cron stub）/ 透明度面板 ❌ | 社交深化的关键 |
| 路径二（内部驱动） | 🔴 空心 | Task/Step 表 ✅ / AI 拆解 ❌ / AI 建议时间 ❌ / 线性依赖 ❌ | **产品心脏** |
| 路径三（自发驱动） | 🟢 够用 | 快速创建 ✅ / 模板 ✅ / 自然语言建日程 ❌ / iCal 导入 ❌ | 降低创建摩擦 |
| 分类脊柱 | 🟡 半通 | Category 表 ✅ / 子类 UI 强化 ❌ / 颜色图标 ❌ | 数据可理解性 |

**双引擎战略（v1.4 战略升级）**：路径一和路径二不是主次关系，而是**双引擎**——
- **路径一 = 微信社交协作引擎**（滴答清单做不到的**平台层**差异化）：群任务归集、群日程投票、群内委托、群可见性。滴答清单是"通过微信打开的单机工具"，社交停留在分享任务；timeslots 是原生小程序，能做微信不会给第三方 App 开放的群协作深度集成
- **路径二 = AI 拆解引擎**（滴答清单做不到的**质量层**差异化）：AI 拆解质量做到"啊确实该这么做"的惊喜感
- **交汇点**：转发群消息 → AI 解析出任务/截止/负责人 → 用户确认归集。AI 在协作场景有独特价值（把模糊聊天变成结构化任务），在个人场景也有价值（拆解个人目标）。AI 横跨两个场景的通用能力

**为什么是双引擎而非单引擎**：微信社交协作的需求确定性高（人人都经历过群里说了没人记得），但单独做可能变成和微信原生群工具竞争（群接龙/群投票/群待办）。AI 拆解的差异化独特但需求需验证。两者组合——"在微信里用 AI 把散落任务扭成可执行时间"——是滴答清单和微信原生功能都做不到的无人格子。
**诊断结论**：路径二是心脏，当前是空的——这是整个产品最该补强的部分。路径一有了审批骨架但委托流和通知是断的。路径三够用。优先级：**路径二 > 路径一 > 路径三**。

---

## 1. 产品定位

### 1.1 一句话定位

一款基于时间块（Time Block）的微信小程序日程管理工具，把待办和日历融合在一天 24 小时的时间轴上，**核心解决"日程如何生成"——通过外部协作（审批/委托）、内部目标拆解（任务→步骤→排期）、自发记录三条路径，让每一格时间都有明确来源**。

### 1.2 核心差异化（5 条，按战略重要性排序）

1. **以时间块为骨架**（品类定义级）— 一天划分为若干连续时段，每个时段承载一个具体事项。**视觉本质是"空间大小 = 时间长度"**——卡片高度必须与时长成正比，这是时间块产品与普通日历的本质视觉差异，不可妥协。
2. **任务拆解引擎**（核心差异化，v1.4 强调）— 任务 → AI 拆成有依赖的步骤 → AI 建议时间段 → 用户逐个确认。**区别于 Motion 的自动排程**，是"建议确认"模式——AI 是拆解引擎和建议引擎，不是调度引擎。Motion 在自动排程烧了几千万美元做 5 年，timeslots 不硬刚这个赛道。
3. **待办和日程同源** — 每条 todo 可选关联到某个时间块，未关联的留在"收件箱"。Task 是视图（聚合 TimeBlock），TimeBlock 是事实表（时间占用），两者通过 taskId 弱关联。
4. **审批/委托流协作** — 发起日程→分享卡片/短信给受邀人→对方同意后双方各生成独立日程。委托流更进一步：把任务拆成步骤发给对方，对方在自己时间轴上逐一安排，发起方实时看到进度。
5. **微信生态无缝** — 微信一键登录、分享卡片、订阅消息提醒。独有拉新通道：小程序卡片邀请（时间连接器）+ 时间名片海报引流，不依赖 App Store。

### 1.3 品类定位（来自竞品分析 v3 — 占据无人格子）

```
        个人使用               团队使用
        ─────────             ─────────
公司付费 │ 不存在               │ 钉钉/飞书/企微    │
个人付费 │ Todoist/TickTick     │ ClickUp/Asana      │
个人免费 │ timeslots ← 唯一格子  │ 不存在              │
```

**timeslots 是唯一一个"个人免费、不以团队为中心、不以项目为入口、而是以人为中心归集所有来源任务"的产品。** 它不是更好的 Todoist，不是更便宜的 Asana——它是一个不同的品类：**个人任务归集器**。现有工具是"你去管理项目"，timeslots 是"项目来找你，你管理时间"。

**为什么钉钉/飞书/企微做不了 timeslots 的事**：它们的收入来自企业订阅。如果推出免费、独立于企业、数据归属个人的版本，企业会问"我为什么还要付费"。这不是产品决策，是**财务自杀**——这就是 Clayton Christensen 说的创新者的窘境。在位者被商业模式锁死，是 timeslots 最强的护城河。

---

## 2. 目标用户

### 2.1 用户画像（5 类，来自 PRD v4 §3.1，映射三路径）

| 角色 | 特征 | 核心场景 | 主要路径 |
|------|------|---------|:--------:|
| **双职工父母** | 25-40 岁，有 3-12 岁子女 | 育儿时间协同——接送、辅导、家务分工 | 路径一（夫妻委托）+ 路径二（家务拆步骤）|
| **自由职业者** | 同时服务多个客户，无固定雇主 | 多客户 deadline 归集，按时间轴安排 | 路径二（任务拆解）+ 路径三（手动录入）|
| **斜杠青年** | 一份主业 + 一到两个副业 | 多角色时间分配，防止冲突 | 路径二 + 分类脊柱 |
| **创业合伙人** | 2-5 人团队，深度协作 | 互相知道工作时段，避免不当打扰 | 路径一（预约）+ 可见性 |
| **远程团队成员** | 跨时区协作 | 深度工作时段互相可见 | 路径一 + 时间连接器 |

### 2.2 共性特征

- 25–40 岁城市职场人士
- 已有时间管理意识（如阅读过《深度工作》《搞定》等）
- 日常工作需要在多个角色/项目间切换
- 重度微信用户，期望低安装/低切换成本
- **共同痛点**：任务散落在钉钉、飞书、微信、邮件中，没有统一归集视图；现有工具为公司设计，数据归属公司，离职后清零

### 2.3 用户故事（来自 PRD v4 §3.2）

| ID | 作为 | 我想要 | 以便于 |
|----|------|--------|--------|
| US-01 | 自由职业者 | 把来自 3 个客户的 deadline 归集到一张时间轴上 | 不用在钉钉、微信、邮件之间来回切换 |
| US-02 | 双职工父亲 | 让老婆看到我今天的空闲时段 | 她知道什么时候可以给我打电话，不用担心打断会议 |
| US-03 | 创业合伙人 | 把"重构用户模块"拆成 5 个步骤并发给李华 | 李华根据她的日程逐一安排，我不需要反复催 |
| US-04 | 斜杠青年 | 收到微信消息"周五前把报告做完"时，直接转发到 timeslots 创建任务 | 不需要手动录入 |
| US-05 | 隐私敏感者 | 随时查看"当前谁能看到我的哪些时间段"，一键暂停所有共享 | 我自己控制我的时间对谁可见 |
| US-06 | 所有用户 | 看到每条日程来自哪里——自建、别人委托、还是微信转发 | 知道我的时间是被谁占据的 |

### 2.4 成功指标体系（来自 PRD v4 §2.3 — v1.4 新增）

| 指标 | 目标值 | 测量方式 | 验证假设 |
|------|:------:|---------|----------|
| 单人模式次日留存 | ≥ 40% | 前端埋点 | 工具本身有用 |
| 委托发出→被回应率（24h 内）| ≥ 70% | 后端埋点 | 委托流被接受 |
| **委托用户 vs 非委托用户 30 日留存** | **≥ 1.5x** | 后端埋点 | **委托形成网络效应（金标准）** |
| 小程序卡片加载 | < 1.5s | 前端性能监控 | 微信生态体验 |
| 时间回应平均耗时 | < 45s | 前端埋点 | 委托接收低摩擦 |
| 模板应用后手动调整量减少 | ≥ 50% | 前端埋点 | 模板真有用 |

**金标准说明**：所有指标里，"委托用户 vs 非委托用户 30 日留存 ≥1.5x"是判断路径一（外部驱动）是否成立的根本标准。如果委托用户留存不显著高于非委托，说明委托流没有创造网络效应价值，产品方向需要重新评估。

---

## 3. 4 Tab 产品骨架（已实现）

客户端首页采用底部 4 Tab 导航（[done]）：

| Tab | 定位 | 一手数据 | 核心交互 |
|-----|------|----------|----------|
| **日程** | 用户主战场：日视图 24h 时间轴 + 日/周/月切换 | TimeBlock | 创建/编辑/查看/发起审批 |
| **协作** | 审批中心 + 圈子管理 | ApprovalRequest / Circle | 待我审批/我发起的/圈子 |
| **任务** | 跨日程的任务聚合 | Task | 列表/进度统计/步骤管理 |
| **我的** | 用户画像 + 账号设置 | User | 登录/注销/恢复 |

> **3 Tab 备选方案（v1.4 记录，待 v0.50 验证时 A/B 测试）**：UIUX 建议提出把 4 Tab 改为 3 Tab `[日程][收件箱][我的]`，"收件箱"合并协作+任务——本质都是"需要我处理的事"。此方案降低认知负载但损失功能明确性，暂不采纳，验证阶段评估。

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
| `pages/mine/settings` | 设置页（day_starts_at / 默认提醒 / 默认可见性） | ✅ [done] v0.28 |
| `pages/mine/coach` | AI 教练历史页 | ⏳ [planned] v0.51 |
| `pages/mine/quota` | 额度明细页 | ❌ [cancelled] 永久免费，无额度 |
| `pages/mine/transparency` | 透明度控制面板（一键隐身） | ⏳ [planned] v0.48 |
| `pages/schedule/create` | AI 多模态新建块 | ❌ [cancelled] 改为自然语言建日程 v0.49 |
| `pages/tasks/ai-decompose` | AI 任务拆解页（流式） | ⏳ [planned] v0.45 |
| `pages/tasks/delegation-detail` | 委托详情页（接收方：接受/拒绝/协商） | ⏳ [planned] v0.47 |
| `pages/tasks/import-ical` | iCal 导入页 | ⏳ [planned] v0.52 |

---

## 4. 数据模型（当前 12/16 实体已实现 [done]）

### 4.1 实体清单

| 实体 | 表名 | 关键字段 | 说明 | 状态 |
|------|------|----------|------|------|
| `User` | `users` | openid, nickname, settings | 用户账号 | ✅ [done] |
| `TimeBlock` | `time_blocks` | userId, title, startTime, endTime, status, taskId, rigidity, bufferBefore, bufferAfter, anchorType, category, categoryId, source, sourceId, nature, circleId, recurrence, recurrenceGroupId | 核心日程实体（刚性锚点语义见 §4.2） | ✅ [done] |
| `Circle` | `circles` | ownerId, name, description, inviteCode (unique), status, parentId, level, isFixed | 协作圈子（隐私标签） | ✅ [done] |
| `CircleMember` | `circle_members` | circleId, userId, role (OWNER/ADMIN/MEMBER) | 圈子成员 | ✅ [done] |
| `Task` | `tasks` | userId, title, goal, steps, status, priority, category, categoryId, dueAt, completedNote, retrospective | 任务项 | ✅ [done] |
| `Step` | `steps` | taskId, text, sortOrder, estimatedMinutes, status, timeBlockId, dependsOnId | 任务步骤（5 态状态机 + 线性依赖） | 🟡 [partial] 待升级 v0.44–0.45 |
| `Reminder` | `reminders` | userId, blockId, remindAt, leadMinutes, status | 日程提醒 | ✅ [done] |
| `Category` | `categories` | userId, name, parentId, level, isFixed, isDefault, color | 分类树（3 大类 + 子类） | ✅ [done] |
| `Template` | `templates` | userId, name, type, title, config, isSystem | 任务/日程模板 | ✅ [done] |
| `ApprovalRequest` | `approval_requests` | initiatorId, blockId, title, startTime, endTime, nature, categoryId, circleId, shareToken, status | 审批请求（反范式存日程副本） | ✅ [done] v0.22 |
| `ApprovalRecipient` | `approval_recipients` | requestId, contactType, contactValue, userId, status, blockId | 审批受邀人 | ✅ [done] v0.22 |
| `Comment` | — | — | 日程评论 | ❌ [cancelled] 移出 MVP |
| `RSVP` | — | — | 日程受邀确认 | ❌ [cancelled] 移出 MVP |
| `Quota` | — | — | AI 额度 | ❌ [cancelled] 永久免费 |
| `QuotaTransaction` | — | — | 额度流水 | ❌ [cancelled] 永久免费 |
| `CoachCard` | `coach_cards` | userId, type, content, readAt | AI 周报/教练卡 | ⏳ [planned] v0.51 |
| `Delegation` | `delegations` | type, initiatorId, recipientUserId, stepId, taskId, blockId, candidateSlots, status | 委托流（步骤执行 + 预约时间双场景） | ⏳ [planned] v0.46–0.47 |
| `RecurrenceException` | `recurrence_exceptions` | recurrenceGroupId, originalDate | 重复日程例外（跳过某天） | ⏳ [planned] v0.46 |
| `ImportLog` | `import_logs` | userId, source, imported, skipped | iCal 导入历史 | ⏳ [planned] v0.52 |
| `TaskGroup` | — | — | **已从 scope 移除**（category 替代） | ❌ [cancelled] |

### 4.2 核心规则

- **TimeBlock 是事实表** — 每条都是一段被占用的时间 [done]
- **Task 是视图** — 聚合相关 TimeBlock（通过 taskId）[done]
- **审批流** — 发起→分享卡片/短信→对方同意→双方各生成独立 TimeBlock [done] v0.22–0.26
- **Circle 为隐私标签** — work 分类日程仅"同事"圈可见，life 仅"家人"圈可见 [done] v0.27
- **软删双轨制** — `isDeleted Boolean` + `deletedAt DateTime?` [done]
- **分类脊柱** — 3 固定大类（工作/生活/私有，isFixed）+ 用户自建 4 级子类（每级 ≤20）；**归集兜底**：未选分类 → 工作/默认 [done] v0.39
- **任务拆解链（产品心脏）** — Task → Step（有线性依赖）→ TimeBlock（source='step'）；全部 Step done → 弹窗确认 Task done + 强制填复盘 [planned] v0.44–0.46
- **委托流双向** — 场景 A 委托步骤执行 + 场景 B 委托预约时间，复用审批流事务/乐观锁/空闲校验基础 [planned] v0.46–0.47
- **AI 角色边界** — AI 只做"拆解 + 建议时间段"，**不做自动排程**；时间段建议用纯规则算法（贪心 + 用户偏好），用户逐个确认 [planned] v0.45–0.46
- **来源追踪贯穿** — 每条 TimeBlock 标 source（manual/step/approval/template/import/delegation/nl）+ sourceId，用户一眼看到"这条日程从哪来" [done] v0.39（部分 source 值待补）
- **刚性锚点语义** — TimeBlock.rigidity 替代旧 priority 语义：`ABSOLUTE` = 不可调整的固定时间块（原"高优先级"），如已确认的会议、挂号通勤；`RELATIVE` = 可小范围协商的时间块（原"中优先级"），如非正式对接、朋友聚会。低优先级类事项不占用 TimeBlock，仅作为自由任务存于 Task 中。锚点默认叠加 `bufferBefore`/`bufferAfter` 缓冲时间（由 `anchorType` 决定默认值），用于覆盖隐性耗时 [planned] v0.49.5

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
| `StepStatus` | String `@default("pending")` | **升级为 5 态**: unscheduled/scheduled/in_progress/done/overdue | 🟡 [planned] v0.45 |
| `TimeBlockSource` | String? | "manual"/"step"/"approval"/"template"/"import"/"delegation"/"nl" | ✅ [done]（部分值待补） |
| `DelegationType` | String | "step_execution"/"appointment" | ⏳ [planned] v0.46 |
| `DelegationStatus` | String | pending/accepted/rejected/negotiating/completed/cancelled | ⏳ [planned] v0.46 |
| `SharingLevel` | String | "none"/"free_only"/"with_title"/"full" | ⏳ [planned] v0.48 |
| `TimeBlockRigidity` | String `@default("relative")` | "absolute"/"relative" | ⏳ [planned] v0.49.5 |
| `AnchorType` | String `@default("other")` | "meeting"/"commute"/"social"/"medical"/"other" | ⏳ [planned] v0.49.5 |
| `TransactionType` | — | — | ❌ [cancelled] 永久免费 |

---

## 5. 后端架构（NestJS DDD — 已实现）

### 5.1 模块清单（12 个已注册 + 5 个 planned）

| 模块 | 职责 | API 端点 | 状态 |
|------|------|----------|------|
| `health` | 健康检查（公开） | `GET /api/v1/health` | ✅ [done] |
| `auth` | JWT 登录 + 用户资料 + 注销/恢复 + 设置 | `POST /login`, `PATCH /profile`, `DELETE /account`, `GET/PATCH /settings` | ✅ [done] |
| `timeblock` | TimeBlock CRUD + 冲突检测 + 统计 + 分享名片 | `GET/POST /time-blocks`, `GET/PATCH/DELETE /time-blocks/:id`, `POST /check-conflicts`, `GET /stats`, `POST/GET /share-card`, `GET /namecard` | ✅ [done] |
| `circle` | 圈子 CRUD + 邀请码 + 加入/踢出 + 成员忙闲 | `GET/POST /circles`, `GET/PATCH/DELETE /circles/:id`, `POST /circles/:id/invite`, `POST /circles/join/:inviteCode`, `POST /circles/:id/members`, `GET /circles/:id/availability` | ✅ [done] |
| `task` | 任务 CRUD + 统计 + 从文本创建 | `GET/POST /tasks`, `GET/PATCH/DELETE /tasks/:id`, `GET /tasks/my/stats`, `POST /tasks/from-text` | ✅ [done] |
| `step` | 步骤 CRUD + 排期 | `POST /steps`, `GET /steps/by-task/:taskId`, `PATCH/DELETE /steps/:id`, `POST /steps/:id/schedule` | 🟡 [partial] 待升级线性依赖 v0.45 |
| `reminder` | 提醒 CRUD + cron | `GET/POST /reminders`, `PATCH/DELETE /reminders/:id` | ✅ [done]（推送 stub 待接） |
| `approval` | 审批流 CRUD + 分享 | `POST /approvals`, `GET /my-initiated`, `GET /my-pending`, `GET /:id`, `PATCH /:reqId/recipients/:recId`, `POST /resend`, `POST /cancel`, `GET /shared/:token`, `POST /bind` | ✅ [done] v0.22 |
| `category` | 分类树 CRUD + 初始化默认 | `GET/POST /categories`, `GET/PATCH/DELETE /categories/:id` | ✅ [done] v0.39 |
| `template` | 模板 CRUD + 应用 | `GET/POST /templates`, `GET/PATCH/DELETE /templates/:id`, `POST /templates/:id/apply` | ✅ [done] v0.40 |
| `search` | 跨模块搜索 | `GET /search?q=` | ✅ [done] v0.42 |
| `prisma` | 全局 PrismaService（$extends 软删） | — | ✅ [done] |
| `jobs` | 定时任务（reminder / recurrence / cleanup） | — | ✅ [done] |
| `llm` | MiniMax M3 代理 + AI 拆解 + 自然语言解析 | `POST /ai/decompose`, `POST /ai/parse`, `POST /ai/suggest-slots` | ⏳ [planned] v0.45/v0.49 |
| `delegation` | 委托流（步骤执行 + 预约时间） | `POST /delegations`, `GET /delegations/my`, `PATCH /delegations/:id/respond`, `POST /delegations/:id/deliver` | ⏳ [planned] v0.46–0.47 |
| `sharing` | 共享关系管理（三级 + 透明度面板） | `GET/PATCH /sharing/relationships`, `POST /sharing/stealth` | ⏳ [planned] v0.48 |
| `coach` | AI 周报 + 教练卡 | `GET /coach/cards`, cron 每周日生成 | ⏳ [planned] v0.51 |
| `import` | iCal 导入 | `POST /import/ical` | ⏳ [planned] v0.52 |

### 5.2 基础设施

| 组件 | 文件 | 说明 | 状态 |
|------|------|------|------|
| `BusinessException` | `common/exceptions/business-exception.ts` | 业务异常（5 位错误码） | ✅ [done] |
| `ErrorCodes` | `common/exceptions/business-exception.ts` | 预定义业务码 | ✅ [done] |
| `AllExceptionsFilter` | `common/filters/http-exception.filter.ts` | 全局异常 → `{code, message, data, path, timestamp}` | ✅ [done] |
| `TransformInterceptor` | `common/interceptors/transform.interceptor.ts` | 成功响应包装 | ✅ [done] |
| `JwtAuthGuard` | `common/guards/jwt-auth.guard.ts` | JWT 身份守卫 | ✅ [done] |
| `@CurrentUser` | `common/decorators/current-user.decorator.ts` | 从 JWT payload 提取 userId | ✅ [done] |
| `@Public` | `common/decorators/public.decorator.ts` | 跳过 JWT 验证 | ✅ [done] |
| `EventVisibilityService` | `modules/visibility/event-visibility.service.ts` | 圈子隐私标签可见性掩码 | ✅ [done] v0.27 |
| `WxSubscribeService` | — | 微信订阅消息发送（7 场景） | ✅ [done] v0.45 |
| `SmsService` | — | 短信网关（委托/审批用） | ✅ [done] v0.45（log-only，未接真实网关） |
| `SlotSuggester` | — | 时间段建议算法（纯规则，非 LLM） | ⏳ [planned] v0.47 |

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
| `--ts-primary` | `#10B981`（薄荷绿） | 工具动作色（FAB/主按钮/导航） |
| `--ts-social` | `#F59E0B`（暖橙） | 社交动作色（圈子/分享/邀请） |
| `--text-main` / `--text-secondary` / `--text-placeholder` | — | 文字层级 |
| `--bg-canvas` / `--bg-card` / `--bg-secondary` | — | 背景层级 |
| `--border-subtle` | — | 边框 |
| `--text-inverse` | — | 反色文字 |

**颜色语义原则**（v1.4 强调）：品牌色（绿）仅用于工具动作（导航/FAB/主按钮），社交色（橙）仅用于社交动作（圈子/分享/邀请）。分类色独立色板，不与品牌色撞色。优先级色阶：high=红/medium=黄/low=绿。状态色：todo=蓝/done=绿/cancelled=灰。

自定义组件：`BottomSheet` / `Cell` / `Skeleton` / `Tag` / `PrivacyAgreement` / `VisibilityBar` / `RelationPanel` / `CustomTabBar`（各带 styleIsolation: isolated）。

### 6.3 前端 Stores（6 [done] + 3 [planned]）

| Store | 文件 | 状态 |
|-------|------|------|
| `authStore` | `stores/authStore.ts` | ✅ [done] |
| `blockStore` | `stores/blockStore.ts` | ✅ [done] |
| `circleStore` | `stores/circleStore.ts` | ✅ [done] |
| `approvalStore` | `stores/approvalStore.ts` | ✅ [done] v0.23 |
| `taskStore` | `stores/taskStore.ts` | ✅ [done] |
| `userStore` | `stores/userStore.ts` | ✅ [done] |
| `stepStore` | `stores/stepStore.ts` | ⏳ [planned] v0.45 |
| `delegationStore` | `stores/delegationStore.ts` | ⏳ [planned] v0.46 |
| `coachStore` | `stores/coachStore.ts` | ⏳ [planned] v0.51 |

### 6.4 编码约束（AGENTS.md 强制执行）

- **严禁 `any`** → 用 `unknown` + 类型守卫
- **Page 双泛型** `Page<TData, TCustom>`，接口名 `XxxPageData` / `XxxPageMethods`
- **禁止 `PageData` 全局接口名冲突** → 用 `<Name>PageData` 形式
- **禁止 Taro / React / NutUI / px 单位**
- **WXML 用 `||` 替代 `??`**（WXML 不支持 nullish coalescing）
- **`wx.request` PATCH 需要 cast**（官方 TS method 类型不含 PATCH）
- **所有异步必须 `try/catch`** + fire-and-forget 用 `void` 前缀
- **TabBar 操作用类型断言** → `(this as unknown as WithTabBar).getTabBar?.()`，禁止 `(this as any)`
- **Toast 克制原则**（v1.4 强调）→ 操作成功不弹 Toast（直接 navigateBack 让用户看结果）；失败 Toast + 保留表单；删除用 Snackbar「已删除，可撤销」；网络错误用页面内嵌入式提示不挡内容

---

## 7. 后端编码约束

| 规则 | 说明 |
|------|------|
| Controller 薄 | 仅处理 HTTP + 参数校验 + 调 service |
| Service 厚 | 业务逻辑全部在 service |
| DTO 严格 | class-validator 装饰器 |
| BusinessException | 统一 5 位错误码 |
| 跨用户隔离 | 所有查询显式 `where: { userId }` |
| 软删 | `isDeleted` + `deletedAt`；`PrismaService.$extends` 读方法注入 `isDeleted: false` |
| 乐观锁 | `where: { id, version }` → P2025 → 40901 |
| Joi env | `.allow('').optional()` 防止空字符串拒绝 |
| **时区统一** | 中国日期边界必须用 `+08:00`，禁止裸 UTC `Z`（教训 L15） |
| **AI 失败降级** | LLM 超时/拦截/格式错 → 静默降级手动输入，**禁止弹错误 Toast** |

---

## 8. 测试覆盖（85+ tests passing）

| 模块 | 状态 |
|------|------|
| BusinessException + ErrorCodes | ✅ |
| TransformInterceptor | ✅ |
| HttpExceptionFilter | ✅ |
| AuthService | ✅ |
| TimeBlockService | ✅ |
| TaskService | ✅ |
| CircleService | ✅ |
| ReminderService | ✅ |
| HealthService | ✅ |
| ApprovalService | ⏳ [planned] v0.46 补测 |
| StepService | ⏳ [planned] v0.46 补测 |
| EventVisibilityService | ✅ [done] |
| SlotSuggester | ⏳ [planned] v0.47 补测 |

---

## 9. 技术栈总览

| 层 | 选型 | 部署 |
|----|------|------|
| 客户端 | 微信原生小程序 + TS + mobx-miniprogram | 微信小程序平台 |
| 后端 | NestJS + TypeScript + Prisma | 独立 Node.js 部署 |
| 数据库 | PostgreSQL 18（Windows native） | `localhost:5432` |
| 静态资源 | 微信云存储（wx.cloud） | 前端直传，fileID 入库 |
| 认证 | JWT + 微信 code2session | Dev: POST /auth/login |
| 推送 | 微信订阅消息（7 场景） + 短信网关（委托/审批） | ✅ [done] v0.45 |
| AI | MiniMax M3（拆解 + 自然语言解析） | ⏳ [planned] v0.45/v0.49 |
| 工具链 | ESLint + Prettier + Husky（pre-commit: tsc + eslint + test） | |

---

## 10. 里程碑完成状态

| M# | 名称 | 关键交付 | 状态 |
|----|------|----------|------|
| M1 | 基建脚手架 | 前端 src/ + 后端 NestJS + Prisma + /health | ✅ [done] |
| M2-A | 后端核心模块 | health/auth/timeblock/task/reminder/circle/approval（7 模块 ~42 API） | ✅ [done] |
| M2-B | 前端 4 Tab 绑定 | 6 stores + 11 页面 + 4 组件 + 设计系统 | ✅ [done] |
| M2-C | 前端工具链 | ESLint 基本配置 + prettier | ✅ [done] |
| M2-D | Bug 修复 | 审计修复 | ✅ [done] |
| M2-E | 测试 + 工具链奠基 | Jest + 77 tests + PRD 修正 | ✅ [done] |
| M2-F (v0.22–0.26) | 审批流 | ApprovalRequest/Recipient 实体 + 9 端点 + 审批中心 Tab | ✅ [done] |
| M2-G (v0.27) | 圈子可见性 | TimeBlock 加 nature/circleId + EventVisibilityService | ✅ [done] |
| M3-A (v0.28–v0.30) | 设置页 + 内测收尾 | day_starts_at + 隐私协议 | ✅ [done] |
| M3 (v0.31–v0.43) | 日程管理完整化 + 冷启动 + UX 三层 | 周月视图/冲突检测/重复日程/分类树/模板/时间名片/统计/搜索/手势/关系条 | ✅ [done] |
| **M4 (v0.44–v0.46)** | **架构债清偿 + 路径二心脏 + 推送工程** | **路径二地基（Step 线性依赖 + AI 拆解 + shareCard 持久化）+ Notification 框架 + 埋点基建 + 推送真实接入 + Prompt 4 变体 + overdue cron + 单测** | 🟡 [进行中：v0.44.5 ✅ / v0.45 ✅ / v0.46 ⏳] |
| **M5 (v0.47–v0.49)** | **路径二闭环 + 路径一 + 路径三** | **AI 建议时间 + 步骤联动 + AI 拆解预览页 + schedule behavior 拆分 + 委托流双场景 + 透明度面板 + 自然语言建日程** | ⏳ [planned] |
| **M6 (v0.50)** | **强制验证门禁** | **5 人真机观察测试 + 数据埋点回收 + 指标判定 + 定位决议（基于真实数据决定是否继续 v0.51+，不可跳过）** | ⏳ [planned] |
| **M7 (v0.51–v0.52)** | **AI 闭环 + iCal 导入** | **AI 周报/教练卡 + iCal 导入** | ⏳ [planned] |

> <!-- AI-EDIT 2026-06-14 by ZCode（技术指导）-->
> <!-- 本次仅微调 M4 状态：⏳ → 🟡 进行中（体现 v0.44.5 已 ✅ 完成）。M3/M4 版号边界未拆分，保持全文 M 号引用稳定。-->
> <!-- 待核对项（请后续维护者确认后删除本注释）：反馈原文要求"M4 = v0.41-0.43 ✅ / M5 = v0.44-0.46"，与当前 M3 吞并 v0.41-0.43 的写法存在出入。如需严格对齐反馈，需把 M3 截到 v0.40、v0.41-0.43 独立成 M4、后续 M 号顺延——但这会牵动 §11/§17 等处"M6 验证""v0.50 门禁"等引用，影响面较大，故本次按"最小变动"原则仅改 M4 状态。请核对后决定是否执行版号重排。-->

---

## 11. 当前已知限制

- **Husky pre-commit 已配** — `.husky/pre-commit` = `tsc --noEmit && eslint && cd server && jest`
- **MiniMax API Key 未配置**（`.env` placeholder）— LLM 端点待 v0.46
- 微信 `code2session` 已接入 dev 模式，真机待 v0.50 验证
- **分享卡片内存存储** — `POST /time-blocks/share-card` 生成的卡片存在 NestJS 进程内存 Map，重启丢失。v0.46 改数据库持久化
- 短信网关当前为 log-only（v0.45 已集成 SmsService 框架，未对接真实网关）— 内测阶段可接受
- Cron 仅 reminder/min + recurrence/day + cleanup/day
- **推送通知已升级**（v0.45）— `WxSubscribeService` + `SmsService` + `ReminderCron` 真实推送 + `ApprovalService`/`StepService` hooks。仍需在微信公众平台配置 templateId 后真机验证
- **审批副本字段已修复** — nature/categoryId/circleId 已补
- **Step 5 态未对齐** — schema 仍是 `pending` 默认，PRD 设计是 5 态 — v0.46 升级
- **步骤无线性依赖** — Step 表尚无 `dependsOnId` — v0.46 新增
- **AI 拆解是 stub** — LLM service `throw 'deferred'` — v0.46 实现 + Prompt 工程
- **共享关系仅 nature 三态** — 缺三级粒度（完整/仅空闲/单次）— v0.48 补
- **透明度面板未做** — 无一键隐身 — v0.48 随委托流上线
- **数据埋点 2/16** — v0.45 已埋 `task_create`(source) + `step_schedule`(from→to)，剩余 14 事件 v0.49 前补全
- **AI 拆解无任务类型分治** — Prompt 只一个通用模板，输出缺乏差异化 — v0.46 Prompt 工程专项（报告/会议/开发/家务 4 变体）
- **iCal 导入未做**（导出明确不做）— v0.52 做导入

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
| 40301 | 无权访问 | 访问他人私有 TimeBlock |
| 40401 | 资源不存在 | id 不存在或已软删 |
| 40901 | 乐观锁冲突 | 并发修改 |
| 50000 | 未处理异常 | 兜底 |

---

## 13. 路径二核心：任务 → 拆步骤 → 排时间（产品心脏）

> 本章定义产品的核心差异化，是"追 AI 拆解，不追 AI 排程"战略原则的具体落地。

### 13.1 为什么路径二是心脏

路径一（外部驱动）依赖有共享关系的对方，路径三（自发驱动）没有技术门槛，只有**路径二（任务→拆步骤→排时间）是 timeslots 能做、别人做不了的事**——它把"我有目标"到"我什么时候做"之间的鸿沟，用 AI 拆解 + 规则建议 + 用户确认填补。这条路径跑通，timeslots 就从"日历工具"升级成"时间生成引擎"。

竞品做不到的原因：Todoist/滴答清单任务是平铺的，没有"拆成有依赖的步骤再排期"；Motion 做自动排程但太重太贵；ClickUp 太复杂。timeslots 占据的是"轻量拆解 + 建议确认"的无人格子。

### 13.2 Step 五态状态机 + 触发条件

```
                    ┌─────────────┐
                    │ unscheduled │ ← 初始状态（拆解后、未排时间）
                    └──────┬──────┘
                           │ 用户拖入时间轴 / 点击[排时间] / AI 建议确认
                           ▼
                    ┌─────────────┐
            ┌──────│  scheduled  │ ← 已安排到具体时段（timeBlockId 有值）
            │      └──────┬──────┘
            │             │ 当前时间 > TimeBlock.startTime（可选状态，可跳过）
            │             ▼
            │      ┌─────────────┐
            │      │ in_progress │ ← 正在执行
            │      └──────┬──────┘
            │             │ 用户标记完成
            │             ▼
            │      ┌─────────────┐
            │      │    done     │ ← 终态（completedAt 有值）
            │      └─────────────┘
            │
            │      ┌─────────────┐
            └─────→│   overdue   │ ← 系统自动判定：当前时间 > startTime
                   └─────────────┘   且 status != done，每小时 cron 扫描
```

**完整触发条件表**（来自 PRD v4 §4.3，v1.4 补全）：

| 当前状态 | 目标状态 | 触发条件 |
|---------|---------|---------|
| unscheduled | scheduled | 用户为步骤创建 TimeBlock 关联 |
| scheduled | in_progress | 系统时间到达 TimeBlock.startTime（可选，可跳过此状态） |
| scheduled | done | 用户标记完成 |
| scheduled | overdue | 系统时间 > TimeBlock.startTime 且用户未标记完成，**每小时 cron 扫描一次** |
| overdue | done | 用户标记完成（逾期后仍可完成） |
| scheduled | unscheduled | 用户移除步骤与 TimeBlock 的关联（取消安排，可回退） |

### 13.3 线性依赖运行时逻辑

- 步骤 A 未 done 时，步骤 B（`dependsOnId = A.id`）的 `blocked = true`
- blocked 步骤无法被 schedule（前端禁用"排时间"按钮）+ 显示 🔒 + "等待【步骤A】完成"
- 步骤 A 变 done 时，自动解锁步骤 B + 推送通知"前置步骤完成，可以开始..."

**为什么支持线性依赖**：真实任务的步骤往往有先后（写报告→评审→定稿）。不支持依赖，用户只能脑记顺序，拆解的价值打折。支持依赖后，AI 拆解直接输出依赖图，用户不用手动标注。

### 13.4 AI 拆解流程

```
用户在任务详情页点"AI 拆解"
  → 输入/编辑任务目标（默认填 task.goal）
  → AI 流式返回 3-7 个有依赖的步骤（SSE 打字机效果）
  → AI 自动标注 dependsOnIndex（链式依赖）
  → 用户可编辑（删/排序/改文字/改估时/调依赖连线）
  → 点"创建步骤" → 生成 Step + 依赖关系
  → 进入"AI 建议时间段"环节
```

**Prompt 设计要点**：
- 角色："timeslots 的时间管理教练"
- 规则：步骤必须动词开头、独立可执行、30 分钟粒度估时、3-7 个、线性依赖
- 上下文注入：occupation / residence / category / 最近 7 天空闲
- 输出严格 JSON：`{ steps: [{text, estimatedMinutes, dependsOnIndex}], totalMinutes, rationale }`

**降级兜底（关键，决定 AI 体验成败）**：MiniMax 超时 8s / 内容安全拦截 / 格式错 → **不弹错误 Toast**，无缝切换"手动添加步骤"输入框。用户感觉不到 AI 失败，只觉得这次得自己写。这是 AI 体验成败的关键——绝不让用户看到"AI 出错了"。

**输出质量标准（差异化生命线，v1.4 新增）**：通用模板"收集→计划→执行→检查→输出"是**不合格输出**——任何用户自己都能想出来，毫无差异化价值。合格输出的标准是"针对具体任务给出具体步骤，让用户产生'啊，确实该这么做'的惊喜感"。对照基准：

| 任务输入 | ❌ 不合格（通用模板） | ✅ 合格（任务类型感知） |
|---------|---------------------|----------------------|
| 写季度报告 | 收集资料→制定计划→执行→检查→输出 | 收集 Q3 各业务线营收数据→整理核心指标环比→撰写初稿（聚焦亮点+风险）→内部评审收口→终稿定版发送 |
| 准备周会 | 收集→计划→执行→检查→输出 | 回顾上周 action item→整理本周关键进展→准备讨论议题→制作汇报材料→会前发送材料 |
| 开发新功能 | 收集→计划→执行→检查→输出 | 阅读需求文档→设计技术方案→实现核心逻辑→写单元测试→代码审查 |
| 打扫卫生 | 收集→计划→执行→检查→输出 | 收集脏衣物→分类洗涤→晾晒→叠放收纳→清理地面 |

**Prompt 分类路由架构（v1.4 新增）**：不可指望一个 Prompt 通吃所有任务类型。必须两步走：
1. **轻量分类 Prompt**：先让 AI 判断任务类型（报告/会议/开发/家务/其他）
2. **专用 Prompt 路由**：根据分类结果路由到对应专用 Prompt（每个含 few-shot 示例）
3. **通用 Prompt 兜底**：无法分类时回退通用 Prompt

Prompt 管理为 `server/src/prompts/` 目录下多文件：`classify.md` + `decompose-report.md` + `decompose-meeting.md` + `decompose-dev.md` + `decompose-household.md` + `decompose-general.md`，版本化管理。

**持续调优闭环**：上线后收集用户"删除/修改了哪些步骤"的数据，反推 Prompt 哪里不好，迭代。验收标准：找 10 个真实任务输入，输出结果让 3 个同事看——说"挺合理"算及格，说"啊这个我没想到"算优秀。
### 13.5 AI 建议时间段（纯规则算法，非 LLM）

**核心边界**：AI 只建议，用户逐个确认。**不做自动排程**（区别于 Motion）。

```
步骤拆解完成（有依赖链）
  → 用户点"AI 建议时间段"
  → 后端读：用户空闲段 + 用户设置（dayStartsAt/默认时长/避免时段）+ 步骤依赖 + 估时
  → 纯规则算法生成建议（贪心：找 earliestStart 后第一个能容纳估时的空闲段）
  → 返回 [{stepId, suggestedStart, suggestedEnd, reason}]
  → 前端逐个展示卡片，用户操作：
     ✅ 接受 → 生成 TimeBlock（source='step', sourceId=stepId）
     ✏️ 改时间 → 弹选择器
     ⏭️ 跳过 → 保留 unscheduled
     ❌ 拒绝 → 标记"暂不排期"
```

**为什么用规则而非 LLM**：省钱省时（毫秒级）、可解释（reason 字段告诉用户为什么建议这个时间）、可调（改设置立即生效）。LLM 适合"理解意图"（拆解），不适合"约束求解"（排期）。

**为什么不自动排满**：自动排程的用户感受是"被算法控制"，出错成本高（排错了要逐个改），信任建立慢。建议确认模式让用户每次都拍板，信任建立快。这是 timeslots 与 Motion 的核心分界线。

### 13.6 步骤完成 → 任务完成联动

- 全部步骤 `status === 'done'` → 任务卡片显示"全部步骤已完成"绿色徽章
- 弹窗"所有步骤完成了，要标记任务完成吗？"
- 用户确认 → `task.status = 'done'` + **强制填 completedNote + retrospective**
- **不自动标记 done**——步骤完成 ≠ 目标达成，可能还要补充；强制复盘让任务真正闭环（而非只是勾选完）

---

## 14. 路径一：微信社交协作（委托流 + 群协作）

### 14.1 为什么委托流是路径一的核心

审批流是"邀请你参加我已定好的日程"，是单向的——发起方定时间，接收方只能同意/拒绝。但真实协作里更常见的是"帮我做这件事，时间你定"——这是委托流。委托流让接收方在自己的时间轴上安排，发起方实时看到进度。**这是从"告诉你做什么"进化到"信任你安排"的社交深化**。

### 14.2 双场景设计

**场景 A：委托步骤执行（"帮我做这件事"）**
```
任务详情页某步骤 → 点"委托"
  → 选委托对象（圈子成员/手机号/微信好友）
  → 填委托说明 + 截止时间
  → 对方收到通知 → 看到委托详情
  → 接受/拒绝/协商改时间
  → 接受后：被委托方任务列表多"来自委托"任务，可自己拆步骤排时间
  → 完成后：被委托方点"完成并交付" → 委托方确认验收 → 原步骤 done
```

**场景 B：委托预约时间（"找个时间碰个头"）**
```
日程详情页点"发起预约"（区别审批的"邀请参加"）
  → 选预约对象 + 提供 2-3 个候选时间段
  → 对方收到 → 选一个时间接受 / "都不行"拒绝
  → 接受后：双方日历各生成 TimeBlock（source='appointment'）
```

### 14.3 委托接收页交互设计（来自 PRD v4 §5.3.2，v1.4 吸收）

接收方面对的不是消息列表，而是**并排时间轴**——左侧是接收方现有日程，右侧是委托的待安排步骤，空闲时段高亮：

```
┌──────────────────────────────────┐
│ 张明需要你帮忙                    │
│ 重构用户模块 · 周五 18:00 前      │
├──────────────────────────────────┤
│ 你的时间轴                       │
│ 周三                             │
│ 09:00 [████████] 站会            │
│ 10:00 [        ] 空闲 2h        │ ← 空闲时段高亮
│ 12:00 [████████] 午休            │
│ 14:00 [        ] 空闲 3h        │
├──────────────────────────────────┤
│ 待安排的步骤（拖入时间轴）        │
│ ○ 阅读现有代码        2h  [安排] │
│ ○ 设计新接口          1h  [安排] │
│ ○ 实现核心逻辑        3h  [安排] │
├──────────────────────────────────┤
│         [确认所有安排]            │
└──────────────────────────────────┘
```

**关键设计点**：
1. 左侧时间轴 + 右侧待安排步骤并排（不分两个页面）
2. 空闲时段高亮（用户一眼看到能塞进去的空隙）
3. [安排] 按钮默认推荐第一个能容纳估时的空闲段
4. 空闲不足时提示"需要 Xh 可用 Yh 建议协商截止"但**不阻塞**安排
5. 接收方拒绝委托 → 所有步骤状态变 expired，发起方收到通知

**降低接收方（B）接受成本（v1.4 新增，决定委托流成败）**：委托流最大风险是 B 说"微信回你就行"。降低 B 接受成本的 4 个设计：
1. **B 不需注册即可查看委托**：分享链接 H5 打开，看到委托详情 + 步骤 + 截止时间，降低"要先注册"的心理门槛
2. **B 接受只需 1 步**：点"接受"即把步骤塞进 B 的时间轴（已注册）或引导注册（未注册）
3. **系统自动预填 B 的时间轴**：接受后用 SlotSuggester 给每个步骤建议时间，B 只需确认而非从零安排
4. **委托通知带"钩子"**：不是"张明委托你 3 件事"，而是"张明委托你 3 件事，预计 2h，你的周三下午有空"——让 B 觉得"已帮我安排好"

### 14.4 数据模型与审批流的关系

`Delegation` 表（见 §4.1），字段：type / initiatorId / recipientUserId|recipientPhone|shareToken / stepId|taskId|blockId / candidateSlots / status / message / deadline / acceptedSlot。

独立实体但架构一致（复用事务 + 乐观锁 + `checkConflicts`）。**不修改已有 TimeBlock/Circle 表结构**。确认排期是原子事务：校验空闲 → 创建 TimeBlock → 更新 step.timeBlockId → 更新 status。

### 14.5 群任务归集（v1.4 新增 — 微信社交协作核心场景）

**场景**：群里说了"周五交方案""下周一做 presentation"，淹没在聊天流里，没人整理。

**产品流程**：
```
群成员长按聊天消息 → 转发到 timeslots 小程序
  → AI 解析消息（复用 /ai/parse）→ 提取 {任务标题, 截止时间, 涉及人员}
  → 用户确认/编辑 → 归集到该群的"协作面板"
  → 群成员可见：谁领了、谁在做、什么时候做
```

**权限约束（确定性边界）**：微信小程序**不能**主动读取群消息/群成员列表/群公告。入口是**用户主动转发**驱动的。timeslots 是"协作收纳箱"不是"消息解析器"。这决定了产品形态——降低手动归集的摩擦（AI 解析一条消息即得结构化任务），而非追求自动抓取。

**关键设计**：
1. 转发摩擦极低：长按消息→转发到 timeslots→AI 已解析好→只需确认
2. AI 解析是群场景的**杀手锏**——这是 AI 拆解引擎在协作场景的价值，不只是个人拆解
3. 群协作面板按群分组（通过 shareTicket 识别群），展示该群所有归集任务
4. 任务可"认领"（谁领了谁负责）+ "排期"（领了的人排到时间轴）

### 14.6 群日程投票（v1.4 新增）

**场景**："我们什么时候开会"→ 七嘴八舌讨论 20 分钟。

**产品流程**：
```
发起人在 timeslots 选 2-3 个候选时间段
  → 生成小程序卡片 → 分享到群
  → 群成员点卡片 → 选一个时间投票
  → 自动选最多人选的时间 → 双方日历同步
```

**与微信原生群投票的区别**：微信群投票是"信息决策"（选什么），timeslots 群日程投票是"时间决策"（什么时候）+ 自动同步到各自时间轴。这是微信原生功能不覆盖的时间维度。

### 14.7 群可见性分层（v1.4 新增 — 隐私在群场景更复杂）

**问题**：用户可能愿意让特定好友看到忙闲，但不愿意让整个群看到。

**分层模型**：
| 层级 | 可见内容 | 适用场景 |
|------|---------|---------|
| 群全员 | 仅忙闲（不暴露内容）| 默认，降低社交压力 |
| 群主/管理员 | 忙闲 + 归集任务标题 | 管理需要 |
| 特定好友（群内）| 完整共享（标题+描述）| 深度协作者 |

**与 §18 透明度面板的关系**：透明度面板（一键隐身）在群场景下更关键——没有它用户不敢在群里暴露日程。群可见性分层是透明度面板的群场景扩展。

### 14.8 微信群协作的验证指标（v1.4 新增）

除了 §2.4 的金标准（委托用户 vs 非委托 1.5x 留存），群场景需要额外指标：

| 指标 | 目标 | 验证假设 |
|------|:----:|---------|
| **群内协作完成率** | ≥60% | 通过 timeslots 发起并被完成的协作任务 / 群里口头布置的任务总数。回答"timeslots 真的让群协作更靠谱了，还是多了一个步骤" |
| **转发→归集转化率** | ≥70% | 用户转发群消息到 timeslots 后，确认归集的比例。回答"AI 解析是否足够准确到用户愿意确认" |
| **群成员激活率** | ≥30% | 群内收到 timeslots 卡片后点开的成员比例。回答"群场景能否拉新" |

---

## 15. 路径三补全：自然语言建日程 + iCal 导入

### 15.1 AI 自然语言建日程（PRD 未规划，v1.4 强烈建议补）

```
首页输入框打字："明早 9 点和李总开会讨论 Q4"
  → 实时调 POST /ai/parse（debounce 500ms）
  → 返回 {type, title, startTime, endTime, recurrence, category, confidence, ambiguous}
  → 预览卡片：📅 [明早 9:00-10:00] 和李总开会讨论 Q4 [工作]
  → [创建] 直接建块 / [编辑] 进 detail 微调
```

**为什么这个功能比拆解更高频**：拆解一个月用几次，自然语言建日程**每天都用**。它把创建摩擦从"填 3+ 字段表单"降到"打一句话"。MiniMax 中文能力强，天然适合。微信转发创建（v0.41）可升级为"转发消息→AI 解析→一键建日程"，复用 `/ai/parse`。

AI 判断 type（schedule 还是 task），置信度 <0.7 时弹分类选择器。支持 recurrence 解析（"每天/工作日/每周/每月"）。

**AI 拆解预览页（增长破冰，v1.4 新增）**：当前用户从打开到体验 AI 拆解要 4 步（扫码→登录→建任务→拆解）。预览页把它压到 2 步（扫码→输入）。规格：
- 纯前端 Demo 页，**不登录可见**→输入自然语言→展示预设/真实拆解结果→"被惊艳了再注册"引导
- 预设 3-5 个**惊艳示例**（如"准备下周的晋升答辩"），用户一点即看拆解
- 拆解结果用**卡片动画逐条出现**（视觉冲击）
- 底部 CTA："想拆解你自己的任务？注册 timeslots"
- **必须真实调 MiniMax**，禁用 mock——否则用户注册后发现"拆解和预览不一样"会失望
- 路由：`pages/public/ai-preview/index`（公开页，无需 auth）

### 15.2 iCal 导入（导出明确不做）

PRD 战略原则"无导出/备份"。但"无云备份"≠"无本地导入"。iCal 导入解决"换工具数据没了"恐惧，不违背隐私定位（本地解析，不上云）。导出明确不做。

```
用户上传 .ics 文件或粘贴内容
  → 后端用 ical.js 解析 VEVENT
  → 查重（同 UID + userId）
  → 分类映射（标题含"会议/standup"→工作/会议；含"健身/体检"→生活/健康）
  → 处理 RRULE → recurrence 字段
  → 时区转换 UTC → Asia/Shanghai
  → 批量创建 TimeBlock（source='import'）
  → 返回导入报告：成功 N 条，跳过 M 条（重复）
```

---

## 16. 通知与触达：让三条路径活起来

当前所有推送 stub 已在 v0.45 替换为真实 `WxSubscribeService`（需在微信公众平台配置 templateId 后方可在真机验证）。短信网关保持 log-only。

### 16.1 微信订阅消息 7 场景

| 场景 | 模板用途 | 触发时机 | 对应路径 |
|------|---------|---------|:--------:|
| 日程提醒 | "10分钟后有会议" | reminder 到点 | 全部 |
| 审批邀请 | "XX 邀请你参加..." | 审批创建时 | 路径一 |
| 审批结果 | "XX 同意了你的邀请" | 审批回应时 | 路径一 |
| 委托请求 | "XX 请你帮忙..." | 委托发起时 | 路径一 |
| 委托完成 | "XX 完成了你委托的事" | 委托交付时 | 路径一 |
| 步骤解锁 | "前置步骤完成，可以开始..." | 依赖步骤 done 时 | 路径二 |
| 周报生成 | "你的本周时间报告" | 每周日 20:00 | 路径二 |

### 16.2 短信网关（委托/审批用）

仅委托/审批场景用（日程提醒用订阅消息）。接阿里云或腾讯云短信，内容含短链 `https://timeslots.app/d/{token}`，跳 H5 引导注册小程序。

### 16.3 订阅授权 UX

首次操作时 `wx.requestSubscribeMessage` + 授权状态持久化。拒绝后降级：关闭提醒选项并显示"已关闭提醒（可进入设置重新开启）"，不阻塞流程。

**推送规范三原则（v1.4 新增，决定协作功能是否"活"）**：
1. **授权时机**：不要在 App 启动时弹（用户会拒绝）。在用户**主动创建第一个提醒/审批/委托时**弹，此时用户有明确意图，授权率最高
2. **推送内容要有信息量**：不是"您有一个提醒"，而是"15 分钟后：季度复盘会 @会议室A"。模板必须支持动态参数（标题/时间/地点）
3. **推送失败静默降级**：用户拒绝授权或网络问题，推送失败不报错，静默记日志。用户绝不该看到"推送失败"提示

---

## 17. 战略原则（产品长期决策）

| 原则 | 说明 |
|------|------|
| **核心是"日程如何生成"** | 三条路径（外部驱动/内部驱动/自发驱动）+ 分类脊柱，所有功能取舍围绕这个 |
| **追 AI 拆解，不追 AI 排程** | Motion/Reclaim 在自动排程烧了几千万。timeslots 是"建议确认"模式，AI 只拆解 + 建议时间，用户拍板 |
| **先基础数据，再社交体验** | 分类树 + 来源追踪 + 模板是基础设施。数据层没做好前不进社交功能 |
| **隐私信任是社交的前提** | 隐私信任体系和效率闭环同等重要。用户必须看到"我的时间只属于我"才放心共享。**没有透明度面板，用户不敢开启共享，路径一无法成立** |
| **微信生态冷启动** | 小程序卡片邀请 + 时间名片海报引流，不依赖 App Store |
| **UX 一体化：三层同步落地** | 话语体系（文案）→ 交互手势（操作）→ 信息密度（内容），分阶段交付 |
| **先验证，后建设** | v0.50 完成后是强制验证门禁。不要做到 v0.55 才知道产品有没有价值 |
| **向后兼容不是可选项** | 旧字段保留不删、标记 `@deprecated`。旧版本前端不崩、回滚可恢复 |
| **永久免费、无商业化** | 无付费、无 AI 额度、无充值、无订阅、无导出（导入可做）/备份 |
| **固定三大类 + 可配置子类** | 分类：工作/生活/私有（不可删改移动）+ 4 级子类（≤20/级）。圈子：同事/朋友/亲人 + 3 级子圈。归集兜底。管理入口仅"我的" |
| **不做清单（战略定力）** | ❌ AI 自动排程 ❌ 云备份 ❌ 多端同步 ❌ 付费 ❌ AI 聊天助手 ❌ AI 情绪分析 ❌ 多模态拍照 ❌ iCal 导出（现阶段） ❌ Taro/RN 重写 ❌ 继续堆 UI 微调（v0.33-0.43 已调 11 版，边际递减） |

| **双引擎差异化（v1.4 战略升级）** | 微信社交协作 = 平台层差异化（滴答做不到，微信不给第三方 App 开放群深度集成）+ AI 拆解 = 质量层差异化（滴答做不到的拆解质量）。两者组合"在微信里用 AI 把散落任务扭成可执行时间"是无人格子。**不是二选一，是双引擎** |
| **微信原生功能不覆盖时间维度（v1.4 新增）** | 微信群工具（公告/接龙/投票/待办）是信息工具，timeslots 是时间工具。timeslots 不和微信原生功能竞争，它补的是"这个任务什么时候做、你的时间轴怎样、共同空闲在哪"这个微信不覆盖的维度 |
| **协作收纳箱而非消息解析器（v1.4 新增）** | 微信小程序不能自动读群消息，只能用户主动转发。产品形态是"降低手动归集摩擦"（AI 解析转发消息即得结构化任务），不追求自动抓取。**转发摩擦必须极低**——长按→转发→AI 解析好→确认，4 步以内 |
---

## 18. 共享关系三级 + 透明度面板（v1.4 新增 — 隐私信任体系）

> 本章是"隐私信任是社交前提"战略原则的具体落地。当前只有 nature 三态（PUBLIC/PRIVATE/CIRCLE_ONLY），粒度不够。共享关系需要更细的三级粒度 + 集中控制面板。

### 18.1 共享关系三级状态机

```
         ┌──────────┐
         │ 不共享    │ ← 默认状态。新用户所有数据仅自己可见
         └────┬─────┘
              │ 用户主动开启共享、选择共享对象和级别
              ▼
    ┌─────────────────┐
    │     共享中       │
    │                  │
    │  ┌─────────────┐ │
    │  │ 完整共享     │ │ ← 对方看到所有日程（标题+时间+描述）
    │  ├─────────────┤ │
    │  │ 仅空闲       │ │ ← 对方只看到空闲时段，不暴露内容（时间连接器做到的）
    │  ├─────────────┤ │
    │  │ 单次邀请     │ │ ← 仅共享这一条日程
    │  └─────────────┘ │
    └────────┬────────┘
             │ 用户调整级别 / 撤回共享
             ▼
        ┌──────────┐
        │ 已撤回    │ ← 对方时间轴自动移除用户数据，无通知
        └──────────┘
```

**为什么需要三级而非两极**：隐私敏感用户的核心需求是"让你知道我忙不忙，但不让你知道我在忙什么"——这正是"仅空闲"级。当前时间连接器（shareCard）做到了对外只显示忙闲，但这是一次性的卡片，不是持续的共享关系。三级粒度让用户精确控制每段关系的信息暴露度。

### 18.2 透明度控制面板

| 元素 | 功能 |
|------|------|
| 共享对象列表 | 头像 + 名字 + 当前共享级别，每个对象有独立的三级滑块（仅忙闲/含标题/含详情）|
| **一键隐身** | 开关，开启后所有共享暂停，主色调变灰，顶部显示"🔒 时间已隐藏" |
| 恢复上次 | 一键恢复隐身前的共享设置 |
| 临时共享管理 | 显示所有 7 天有效期的临时共享，到期前 24h 提醒续期 |

**为什么透明度面板是路径一成立的前提**：没有这个面板，用户面对"要不要开启共享"的决策时，焦虑感会压倒收益感——"开了之后谁能看到？能随时关吗？关了对方知道吗？"。面板把所有共享关系集中可视化 + 一键隐身兜底，让用户敢于尝试共享。**这是社交冷启动的心理门槛降低器**。

---

## 19. 数据埋点体系（v1.4 新增 — 验证门禁的数据基础）

> 当前代码 0 埋点。v0.50 验证门禁需要数据，必须在 v0.49 前完成埋点基建。

### 19.1 核心埋点事件（10 个）

| 事件名 | 参数 | 说明 | 验证假设 |
|--------|------|------|----------|
| `task_create` | source(manual/ai/wechat), category_id, has_delegation | 任务创建 | 路径二使用率 |
| `step_schedule` | task_id, from_status, to_status | 步骤排时间 | 路径二闭环率 |
| `delegation_send` | to_user_id, step_count | 委托发出 | 路径一活跃度 |
| `delegation_respond` | delegation_id, action(accept/reject) | 委托回应 | 委托接受率 |
| `share_card_generate` | date | 时间连接器生成 | 冷启动引擎 |
| `share_card_open` | token, from_source(wechat/qr/link) | 时间连接器被打开 | 拉新转化 |
| `namecard_generate` | — | 时间名片生成 | 社交货币使用 |
| `privacy_panel_open` | — | 透明度面板打开 | 隐私焦虑指标 |
| `privacy_stealth_toggle` | new_state(on/off) | 隐身模式切换 | 共享意愿 |
| `template_apply` | template_type | 场景模板应用 | 模板价值 |

### 19.2 埋点实现原则

- 前端埋点（wx.reportEvent 或自建上报）+ 后端事件落库（EventLog 表，可选）
- 关键漏斗：task_create → step_schedule → delegation_send → delegation_respond，每一环转化率都要可查
- 隐私合规：埋点不含日程内容，只含结构化参数（source/category_id 等）

---

## 20. 发布策略与降级预案（v1.4 新增 — 来自 PRD v4 §7）

### 20.1 发布策略

| 阶段 | 用户量 | 策略 |
|------|--------|------|
| 体验版 | 自己 + 2 个亲密朋友 | 微信小程序体验版，无需审核，扫码可用 |
| 内测 | 20 人 | 找到 10 个有"多来源任务"痛点的人。观察行为数据，不做 NPS |
| 小推广 | 100-500 人 | 即刻/豆瓣/V2EX 发帖，审批流自然增长 |
| 正式版 | 500+ | 提交微信审核，正式上线 |

### 20.2 配置化要求

| 配置项 | 配置位置 | 默认值 |
|--------|---------|--------|
| shareCard 过期时间 | 后端常量 | 7 天 |
| 模板列表（isSystem=true）| DB Template 表 | 3 套 |
| AI 拆解开关 | 后端环境变量 | `AI_DECOMPOSE_ENABLED=false`（v0.45 前灰度控制） |

### 20.3 降级应急预案

| 异常 | 降级方案 |
|------|---------|
| AI 服务不可用 | "AI 拆解"按钮灰色 + "AI 暂时不可用"。用户可手动添加步骤 |
| shareCard 重启丢失 | 提示"卡片已过期请重新生成"。v0.45 改 DB 持久化 |
| 微信审核被拒 | 准备 H5 备用页面，关键功能可通过 H5 走通 |
| 数据库故障 | PostgreSQL 备份策略，恢复时间目标 < 1h |

---

## 21. 性能与兼容性（v1.4 新增 — 来自 PRD v4 §6.2/6.4）

### 21.1 性能需求

| 指标 | 目标值 |
|------|--------|
| 小程序首屏加载 | < 1.5s |
| 时间轴渲染（100 个日程）| < 500ms |
| 接口响应时间（P95）| < 500ms |
| shareCard 卡片加载 | < 1.5s |
| 时间名片生成 | < 2s |
| 透明度面板打开 | < 300ms |

### 21.2 兼容性

- 微信小程序基础库 ≥ 3.3.0
- 微信客户端版本 ≥ 8.0
- 屏幕适配：375px-428px 宽度（iPhone SE - iPhone Pro Max）

---

## 22. 闭环性诊断（v1.4 新增 — 来自 closure-analysis）

> 本节记录各模块的闭环状态，指导后续开发优先级。

### 22.1 模块闭环状态

| 模块 | 闭环 | 关键断裂点 |
|------|:----:|-----------|
| 日程（TimeBlock）| ✅ | 完整 CRUD + 日/周/月视图 |
| 任务（Task）| ✅ | 完整 CRUD + 步骤 + 强制复盘 |
| 审批流 | ⚠️ | 架构完整，但审批副本缺字段（已修复）+ 推送 stub |
| 提醒（Reminder）| ⚠️ | 后端 cron 完整，推送通道未通 |
| 圈子（Circle）| ⚠️ | 结构完善，可见性已实现 |
| 设置（Settings）| ✅ | dayStartsAt 已生效（v0.31 修复） |
| **任务拆解链** | 🔴 | **心脏路径未通——AI 拆解/AI 建议/线性依赖全缺** |
| **委托流** | 🔴 | **完全未做** |

### 22.2 已知逻辑漏洞（历史发现，多数已修）

- ~~CIRCLE_ONLY 无 circleId 变 PUBLIC（隐私泄漏）~~ ✅ 已修复（create/update 双重校验）
- ~~删除 TimeBlock 不联动删 Reminder（孤儿提醒）~~ ✅ 已修复（v0.31 softDelete 级联）
- ~~dayStartsAt 存了但不生效~~ ✅ 已修复（v0.31 groupByHour 从 dayStartHour 起）
- ~~审批分享链路 respondApproval 传错对象~~ ✅ 已修复
- **TimeBlock 缺 cancelled 状态可用性** — schema 有但 UI 不支持"取消"（只能删除）。在日程管理中，"取消"和"删除"心理含义不同——取消意味着"原计划未执行但需保留记录"。⏳ 待评估

---

## 23. 代码质量规则 L19-L24（v1.4 新增 — 来自历史 bug 提炼）

> 以下 6 条规则建议补进 AGENTS.md 或 VERSION_PLAN 审计教训，是从历史 bug 模式提炼的固化规则。

| 编号 | 规则 | 来源 |
|:----:|------|------|
| **L19** | **schema 改动必须同步数据库**：手动改 `schema.prisma` 后必须执行 `npx prisma db push`（开发）或 `npx prisma migrate dev`（正式）。`migrate status` 不可信——它只比对 migration 文件，不比对实际表结构。建议定期跑 `prisma migrate diff` 检测漂移 | 本次 500 bug 根源 |
| **L20** | **软删级联必须先查 ID 再删**：`PrismaService.$extends` 全局给读方法注入 `isDeleted:false`，任何"先删后查"的第二次查询都返回空。模式：`const ids = (await findMany).map(x=>x.id); await updateMany({where:{id:{in:ids}}})` | closure-analysis |
| **L21** | **前后端契约必须同步**：后端 schema/DTO 加字段时，必须同步 (1) 前端 types/api.ts (2) services/api.ts (3) 所有 toResponse() (4) 创建实体的 service 写入逻辑。缺任何一步都算未完成 | v40 审查 |
| **L22** | **可见性字段必须校验配套字段非空**：`CIRCLE_ONLY` 必须有 `circleId`。可见性默认值必须是最严格的（PRIVATE），而非最宽松的（PUBLIC）| closure-analysis |
| **L23** | **反范式快照必须复制全部业务字段**：任何"反范式快照"实体（ApprovalRequest 存日程副本、Delegation 存任务副本），必须复制源实体的全部业务字段，尤其可见性字段和来源字段 | v40 审查 |
| **L24** | **门禁状态必须实跑验证**：VERSION_PLAN 声称的门禁（eslint 0 错/jest 全绿）必须与实跑结果一致。每次写"0 错"前必须实跑。husky pre-commit 加 `eslint --max-warnings 0` | 本次审查 |

---

## 24. 路线重审的核心洞见（v1.4 记录 — 战略参考）

> 来自路线重审文档，虽未完全采纳但其核心逻辑极具价值，记录供决策参考。

### 24.1 "骨架和心脏"理论

> "v0.37 是一个完整的个人日程+任务管理工具。但它和归集器之间，还差一张 Step 表和一条委托流。两者之间的所有东西——分类树、模板库、时间名片、隐私面板——都是'有了更好'，不是'没有不行'。先把骨架和心脏做出来，让它跳。跳了再穿衣服。"

当前 v1.4 的"路径二是心脏"完全继承了这套理论。

### 24.2 验证加速：从 10 周压缩到 3 周

路线重审算的账：用最小闭环（拆解→排期→委托）3 周内验证心脏路径是否成立，而非 10 周堆功能后再验证。**当前 VERSION_PLAN 可考虑进一步压缩**——v0.44（地基）+ v0.45（AI 拆解）+ v0.46（建议时间段）+ v0.47（委托流）+ v0.50（验证），砍掉中间的推送/自然语言/周报/iCal，推到验证后。

### 24.3 三个最该验证的假设（验证前必答）

1. 找 10 个有多个任务来源的人，问"你有没有因为任务散落在不同地方而感到困扰"——如果 10 人中 <5 人说"有"，方向需调整
2. 让 5 个用户用 timeslots 管理一周任务，观察能否独立完成"创建→拆步骤→安排时间"——如果 <3 人能完成，产品太复杂
3. 让 3 个用户尝试委托（A 委托 B），观察 B 反应——如果 B 第一反应是"我微信回他就行"，委托价值主张需重新设计

---

## 25. 护城河评估（v1.4 新增 — 来自竞品分析 v3）

| 护城河类型 | 深度 | 说明 |
|-----------|:----:|------|
| **商业模式护城河** | ⭐⭐⭐⭐⭐ | 在位者（钉钉/飞书/企微）被锁定在企业付费，不能做免费归属个人的版本。创新者的窘境 |
| **数据归属护城河** | ⭐⭐⭐⭐ | 用户的时间数据跟自己走——切换工具意味着丢失所有历史 |
| **网络效应护城河** | ⭐⭐⭐ | 委托流形成后——"张明总是通过 timeslots 委托我，我不用不行" |
| **生态护城河** | ⭐⭐⭐ | 微信转发创建任务——Trello/Asana 无法复制 |
| **AI 护城河** | ⭐⭐ | AI 拆解不是壁垒（大模型 API 人人可调），但"拆解+归集+时间轴"的组合是 |
| **品牌护城河** | ⭐ | 目前为零 |
| **规模护城河** | ⭐ | 目前为零 |

**最强护城河不是代码，是在位者的商业模式锁死。** 钉钉不可能做 timeslots 做的事——不是因为技术，是因为如果它做了，它的企业客户就不再付钱了。

---

## 26. 文档关联（v1.4 新增）

| 文档 | 位置 | 状态 |
|------|------|------|
| VERSION_PLAN.md | 项目根 | v1.3，v0.44+ 重排 |
| AGENTS.md | 项目根 | 编码约束 + 审计教训 L1-L18（待补 L19-L24）|
| README.md | 项目根 | 技术栈 + 快速开始 |
| 竞品深度分析 v3 | `~/.openclaw-autoclaw/.../workspace/` | 战略参考 |
| 路线重审 | 同上 | 验证加速理论 |
| 闭环/逻辑/日程三视角评估 | 同上 | 11 个功能缺口 |
| UIUX 建议报告 | 同上 | 11 项交互改进（多数已实现）|
| PRD v4 | 同上 | 委托流原型 / 状态机 / 埋点 / 发布策略来源 |
| 代码审查报告（多版本）| 同上 | bug 模式提炼 |
| workbuddy/plans 综合提炼 | `~/.workbuddy/plans/` | workspace 文档提炼 |

---

## 附录：v1.4 变更摘要

| 章节 | 变更 |
|------|------|
| §0 | 增强"为什么是三条路径"的逻辑论证 + 完成度体检加战略意义列 |
| §1 | 新增 §1.3 品类定位（无人格子矩阵 + 商业模式锁死论证）|
| §2 | 重写为 5 类用户画像 + 用户故事 + 成功指标体系（6 指标，含金标准）|
| §3 | 加 3 Tab 备选方案备注 + transparency 路由 |
| §4 | Step 加 dependsOnId + 来源追踪规则 + SharingLevel 枚举 |
| §6 | 加颜色语义原则 + Toast 克制原则 |
| §10 | 里程碑重排（M4-M7 按三路径）|
| §13 | 补全 Step 触发条件表 + 为什么支持线性依赖 + 为什么不自动排满论证 |
| §14 | 吸收 PRD v4 委托接收页并排时间轴 ASCII 原型 |
| §15 | 补自然语言建日程高频论证 |
| §17 | 不做清单加"继续堆 UI 微调" |
| **§18 新增** | 共享关系三级 + 透明度面板（隐私信任体系）|
| **§19 新增** | 数据埋点体系（10 事件）|
| **§20 新增** | 发布策略 + 配置化 + 降级预案 |
| **§21 新增** | 性能与兼容性指标 |
| **§22 新增** | 闭环性诊断 + 已知逻辑漏洞 |
| **§23 新增** | 代码质量规则 L19-L24 |
| **§24 新增** | 路线重审核心洞见（骨架心脏理论 + 验证加速 + 3 假设）|
| **§25 新增** | 护城河评估 |
| **§26 新增** | 文档关联表 |
| **§27 新增** | 产品成熟度评分模型（6 维加权，参考性质）|
| **§28 新增** | 任务来源全景（10 分类穷举 + 战略取舍）|
| **§29 新增** | 主动伙伴架构（四层进化 + 5 场景 + 技术基础 + 版本映射）|

---

## 27. 产品成熟度评分模型（v1.4 新增 — 参考性质）

> 本章为**评估参考**，非产品规格。用于量化"产品做到几分"的进度，指导版本优先级。

### 27.1 六维评分模型

| 维度 | 权重 | 4 分现状 | 9 分标准 |
|------|:----:|---------|---------|
| **核心闭环**（差异化功能跑通）| 30% | AI 拆解/委托/共享全未闭环 | 三路径全部闭环，用户能完整走通 |
| **AI 质量**（差异化生命线）| 20% | MiniMax 接通但输出通用模板 | 分任务类型输出，用户有"啊确实该这么做"惊喜 |
| **触达闭环**（推送/通知）| 15% | console.warn stub | 7 场景真实推送，协作功能"活"起来 |
| **验证闭环**（有真实用户数据）| 15% | 0 用户 | 5+ 真人验证，D1≥30%，有观察记录 |
| **工程健壮**（无架构债）| 10% | 推送债/shareCard 已修/schedule 巨石 | 推送通+单文件拆分+测试覆盖核心 |
| **增长闭环**（拉新/留存机制）| 10% | 无 | AI 预览页拉新+推送留存+时间名片传播 |

**当前加权分约 2.0**（CRUD 完整但差异化功能占 65% 权重几乎为 0）。注意：之前"4 分"是单一功能完整度评分，6 维加权后真实分更低——CRUD 是入场券不是得分项。

### 27.2 版本爬坡推演

| 版本 | 加权分 | 涨分来源 | 关键事件 |
|------|:------:|---------|---------|
| v0.44.5 | 2.0 | — | 基线（CRUD 完整，差异化空）|
| v0.45 | 3.2 | +1.2 | 推送破冰（触达 0→7）|
| v0.46 | 4.5 | +1.3 | AI 拆解+Prompt 工程（产品分首超工程分）|
| v0.47 | 5.2 | +0.7 | 路径二闭环（第一次能演示差异化）|
| v0.48 | 5.7 | +0.5 | 委托流（路径一打通）|
| v0.49 | 6.4 | +0.7 | 自然语言建日程 |
| **v0.50** | **7.2** | **+0.8** | **★ 验证门禁（产品成熟线）★** |
| v0.51-52 | 7.8 | +0.6 | 周报+iCal |

### 27.3 三个里程碑

- **v0.46（4.5 分）**：产品分首次超过工程分——AI 拆解开始兑现差异化
- **v0.47（5.2 分）**：路径二闭环——第一次能完整演示"timeslots 和滴答清单有什么不同"
- **v0.50（7.2 分）**：验证门禁——产品成熟，可对外推广。对独立开发者项目，7 分以上就是成功

### 27.4 为什么达不到 9 分（天花板分析）

9 分需要：(1) 验证闭环 100+ 用户留存数据（当前 0 用户）；(2) AI 质量接近 GPT-4 级（MiniMax M3 有差距）；(3) 增长闭环病毒系数 >1（需委托流形成真实网络效应）。**这是 1-2 年 + 资金 + 团队的长期目标，不是版本计划能覆盖的。v0.50 的 7.2 分是当前阶段的天花板，也是值得骄傲的成就。**

### 27.5 从 4 分到 7 分的最短路径

> v0.45 通推送 → v0.46 把 Prompt 工程做到惊艳 → v0.47 路径二闭环 → v0.50 找 5 个真人验证。关键卡点不是版本数量，是 v0.46 的 AI 拆解质量——如果输出还是"收集→计划→执行→检查→输出"的通用垃圾，整个产品差异化就是空的，做多少版本都到不了 7 分。

---

## 28. 任务来源全景（v1.4 新增 — 10 分类穷举）

> 本章穷举"日程/任务从哪来"的所有可能来源，作为三路径（§0）的细化展开。当前产品只覆盖部分来源，未覆盖的标注 [planned] 或 [cancelled]。

### 28.1 为什么需要穷举任务来源

当前"三路径"（外部驱动/内部驱动/自发驱动）是**生成机制**层面的抽象。但用户真实面对的是**具体来源**——"这是老板派的""这是我自己想做的""这是账单到期了"。把来源穷举清楚，才能确保产品不遗漏高频入口，也为 §29"主动伙伴"提供数据维度基础。

### 28.2 十大任务来源分类

按"驱动力来源"维度分类（比工作/生活/私有更本质）：

| # | 来源 | 驱动力本质 | 时间确定性 | 谁定义目标 | 当前覆盖 | 战略决策 |
|:-:|------|-----------|:---------:|:---------:|:--------:|:--------:|
| 1 | **公司任务** | 组织驱动 | 高（有 deadline）| 组织 | 🟡 部分（需对接他人时间）| ✅ 深化 |
| 2 | **个人目标** | 自我驱动 | 中（有截止，步骤待拆）| 自己 | ✅ Task+AI 拆解 | ✅ 已是心脏 |
| 3 | **习惯/模式** | 模式驱动 | 低（条件触发）| 自己的惯性 | ❌ 完全缺失 | ✅ **最有想象空间** |
| 4 | **他人请求** | 人际驱动 | 中（答应后定）| 他人 | 🟡 审批流/委托流 | ✅ 路径一 |
| 5 | **外部周期事件** | 时间驱动 | 高（客观到期）| 无主（客观）| ❌ 完全缺失 | ✅ 高频痛点 |
| 6 | **灵感/种子** | 灵感驱动 | 极低（someday）| 自己 | ❌ 完全缺失 | ✅ GTD 核心 |
| 7 | **重复 routine** | 组织/自我 | 高（周期固定）| 组织/惯性 | 🟡 仅日程级 recurrence | ✅ 任务级 routine |
| 8 | **依赖等待** | 阻塞驱动 | 低（被动等）| 外部人 | 🟡 仅 Step 内部依赖 | ✅ 扩展外部阻塞 |
| 9 | **积压 backlog** | 老化驱动 | 无（已积压）| 自己（曾定义）| ❌ 无老化机制 | 🟡 验证后做 |
| 10 | **碎片时间填充** | 情境驱动 | 无（即时）| 自己 | ❌ 无碎片概念 | ❌ **不做**（冲突定位）|

### 28.3 各来源详细规格

#### 来源 1：公司任务（深化）

**现状**：Task + AI 拆解已支持个人细分，但缺"对接他人时间"。**深化方向**：公司任务拆解后，需要确定时间的步骤可发起委托（路径一），形成"组织任务→个人拆解→跨人排期"闭环。

#### 来源 2：个人目标（已是心脏，详见 §13）

目标清晰 + 截止明确 + 步骤待拆 → AI 拆解成 Step → 建议时间段 → 穿插日程。新建日程时主动提示"现阶段可完成的待排事项"（§29 主动伙伴）。

#### 来源 3：习惯/模式（最有想象空间 — v1.4 新构想）⭐

习惯不只是"睡懒觉"，而是一整套**个人时间模式**，应作为用户画像的核心部分（扩展 User.settings）：

| 模式维度 | 示例 | 产品价值 |
|---------|------|---------|
| 作息偏好 | 晚睡型/早起型/周末补觉 | 闹铃智能延后（周末+无安排+习惯→延后）|
| 精力节奏 | 上午深度/下午会议/晚上创意 | SlotSuggester 按精力匹配任务类型 |
| 避免时段 | 午休 12-13/接孩子 16-17/健身 19-20 | 排期自动避开 |
| 社交节奏 | 周三晚家庭晚餐/月度老友聚会 | 周期性占用，不重复询问 |

**升级路径**：当前 settings（dayStartsAt/reminderLeadMinutes）是"几个开关"→升级为**时间人格画像**。AI 的所有建议（拆解/排期/周报）都基于这个画像。**这是当前 settings 的质变**。

**具体场景**："第二天没什么特别安排 + 又是周末 + 你有睡懒觉习惯 → 闹铃自动延后到 9:30 并提示"。这是产品**主动**发起建议，不等用户设置。

#### 来源 4：他人请求（路径一，详见 §14）

他人要求/请求，你答应后形成自己的日程。审批流（已做）+ 委托流（v0.47 计划）覆盖。

#### 来源 5：外部周期事件（高频痛点 — v1.4 新增）

不是谁"派给"你，而是客观时间到了：账单到期、信用卡还款、证件续期（驾照/护照）、年检车检、体检周期、订阅续费、家人生日/纪念日、报税截止。

**特点**：无主（没人要求）、周期性、错过代价高（滞纳金/失效/尴尬）。**当前完全缺失**——用户只能手动建日程，无提前预警。

**产品构想**：新增"周期事务"实体（区别于 recurrence 日程）。它不是某一天的日程，而是"每 N 天/月处理一次"的事务模板，到期前 7/3/1 天主动推送。**这是 §29 主动伙伴的核心数据源之一**。

#### 来源 6：灵感/种子（GTD someday/maybe — v1.4 新增）

突然想到"该学 Rust""这个点子不错""整理书单"。不是目标（没那么清晰），不是任务（没那么具体），是**潜在种子**。

**特点**：模糊、低优先级、可能永远不做、但也可能某天变成目标。GTD 方法的核心之一就是 someday/maybe 清单。当前 Task 都是"确定要做"的，种子无处安放 → 用户用微信收藏/备忘录存，和 timeslots 割裂。

**产品构想**：新增"种子库"（区别于 Task）。种子可"孵化"成 Task，也可静置。AI 定期扫描种子库，结合用户空闲主动建议"你 3 个月前想学 Rust，最近工作类少了，要不要安排？"——**从被动工具升级为主动伙伴的关键**。

#### 来源 7：重复 routine（组织/自我 — v1.4 新增）

每天站会、每周周报、每月报销、每两周 1:1。组织强制的重复任务，既不是一次性公司任务（来源 1），也不是个人习惯（来源 3）。

**特点**：强制、周期固定、内容相似但每次都要做。当前 recurrence 只是**日程级重复**（每周三 10:00 的块重复），缺**任务级 routine**——"周报"是持续任务，每周期 spawn 一个待办实例，完成后下周期自动生成。

**产品构想**：Task 增加 `isRoutine` + `routinePattern`。routine 永不"完成"，而是每周期 spawn 一个 Step/TimeBlock 实例。

#### 来源 8：依赖等待（协作痛点 — v1.4 扩展）

"等设计稿""等审批""等老板回复"。当前 Step 有 `dependsOnId`（任务内部依赖），缺**等外部人**的依赖。

**特点**：被动、焦虑感强（不知对方何时回）、易遗忘（等久了忘了在等什么）。

**产品构想**：Step 增加 `blockedBy`（外部依赖描述）+ `blockedSince`（等待开始时间）。看板"等待中"列按等待时长排序，超过 3 天自动提示"已等 X 天，要不要催一下"。

#### 来源 9：积压 backlog（清单卫生 — v1.4 新增，验证后做）

一直想做但没排上时间的任务。和种子不同——这些明确要做但优先级低。当前 Task 平权，无"积压池"，时间长了列表变垃圾桶。

**产品构想**：Task 超 30 天未排期自动进入"积压"区。AI 定期问"这件事放了 30 天，还要做吗？删除还是降级为种子？"。**防止用户被冗长列表压垮**。

#### 来源 10：碎片时间填充（明确不做）

5-10 分钟零碎事。**明确不做**——和时间块理念冲突（时间块要求专注，碎片要求填充）。稀释产品定位，禁止。

### 28.4 战略取舍：哪些做，哪些不做

| 来源 | 决策 | 理由 |
|------|:----:|------|
| 5 周期事务 | ✅ 做 | 高频痛点，无主任务，产品完全缺失 |
| 6 灵感种子库 | ✅ 做 | GTD 核心，让产品从工具升级为伙伴，差异化强 |
| 7 routine 任务 | ✅ 做 | 组织场景刚需，复用现有 recurrence 基建 |
| 8 依赖等待 | ✅ 做 | 协作真实痛点，扩展现有 dependsOn |
| 9 积压老化 | 🟡 后期 | 清单卫生有价值但优先级低，验证后再做 |
| 10 碎片填充 | ❌ 不做 | 和时间块理念冲突，稀释定位 |
| 情境感知（通勤/位置）| ❌ 现阶段不做 | 微信小程序位置 API 受限，ROI 低 |
| 能量管理（精力曲线）| 🟡 融入来源 3 | 作为"时间人格画像"的一部分，不单独做 |

---

## 29. 主动伙伴架构（v1.4 新增 — 产品进化方向）

> 本章定义 timeslots 从"被动记录器"到"主动伙伴"的进化路径。**这是滴答清单/Motion 都做不到的差异化**——它们的任务模型是平铺的，没有习惯/种子/阻塞/预算这些维度。timeslots 的数据模型（Task+Step+Category+source+settings）天然支持这些扩展。

### 29.1 四层进化模型

```
第四层：时间哲学家（远期愿景）
  产品帮用户回答"我的时间去哪了""我该怎么优化"
  周报洞察 + 长期趋势 + 反思引导
       ↑
第三层：主动伙伴（v1.4 构想指向这里）⭐ 差异化核心
  产品主动发起建议，不等用户问：
  • 习惯感知（周末+无安排+睡懒觉→闹铃延后）
  • 周期预警（账单 3 天后到期→排个处理时间）
  • 种子孵化（3 个月前的种子+最近空闲→要安排吗）
  • 阻塞提醒（等设计稿 5 天→要不要催）
  • 预算预警（本周工作 42h 超 40h→明天建议生活）
       ↑
第二层：智能助手（v0.46-v0.50 路线）
  AI 被动响应——拆解、建议时间、自然语言建日程
  用户问，AI 答
       ↑
第一层：被动记录器（当前状态）
  用户主动建任务/日程，产品记录
  AI 只在被叫到时拆解
```

### 29.2 第三层"主动伙伴"的 5 个主动建议场景

主动伙伴的核心是**产品不等用户问，主动发起建议**。基于 §28 的任务来源维度：

| 场景 | 数据来源 | 触发条件 | 建议形式 | 对应来源 |
|------|---------|---------|---------|:--------:|
| **习惯感知** | User.settings 时间人格画像 | 明天周末 + 无特别安排 + 有睡懒觉习惯 | "明天周末，闹铃延后到 9:30？" | 来源 3 |
| **周期预警** | 周期事务实体（§28 来源 5）| 账单/证件 3 天后到期 | "信用卡账单 3 天后到期，排个处理时间？" | 来源 5 |
| **种子孵化** | 种子库（§28 来源 6）| 种子超 30 天 + 最近该分类空闲 | "你 3 个月前想学 Rust，最近工作少了，要安排吗？" | 来源 6 |
| **阻塞提醒** | Step.blockedBy/blockedSince（§28 来源 8）| 外部等待超 3 天 | "已等设计稿 5 天，要不要催一下？" | 来源 8 |
| **预算预警** | Category 统计 + 用户预算设置 | 本周某分类时长超预算 | "本周工作 42h 超过 40h 预算，明天建议安排生活类" | 来源 2/3 |

### 29.3 主动伙伴的技术基础

主动建议不是凭空产生，需要数据维度支撑。timeslots 现有数据模型已经为大部分场景预留了基础：

| 数据维度 | 现有基础 | 需扩展 | 支撑场景 |
|---------|---------|--------|---------|
| 时间人格画像 | User.settings（dayStartsAt 等）| 扩展为作息/精力/避免/社交 4 维度 | 习惯感知 |
| 周期事务 | Template（isSystem）+ recurrence | 新增"周期事务"实体（区别于日程）| 周期预警 |
| 种子库 | 无 | 新增 Seed 实体（status: seed/incubating/active）| 种子孵化 |
| 外部阻塞 | Step.dependsOnId（内部）| 新增 blockedBy + blockedSince | 阻塞提醒 |
| 时间预算 | Category 统计 | 新增 Category.weeklyBudget | 预算预警 |

### 29.4 进化路径与版本映射

主动伙伴不是单一版本，是**贯穿多个版本的渐进进化**：

| 阶段 | 版本 | 能力 | 进化层 |
|------|:----:|------|:------:|
| 时间人格画像基础 | v0.45+ | settings 扩展作息/精力/避免时段 | 第二层 |
| AI 主动建议时间 | v0.46 | SlotSuggester 基于画像排期 | 第二层 |
| 阻塞提醒 | v0.47+ | Step.blockedBy + 等待超时提示 | **第三层萌芽** |
| 周期事务 + 预警 | v0.49+ | 周期事务实体 + 到期推送 | **第三层** |
| 种子库 + 孵化建议 | v0.51+ | Seed 实体 + AI 定期扫描 | **第三层** |
| 习惯感知（闹铃延后）| v0.52+ | 周末+无安排+习惯→主动建议 | **第三层** |
| 周报洞察 | v0.51 | 统计+趋势+AI 观察 | **第四层萌芽** |

### 29.5 为什么这是差异化护城河

滴答清单做不到主动伙伴，因为：
1. **任务模型平铺**——没有 Step 依赖、没有 Category 脊柱、没有 source 追踪，无法知道"这个任务在等什么"
2. **无时间人格画像**——只有简单设置，不知道用户"周三晚有家庭晚餐"
3. **无 AI 主动建议引擎**——只有被动提醒（到点响），没有"基于多维数据的主动发起"

Motion 做不到，因为：
1. **聚焦自动排程**——它是调度引擎不是伙伴，用户感受是"被控制"而非"被帮助"
2. **无社交维度**——没有习惯/种子/人际请求这些"人"的维度

**timeslots 的机会**：数据模型（Task+Step+Category+source+settings）天然支持多维扩展，加上微信生态（小程序卡片/订阅消息/转发），是唯一能做"主动时间伙伴"的产品。

### 29.6 风险与边界

主动伙伴的最大风险是**过度打扰**——产品主动建议太多，用户觉得烦。

**边界原则**：
- **每天最多 1 条主动建议**（用户可设置频率）
- **建议必须可一键忽略**（"知道了"按钮，且同类建议 7 天内不重复）
- **建议必须基于明确数据**（不猜测，如"周末+无安排+习惯"三个条件全满足才建议闹铃延后）
- **建议失败（用户忽略 3 次同类）自动降频**（同类建议暂停 30 天）

---