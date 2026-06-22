# TimeSlots v1 — 编码规范（合并版）

> 来源: CODING_RULES.md + TEAM_RULES.md + AGENTS.md + WECHAT_MINIPROGRAM_DEVELOPMENT_SPEC.md + 2026-06-19 全量前端审计
> 最后更新: 2026-06-20
> 
> **Ponytail The Ladder**（每次写代码前走，停在第一个成立的台阶）：
> 1. YAGNI — 这东西真的需要存在吗？
> 2. 标准库 — 标准库能实现吗？
> 3. 原生平台 — CSS 替代 JS、DB 约束替代应用代码
> 4. 已有依赖 — 已有依赖能解决吗？禁止加新依赖换几行代码
> 5. 一行 — 能一行写完吗？
> 6. 最少代码 — 最后才写最少代码
> 
> **Planning-with-files**（复杂任务 3+ 步必须创建）：`task_plan.md` + `findings.md` + `progress.md` + **3-Strike Error Protocol**（诊断→换方法→重新思考→升级）
> 
> **注意**：本项目使用 ponytail **full** 级别；不写 `// ponytail:` 标记注释（AGENTS.md §5.5 优先）；禁止用 `todowrite` 做持久跟踪
> 违反任何一条 = 代码不可上线

## 1. 通用规则

### 1.1 TypeScript 严格模式
- `strict: true` 必须开启
- **禁止 `any`** — 用 `unknown` + 类型守卫
- **禁止 `as any`** — 用 `as unknown as XXX`
- 接口集中定义在 `types/`
- `prefer-const` — 未重赋值的变量必须 `const`

### 1.2 最小改动原则
- 只改与需求直接相关的代码
- 禁止顺手重构/改命名/改格式/加注释
- 如需重构，先提 `CHANGE-xxx.md`

### 1.3 受保护模块（禁止修改）
- `src/utils/request.ts` — 网络请求层
- `src/stores/auth.ts` — 认证状态
- `src/services/*` — 业务 service（改既有需 CHANGE）
- `server/src/modules/llm/**` — MiniMax 代理
- `src/types/global.d.ts` — 全局类型
- `src/prompts/**` — System Prompt
- `project.config.json` — 微信项目配置

### 1.4 TODO/FIXME 零容忍
```bash
grep -rE "\b(TODO|FIXME)\b" src/ server/src/ --include='*.ts' --include='*.wxml'
# 必须为 0
```

### 1.5 隐私与安全
- 日志禁止包含: `shareToken`、`contactValue`、`password`、`token`
- MiniMax API Key 必须在 NestJS 后端 config 加载
- 隐私日程（nature=private）禁止送入 LLM

## 2. 前端规则

### 2.1 基础架构
- 源目录: `src/`
- 禁止 `.js` 文件，统一 `.ts`
- 页面用 `Page()`，组件用 `Component()`
- 组件必须 `options: { styleIsolation: 'isolated' }`

### 2.2 严禁
- Taro / React / NutUI / `px` 单位
- `window.*` / `document.*` / `localStorage`
- `userAgent` 做平台判断（用 `wx.getSystemInfoSync()`）

### 2.3 Page 泛型签名
```typescript
interface SchedulePageData { blocks: TimeBlock[] }
interface SchedulePageMethods {
  onTapFoo(): void
  storeBindings?: { destroyStoreBindings: () => void }
}
Page<SchedulePageData, SchedulePageMethods>({ data: { blocks: [] }, onTapFoo() {} })
```
- TData 接口名**禁止用 `PageData`**（会被全局合并）
- 命名: `<Name>PageData` / `<Name>PageMethods`

### 2.4 WXML 模板限制
- 不支持: 方法调用、`??`、模板字符串、箭头函数
- 替代: `a || b` 代替 `a ?? b`；预计算为 data 字段

### 2.5 wx.request cast
```typescript
export type WxRequestMethod = 'OPTIONS'|'GET'|'HEAD'|'POST'|'PUT'|'DELETE'|'TRACE'|'CONNECT'|'PATCH'
wx.request({ method: method as WxRequestMethod, data: data as WxRequestData })
```

### 2.6 wx 错误回调字段
- `wx.onError` 回调 → `err.message`（不是 `errMsg`）
- `success/fail` 回调 → `res.errMsg`

### 2.7 异步 + 错误处理（审计 L25/L26/L17 加强）
- **空 catch 零容忍**：`catch {}` / `catch (e) {}` 无任何处理 = 代码不可上线
- **必须 `logError(ctx, err)`**：禁止只用 `console.error`（生产环境看不到）
  - `logError` 签名：`logError(ctx: string, err: unknown, extra?: Record<string, unknown>): void`
  - ctx 用模块路径前缀，如 `'blockStore.fetchByDate'`
  - 敏感字段（shareToken/contactValue/password/token）必须在 extra 里先脱敏
- 禁止死 try/catch（只 throw e）
- fire-and-forget 用 `void` 前缀
- 关键写操作（创建/删除/扣额度）失败必须用户可见 toast（参考 §2.11）
- **全局兜底**：`app.ts` 的 `wx.onError`/`onUnhandledRejection` 当前仅 console.error（审计 L26 P0）；生产前必须接上报通道

### 2.8 MobX Store 模式
```typescript
const blockStore: BlockStore = observable({
  fetchByDate: action(async function(this: BlockStore, date: string) {
    this.loading = true
    try { ... } catch (e) { console.error(...) } finally { this.loading = false }
  }),
})
```
- action 用 `function(this: StoreName, ...)` 非箭头函数
- async 代码不在 action 事务内，直接赋值触发渲染

### 2.9 网络请求集中
- 所有请求走 `utils/request.ts`
- 页面内禁止 `wx.request`

### 2.10 样式规范（审计 L7/L9/L32/L41 加强）
- 单位 `rpx`，禁止 `px`（仅 transform/box-shadow 的数值边界除外）
- **`styleIsolation: 'isolated'` 必须在 `index.json` 的 `component` 字段下声明**（不是只写在 TS options）
  ```json
  { "component": true, "styleIsolation": "isolated", "usingComponents": {} }
  ```
  - 审计 L32：14 个组件 JSON 缺此项 → 父子样式互串
- **WXSS 文件禁止 UTF-8 BOM**（L41）：Write/Edit 工具会带 BOM → 微信编译器崩溃白屏；每次改 .wxss 后验证
- 滚动 / 非渲染状态禁止塞进 `data`（L31）：用组件实例属性 `this.scrollX = x` 而非 `this.data.scrollX`，避免 setData 性能开销与视图错乱

### 2.11 Toast 克制
- 成功: 不弹 Toast，直接 navigateBack
- 失败: 保留表单，弹 `icon:none` Toast
- AI 失败: 静默切手动，不弹错误 Toast

### 2.12 Design Token 单源（审计 L33 + D7 新增，P1）
- 所有颜色 / 间距 / 圆角 / 字号 / 阴影**必须**引用 `src/styles/tokens.wxss` 的 CSS 变量
- **禁止**硬编码：`color: #1890FF` / `background: #fff` / `box-shadow: 0 2rpx 8rpx rgba(0,0,0,.1)`
- token 分层（优先用上层）：
  - **语义层**（首选）：`--ts-color-text-primary` `--ts-color-bg-base` `--ts-color-accent` `--ts-radius-card`
  - **原子层**：`--ts-color-blue-500` `--ts-space-md` `--ts-font-size-lg`
- 暗黑模式由 token 文件内 `@media (prefers-color-scheme: dark)` 统一处理，业务代码**不写暗黑分支**
- `app.wxss` 提供全局工具类（`ts-card` `ts-text-secondary` 等），能用工具类优先用工具类
- 整改现状：30+ 处硬编码颜色待替换（2026-06-19 审计）

### 2.13 无障碍（审计 L34/L35 新增，P1）
- **icon-only 按钮必加 `aria-label`**（如关闭按钮 `<view aria-label="关闭" bindtap="onClose">×</view>`）
- 图片加语义化描述（用 `aria-label` 或相邻 `<text>` 描述）
- 点击热区 ≥ 44×44rpx（iOS HIG / WCAG 推荐）
- 文字对比度 ≥ 4.5:1（正文）/ 3:1（大字号 18pt+）
- 字号响应系统缩放：关键文本优先用 `rpx`（已按 750px 设计稿缩放）；评估 `wx.getSystemInfoSync().fontSizeSetting` 做二次缩放（老年/视障用户）

### 2.14 动画规范（审计 L36 新增，P2）
- **禁止**列表卡片在每次 setData 时重放入场动画（L36：block-card 滚动时不停闪动）
- 入场动画只在首次挂载触发（CSS `:first-child` / 一次性 class / `wx:if` 控制）
- 动画时长 ≤ 300ms（微交互 ≤ 200ms）
- 优先 CSS animation / transition，避免 JS 驱动 `setInterval` 动画
- 尊重 `wx.getSystemInfoSync().enableAnimation === false`（用户关闭了动画）

### 2.15 时间处理（审计 L29/L30 + D4 加强）
- `formatDate` / `toLocalTime` / `todayStr` 等**必须**集中在 `src/utils/date.ts`，禁止拷贝粘贴
- `utils/date.ts` 的 `formatDate` 用 `Intl.DateTimeFormat('Asia/Shanghai')` 是**唯一正确实现**
- 审计 L29：`behaviors/day-nav.ts` + `behaviors/week-nav.ts` 各有一份**漏了时区参数**的拷贝，必须删除改 import
- `new Date(dateStr)` 必须显式时区：`new Date(dateStr + 'T00:00:00+08:00')`
- 禁止裸 `new Date('2026-06-19')`（依赖设备时区，海外用户错位）

## 3. 组件规范

### 3.1 组件结构
每个组件必须包含 4 个文件：
```
components/component-name/
├── index.json    # usingComponents
├── index.ts      # Component() 构造器
├── index.wxml    # 模板
└── index.wxss    # 样式
```

### 3.2 组件通用规则
1. **必须 `styleIsolation: 'isolated'`**，且写在 `index.json` 的 `component: true` 同级（不只写在 TS options）—— 审计 L32：14 个组件缺此项
2. 自定义组件必须有 README.md（AGENTS §5.2.2 唯一例外）
3. Props 必须有默认值
4. UI 优先 WeUI
5. **禁止拷贝工具函数进组件**（L29/L42）：`formatDate`/`todayStr`/`toLocalTime` 等 import 自 `utils/date.ts`

### 3.3 组件列表（2026-06-19 审计核对，实际 16 个）

> ⚠️ 旧版知识库列了 15 个含 `relation-panel` / `visibility-bar`，**实际不存在**（已被内联到页面或删除）。下表为 grep `src/components/*/index.json` 核对结果。

| 组件 | Props | Events | 备注 |
|------|-------|--------|------|
| block-hero | (block 数据) | (tap 等) | 时间块详情头图，新增 |
| block-sections | (sections) | (展开/收起) | 时间块分段展示，新增 |
| bottom-sheet | visible, height | close | |
| capsule-button | text, variant, disabled | tap | |
| category-picker | categories, selected | select | |
| cell | title, desc, arrow, bordered | tap | |
| compact-header | date, weekDays, selectedDay | search, plus, weekdaytap | |
| confirm-modal | visible, title, content, confirmText, cancelText, danger | confirm, cancel | |
| create-entry-sheet | visible | close, submit | |
| inset-form | visible, fields | submit | |
| loading | (size 等) | - | 新增（基础 loading） |
| privacy-agreement | - | agree | |
| segmented-control | options, selectedIndex | change | |
| skeleton | rowCount, showAvatar, avatarShape | - | |
| state-view | loading, empty, error, emptyText, errorText, actionText | action | |
| tag | text, type, size, closable | close | |

> 旧版的 `visibility-bar` / `relation-panel` 已不在 `src/components/`，若页面用到需检查是否内联。改组件前务必 `grep -r "visibility-bar\|relation-panel" src/` 确认实际位置。

## 4. 后端规则（NestJS + Prisma）

### 4.1 架构分层
- Controller: 仅 HTTP 路由 + 参数校验 + 调 service
- Service: 全部业务逻辑 + 数据访问
- DTO: 所有入参用 `class-validator` 装饰器

### 4.2 错误码
```
40001: VALIDATION_FAILED
40002: INVALID_DATE
40101: UNAUTHORIZED
40301: FORBIDDEN
40401: NOT_FOUND
40901: CONCURRENT_MODIFICATION
40902: DUPLICATE_ENTRY
50000: INTERNAL_ERROR
```

### 4.3 跨用户隔离
- 所有数据访问必须显式带 `userId` 过滤

### 4.4 软删除架构
- PrismaService `$extends` 自动注入 `isDeleted: false`
- 事务内用 `tx.xxx` 不用 `this.prisma.client.xxx`
- 级联软删: 先查 ID 再 updateMany
- SOFT_DELETE_MODELS 约 11 个
- **User 不在列表中**，需手动 `isDeleted: false`

### 4.5 乐观锁
```typescript
await tx.quota.update({
  where: { id, version: currentVersion },
  data: { balance: { decrement: amount }, version: { increment: 1 } }
})
// P2025 → BusinessException(40901, 'CONCURRENT_MODIFICATION')
```

### 4.6 时区 +08:00
```typescript
// ✅ 正确
new Date(date + 'T00:00:00+08:00')
// ❌ 禁止
new Date(date + 'T00:00:00.000Z')  // off-by-one
```

### 4.7 void + 204 冲突
- 禁止 `@HttpCode(204)` + `Promise<void>` 同时使用
- 返回 `{ deleted: true }`

### 4.8 Joi 校验
- `Joi.string().allow('').optional()` 处理空字符串

### 4.9 索引匹配查询
- 每个 `findMany` 的 `where` 组合必须对应 `@@index`

## 5. AI/LLM 规则

- LLM 5s 未响应 → 前端阻断，手动降级
- API Key 从 `server/src/config/` 加载
- 调用前后 `msgSecCheck` 双向审核
- 隐私日程禁止送入 LLM
- 流式传输: `idle → streaming → done/error` 状态机

## 6. 变更管理 SOP

收到 `CHANGE-xxx.md` 时强制执行三段式：
1. **影响分析** — 列出受影响文件/函数/类型/状态
2. **方案设计** — 具体修改清单 + 解耦方式
3. **增量实施** — 逐文件输出代码

## 7. 3-Strike Error Protocol（AI 错误恢复协议）

每次出现错误时执行，**禁止连续重复相同操作**：

| 次数 | 行动 |
|------|------|
| 第 1 次 | 诊断并修复 — 识别根因，在 `progress.md` 记录 |
| 第 2 次 | 换方法 — 换不同工具/库/方向，**禁止重复相同操作** |
| 第 3 次 | 重新思考 — 质疑假设，搜索方案，更新 `task_plan.md` |
| 3 次失败后 | **升级给用户** — 说明尝试 + 错误信息 + 请求指导 |

**铁则**：`if action_failed: next_action != same_action`；致命错误（数据丢失、安全漏洞）**立即升级**。

## 8. 质量自检清单

- [ ] 类型安全：无 any
- [ ] 平台兼容：未使用 DOM/BOM
- [ ] 架构隔离：未违规修改受保护模块
- [ ] NestJS 分层：Controller 未直接调 Prisma
- [ ] 错误处理：所有异步已 try/catch + **`logError(ctx, err)`**（非裸 console.error）
- [ ] 死代码清理
- [ ] UI 规范：优先 WeUI，单位 rpx
- [ ] **Design Token**：未硬编码颜色/间距/字号，用 `var(--ts-*)`（D7）
- [ ] **无障碍**：icon-only 按钮有 `aria-label`，热区 ≥44rpx，对比度 ≥4.5:1（L34）
- [ ] **时间处理**：无重复 `formatDate` 拷贝，`new Date` 带时区（L29/L30）
- [ ] **组件隔离**：`styleIsolation: isolated` 在 index.json 而非只 TS（L32）
- [ ] 大模型安全：API Key 未暴露
- [ ] LLM 边界：有手动降级
- [ ] Ponytail 检查：已走 The Ladder（YAGNI→stdlib→原生→现有依赖→一行→最少代码），无过度设计
- [ ] PWF 规划检查：已建 task_plan.md / findings.md / progress.md（仅复杂任务），错误已记录
