# 2026-06-07 数据模型 V1 ER 图（评审稿）

> 2026-06-07 Batch 1 更新：Space → Group（分享圈简化），SpaceMember → GroupMember（isOwner），新增 Project（原 Group 任务归集），RSVP 状态简化，BusinessException HTTP 1:1 对齐

## Mermaid ER 图

```mermaid
erDiagram
    User ||--o{ TimeBlock : "owns"
    User ||--o{ Space : "owns"
    User ||--o{ SpaceMember : "joins"
    User ||--|| Quota : "has"
    User ||--o{ CoachCard : "receives"
    User ||--o{ TrackingEvent : "triggers"

    Space ||--o{ SpaceMember : "has"
    Space ||--o{ TimeBlock : "hosts"

    User ||--o{ Group : "owns"
    Group ||--o{ TimeBlock : "aggregates"

    TimeBlock ||--o{ Comment : "has"
    TimeBlock ||--o{ RSVP : "invites"

    CoachCard ||--o{ CoachFeedback : "receives"

    Quota ||--o{ QuotaTransaction : "tracks"

    User {
        uuid id PK
        string openid "微信 openid, 唯一"
        string nickname
        string avatarUrl
        enum status "ACTIVE | PENDING_DELETE | HARD_DELETE"
        string dayStartsAt "用户时区偏移, e.g. '+08:00'"
        jsonb coachSettings "AI 教练配置: {fragmentation, deviation, deepWork, workFilter}, 默认见 coach-algorithm-spec §7"
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }

    TimeBlock {
        uuid id PK
        uuid userId FK "创建者"
        uuid spaceId FK "可选, 协作空间归属"
        uuid groupId FK "可选, 任务归集键(引用 Group)"
        string title "限 20 字"
        text notes
        string location
        enum nature "work | life | private"
        enum privacy "open | members_only | private"
        timestamptz startTime
        timestamptz endTime
        int actualDurationMinutes "复盘填, 选填"
        boolean isAIGenerated "默认 false"
        string aiTraceId "幂等用, 选填"
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }

    Space {
        uuid id PK
        string name
        uuid ownerId FK "User.id"
        text description
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }

    SpaceMember {
        uuid id PK
        uuid spaceId FK
        uuid userId FK
        enum role "OWNER | ADMIN | MEMBER"
        datetime joinedAt
        datetime createdAt
        datetime updatedAt
        uniqueIndex "spaceId+userId"
    }

    Group {
        uuid id PK
        uuid ownerId FK "User.id, 创建者"
        string name "AI 默认生成, 用户可改"
        float aiConfidence "0~1, 归集时 AI 给出"
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }

    Comment {
        uuid id PK
        uuid timeBlockId FK
        uuid userId FK
        text content
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }

    RSVP {
        uuid id PK
        uuid timeBlockId FK
        uuid userId FK "被邀请人"
        enum status "PENDING | ACCEPTED | DECLINED"
        datetime respondedAt
        datetime createdAt
        datetime updatedAt
        uniqueIndex "timeBlockId+userId"
    }

    CoachCard {
        uuid id PK
        uuid userId FK
        enum type "WEEKLY | DAILY"
        date weekStart "WEEKLY 用"
        date cardDate "DAILY 用"
        jsonb metrics "{fragmentation, deviation, deepWork}"
        text content "LLM 生成的建议"
        boolean dismissed
        datetime createdAt
        datetime updatedAt
    }

    CoachFeedback {
        uuid id PK
        uuid cardId FK
        uuid userId FK
        enum action "DISMISS | ACCEPT"
        text note "选填, 用户备注"
        datetime createdAt
    }

    Quota {
        uuid userId PK,FK "1:1 with User"
        int balance "当前余额"
        datetime updatedAt
    }

    QuotaTransaction {
        uuid id PK
        uuid userId FK
        int delta "正负整数"
        enum reason "SIGNUP_GRANT | AI_PARSE | AI_CREATE | AI_WEEKLY_REPORT | AI_PHONE_CALL | REFUND"
        string refType "选填, e.g. 'time_block' | 'ai_parse'"
        string refId "选填, 关联业务 ID"
        text note
        datetime createdAt
    }

    TrackingEvent {
        uuid id PK
        uuid userId FK "可能为 null(游客)"
        string eventName "ai_parse_result 等"
        jsonb params "事件参数"
        string sourcePage "页面路径"
        datetime createdAt
    }
```

## 关键设计决策

### 1. Group 是单独表，不是 TimeBlock 上的字符串

- **理由**：任务单有"名称"（AI 生成 + 用户可改）、"创建者"、"AI 置信度"等独立属性
- **数据同源保留**：TimeBlock.groupId 仍存在，**外键引用 Group.id**（不是字符串）
- 任务视图 = JOIN Group + GROUP BY TimeBlock
- 与 PRD 文字"任务视图 = Events 按 group_id 聚合"兼容

### 2. Quota 1:1 User（不是余额字段放在 User 上）

- **理由**：高并发扣费场景下，单独小表 + PG advisory lock 性能更优
- QuotaTransaction 留完整审计轨迹（监管 / 客诉）

### 3. Space 独立于 Group

- Space = 协作空间（人员组织维度）
- Group = 任务单（业务聚合维度）
- 一个 Space 里可以有多个 Group（项目组空间下分多个任务单）

### 4. TimeBlock 同时持有 spaceId 和 groupId

- spaceId = 这个日程是否投到某个协作空间（决定权限矩阵）
- groupId = 这个日程属于哪个任务单（决定看板聚合）
- 二者独立：一个 Group 的日程可以不属于任何 Space（个人私域）

### 5. nature vs privacy 二维

- **nature** = 日程性质（AI 推断）：work / life / private（决定视觉 chip 颜色）
- **privacy** = 协作共享范围：open / members_only / private（决定权限矩阵）
- 例：生活聚餐（nature=life）可投到家庭 Space（privacy=members_only）

### 6. TrackingEvent 单独表

- 与 Quota 业务表解耦
- 高写入量场景可后续接 ClickHouse 等 OLAP
- MVP 用 PG 一张表足够

### 7. coachSettings 存在 User 表（M2-A 加 jsonb 字段）

- **理由**：AI 教练算法 4 维配置（fragmentation / deviation / deepWork / workFilter）属用户级设置
- **与 Quota 解耦**：Quota 是高频写 + 锁，coachSettings 是低频读 + 偶尔写
- **详情**：默认值与字段定义见 `conversations/2026-06-07-coach-algorithm-spec.md` §7
- **写时点**：用户首次进入「我的 → 教练设置」时按默认值创建（用 PG UPSERT）

## 软删与跨用户隔离

- 所有表必备 `deletedAt: DateTime?`
- Prisma middleware 自动注入 `where: { deletedAt: null }`（AGENTS §5.3.3 #8）
- 所有数据访问强制 `where: { userId }`（AGENTS §5.3.3 #5）

## 后续动作

- ~~[ ] 用户 review 本 ER 图~~ ✅ 已拍
- ~~[ ] M2-A 阶段：写 Prisma schema~~ ✅ Batch 1 完成（12 实体表）
- ~~[ ] M2-A 阶段：写软删 middleware + 跨用户隔离 guard~~ ✅ Batch 1 完成
- - [ ] ER 图合入 PRD v1.0（待 PRD.md 升版）

## Batch 1 变更（2026-06-07, 已废弃，被 Batch 2 取代）

> 按 PRD 瘦身 + 用户拍板 3 点（Q1/B/1:1 码）实施的架构变更

### 1. Space → Group（分享圈，简化）

**之前（ER §5.2）**：
- Space：协作空间，ownerId，独立于 Group
- SpaceMember：role = OWNER | ADMIN | MEMBER

**之后（Batch 1 Prisma schema）**：
- **Group** = 分享圈（家庭/朋友组），与任务归集解耦
- **GroupMember**：isOwner: Boolean（去角色层级）
- Group 不再承载复杂 RBAC

### 2. Group（原任务归集）→ Project

**之前**：Group 承担"任务归集键"（TimeBlock.groupId）
**之后**：
- **Group** = 分享圈（TimeBlock.groupId）
- **Project** = 任务归集（TimeBlock.projectId）
- TimeBlock 同时持有 groupId（分享圈）和 projectId（归集）

### 3. 新增字段

| 表 | 字段 | 用途 |
|----|------|------|
| TimeBlock | status (ACTIVE/COMPLETED/CANCELLED) | PRD V1.2 索引 idx_group_status |
| TimeBlock | encryptedDetails (Json?) | AES-256-GCM 加密的地点和备注 |
| TimeBlock | isBusy (boolean, default true) | 忙闲标记 |
| User | coachSettings (Json?) | AI 教练算法配置 |
| Quota | permanentPoints + monthlyPoints | 永久/当月点数分层 |
| Quota | monthlyExpireAt (DateTime?) | 当月点数过期时间 |
| Quota | version (int) | 乐观锁 |

### 4. RSVP 简化

- 状态：PENDING → CONFIRMED / CANCELLED（去掉 ACCEPTED/DECLINED）
- 无审批流（ApprovalFlow / ApprovalRecord 不创建）

### 5. 索引

- `idx_user_time`: (userId, startTime, endTime)
- `idx_group_id`: (groupId)
- `idx_project_id`: (projectId)
- `idx_status`: (status)
- GroupMember: @@unique([groupId, userId])
- RSVP: @@unique([timeBlockId, userId])

### 6. Visibility 算法修正

```
P0: owner 永远可见
P1: RSVP 参与者（不限 nature）
P2: private 阻断非参与者后 → isInSameGroup
P3: 拒绝
```

新增 `AvailabilityService`（`GET /api/v1/availability`）返回忙闲（不暴露详情）。

---

## Batch 2 变更（2026-06-07, **当前生效**）

> 按用户 V1.2 PRD V2 schema + 6 项细化设计 multi-select 全采纳实施的架构重构
> 当前实体数：**11**；实体重命名 + 列优化 + 软删双轨

### 1. 实体重命名（V1 → V2）

| V1 (Batch 1) | V2 (Batch 2) | 理由 |
|---|---|---|
| `Group` (分享圈) | `Circle` | 与"任务归集"区分；语义更准（"社交圈"） |
| `GroupMember` (isOwner) | `CircleMember` (role enum) | `role: OWNER | MEMBER` 比 Boolean 更扩展 |
| `Project` (任务归集) | `TaskGroup` | "Project" 偏企业；"TaskGroup" 偏个人任务 |
| `RSVP.userId` | `RSVP.attendeeId` | 强调"被邀请人"，避免与"创建者"混淆 |
| `TrackingEvent` | **删除** | 埋点下沉到 M2-C + 第三方分析平台 |

### 2. 新增列

| 表 | 字段 | 用途 |
|---|---|---|
| TimeBlock | `summary: String?` | 明文短摘要（列表预览，免解密） |
| TimeBlock | `encryptedDetails: Json?` | AES-256-GCM 加密的详情（`{data, iv, tag}`） |
| User | `coachSettings: Json?` 含默认值 | AI 教练配置：tone / weeklyReportDay |
| User | `isDeleted: Boolean @default(false)` | 双轨软删（Boolean 快筛 + deletedAt 时序） |
| Circle | `status: CircleStatus @default(ACTIVE)` | ACTIVE / FROZEN / DISSOLVED |
| Circle | `autoDisbandAt: DateTime?` | 30 天无活动自动解散 |
| TaskGroup | `color: String @default("#888888")` | 看板色块 |
| QuotaTransaction | `type: TransactionType` | DEDUCT / RECHARGE / MONTHLY_GRANT / REFUND |
| QuotaTransaction | `amount: Int` | 带符号（扣费为负） |
| QuotaTransaction | `balanceAfter: Int` | 余额快照（审计/对账） |
| QuotaTransaction | `description: String?` | 人类可读说明 |
| QuotaTransaction | `relatedBlockId: String?` | 关联 TimeBlock ID |
| CoachCard | `weekStart: DateTime @db.Date` | 周一起始日期（强一致） |
| CoachCard | `insights: Json` | AI 生成的洞察文本 |
| CoachFeedback | `rating: Int (1-5)` | RLHF 数据收集（替代 action/note） |
| CoachFeedback | `comment: String?` | 可选文字反馈 |

### 3. 删除列

| 表 | 字段 | 理由 |
|---|---|---|
| TimeBlock | `location` | 移到 `encryptedDetails.location` |
| TimeBlock | `notes` | 移到 `encryptedDetails.notes` |
| Group | `description` | Circle.description 保留，但 Project/TaskGroup 不需要 |
| QuotaTransaction | `delta / reason / refType / refId / note` | 用 `amount / type / relatedBlockId / description` 替代 |
| CoachCard | `type / cardDate / content / dismissed` | 简化为单周卡 + insights 拆分 |
| CoachFeedback | `action / note` | 用 `rating` 替代 |

### 4. 双轨软删

所有实体新增 `isDeleted: Boolean @default(false)`：
- **Boolean 字段**：高频查询时快速过滤（避免 `IS NULL` 索引失效）
- **deletedAt 字段**：保留时序信息，支持恢复
- **Prisma middleware**：M2-A 启用后自动注入 `where: { isDeleted: false }`

### 5. 显式列类型（@db.*）

| 类型 | 用例 |
|---|---|
| `@db.Uuid` | 所有主键 |
| `@db.VarChar(n)` | 短文本（title=100, name=50, color=10） |
| `@db.Text` | 长文本（summary, content, comment） |
| `@db.Timestamptz(6)` | 时间字段（startTime, endTime, expireAt） |
| `@db.Date` | 日期字段（CoachCard.weekStart） |

### 6. 索引具名化

所有索引加 `name:` 避免 Prisma 自动生成 `Table_column_idx` 命名（与命名空间冲突）：
- `users_openid_idx` / `users_delflag_idx`
- `time_blocks_user_time_idx` / `time_blocks_circle_time_idx` / `time_blocks_group_status_idx` / `time_blocks_delflag_idx`
- `circles_owner_idx` / `circles_delflag_idx`
- `circle_members_uk` (UNIQUE) / `circle_members_user_idx`
- `task_groups_user_delflag_idx`
- `comments_block_idx` / `comments_delflag_idx`
- `rsvps_block_attendee_uk` (UNIQUE) / `rsvps_attendee_idx` / `rsvps_delflag_idx`
- `coach_cards_user_week_uk` (UNIQUE) / `coach_cards_delflag_idx`
- `coach_feedbacks_card_idx` / `coach_feedbacks_delflag_idx`
- `quotas_delflag_idx`
- `quota_txns_user_time_idx` / `quota_txns_delflag_idx`

### 7. CoachCard 重构

```
旧: type (WEEKLY/DAILY) + cardDate + content (text) + dismissed
新: weekStart (Date, 唯一) + insights (Json) + metrics (Json?)
```

**理由**：用户每周一查看一次周报，DAILY 卡可从周报推导；强一致 weekStart + 唯一约束 `(userId, weekStart)`。

### 8. CoachFeedback RLHF 重构

```
旧: action (DISMISS/ACCEPT) + note (text)
新: rating (Int 1-5) + comment (text?)
```

**理由**：标准 5 星评分更利于 ML 训练数据；保留 comment 收集文字反馈。

### 9. AES-256-GCM 加密服务（新增）

`server/src/common/services/encryption.service.ts`：
- 算法：AES-256-GCM（12 字节 IV + 16 字节 AuthTag）
- 密钥：`ENCRYPTION_KEY`（64 hex = 32 bytes）
- API：`encryptObject()` / `decryptObject()` / `encrypt()` / `decrypt()`
- 由 `EventService` 在 `timeBlock.create` 前调用加密 `details` → `encryptedDetails`

### 10. Visibility 算法升级

```
旧: e.nature === 'WORK' / 'LIFE'（旧 enum，已删除）
新: e.nature === PRIVATE / PUBLIC / CIRCLE_ONLY
```

| nature | 非 owner 非参与者 | 同 Circle 成员 | 所有人 |
|---|---|---|---|
| PRIVATE | ❌ 阻断 | ❌ 阻断 | ❌ 阻断 |
| CIRCLE_ONLY | ❌ 阻断 | ✅ 可见 | ❌ 阻断 |
| PUBLIC | ✅ 可见 | ✅ 可见 | ✅ 可见 |

### 11. 验证

- `prisma validate` ✅
- `prisma generate` ✅
- `server npx tsc --noEmit` ✅
- `frontend npx tsc --noEmit` ✅
- 实体数：11（删 TrackingEvent）
- 公共文件变更：4 service + 2 DTO + 1 controller + 1 module + 1 新 encryption.service
