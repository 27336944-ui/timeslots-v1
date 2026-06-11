# MILESTONE-20260607-m1-scaffold

> M1 脚手架收尾记录。后续 M2+ 工作以此为基线。

## 背景

按照 PRD.md v0.2 + AGENTS.md v1.2，启动 `timeslots-v1` 项目的 M1 里程碑。
M1 目标：搭建前后端骨架、验证 dev-loop 可行性（前端 tsc + 后端 NestJS /health 可达）。

## 范围

- 前端：微信原生小程序骨架（`src/`），`tsc --noEmit` 通过
- 后端：NestJS Module 切分骨架（`server/`），`GET /api/v1/health` 返回 `{ code: 0, data: { status: 'ok' }, message: '' }`
- 工程化：根目录配置、TS 严格模式、Prisma schema（仅 User 模型占位，不 migrate）、Docker Compose（PG 16）、WeChat sitemap

## 约束

- **CRITICAL**：微信原生（**禁止** Taro / React / NutUI / px）
- **CRITICAL**：NestJS Module 切分（**禁止** Express 风格 `controllers/` `routes/` 顶层目录）
- **CRITICAL**：LLM 是**增值功能**，M1 不实现（仅留 stub 接口）
- **CRITICAL**：静态资源走 `wx.cloud`，业务后端独立部署（计算与存储分离）

## 验收标准

- [x] 前端 tsc `--noEmit` 0 错误
- [x] 后端 tsc `--noEmit` 0 错误
- [x] `GET http://localhost:3000/api/v1/health` 返回 `{ code: 0, data: { status: 'ok', timestamp: '...' }, message: '' }`
- [x] 前端禁用项扫描 0 命中（Taro / React / DOM / BOM）
- [x] 黄金代码回归（`examples/page-template` / `component-template` / `api-call.ts` 关键语法未回退）
- [x] 微信 `sitemap.json` / `app.json` / `project.config.json` 配置自洽
- [x] 3 个延迟集成接口已建 stub（`src/services/cloud-storage.ts` / `src/services/llm.ts` / `server/src/modules/auth/auth.service.ts#code2Session()`）

## 产出

### 新增文件（34 个）

| 类别 | 路径 |
|------|------|
| 根配置 (6) | `package.json` `tsconfig.json` `project.config.json` `.gitignore` `docker-compose.yml` `.env.example` |
| 服务端配置 (7) | `server/package.json` `server/tsconfig.json` `server/tsconfig.build.json` `server/nest-cli.json` `server/Dockerfile` `server/.env.example` `server/.gitignore` |
| 服务端源码 (12) | `server/prisma/schema.prisma` + `server/src/main.ts` `app.module.ts` + 4 common + 2 config + 2 prisma + 2 health |
| 前端入口 (4) | `src/app.ts` `src/app.json` `src/app.wxss` `src/sitemap.json` |
| 前端 utils (3) | `src/utils/request.ts` `storage.ts` `promisify.ts` |
| 前端 types (2) | `src/types/api.ts` `global.d.ts` |
| 前端 page (4) | `src/pages/index/{index.json,index.wxml,index.wxss,index.ts}` |
| 前端 stub (2) | `src/services/cloud-storage.ts` `llm.ts` |
| 占位 (5) | `src/pages/{todo,calendar,settings}/.gitkeep` + `src/components/.gitkeep` + `src/stores/.gitkeep` |
| 工具 (1) | `scripts/{verify-batch1,verify-batch2,verify-batch3,verify-batch4}.ps1` |

### 修改文件

- 无（M1 全为新增）

### 删除文件

- 无

## 经验沉淀（详见 AGENTS.md §5.2.2 / §5.3.3 增量）

1. **`Page<TData, TCustom>` 第二个泛型是 TCustom（方法类型）**，不是 data。错误示例 `Page<{}, PageData>` 会让对象字面量触发 excess property check。
2. **`wx.onError` 回调入参是 `ListenerError`**，字段是 `message`（**不是** `errMsg`，跟 `GeneralCallbackResult` 区分）。
3. **`wx.request` 官方 TS 类型不包含 `PATCH`**，但运行时可用。业务侧保留完整 HTTP method（含 PATCH），wx 边界处显式 cast（**禁止** `as any`，必须用具体类型别名）。
4. **Joi `.optional()` 不接受空字符串**。`.env.example` 用空值占位是常见做法，schema 需用 `.allow('').optional()` 放行。

## 后续工作

| 里程碑 | 范围 | 阻塞 | 预估天数 |
|--------|------|------|----------|
| M2 鉴权 | 微信 code2Session + JWT + auth store + JwtAuthGuard | DB（PG 启动 + 首次 migrate） | 3 |
| M3 时段 | TimeBlock CRUD + 循环规则 + 分类 + 微信云存储接入 | M2 | 4 |
| M4 待办+日历 | Todo CRUD + 日/周聚合视图 | M3 | 4 |
| M5 提醒+设置+导出 | 订阅消息 cron + day_starts_at + 数据导出 | M4 | 3 |
| M6 LLM 增值 | MiniMax 代理 + 智能复盘/提取/规划 + 微信 msgSecCheck | M5 | 2 |

### M2 启动前待办

- 安装 Docker（PG 启动依赖）
- 准备微信小程序 AppID（code2Session 联调需要）
- 准备 MiniMax M3 API Key（即使 M2 不用，env 占位先填上）
- **修复 examples/page-template/index.ts 的 `Page<{}, PageData>` 反模式**（同根因 #1）

## 变更日志

- 2026-06-07 M1 scaffold 完成
