# 2026-06-07 批次一现状评估与路线图

> 用户在批次一开干前对当前 opencode 状态的评估。后续批次二、批次三将基于本文件继续。
> 用户原话："记住这些，后面还有批次二、批次三、一并补齐"

## 现状

opencode 当前交付的是 **M1 工程骨架**（前后端骨架 + /health demo），**不是**批次一的产品骨架。
具体产出：
- 21 个 .ts 文件（9 前端 + 12 后端）+ 68 个 JSDoc
- AGENTS.md v1.2（含 4 条 M1 新增铁律）
- M1 changelog：`MILESTONE-20260607-m1-scaffold.md`

## 批次一目标（用户原话）

> 暂停 M2/M3，先做 V1.0 PRD 的样板项目（mock 数据 + 占位页 + tabBar 骨架），让产品/设计/前端/后端先对齐视觉再写代码

## 现状 vs 目标差距

| 维度 | 批次一目标 | 现状 | 差距 |
|------|-----------|------|------|
| 页面数 | 4 个主 Tab（**日程 / 协作 / 任务 / 我的**）| 1 个 dev demo（健康检查）| ❌ 缺 3 个 Tab |
| tabBar | 4 项 tabBar + icon | `app.json` 只有 `pages` 数组 | ❌ 无 tabBar |
| 视觉骨架 | 占位页 + 组件卡片 + 时间轴/项目双视图雏形 | 只有 1 个文字页 | ❌ 无视觉锚点 |
| Mock 数据 | 统一 mock 层 | 只有 `/health` 一个真实端点 | ❌ 无 mock |
| AGENTS.md | 与 V1.0 PRD reconciled | §6 LLM 定位冲突未决 | ❌ 规则层未对齐 |
| 视觉对齐机制 | 截图/设计稿/设计 token 落库 | 0 | ❌ 无对齐通道 |

## 4 块硬骨头（按依赖顺序）

### 1. AGENTS.md reconcile（先做）
- 解 LLM 定位冲突（"增值" vs "AI 录入核心"）
- 解 §6.5 三个 deferred 与新 PRD 协作 Tab 冲突
- 把批次一/M2/M3 里程碑映射写进 §12

### 2. PRD 升 v1.0（同步）
- 整合 4 节新 PRD（4 Tab / AI 录入 / 隐私三态 / 双视图 / 复盘编辑 / 双轨账号）
- 列 14 条待澄清疑点先收敛

### 3. Mock 数据层（批次一基建）
- `src/services/mock/`：按 PRD 资源（TimeBlock / Todo / Project / Category）建 in-memory store
- 拦截器开关：`VITE_USE_MOCK=true` 走 mock，否则走真实 API
- 业务 service 只跟 service 契约对接，不感知 mock

### 4. 4 Tab 页面骨架 + tabBar（批次一交付物）
- `src/pages/timeline/`（日程）— 时间轴 + 隐私三态 chip
- `src/pages/projects/`（协作）— 项目列表 + 进度条
- `src/pages/tasks/`（任务）— 任务池 + 优先级排序
- `src/pages/me/`（我的）— 设置 + AI 额度 + 退出
- `app.json` 加 `tabBar` 配置
- 顶部统一 `AppBar` + 底部统一 `TabBar` 组件

## 顺带要补的（批次一准备）

- 装 `mobx-miniprogram`（受保护依赖未装）
- 装 `dayjs`（隐私三态按时区切分需要）
- 决定 `examples/page-template` 那个 `Page<{}, PageData>` 反模式是修还是不修（受保护 §10，需 CHANGE-xxx.md）

## 后续批次

- **批次二**：真实 API 接入（接 DB + 接微信 code2Session + JWT）
- **批次三**：AI 录入 + LLM 代理 + 智能复盘/提取/规划

## 风险与权衡

- **AGENTS reconcile 拖延会阻塞所有批次**：规则不锁定，后续每次都要回头解冲突
- **Mock 优先于真实 API**：批次一只走 mock，避免 DB/微信联调阻塞前端视觉对齐
- **设计 token 必须先于组件库**：批次一要先把颜色/字号/间距 token 落到 `app.wxss` 变量，否则 WeUI 改不动
