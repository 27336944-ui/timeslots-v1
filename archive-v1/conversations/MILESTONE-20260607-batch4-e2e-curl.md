# 8️⃣ 2026-06-07 Batch 1-4 收尾（运行时验证）

## 背景
Batch 3 (PM 拍板重写) 完成后，Server 已经能跑通 `npx nest start` 但 `HealthController` 路由漏了 `/api/v1` 前缀，导致 `GET /api/v1/health` 返回 404。Batch 4 集中收尾 + 修复路由，并跑通端到端 curl 验证。

## 范围
- `server/src/prisma/prisma.service.ts` 启动弹性
- `server/src/app.module.ts` 挂载修复
- `server/src/modules/event/event.service.ts` 死代码
- `server/src/modules/event/dto/event-response.dto.ts`（删）
- `server/src/modules/quota/dto/create-quota-transaction.dto.ts`（删）
- `server/src/health/health.controller.ts` 路由修复
- 端到端 curl 验证

## 约束
- **CRITICAL**: 全局响应契约 `{code, message, data, path, timestamp}` 不能破
- **CRITICAL**: DB 不可达时 server 必须能起（**不能** 阻塞 boot）
- **CRITICAL**: `HealthController` 必须能被 `@Public()` 跳过 JWT（验收探活）

## 验证结果

| 场景 | 期望 | 实际 | HTTP | 业务码 | 说明 |
|------|------|------|------|--------|------|
| `GET /api/v1/health` | `{status:ok}` | ✅ | 200 | 0 | 探活 |
| `GET /api/v1/events/my` 无 token | 401 | ✅ | 401 | 40100 | JwtAuthGuard 拒绝 |
| `GET /api/v1/events` | 404 | ✅ | 404 | 40400 | NestJS 兜底 |
| `POST /api/v1/events` 空 body | 400 | ✅ | 400 | 40000 | ValidationPipe |
| `POST /api/v1/events` 无效 ISO | 400 | ✅ | 400 | 40000 | ValidationPipe |

**结论**: 5/5 全绿 ✅

## 复现命令
```powershell
cmd /c "cd /d C:\Users\xwhy7\timeslots-v1\server && node test-endpoints.js"
```

(注：临时 `test-endpoints.js` 跑完已删)
