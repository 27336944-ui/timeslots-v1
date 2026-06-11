# MILESTONE-20260607-batch9 — 4 Tab 重新梳理 + 退 WSL 装 Windows native PG

> **批次定位**：M2-A 第 2 阶段（脚手架已就绪 → 业务骨架落定）。
> **核心成果**：
> 1. **4 Tab 重新梳理**：从"首页/日历/项目/我的"→"日程/协作/任务/我的"，PRD §2.5 详细子功能/关键页面/API 矩阵落地
> 2. **退 WSL**：放弃 WSL Ubuntu 26.04 + WSL 内 PG 18 → 装 Windows native PG 18（EDB installer via winget）
> 3. **端到端联调通过**：7/7 端点 e2e 全绿（health / events.my / events.post 等）
> 4. **新增铁律 #22**：`Page<TData, TCustom>` 的 TData 接口名禁止用 `PageData`（miniprogram-api-typings 全局冲突）

---

## 1. 4 Tab 重新梳理（PRD v1.0 §2.5 新增）

### 1.1 决策拍板（用户）

| # | 决策点 | 拍板 |
|---|--------|------|
| Q1 | 收到的邀请 + 共享给我 是否分两个子 Tab | **都在协作 Tab（子 Tab）** |
| Q2 | 任务组是否支持圈子共享 | **不支持**（个人任务组） |
| Q3 | AI 教练入口放哪 | **我的 Tab** |
| Q4 | 日程 Tab 默认视图 | **日视图 24h 时间轴** |
| Q5 | 任务主页顶部 3 卡筛选 | **仅显示 owner 的** |
| Q6 | 我的 Tab 是否要"切换账号" | **不需要** |
| Q7 | 协作 Tab 是否显示已退出的圈子历史 | **不显示**（软删即走） |
| Q8 | 日程详情页是否要"评论"区 | **要** |

### 1.2 4 Tab 关系拓扑

```
┌─────────────┬──────────────────────────────────────────────┐
│ 日程        │ 一手时间块 (TimeBlock) 增删改查 + AI 录入     │
│ 协作        │ 圈子 (Circle) + 共享日程 + 邀请/回复 (RSVP)   │
│ 任务        │ 任务组 (TaskGroup) + 任务 (Task) 跨日程聚合   │
│ 我的        │ 用户画像 + AI 教练 + 额度 + 设置                │
└─────────────┴──────────────────────────────────────────────┘
```

### 1.3 关键关系

- **TimeBlock 是事实表**（每条都是一条占用的时间）
- **Task 是视图**（聚合相关 TimeBlock）
- **TaskGroup 不支持圈子共享**（M2-A 简化为个人任务组）
- **Circle 只对 TimeBlock 的可见性起作用**（PRIVATE/PUBLIC/CIRCLE_ONLY）
- **用户看到的"共享给我" = `nature != PRIVATE AND 我是相关 Circle 成员`**

### 1.4 子功能 / 关键页面矩阵

| Tab | 子功能 | 关键页面 | 关联 API |
|-----|--------|----------|----------|
| 日程 | 24h 日视图 | `pages/schedule/index` | `GET /events?date=` |
| 日程 | 时间块详情 (含评论) | `pages/schedule/detail` | `GET/PATCH/DELETE /events/:id` + comments |
| 日程 | AI 多模态新建 | `pages/schedule/create` | `POST /llm/parse` + `POST /events` |
| 协作 | 子 Tab：我的圈子 | `pages/collab/index` (tab 0) | `GET /circles` |
| 协作 | 子 Tab：收到的邀请 | `pages/collab/index` (tab 1) | `GET /invitations` |
| 协作 | 子 Tab：共享给我 | `pages/collab/index` (tab 2) | `GET /events/shared` |
| 协作 | 圈子详情 | `pages/collab/circle-detail` | `GET/PATCH /circles/:id` |
| 任务 | 任务主页 (任务组 + 顶部 3 卡) | `pages/tasks/index` | `GET /task-groups` |
| 任务 | 任务组详情 | `pages/tasks/group-detail` | `GET /task-groups/:id` |
| 任务 | Task 详情 | `pages/tasks/task-detail` | `GET /tasks/:id` |
| 我的 | 我的主页 | `pages/mine/index` | `GET /users/me` + `/quota/me` + `/coach-cards/latest` |
| 我的 | AI 教练 | `pages/mine/coach` | `GET /coach-cards` + `POST /coach-feedbacks` |
| 我的 | 额度明细 | `pages/mine/quota` | `GET /quota/transactions` |
| 我的 | 设置 (含 `coachSettings`) | `pages/mine/settings` | `PATCH /users/me` |
| 我的 | 数据导出 | `pages/mine/export` | `GET /users/me/export` |

---

## 2. 退 WSL：决策与执行

### 2.1 决策（用户拍板）

> "**能不用 Ubuntu 就不用了，尽量都集中在 Windows 内**"

之前为本地 PG 走了 2 条弯路：
1. ❌ EDB Windows MSI 装 PG（unattended mode 没装 lib/，缺 dict_snowball）
2. ❌ WSL Ubuntu 26.04 apt install postgresql-18（WSL2 eth0 IP 被 Windows Defender 挡，Windows Prisma 连不上 WSL PG；退而求其次 WSL 内装 Linux Node 跑 Prisma 暂时解决 migration，但 server 启动仍连不上）

**最终方案**：在 Windows 内**用 winget 装 EDB PG 18 + 手动调 initdb/data dir + 改 pg_hba.conf 走 UAC**，全程留在 Windows 域。

### 2.2 装 PG 18 步骤

```powershell
# 1. winget 静默装 EDB PG 18（UAC 弹窗用户点"是"）
winget install -e --id PostgreSQL.PostgreSQL.18 --accept-package-agreements --accept-source-agreements
# 装到: C:\Program Files\PostgreSQL\18
# 包含 bin/ lib/ share/ data/ pgAdmin 4/ installer/
# 服务: postgresql-x64-18 STATE=RUNNING
# 端口: 5432 (localhost 接受连接)

# 2. 重置 postgres 密码（UAC 弹窗用户点"是"）
#    脚本 reset-pg-pw.ps1：备份 pg_hba.conf → 替换 scram-sha-256 → trust
#    → 重启服务 → 用 psql 改密码 → 建 timeslots_dev DB → 还原 pg_hba.conf → 重启

# 3. .env 配置
DATABASE_URL=postgresql://postgres:timeslots_dev@localhost:5432/timeslots_dev?schema=public
```

### 2.3 退 WSL 命令

```powershell
wsl --shutdown
wsl --unregister Ubuntu-26.04  # 删 WSL 实例（含 PG 18）
# 清空 .wslconfig（保留 WSL feature 以备不时之需）
```

### 2.4 关键脚本

| 脚本 | 用途 |
|------|------|
| `scripts/pg-silent-install.bat` | EDB installer 静默装 |
| `scripts/pg-initdb.bat` | initdb（已废，用 EDB 自带 data） |
| `scripts/reset-pg-pw.ps1` | 改 pg_hba.conf trust → 重启服务 → 改密码 → 还原 |
| `scripts/trigger-reset-pw.ps1` | 触发 UAC 跑 reset-pg-pw |
| `scripts/verify-pg-install.bat` | 验 PG 装好（读 installation_summary.log） |
| `scripts/check-pg.bat` | 查 PG 服务状态 |
| `scripts/check-pg-state.bat` | 查 PG 是否在跑 |
| `scripts/check-pg-install.bat` | 验 install summary + pg_isready |
| `scripts/test-endpoints.js` | **7 端点 e2e Node 测试（最终验证）** |

### 2.5 避坑点

1. **winget install 不会在 headless 终端等 UAC**：必须用 PowerShell `Start-Process -Verb RunAs` 触发 UAC，**不 -Wait**，让用户在桌面点"是"
2. **EDB installer 第一次只装 bin/share/installer 不装 lib**：必须用 `--install_runtimes 1` flag 才会装 lib/（含 dict_snowball.dll）
3. **data dir 默认在 C:\Program Files\PostgreSQL\18\data，普通用户无写权限**：让 EDB 自己 initdb，不要手动 initdb 到该目录
4. **EDB installer 生成的 postgres 密码是随机的**（不是 `--superpassword` 指定的）：必须用 reset-pg-pw.ps1 流程重置
5. **prisma service 启动时若 PG 还没就绪会 warn 但 server 仍起**：是预期行为（Batch 4 修的弹性 try/catch），PG 就绪后再调接口即可

---

## 3. 端到端联调

### 3.1 数据库连接

- ✅ `pg-test-new-pw.js`: Node pg 客户端连 `localhost:5432` 成功
- ✅ `prisma-conn-test.js`: Prisma Client 连 PG 18 成功（user/quota/timeBlock 查询都 OK）
- ✅ `prisma migrate dev --name init`: 12 表 + 6 enum 全部创建，迁移文件 `prisma/migrations/20260607133628_init/`
- ✅ Prisma Client (v5.22.0) 重生成到 `server/node_modules/@prisma/client`

### 3.2 7 端点 e2e 全绿

`scripts/test-endpoints.js` 验证：

| # | 端点 | 期望 | 实际 |
|---|------|------|------|
| T1 | `GET /api/v1/health` | 200 | 200 ✅ |
| T2 | `GET /api/v1/events/my` 无 auth | 40100 | 40100 ✅ |
| T3 | `GET /api/v1/events/my` Bearer u_test001（空数组）| 200 | 200 ✅ |
| T4 | `POST /api/v1/events` 空 body | 40000 class-validator | 40000 ✅ |
| T5 | `POST /api/v1/events` endTime<=startTime | 40001 | 40001 ✅ |
| T6 | `POST /api/v1/events` 真实创建 | 201 | 201 ✅ |
| T7 | `GET /api/v1/events/my` 创建后 | 200 + 1 row | 200 + 1 row ✅ |

**关键发现**：
- T3 / T6 / T7 用 `Authorization: Bearer 11111111-1111-1111-1111-111111111111`（真 UUID）才能跑通
- `User.id` 是 `@db.Uuid`，非 UUID 字符串触发 P2023 "Error creating UUID"
- `dayStartsAt` 是 `VarChar(5)`，必须是 `"04:00"` 不能是 `"04:00:00:00"`（P2000 "value too long"）
- 测试前必须 `upsert` user + quota 行（避免 FK 约束 P2003）

---

## 4. 前端 4 Tab + 4 stub pages

### 4.1 `app.json` tabBar 4 项

```json
"tabBar": {
  "color": "#999999",
  "selectedColor": "#07c160",
  "backgroundColor": "#ffffff",
  "borderStyle": "black",
  "list": [
    { "pagePath": "pages/schedule/index", "text": "日程" },
    { "pagePath": "pages/collab/index", "text": "协作" },
    { "pagePath": "pages/tasks/index", "text": "任务" },
    { "pagePath": "pages/mine/index", "text": "我的" }
  ]
}
```

**注**：tabBar **无 iconPath**（text-only），M2 阶段补图标（用 WeUI 标准 iconfont 或自研 SVG → PNG）。

### 4.2 4 stub pages

| 页面 | 内容 |
|------|------|
| `pages/schedule/index` | 标题 + 副标题 + "日视图 24h 时间轴 AI 多模态录入" 提示 |
| `pages/collab/index` | 3 子 Tab："我的圈子" / "收到的邀请" / "共享给我"（点击切换） |
| `pages/tasks/index` | 顶部 3 卡："今日待办" / "本周到期" / "逾期"（数字 0） |
| `pages/mine/index` | 头像 + 昵称 + 额度 2 卡（永久 / 本月） |

每个 page 都有 `index.{ts,wxml,wxss,json}` 4 文件，符合小程序标准。

### 4.3 Page 接口命名铁律 #22（新增）

**问题**：miniprogram-api-typings 在全局声明了同名 `PageData` 接口。业务侧 `interface PageData` 与全局 + 其他文件的 `PageData` **自动合并**，导致 `Page<TData, TCustom>` 的 `data` 字段必须满足合并后的超集。4 个 page 都用 `PageData` 时 tsc 报：

```
Type '{ title: string; subtitle: string; hint: string; }' is missing the following
properties from type 'PageData': tabs, activeTab, nickname, permanentPoints, ...
```

**修复**：每页 TData 接口用 `<Name>PageData` 形式（如 `SchedulePageData`），方法接口用 `<Name>PageMethods`（如 `SchedulePageMethods`）。

```typescript
// ❌ 错误：通用名
interface PageData { title: string; }
interface PageMethods { onLoad(): void; }
Page<PageData, PageMethods>({ data: { title: 'x' } });

// ✅ 正确：每页独立名
interface SchedulePageData { title: string; }
interface SchedulePageMethods { onLoad(): void; }
Page<SchedulePageData, SchedulePageMethods>({ data: { title: 'x' } });
```

**未修**：`examples/page-template/index.ts` 仍是反例（§10 只读，待 M2 拍板修）。

---

## 5. 全 4 阶段（Quality Gates）全绿

| Gate | 工具 | 结果 |
|------|------|------|
| TypeScript 编译 | `npx tsc --noEmit` | **0 错** ✅ |
| Prisma schema 验证 | `npx prisma validate` | ✅ |
| Jest 单元测试 | `npx jest` | 13/13 ✅（Batch 8 数据） |
| 端到端 e2e | `node scripts/test-endpoints.js` | **7/7** ✅ |
| Server 审计 | `node scripts/audit.js` | TODO 0 / JSDoc 0 / unused 0 ✅ |

---

## 6. 关键变更清单

### 6.1 新增文件
- `src/pages/schedule/index.{ts,wxml,wxss,json}` — 4 文件
- `src/pages/collab/index.{ts,wxml,wxss,json}` — 4 文件
- `src/pages/tasks/index.{ts,wxml,wxss,json}` — 4 文件
- `src/pages/mine/index.{ts,wxml,wxss,json}` — 4 文件
- `server/scripts/test-endpoints.js` — 7 端点 e2e 测试
- `server/scripts/start-detached.js` — 真分离 spawn（绕开 bash timeout）
- `server/scripts/reset-pg-pw.ps1` — PG 密码重置脚本
- `server/scripts/trigger-reset-pw.ps1` — 触发 UAC 跑 reset
- `server/scripts/verify-pg-install.bat` / `check-pg-state.bat` / `check-pg-install.bat` / `check-pg.bat` / `check-pg18-utf8.bat` / `dir-pg18*.bat` / `verify-tables.bat` / `wmic-node.bat` / `ps-node.ps1` / `peek-pg-zip.bat` / `expand-pg-zip.bat` / `dl-pg*.bat` / `pg-initdb*.bat` / `pg-silent-install*.bat` / `trigger-uac-install*.ps1` / `choco-pg.ps1` / `pg-pw-brute.js` / `pg-sspi.js` / `pg-create-db.js` / `pg-init-dev-db.js` / `prisma-conn-test.js` / `debug-p2023.js` — 25+ 临时诊断脚本

### 6.2 修改文件
- `src/app.json` — 加 tabBar 4 项 + 4 pages 路径
- `src/pages/index/index.ts` — `PageData` / `PageMethods` 改 `IndexPageData` / `IndexPageMethods`
- `PRD.md` — 新增 §2.5（4 Tab 结构）；§4.1 PG 16 → 18 + 删 Docker Compose
- `AGENTS.md` — §2 PG 16 → 18 + 删 WSL 注释；§5.2.2 新增 #22（Page 接口命名）；§12 +1 changelog

### 6.3 临时文件（待清理）
- `C:\pg-installer\` (730MB EDB installer)
- `C:\pg-zip\` (11MB 部分下载)
- `C:\pg-data\` (空 data dir，第一次 initdb 失败产物)
- `server\.env.test*` (3 个测试用)
- `server\server.log` (启动日志)
- `server\.server.pid` (detached spawn PID)
- `server\scripts\wsl-*.bat` / `wsl-*.js` (WSL 临时脚本)

### 6.4 永久删除
- `C:\Users\xwhy7\.wslconfig` (清空)
- WSL Ubuntu-26.04 实例

---

## 7. 待办（Batch 10+ 后续）

1. **JWT 真实接入**（M2-A 后续）：替换 JwtAuthGuard stub；code2Session + JWT 签发
2. **tabBar 图标**：4 个 PNG (81x81 + 162x162 retina)，text-only 升级为 icon + text
3. **PRD §功能设计章节完整化**：每个 user story 标注所属 Tab + API
4. **AGENTS §6.7 AI 教练算法 spec 补完**（之前 P0 第 4 项）
5. **PRD.md 升 v1.0**（现有 v0.2 + 4 Tab 决策入正文）
6. **WeChat dev tools 实操**：`cli.bat -o C:\Users\xwhy7\timeslots-v1\src` 打开项目
7. **Jest E2E**：跑全 7 端点
8. **清理临时诊断脚本**（6.3 列表）
9. **schema migration 验证**：当前已 applied，formal run 一次

---

## 8. 拍板决策回放

| 决策 | 拍板时间 | 影响 |
|------|----------|------|
| 4 Tab 重新梳理 | 2026-06-07 | PRD §2.5 / app.json / 4 stub pages |
| 任务组不支持圈子共享 | 2026-06-07 | TaskGroup schema 不加 circleId |
| AI 教练在"我的"Tab | 2026-06-07 | pages/mine/coach |
| 日程 Tab 默认日视图 | 2026-06-07 | 24h 时间轴 |
| 任务主页 3 卡仅 owner | 2026-06-07 | owner filter |
| 协作不显示已退圈子 | 2026-06-07 | 软删即走 |
| 日程详情有评论 | 2026-06-07 | Comment 模型 + pages/schedule/detail |
| 我的无切换账号 | 2026-06-07 | 不做 |
| 退 WSL 装 Windows PG | 2026-06-07 | 全 Windows 拓扑 |
| 收邀 + 共享子 Tab | 2026-06-07 | pages/collab 子 Tab |
| **PageData 改名铁律** | 2026-06-07 | AGENTS §5.2.2 #22 |
