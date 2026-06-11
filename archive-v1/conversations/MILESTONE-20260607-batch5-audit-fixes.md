# 9️⃣ 2026-06-07 Batch 5 (M2-A) 全面自检 + 端口迁移 + 3 关键 Bug 修复

## 背景
Batch 1-4 完成 M2-A 主流程，但**未做端到端运行时验证**。本次全面自检，发现并修复 3 个潜在生产级 Bug。

## 修复清单

### Bug 1 — EncryptionService 配置 key 错误（🔴 严重）
**位置**: `server/src/common/services/encryption.service.ts:33`

**症状**:
```typescript
const keyHex = config.get<string>(
  'ENCRYPTION_KEY',  // ❌ 错：env 名，ConfigService 找不到
  '0000...0000',
);
```

`ConfigService.get()` 查的是 `configuration` 工厂返回的对象字段（**camelCase**），不是 env 变量名。原代码永远走默认全 0 密钥，**生产环境数据无安全性**。

**修复**:
```typescript
const keyHex = config.get<string>(
  'encryptionKey',  // ✅ 改：camelCase，匹配 AppConfig.encryptionKey
  '0000...0000',
);
```

**影响**: M2-A LLM 加密（私密日程 AI 解析）、QuotaTransaction 流水、User 隐私字段全链路安全性。

---

### Bug 2 — PrismaService 拦截器漏实现（🟡 中等）
**位置**: `server/src/prisma/prisma.service.ts`（JSDoc 42 行 + `buildExtendedClient`）

**症状**: JSDoc 写明拦截 `findUniqueOrThrow` / `findFirstOrThrow` 但 `buildExtendedClient` 没实现。软删模型用 `*OrThrow` 读时不会过滤已删数据，**潜在读到软删数据**。

**修复**: 在 `buildExtendedClient` 的 `$allModels.query` 中补齐两个拦截器，与现有 4 个保持一致。

---

### Bug 3 — `index.wxml` 内容是 CSS（🔴 严重）
**位置**: `src/pages/index/index.wxml`

**症状**: 整个文件内容是 `.page { padding: 40rpx 32rpx; ... }` 等 CSS 规则。`.wxml` 应该是 WXML 标记（`<view>...</view>`），不是 CSS。

**影响**: 启动小程序后**首页空白**，`/health` 端到端联调无法可视化。

**修复**: 重写为正确 WXML（view 容器 + text 文本 + button 按钮 + 三元类名 + `bindtap`）。

---

### 端口迁移 — 3000 → 8000
**原因**: 用户本地 `3000` 端口被其他进程占用，`EADDRINUSE` 反复出现。

**改动文件 (6)**:
- `server/src/config/configuration.ts` — 默认 `8000`
- `server/src/config/validation.ts` — Joi `.default(8000)` + JSDoc
- `server/src/main.ts` — 兜底 `8000`
- `server/.env.example` + `server/.env` — `PORT=8000`
- `.env.example`（根）— `APP_PORT=8000`
- `src/utils/request.ts` — `BASE_URL = 'http://localhost:8000/api/v1'`

**验证**: 端口扫描 `node find-port.js` 显示 8000-8049 全部空闲 → 选 `8000`（HTTP-alt 通用端口）。

---

## 死代码清理

### `server/test/helpers/prisma-mock.ts`
删除：
- 顶层 `quota / quotaTransaction / timeBlock` mock（实际只 `mockPrisma.$transaction` 路径用）
- `client.timeBlock` mock（visibility test 只用 `client.circleMember.findUnique`）
- `mockTransaction(txOverrides)` 形参（无人传）
- `buildMockPrismaService` 导出（无人用）

---

## 自检结果

| Gate | 命令 | 结果 |
|------|------|------|
| Server tsc | `cd server && npx tsc --noEmit` | ✅ 0 errors |
| Frontend tsc | `npx tsc --noEmit` | ✅ 0 errors |
| Prisma validate | `cd server && npx prisma validate` | ✅ valid |
| Jest | `cd server && npx jest` | ✅ 13/13 |
| Server boot | `cd server && npx nest start` | ✅ (DB down 弹性启动) |
| 端到端 curl | `node test-endpoints.js` | ✅ 5/5 |
| TODO/FIXME | `grep -rE "TODO\|FIXME\|XXX" src/` | ✅ 0 hits |

## 已知遗留（不影响 M2-A 启动）
- `examples/page-template/index.ts:11` 用 `Page<{}, PageData>({...})` 反模式（AGENTS §5.2.2 #19）。
  - **状态**: §10 受保护只读；不能改。
  - **影响**: 仅 `examples/` 下的 template，**真实 `src/pages/`** 全部用 `Page<TData, TCustom>` 双泛型正确写法。
  - **建议**: 用户 review 后手工 update template（PR 合入）。
