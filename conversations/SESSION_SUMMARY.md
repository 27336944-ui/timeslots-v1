# Session Summary — 2026-06-10

> 重启计算机前的开发状态快照。下次继续开发时，先读此文件恢复上下文。

## Current Project State

| Version | Pages | Backend |
|---------|-------|---------|
| v0.14 (里程碑：任务 Tab 前端) | 5 pages: 日程 / 详情 / 任务 / 任务详情 / 我的 | NestJS 7777 + PG 5432 |

## What's Been Implemented

| Ver | Feature | Status |
|-----|---------|--------|
| v0.1 | Backend scaffold (NestJS + Prisma + PG18 + /health) | ✅ |
| v0.2 | Frontend skeleton (src/, ts strict, WeUI 1.5.6, mobx) | ✅ |
| v0.3 | Frontend-backend connect (request.ts, types, health card) | ✅ |
| v0.4 | Design system (tokens.wxss, Tag/Skeleton/Cell/BottomSheet) | ✅ |
| v0.5 | Dev login + JWT + exception filter + global pipe + interceptor | ✅ |
| v0.6 | Mine page (login/logout UI, authStore+userStore) | ✅ |
| v0.7 | TimeBlock CRUD backend (5 endpoints, soft-delete) | ✅ |
| v0.8 | by-date endpoint (Asia/Shanghai timezone aware) | ✅ |
| v0.9 | Schedule tab 24h timeline (blockStore, date nav) | ✅ |
| v0.10 | Schedule detail page (create/view/edit 3-mode, 7 extension fields) | ✅ |
| v0.11 | WeChat real login (code2session, migration modal) | ✅ |
| v0.12 | Account delete/restore (7d grace, restoreToken) | ✅ |
| v0.13 | Task backend (work/life/private 3 types, 7 endpoints, stats) | ✅ |

## v0.14 Completed (2026-06-11) — Task Tab Frontend

- **Backend**: TimeBlock DTO + repsonse + create added `taskId`; `GET /api/v1/time-blocks/by-task/:taskId` endpoint
- **Frontend types**: `TimeBlock.taskId` field; `getBlocksByTask()` API function; `taskId` param on `createBlock`
- **Store**: `taskStore` (tasks, stats, CRUD, taskBlocks, category filter)
- **`pages/tasks/index`**: Stats cards (8 metrics), 4 category tabs (全部/工作/生活/私有), task list with category badge + priority dot + due date + done strikethrough, pull-to-refresh, FAB
- **`pages/tasks/task-detail/index`**: 3 modes (create/view/edit). Steps checklist (add/toggle/remove), status management, completedNote + retrospective + improvements, associated timeblock list, "创建日程" entry → schedule detail with `taskId`, delete with confirm
- **Schedule detail**: accepts `taskId` param for creating task-associated timeblocks
- **`app.json`**: TabBar 3 tabs (日程/任务/我的), both task pages registered
- **Gate**: tsc 双 0 错 ✅, prisma validate ✅

## Today's Fixes (2026-06-11) — Architecture Audit 8 Items

- **C1**: PrismaService `$extends` soft-delete interceptor (Task/TimeBlock auto `isDeleted: false`)
- **C2**: `BusinessException` + `ErrorCodes` (9 groups, 5-digit business codes)
- **C3**: `HttpExceptionFilter` rewrite (BusinessException → direct code, Prisma P2002→40901, P2025→40401, fallback `status*100+1`)
- **H2**: Task DTO `@MinLength(1)` + `@IsISO8601()` validation
- **H3**: TimeBlock DTO status `@IsIn(['todo', 'in_progress', 'done'])`
- **H4**: `migrateDevData`/`deleteDevData` now handles Task records
- **M1**: `app.ts` `wx.onError` global error handler
- **M4**: `server/.env.example` with all required env vars

**Pattern change**: All services now use `this.prisma.client.xxx` (PrismaService no longer extends PrismaClient).

## Previous Bug Fixes (C1-C3, M1-M5, L2-L3)

See `VERSION_PLAN.md` changelog entry 2026-06-10 "Bug fix sweep".

- C1: typescript ^6.0.3 → ^5.6.0
- C2: recurrence buttons active class fixed (5 distinct classes)
- C3: task stats arranged/unarranged now queries TimeBlock.taskId
- M1: auth.deleteDevData added @CurrentUser guard
- M2: toLocalDate/toLocalTime uses Intl.DateTimeFormat Asia/Shanghai
- M3: HttpExceptionFilter code → status*100 (5-digit business codes)
- M4: removed deprecated wx.getUserProfile call
- M5: storage keys unified through `storage.ts` utility
- L2: TransformInterceptor path → request.path
- L3: dueAt empty string handling in update path

## Resume Checklist (after PC restart)

```powershell
# 1. Start PostgreSQL (if not auto-started)
# Check: Get-Service postgresql-x64-18 | Start-Service

# 2. Start backend
cd \path\to\timeslots-v1\server
npx nest start --watch

# 3. Start WeChat DevTools
# Open project at \path\to\timeslots-v1
# Enable "不校验合法域名..." in dev settings

# 4. Verify health
curl http://localhost:7777/api/v1/health

# 5. Verify login
curl -X POST http://localhost:7777/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"userId":"550e8400-e29b-41d4-a716-446655440000"}'
```

## Key Test User

- Dev UUID: `550e8400-e29b-41d4-a716-446655440000` (nickname: "TestUser")

## Key Files Reference

| File | Purpose |
|------|---------|
| `AGENTS.md` | Project rules & AI behavior (read first before coding) |
| `VERSION_PLAN.md` | Roadmap v0.1→v0.29 + design points + audit lessons |
| `PRD.md` | Product requirements |
| `src/utils/request.ts` | Unified HTTP client (get/post/put/del/patch) |
| `src/utils/storage.ts` | Unified wx storage wrapper (timeslots_ prefix) |
| `src/types/api.ts` | All API response/request TypeScript interfaces |
| `src/services/api.ts` | All API call functions (auth/block/task) |
| `server/prisma/schema.prisma` | Database schema (User/Task/TimeBlock) |

## Environment

| Service | Host | Credentials |
|---------|------|-------------|
| PostgreSQL 18 | localhost:5432 | timeslots / timeslots_dev_only |
| NestJS API | localhost:7777 | JWT via login endpoint |
| WeChat DevTools | local dev | WX_APPID placeholder (dev login only) |
