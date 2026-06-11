# MILESTONE-20260607-batch7-runtime-fixes

## 触发

Batch 6 收尾后做「端到端 + 真实 e2e 之前」的最后一轮自检。手动过 5 个 issue，全部修复。

## 范围

- `server/src/modules/event/event.service.ts` — `create` 入口加业务校验、清理死代码
- `server/src/main.ts` — 顶部 JSDoc 默认端口 3000 → 7777
- `server/src/common/filters/all-exceptions.filter.ts` — ValidationPipe 多错误 message 取第一条 → 拼接
- `server/src/common/services/encryption.service.ts` — `EncryptedPayload` 加索引签名
- `server/src/common/exceptions/business.exception.ts` — JSDoc 增补使用示例
- `server/scripts/test-endpoints.js` — 新增（一次性验证脚本，不入包）

## 5 个 issue 详情

### 1. 死代码：`EventService` 未使用的 `Logger` 导入和 `logger` 字段

**现象**：`import { Logger } from '@nestjs/common';` 引用了但**整个文件未使用**；`private readonly logger = new Logger(EventService.name);` 字段在构造函数外但也没用。

**修复**：
- 删 `import { Logger }` → 改 `import { Injectable, HttpStatus }`（为 Issue #3 准备）
- 删 `logger` 字段
- audit 0 命中

**为什么不是 bug**：只是 `Logger` 没用；但符合"零死代码"原则 + audit.js 会扫到未用 import。

### 2. 编码风格：`as unknown as Prisma.InputJsonValue` double cast

**现象**：`event.service.ts:69` 原本是 `enc as unknown as Prisma.InputJsonValue`。double cast 在 TS 是 smell，提示类型不匹配。

**根因**：`EncryptedPayload { data, iv, tag }` 没有索引签名，Prisma 的 `InputJsonObject` 要求 `[key: string]: JsonValue`。技术上可强转但风格不雅。

**修复**（Issue #1 改完发现仍报错，扩展修复）：
- 给 `EncryptedPayload` 加 `[key: string]: string;` 索引签名
- 删 `as unknown as`，恢复 `enc as Prisma.InputJsonValue`（单 cast 即可）
- 顶层 JSDoc 说明索引签名的存在意义

**为什么这样做比 `as unknown as` 好**：
- `EncryptedPayload` 在运行时**就是**纯 JSON-serializable 对象，加索引签名如实描述了类型
- 业务侧消费仍是 `enc.data / enc.iv / enc.tag`，索引签名只影响赋值兼容性
- 比 `as unknown as` 链安全（前者只绕过一层检查，unknown 绕过所有）

### 3. 真实 BUG：`create` 缺 `endTime > startTime` 业务校验

**现象**：`create()` 直接把 `dto.startTime / dto.endTime` 转 Date 存库。DTO 层 `class-validator` 的 `@IsISO8601` 只校验**格式合法**（`endTime === startTime` 也是合法 ISO 8601），**不校验**顺序。

**后果**：用户可创建零长度日程（`start === end`）或倒序日程（`end < start`）—— 数据脏 + 后续 `AvailabilityService.getFreeSlots` 区间运算会崩溃。

**修复**：
- 在 `create()` 入口（事务前）加：
  ```ts
  if (end.getTime() <= start.getTime()) {
    throw new BusinessException(
      40001,
      '结束时间必须晚于开始时间',
      HttpStatus.BAD_REQUEST,
    );
  }
  ```
- 用业务码 `40001`（与 DTO 校验错同码同状态，**不**新增 ErrorCodes 常量）
- 用 `HttpStatus.BAD_REQUEST` 显式传入（签名坑：第一参数是 5 位业务码，第二是 message，第三才是 httpStatus）

**为什么放事务前**：业务校验是**纯内存判断**，无副作用，放事务前 fail-fast 节约 DB 开销。**事务只承载真正需要原子性的写操作**。

### 4. 真实 BUG：`AllExceptionsFilter` 多错误 message 只取第一条

**现象**：`all-exceptions.filter.ts:69` 原代码 `const message = m[0];`。`ValidationPipe` 失败时 `m` 是 `string[]`（每条字段一条错）。原本只显示第一条，用户看到 "startTime must be a valid ISO 8601 date string" 但**完全不知道 endTime 也错了**。

**修复**：
- 改为 `const message = m.length > 0 ? m.map(String).join('; ') : exception.message;`
- 显式 `m.length > 0` 兜底（理论上 ValidationPipe 必返回非空数组，但防御性编程）

**为什么用 `; ` 而不是换行**：响应契约的 `message` 字段是**单行字符串**（前端 toast / 表单提示直接展示），换行会破坏 UX。`; ` 是日志/JSON 错误串最常用分隔符。

### 5. 文档：`main.ts` 默认端口 JSDoc 过时

**现象**：`main.ts:18` JSDoc 仍写 `Bootstrap function (默认 3000)`。Batch 6 端口迁 7777 时改了 `configuration.ts` / `validation.ts` / `.env.example` / `.env` / `request.ts`，**漏了 JSDoc**。

**修复**：JSDoc 改 `默认 7777`（与实际 `validation.ts` `Joi.number().port().default(7777)` 一致）。

## 副作用：JSDoc 同步

`BusinessException` 加一行 JSDoc 示例：`(40401, '日程不存在', HttpStatus.NOT_FOUND)` —— Issue #3 改完发现代码注释缺签名示例。

## 验证（6/6 全绿）

| 场景 | 期望 | 实际 |
|------|------|------|
| T1 `GET /health` | 200, code:0 | ✅ 200, code:0, message:"success" |
| T2 `GET /events/my` 无 token | 401, code:40100 | ✅ 401, code:40100 |
| T3 `GET /events` 不存在 | 404, code:40400 | ✅ 404, code:40400 |
| T4 `POST /events` DTO 缺字段 | 400, code:40000, **多错误 `; ` 拼接** | ✅ 400, code:40000, `"startTime must be a valid ISO 8601 date string; endTime must be a valid ISO 8601 date string"` |
| T5 `POST /events` endTime==startTime | 400, code:40001, **业务规则错误** | ✅ 400, code:40001, message:"结束时间必须晚于开始时间" |
| T6 `POST /events` 多个非法字段 | 400, code:40000, **多错误** | ✅ 400, code:40000, 与 T4 一致 |

## 4 大质量门（重跑全绿）

- `npx tsc --noEmit` (server) — 0 错 ✅
- `npx tsc --noEmit` (frontend) — 0 错 ✅
- `npx prisma validate` — ✅
- `npx jest` — 13/13 ✅
- `node scripts/audit.js` — 0 命中（TODO/JSDoc/未用 import）✅

## 未提交

按 AGENTS §4.3「最小改动」+ 用户明确「**未授权严禁 git commit**」原则，5 个文件改动**未** stage，未 commit。等待用户拍板。
