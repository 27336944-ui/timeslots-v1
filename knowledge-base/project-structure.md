# TimeSlots v1 — 项目结构与分包规则

> 最后更新: 2026-06-20（核对 src/app.json 实际内容 + 补审计数据 + 组件数修正为 16）
> 来源: 项目源码逆向整理（一手源码核对，非二级文档）

## 1. 项目总览

```
timeslots-v1/
├── src/                          # 前端小程序源码（miniprogramRoot）
├── server/                       # NestJS 后端
├── knowledge-base/               # 共享知识库（5 个扁平文件）
├── .agents/skills/               # opencode/Hermes 通用技能
├── skills/                       # AI Agent 技能（PWF + ponytail 系列）
├── PRD.md                        # 产品需求
├── VERSION_PLAN.md               # 版本计划
├── AGENTS.md                     # AI Agent 工作规则
├── CODING_RULES.md               # 强制编码规范
├── TEAM_RULES.md                 # 团队规则
├── EXPERIENCE.md                 # 经验文档
├── ONBOARDING.md                 # 新成员指南
├── project.config.json           # 小程序项目配置
├── tsconfig.json                 # 前端 TS 配置
├── package.json                  # 前端依赖
└── server/
    ├── prisma/schema.prisma      # 数据库 Schema
    ├── package.json              # 后端依赖
    └── src/
        ├── main.ts               # NestJS 入口
        ├── app.module.ts         # 根模块
        ├── common/               # 全局基础设施
        ├── modules/              # DDD 业务模块
```

## 2. 前端目录结构（src/）

```
src/
├── app.ts / app.json / app.wxss   # 入口 + 全局配置
├── behaviors/                      # 可复用 Behavior
├── components/                     # 公共组件（kebab-case 目录）
├── constants/                      # 常量
├── custom-tab-bar/                 # 自定义 tabBar
├── pages/                          # 页面（kebab-case 目录）
│   ├── schedule/                   #   日程 Tab
│   ├── tasks/                      #   任务 Tab
│   ├── collab/                     #   协作 Tab
│   ├── mine/                       #   我的 Tab
│   ├── search/ / templates/ / landing/
├── services/api.ts                 # 所有 API 调用集中封装
├── stores/                         # MobX Store
├── styles/tokens.wxss             # CSS 变量/主题
├── types/                          # 全局类型
├── utils/                          # 纯函数工具
└── assets/                         # 静态资源
```

## 3. 页面路由（app.json，2026-06-20 核对）

### 主包 pages（6 个）
- `pages/schedule/index` — 日程（tabBar 首页）
- `pages/tasks/index` — 任务（tabBar）
- `pages/collab/index` — 协作（tabBar）
- `pages/mine/index` — 我的（tabBar）
- `pages/search/index` — 搜索
- `pages/landing/ai-preview/index` — AI 预览（增长破冰，免登录 Demo）

### 分包（4 个，详见 §5）
- `subpkg-detail/`（7 页）：schedule/detail, schedule/preview, schedule/share-card, tasks/task-detail, tasks/delegation-detail, tasks/forward-create, tasks/ai-decompose
- `subpkg-mine/`（8 页）：mine/settings, mine/namecard, mine/categories, mine/circles, mine/stats, mine/transparency, mine/classifications, mine/profile-settings
- `subpkg-collab/`（4 页）：collab/detail, collab/approval-detail, collab/approval-create, collab/approval-share
- `subpkg-templates/`（1 页）：templates/apply

### preloadRule
进入 `pages/schedule/index` 时预加载 `subpkg-detail`（`network: 'all'`），降低详情页首次进入延迟。

## 4. 后端模块（server/src/modules/，核对 controllers 共 18 个）

| 模块 | 职责 | 端点前缀 |
|------|------|----------|
| health | 探活（Public，DB 挂仍返回 200） | `/health` |
| auth | 认证（dev login / wx-login / 注销冷静期） | `/auth` |
| user | 用户管理 | （内部） |
| timeblock | 时间块 CRUD + 冲突/空闲/弹性/名片/分享卡 | `/time-blocks` |
| task | 任务管理 + from-text + 统计 | `/tasks` |
| step | 任务步骤 + 排程 | `/steps` |
| category | 分类管理 | `/categories` |
| circle | 圈子 + 成员 + 忙闲 | `/circles` |
| approval | 审批流（friend/phone/qr 三种 recipient） | `/approvals` |
| delegation | 委托转交 | `/delegations` |
| share | 分享 recipient + 隐身切换 | `/share` |
| reminder | 订阅消息提醒 | `/reminders` |
| template | 模板 + 应用 | `/templates` |
| ai | 建议时间段（**规则算法，不走 LLM**） | `/ai/suggest-slots` |
| llm | MiniMax AI（parse / decompose，**受保护**） | `/ai/parse`、`/ai/decompose` |
| search | 全局搜索 | `/search` |
| quota | 配额扣费（乐观锁，内部被 llm/event 调用） | （内部） |
| eventlog / notification / visibility | 审计日志 / 推送 / 可见性控制（内部服务，无 HTTP） | — |

## 5. 分包配置（**已实施**，核对 src/app.json）

> ✅ 已配置 4 个分包 + preloadRule。主包仅 6 页（4 tabBar + search + landing），见 §3。
> 改分包前务必读 `src/app.json` 实际内容，不要相信二级文档（见 experience-notes.md 元教训）。

```json
{
  "subPackages": [
    { "root": "subpkg-detail", "pages": ["schedule/detail/index", "schedule/preview/index", "schedule/share-card/index", "tasks/task-detail/index", "tasks/delegation-detail/index", "tasks/forward-create/index", "tasks/ai-decompose/index"] },
    { "root": "subpkg-mine", "pages": ["mine/settings/index", "mine/namecard/index", "mine/categories/index", "mine/circles/index", "mine/stats/index", "mine/transparency/index", "mine/classifications/index", "mine/profile-settings/index"] },
    { "root": "subpkg-collab", "pages": ["collab/detail/index", "collab/approval-detail/index", "collab/approval-create/index", "collab/approval-share/index"] },
    { "root": "subpkg-templates", "pages": ["templates/apply/index"] }
  ],
  "preloadRule": {
    "pages/schedule/index": { "network": "all", "packages": ["subpkg-detail"] }
  }
}
```

## 6. 审计数据（2026-06-19 全量前端审计）

> 完整报告：`C:\Users\xwhy7\Desktop\output\2026-06-19-前端审计报告-代码与UI-UX.md`
> 陷阱详情见 `experience-notes.md` L25-L43

- **规模**：209 文件 / 9485 行（TS + WXML + WXSS）
- **组件**：16 个（`src/components/*/index.json` 核对，旧版知识库误记为 15）
- **页面**：26 个（6 主包 + 20 分包）
- **后端模块**：18 个（含 ai/search/health/eventlog/notification/visibility/share，旧版漏列）
- **重点问题**：40+ 静默 catch（L25 P0）/ 全局错误无上报（L26 P0）/ token 明文存储（L28 P0）/ formatDate 重复+时区 bug（L29 P1）/ 30+ 硬编码颜色（L33 P1）

## 7. 组件清单（核对 src/components/*/index.json，共 16 个）

> 详细 Props/Events 见 `coding-rules.md` §3.3。注意：旧版知识库列的 `visibility-bar` / `relation-panel` **不存在**，实际为 `block-hero` / `block-sections` / `loading`。

block-hero, block-sections, bottom-sheet, capsule-button, category-picker, cell, compact-header, confirm-modal, create-entry-sheet, inset-form, loading, privacy-agreement, segmented-control, skeleton, state-view, tag
