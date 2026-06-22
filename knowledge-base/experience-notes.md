# TimeSlots v1 — 经验教训与陷阱清单

> 来源: EXPERIENCE.md + ONBOARDING.md + 2026-06-19 全量前端审计
> 最后更新: 2026-06-20

## 架构决策记录

### D1: NestJS Module 切分（DDD 风格）
- 每个业务领域一个 module（controller + service + dto）
- Controller 薄（仅 HTTP + 参数校验），Service 厚（全部业务逻辑）
- **禁止 Controller 直调 Prisma**

### D2: 响应码契约（统一出口）
```
成功: {code: 0, message: 'success', data: T, path, timestamp}
失败: {code: <5位>, message: string, data: null, path, timestamp}
```

### D3: 软删除架构
- `PrismaService.$extends` 拦截 findMany/findFirst/findUnique/count → 自动注入 `isDeleted: false`
- 事务内用 `tx.xxx` 不用 `this.prisma.client.xxx`
- 级联软删: 先查 ID 再 updateMany

### D4: 时区统一 UTC+8
- 所有日期字符串格式 `YYYY-MM-DD`
- 后端创建日期用 `new Date(date + 'T00:00:00+08:00')`
- 前端日期格式化用 `Intl.DateTimeFormat` + `timeZone: 'Asia/Shanghai'`

### D5: MobX Store 绑定模式
- 页面用 `createStoreBindings` 绑定 store
- `onUnload` 时必须 `destroyStoreBindings()`
- action 用 `function(this: StoreName)` 而非箭头函数

### D6: 前端数据流
- 页面 data 中只放视图相关数据
- 业务数据放 MobX store
- 所有 API 调用走 `services/api.ts` → `utils/request.ts`

### D7: Design Token 系统单源（2026-06-19 审计新增）
- 所有颜色 / 间距 / 圆角 / 字号 / 阴影**必须**引用 `src/styles/tokens.wxss` 的 CSS 变量 `var(--ts-*)`
- **禁止**在 WXSS 或行内 style 硬编码 `#xxx` / `rgb(...)` / 原始 px 数值
- token 分层：语义层（`--ts-color-text-primary`）→ 原子层（`--ts-color-blue-500`）；优先用语义层
- 暗黑模式：token 文件内已用 `@media (prefers-color-scheme: dark)` 重定义，业务代码**不**写暗黑分支
- 现状（2026-06-19 审计）：30+ 处硬编码颜色未使用 token，**P1 待整改**

### D8: 分包策略（**已实施**，2026-06-20 核对 app.json 修正）
- **当前状态：已实施 4 个分包**（`subpkg-detail` / `subpkg-mine` / `subpkg-collab` / `subpkg-templates`），主包仅 6 个页面（4 tabBar + search + landing/ai-preview）
- `app.json` 已配 `subPackages` + `preloadRule`（schedule 进入时预加载 subpkg-detail）
- **教训（2026-06-20 自我纠错）**：2026-06-19 审计曾误报"无分包、26 页全在主包"（L27 P0）。原因是审计依据了陈旧的会话记忆而非实际 `app.json`。**改分包相关代码前必须 grep `src/app.json` 确认现状**，不要相信任何二级来源（含本知识库的历史版本）。
- 分包规则（沿用）：
  - tabBar 页必须在主包
  - 分包间禁止互相 require
  - 分包内组件优先用分包相对路径，跨分包组件放 `src/components/`（主包）

### D9: 错误可观测性（2026-06-19 审计新增）
- 全局错误捕获（`app.ts` 的 `wx.onError` / `wx.onUnhandledRejection`）**当前仅 console.error**
- **P0 待办**：接入 wx.cloud 日志或后端上报端点，禁止生产环境错误"静默消失"
- 业务级 try/catch 至少调 `logError(ctx, err)`（见 coding-rules §2.7），禁止空 catch / bare catch

## 编码陷阱清单（L1-L24）

> L1-L24 为历史积累（早期重建 + 巡视整改）。L25-L36 为 2026-06-19 全量前端审计新增。

| 编号 | 严重度 | 陷阱 | 修复 |
|------|--------|------|------|
| L1 | P0 | `wx.onError` 回调用 `errMsg` 字段 | 改为 `message` |
| L2 | P0 | 空 catch 块 | 至少 `console.error` |
| L3 | P0 | WXML 中使用 `charAt()` | 改为 `slice(0, 1)` |
| L4 | P1 | `as any` 绕过类型检查 | 改为 `as unknown as XXX` |
| L5 | P1 | MobX action 用箭头函数 | 改为 `function(this: StoreName)` |
| L6 | P1 | `??` 在 WXML 模板中使用 | 改为 `||` 或预计算 |
| L7 | P1 | `px` 单位在 WXSS 中使用 | 改为 `rpx` |
| L8 | P2 | setData 频繁调用 | 批量更新 |
| L9 | P2 | 组件缺少 `styleIsolation: 'isolated'` | 必须设置 |
| L10 | P2 | 后端未带 userId 过滤 | 所有查询必须带 userId |
| L11 | P2 | 日期使用 `new Date('...Z')` 导致 off-by-one | 使用 `+08:00` |
| L12 | P2 | 前端直接调用 `wx.request` | 统一走 `utils/request.ts` |
| L13 | P3 | Behavior 中 this 指向丢失 | 用箭头函数或 bind |
| L14 | P3 | 图片未压缩导致主包超限 | 单张 ≤200KB |
| L15 | P3 | 未开启 lazyCodeLoading | app.json 配置 |
| L16 | P3 | 分包中放 tabBar 页面 | tabBar 必须在主包 |
| L17 | P3 | 日志泄漏敏感信息 | 使用 `logError()` |
| L18 | P3 | API Key 出现在前端 | 必须后端加载 |
| L19 | P3 | 隐私日程送入 LLM | nature=private 跳过 |
| L20 | P4 | 未处理网络超时 | request.ts 区分超时/连接失败 |
| L21 | P4 | 重复请求未去重 | 使用 request-dedup.ts |
| L22 | P4 | 组件 Props 无默认值 | 必须有 value |
| L23 | P4 | 页面未清理 store 绑定 | onUnload 必须 destroy |
| L24 | P4 | 后端未处理并发修改 | 乐观锁 + P2025 捕获 |

## 审计新增陷阱清单（L25-L36，来自 2026-06-19 全量前端审计）

> 完整审计报告：`C:\Users\xwhy7\Desktop\output\2026-06-19-前端审计报告-代码与UI-UX.md`
> 审计范围：209 文件 / 9485 行 TS+WXML+WXSS / 16 组件 / 26 页面（6 主包 + 20 分包，见 D8）
> ⚠️ 审计部分结论（如 L27 分包）后被源码核对推翻，已就地标注，详见文末「元教训」

| 编号 | 严重度 | 陷阱 | 影响范围 | 修复 |
|------|--------|------|----------|------|
| L25 | **P0** | 40+ 处静默 catch（`catch {}` 或 `catch (e) {}` 无任何处理） | 全项目遍布 | 至少 `logError(ctx, e)`；关键路径需用户可见 toast |
| L26 | **P0** | 全局错误捕获（`app.ts` 的 `wx.onError`/`onUnhandledRejection`）仅 console.error，无上报 | 生产环境错误静默消失 | 接 wx.cloud 日志或后端上报；见 D9 |
| L27 | ~~P0~~ **已撤销** | ~~无分包，26 页全在主包~~ → **审计误报**：实际 `app.json` 已配 4 个分包 | 见 D8；改分包代码前 grep `src/app.json` |
| L28 | **P0** | JWT token 明文存 `wx.setStorageSync('token', ...)` | storage 被读取即泄露 | 至少做混淆；敏感操作重新校验；评估微信 `wx.setStorage` 加密选项 |
| L29 | **P1** | `formatDate` 在 3 处重复定义（`utils/date.ts` 正确 + `behaviors/day-nav.ts` + `behaviors/week-nav.ts` 错误） | 后两份**漏了时区参数**，跨日界错误 | 删除重复，统一 import `utils/date.ts` 的版本 |
| L30 | **P1** | 27 处 `new Date()` 未指定时区，依赖设备本地时区 | 海外/出差用户日程错位 | 显式 `new Date(str + 'T00:00:00+08:00')`，参考 D4 |
| L31 | **P1** | `onScroll` 直接改 `this.data.xxx`（绕过 setData） | 视图不更新 / 数据不一致 | 滚动状态用组件实例属性 `this.scrollX = x`，不入 data |
| L32 | **P1** | 14 个组件 `.json` 缺 `styleIsolation: 'isolated'` | 样式污染，父子组件相互串样式 | 每个 component.json 必须显式声明（参考 L9，此处升级到 P1） |
| L33 | **P1** | 30+ 处硬编码颜色（`#1890FF` `#999` 等）未用 design token | 暗黑模式失效 / 主题不一致 / 维护成本 | 改用 `var(--ts-color-*)`，参考 D7 |
| L34 | **P1** | 无 `aria-label` / `role` / 无障碍属性 | 读屏不可用；上架审核风险 | icon-only 按钮必加 `aria-label`；图片加 `alt` 等价描述 |
| L35 | **P1** | 字号未响应系统字体缩放（无障碍） | 老年/视障用户字号不可调 | 关键文本用 `rpx` + 评估 `wx.getSystemInfoSync().fontSizeSetting` 缩放 |
| L36 | **P2** | `block-card` 入场动画在**每次 setData** 时重放 | 列表滚动时卡片不停闪动 | 动画只挂载时触发一次；用 CSS `:first-child` 或一次性 class |

### 审计衍生的次级陷阱（L37-L40，衍生自上述主项）

| 编号 | 严重度 | 陷阱 | 修复 |
|------|--------|------|------|
| L37 | P2 | `block-interaction.ts` 513 行 + 21+ 处 `as unknown as` cast | 拆分 behavior；用类型守卫替代 cast |
| L38 | P2 | `services/api.ts` 610 行单文件 80+ API 函数 | 按模块拆分（`api/event.ts` `api/task.ts` ...） |
| L39 | P2 | store 全量替换 fetch（`blockStore`/`taskStore`），无 SWR/增量更新 | 评估 mobx-miniprogram 的 patch 更新；至少 diff 后 setData |
| L40 | P2 | `request.ts` 无重试机制，10s 超时即失败 | 关键写操作加 1-2 次指数退避重试（注意幂等性） |

### 审计未覆盖但需警惕的历史陷阱（补充）

| 编号 | 严重度 | 陷阱 | 修复 |
|------|--------|------|------|
| L41 | P3 | WXSS 文件被 Write/Edit 工具写入 UTF-8 BOM → 微信编译器崩溃白屏 | 每次改 .wxss 后 PowerShell 验证无 BOM（AGENTS §5.2.2 #25） |
| L42 | P3 | `PageData` / `PageMethods` 全局同名接口合并 → 4 页 data 字段被合并报错 | 命名 `<Name>PageData`（AGENTS §5.2.2 #22） |
| L43 | P3 | 业务接口名 `Todo` 与 TODO 标记混淆 | grep `TODO|FIXME` 时排除业务实体 Todo 类名 |

## 审计整改优先级建议

> 给后续 agent 的整改路线图（按 ROI 排序，非按编号）
> ⚠️ **L27（分包）已于 2026-06-20 撤销**——app.json 实际已配 4 分包，审计误报。以下路线图已剔除该项。

1. **先止血（P0）**：L25 静默 catch 批量加 `logError` + L26 全局错误上报 → 防止生产环境盲飞
2. **再消重（P1 高 ROI）**：L29 formatDate 统一 + L30 时区 + L33 design token → 三项机械替换，风险低收益大
3. **后治理（P1 中 ROI）**：L32 styleIsolation + L31 onScroll + L34/L35 无障碍 → 涉及多文件，需逐个验证
4. **最后重构（P2）**：L37/L38 拆分大文件 → 重大架构调整，单独开版本做

## 元教训：知识库自我纠错记录

| 日期 | 误报内容 | 纠正原因 | 教训 |
|------|----------|----------|------|
| 2026-06-20 | L27"无分包，26 页全在主包"（P0） | `grep subPackages src/app.json` 实际已配 4 分包 | 审计/会话记忆是二手信息；改代码前必须核对一手源码（app.json / schema.prisma / tsconfig）|
