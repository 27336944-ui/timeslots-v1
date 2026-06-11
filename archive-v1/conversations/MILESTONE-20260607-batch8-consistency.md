# MILESTONE-20260607-batch8-consistency

## 触发

Batch 7 后做「全量自检 + 死代码清理 + 文档对齐 + 隐藏 BUG 排查」。

## 范围（5 issue 修）

| # | 文件 | 性质 | 改动 |
|---|------|------|------|
| 1 | `encryption.service.ts` | 死代码 | 删 `import { Logger }` + 删 `logger` 字段（grep 确认 0 调用） |
| 2 | `jwt-auth.guard.ts` | 风格 | `import { A, B, C, D } from 'x'` 一行 → 拆 4 行 |
| 3 | `llm.ts:56` JSDoc | **文档错误** | "M6 接入" → "M2-A 接入"（AGENTS §6.5 锁定 M2-A，stub 落后 4 里程碑）|
| 4 | `llm.ts:79,88` 错误信息 | **文档错误** | "deferred to M6" → "deferred to M2-A"（×2 处）|
| 5 | `schema.prisma` CircleMember | **真 BUG** | 缺 `isDeleted/createdAt/updatedAt/deletedAt` 字段 + `@@index([isDeleted])` 索引；与 `SOFT_DELETE_MODELS` 列表不一致，运行时会抛 `Unknown field 'isDeleted'` |

## 关键 BUG 详情：CircleMember 软删字段缺失

### 现象

`server/src/prisma/prisma.service.ts:14-26` 的 `SOFT_DELETE_MODELS` 列表里有 `CircleMember`：

```ts
const SOFT_DELETE_MODELS = [
  'User', 'TimeBlock', 'Circle', 'CircleMember', ...
];
```

但 `server/prisma/schema.prisma:134-147` 的 `CircleMember` 模型只有 4 个业务字段 + 2 关系 + 2 索引，**没有**：
- `isDeleted: Boolean @default(false)`
- `createdAt: DateTime @default(now())`
- `updatedAt: DateTime @updatedAt`
- `deletedAt: DateTime?`
- `@@index([isDeleted])`

### 后果

`event-visibility.service.ts:53` 走 `this.prisma.client.circleMember.findUnique(...)`：
1. Prisma `$extends` 拦截 → 注入 `where: { isDeleted: false }`
2. 实际执行 SQL → `Unknown field 'isDeleted' on model 'CircleMember'`
3. 50000 系统异常返回

**所有 CIRCLE_ONLY nature 的事件可见性查询都会 500**。当前未被触发是 mock 单测 + 未跑真实 DB 测试。

### 修复

补齐 4 字段 + 1 索引（与其他 10 实体保持完全一致）：

```prisma
model CircleMember {
  ...原有 4 字段...
  joinedAt DateTime @default(now())

  isDeleted Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime? @db.Timestamptz(6)

  ...原有 2 关系...

  @@unique([circleId, userId], name: "circle_members_uk")
  @@index([userId], name: "circle_members_user_idx")
  @@index([isDeleted], name: "circle_members_delflag_idx")  // 新增
  @@map("circle_members")
}
```

## 验证

| 门 | 状态 |
|----|------|
| `npx tsc --noEmit` (server) | ✅ 0 错 |
| `npx tsc --noEmit` (frontend) | ✅ 0 错 |
| `npx prisma validate` | ✅ valid |
| `npx jest` | ✅ 13/13 |
| `node scripts/audit.js` | ✅ 0 命中（TODO/JSDoc/未用 import） |
| 6 端点 e2e | ✅ 6/6 |

## 教训

- `SOFT_DELETE_MODELS` 列表是**强契约**——任何 schema 变更都要同步检查这个列表
- 建议（未来 audit.js 增强）：增加第 4 项审计——"schema.prisma 中所有带 `isDeleted` 的模型必须在 `SOFT_DELETE_MODELS` 中"
- 当前 audit.js 仅扫 3 项（TODO/JSDoc/unused import），未来可扩展

## 后续（M2-A 真正上 Prisma migration 时）

需要为 `circle_members` 表跑 `prisma migrate dev`：
- 加 3 列：`is_deleted BOOLEAN DEFAULT FALSE`、`created_at TIMESTAMPTZ`、`updated_at TIMESTAMPTZ`
- 加 1 列：`deleted_at TIMESTAMPTZ NULL`
- 加 1 索引：`circle_members_delflag_idx`
