# AGENTS.md — timeslots-v1 项目规则 (v1.4)

> 本文件是 AI Agent 在本仓库工作的**最高行动准则**。
> 目标：生成高质量、可维护、零幻觉的工程级代码。
> 当用户当前指令与本文件冲突时，**用户当前指令优先**，事后提示更新本文件。

---

## 🔧 开工前必读技能

> 所有技能均随项目仓库分发，路径为项目相对路径。任何在本仓库工作的 AI Agent（Hermes、Claude Code、Cursor 等）必须加载这些技能。

**kb-search skill** — 知识库语义搜索（每次开工前必加载）

- 技能文件：`skills/kb-search/SKILL.md`（自包含，含关键词映射 + Top 陷阱速查 + 质量门禁命令）
- 开工前直接执行搜索，获取项目上下文：
  ```bash
  grep -ri "关键词" knowledge-base/
  ```
  > 知识库已扁平化为 5 个根文件（project-structure.md / coding-rules.md / api-reference.md / experience-notes.md / README.md），grep 秒出结果，不需要 FAISS。
- **常见搜索关键词映射**：
  - 改前端页面 → "编码规范" "Page泛型" "WXML"
  - 改后端接口 → "api-reference" "DTO" "事务"
  - 新增组件 → "编码规范" "组件规范"
  - 改工具函数 → "request" "storage" "date"
  - 理解业务逻辑 → "PRD" "三条路径" "产品哲学"
  - 排查历史问题 → "experience-notes" "陷阱" "L1-L43"
  - 遵守编码规则 → "coding-rules" "受保护模块" "自检清单"
  - 查看审计/Bug → "审核意见" "CSS 损坏" "404"
- **强制规则**：不搜索直接改代码 = 违规

**planning-with-files skill** — 持久化文件式规划（每次开工前加载）

- 路径：`skills/planning-with-files/SKILL.md`
- 开工前用 `skill` 工具加载
- 复杂任务（3+ 步）必须先创建三个文件在项目根：`task_plan.md`（阶段/进展/决策）、`findings.md`（研究发现）、`progress.md`（会话日志）
- **2-Action Rule**：每 2 次查看/搜索操作后，立即保存关键发现
- **重大决定前重读 plan**
- **阶段完成立即更新状态**
- **记录 ALL 错误**到 plan 文件
- 禁止用 `todowrite` 做持久跟踪（用 `task_plan.md` 替代）

**ponytail skill (full)** — YAGNI/最少代码原则（每次开工前加载，始终激活）

- 路径：`skills/ponytail/SKILL.md`
- 开工前用 `skill` 工具加载，保持 `full` 级别，直到明确说"stop ponytail"才退出
- **The Ladder**（上下级阶梯，停在第一个成立的台阶）：
  1. 这东西真的需要存在吗？（YAGNI）
  2. 标准库能实现吗？
  3. 原生平台特性覆盖吗？（CSS 替代 JS、DB 约束替代应用代码）
  4. 已有的依赖能解决吗？（禁止加新依赖换几行代码）
  5. 能一行写完吗？
  6. 最后：写最少代码
- **铁律**：无未请求的抽象、无样板代码、删除优先于添加、最少文件、最短 diff 胜出
- 非平凡逻辑（分支/循环/解析器/金额或安全路径）必须留一个 `assert` 自检
- **何时不懒**：输入校验、数据丢失保护、安全措施、无障碍，以及用户明确要求的

**ponytail-audit skill** — 全仓库过度工程审计

- 路径：`skills/ponytail-audit/SKILL.md`
- 扫描整个仓库，输出可删除/简化/替换为 stdlib 的条目排名列表
- 触发词："ponytail-audit"、"审计过度工程"、"找冗余"

**ponytail-review skill** — 代码审查（专注过度工程）

- 路径：`skills/ponytail-review/SKILL.md`
- 审查 diff 中不必要的复杂度，每行一个发现：位置、删除什么、替换为什么
- 标签：`delete:` / `stdlib:` / `native:` / `yagni:` / `shrink:`
- 触发词："ponytail-review"、"审查过度工程"、"能删什么"

**ponytail-debt skill** — 技术债追踪

- 路径：`skills/ponytail-debt/SKILL.md`
- 收集代码中所有 `ponytail:` 标记注释，生成技术债账本
- 标记无升级路径的条目（silent rot 风险）
- 触发词："ponytail debt"、"列出延迟项"

**ponytail-gain skill** — 性能收益展示

- 路径：`skills/ponytail-gain/SKILL.md`
- 显示基准测试中 ponytail 节省的代码行数、成本、速度
- 只读展示，不修改任何内容

**wechat-miniprogram-spec skill** — 微信小程序开发规范（强制执行）

> ⚠️ **SKILL.md 文件尚未创建**。编码规范已内联到 `knowledge-base/coding-rules.md` §2（前端规则）+ §3（组件规范）+ §5.2.2（AGENTS.md 原版铁律）。
> 在技能文件到位前，Agent 应直接读取 `knowledge-base/coding-rules.md` 中的前端规则。

---

## 1. 项目一句话

`timeslots-v1` 是一款基于时间块（Time Block）的微信小程序日程管理工具，把待办和日历融合在一天 24 小时的时间轴上。定位：朋友内测工具，纯手动 CRUD + 协作体验，不计费、无商业化。

> **当前阶段：v0.49（三条路径已闭环，准备进入 v0.50 强制验证门禁）**

完整产品需求见 [`PRD.md`](./PRD.md)。开发计划以 [`VERSION_PLAN.md`](./VERSION_PLAN.md) 为唯一依据。

### 常用命令

| 命令 | 用途 |
|------|------|
| `cd server && npx tsc --noEmit` | 后端类型检查 |
| `cd server && npx jest` | 后端单元测试（113 tests） |
| `cd server && node scripts/e2e-test.js` | 后端端到端测试（16 sections） |
| `cd server && npx prisma validate` | Prisma schema 校验 |
| `cd server && npx prisma generate` | Prisma client 生成 |
| `cd server && npx nest start` | 启动后端（port 7777） |
| `cd server && node scripts/start-server.js` | 后台启动（PID 文件管理） |
| `cd server && node scripts/stop-server.js` | 停止后台服务 |
| `cd server && npx prisma migrate dev` | 本地迁移（交互式） |
| `cd server && npx prisma migrate deploy` | 生产迁移 |
| `cd server && npx prisma db push` | Schema 同步（非迁移场景） |
| `npm run detect-ip` | 自动检测 LAN IP 写入 DEV_URL（DHCP 变动后执行） |
| | |
| `npx tsc --noEmit` | 前端类型检查（src/） |
| `grep -rE "\b(TODO|FIXME)\b" src/ --include='*.ts' --include='*.wxml'` | 检查残留标记 |

---

## 2. 技术栈（已锁定，禁止擅自替换）

| 层 | 选型 | 版本 / 备注 |
|----|------|-------------|
| 客户端 | **微信原生小程序** + TypeScript 5.x | 基础库 >= 3.3.0；**严禁 Taro 跨端** |
| 项目配置 | `project.config.json` | 必须配 `miniprogramRoot: "src/"` + `useCompilerPlugins: ["typescript"]` |
| 类型定义 | miniprogram-api-typings@latest | **禁止**自定义 `wx.*` 的 `.d.ts` |
| UI 组件库 | **WeUI 1.5.6** | 按需引入；npm 无 2.x 版本，以实际安装为准 |
| 状态管理 | mobx-miniprogram | MobX 风格 |
| 静态资源/文件 | **微信云存储** (wx.cloud) | 前端**直传**，fileID 传后端入库 |
| 后端 | Node.js + **NestJS** + TypeScript | **按 Module 切分（DDD 风格）** |
| ORM | Prisma | |
| 数据库 | **PostgreSQL 18**（Windows native） | 装法: `winget install -e --id PostgreSQL.PostgreSQL.18`；**禁 Docker / WSL 中间层** |
| 部署 | 业务后端独立部署（Node.js 环境）；资源走微信云 | 计算与存储分离；**全 Windows** |
| 认证 | JWT + 微信 `code2session` | |
| 推送 | 微信订阅消息 | |
| LLM | MiniMax M3 | 通过 NestJS 后端代理（**不走** wx.cloud） |

> 已删除 Taro 跨端方案，本项目不适用。
> 已删除 Docker Compose / WSL Ubuntu 方案，统一 Windows native（决策见 `conversations/MILESTONE-20260607-batch9-4tab-and-native-pg.md`）。

---

## 3. 权威文档清单（AI 编写代码前必须以这些为准）

### 3.1 微信小程序（前端，最高优先级）

| 资料 | 网址 | 用途 |
|------|------|------|
| 微信小程序官方文档 | https://developers.weixin.qq.com/miniprogram/dev/framework/ | 最高优先级；不得使用过时/已废弃 API |
| TypeScript 支持指南 | https://developers.weixin.qq.com/miniprogram/dev/devtools/ts.html | `tsconfig.json` 标准 + `useCompilerPlugins` 配置 |
| miniprogram-api-typings | https://github.com/nicolo-ribaudo/miniprogram-api-typings | `wx.*` 完整 TS 类型 |
| WeUI 组件库 | https://developers.weixin.qq.com/miniprogram/dev/extended/weui/ | 官方 UI 规范 |
| 小程序代码规范 | https://github.com/nicolo-ribaudo/miniprogram-code-style | 命名/目录约定 |
| 微信云开发文档 | https://developers.weixin.qq.com/miniprogram/wxcloud/basis/getting-started.html | wx.cloud.* API（仅用于存储） |

### 3.2 后端

| 资料 | 网址 |
|------|------|
| NestJS 官方文档 | https://docs.nestjs.com/ |
| Prisma 官方文档 | https://www.prisma.io/docs |
| PostgreSQL 官方文档 | https://www.postgresql.org/docs/ |
| RxJS（NestJS 流式响应） | https://rxjs.dev/ |

---

## 4. AI 核心行为准则 (Core AI Behavior)

### 4.1 先思考，后编码 (Think Before Code)
- 复杂需求或变更**禁止**直接输出代码；必须先输出「影响分析」+「实施方案」
- 使用 Markdown 引用块展示推理、边界条件、潜在风险
- **等人工确认后再写代码**
- trivial 改动（单行修正、typo、明显重命名）可省略影响分析

### 4.2 上下文优先 (Context is King)
- 优先复用项目内已有的 util / component / type
- API 或组件是否存在的疑问**先搜索代码**，不靠猜测编造
- 见 §10 受保护模块 — 不可绕开既有封装

### 4.3 最小改动 (Minimal Change)
- 只动与当前需求直接相关的代码
- 禁止以「优化」「重构」为名修改无关代码、格式、命名

### 4.4 先计划，再实施 (Plan First, Then Implement)
- 用户发出任何需求后（复杂 3+ 步），**必须先创建 `task_plan.md` 规划阶段和步骤**，等待人工确认后再开始开发
- 需求输出格式：按 `task_plan.md` 模板用 Markdown 阶段+步骤清单，不做长篇影响分析文本
- 规划期间搜索/查看每 2 次后立刻更新 `findings.md`
- 禁止收到需求后直接编码
- trivial 改动（单行修正、typo、明显重命名）可省略

### 4.5 诚实与求助 (Honesty & Clarification)
- PRD 模糊 / 矛盾 / 缺接口时**立即停止**并向用户提问
- 禁止自行脑补业务逻辑

---

## 5. 强制编码规则

### 5.1 TypeScript 严格模式
- `tsconfig.json` 必须开启 `"strict": true`
- **严禁** `any`；不确定类型时用 `unknown` + 类型守卫 (Type Guard)
- 所有 API 响应 / 组件 Props / Store 状态**必须**有 `interface` 定义，集中放 `types/`
- `var` 和 `let`（未被重赋值时）必须用 `const`（ESLint `prefer-const` 0 容忍）

### 5.2 微信小程序（前端）

#### 5.2.1 目录结构

```
src/
├── app.ts              # 入口：仅做初始化 + 全局错误捕获
├── app.json            # WeChat 全局配置
├── app.wxss            # 全局样式
├── pages/              # 主包页面（按功能模块划分文件夹）
│   └── <name>/
│       ├── index.wxml
│       ├── index.wxss
│       ├── index.ts
│       └── index.json
├── components/         # 公共组件（每个必含 index.ts + README.md）
├── services/           # 业务 API 层（按模块：user.ts / time-block.ts / cloud-storage.ts …）
│   └── cloud-storage.ts  # 微信云存储薄封装（前端直传，不走后端）
├── stores/             # 状态管理（mobx-miniprogram）
├── utils/              # 纯函数工具（严禁 DOM 操作 / 业务逻辑）
│   ├── request.ts      # 统一网络请求（含 Token 刷新 + 全局错误拦截）
│   └── storage.ts      # 本地存储封装
├── types/              # 全局类型定义
├── prompts/            # MiniMax M3 的 System Prompt（与代码分离）
├── i18n/               # 预留：MVP 阶段不启用，仅占位空目录
└── assets/             # 静态资源（> 10KB 必须走微信云存储，不打包进本地）
```

> `project.config.json`（仓库根）必须包含：
> ```json
> {
>   "miniprogramRoot": "src/",
>   "setting": { "useCompilerPlugins": ["typescript"] }
> }
> ```
> **严禁**创建 `miniprogram/` 目录；**严禁**在代码中使用任何 `Taro.*` / `@tarojs/*` API。

#### 5.2.2 编码铁律

1. **禁止 any**：禁用 `any`；用 `unknown` + 类型守卫
2. **网络请求集中**：所有请求走 `utils/request.ts`；**页面内禁止 `wx.request`**
3. **密钥不落地**：MiniMax API Key 严禁出现在前端；走 NestJS 后端代理
4. **图片走微信云存储**：> 10KB 的图片资源走 `wx.cloud.uploadFile` 上传，存 fileID，不打包进本地
5. **组件必带 README**：每个可复用组件附 `README.md` 说明 Props / Events（§5.5 通用"不写 README"规则的唯一例外）
6. **TS 全量**：所有 `.js` 文件禁止新增，统一 `.ts`
7. **tsconfig**：开启 `"strict": true` + `"target/module": "esnext"` + `"moduleResolution": "node"` + `"lib": ["esnext"]` + `"types": ["miniprogram-api-typings"]`
8. **类型来源**：微信 API 类型**只能**来自 `miniprogram-api-typings`；**禁止**自定义 `wx.*` 的 `.d.ts`；禁止对 `wx.*` 用 `as any` / `@ts-ignore`
9. **页面/组件构造器**：页面用 `Page()`，组件用 `Component()`，禁止混用旧 Options API
10. **异步 Promise 化**：所有异步封装为 `Promise`；`wx.login` / `wx.request` 等回调用 `util.promisify` 转 Promise
11. **错误处理**：所有 `async` 函数**必须**有 `try/catch` 或调用处 `.catch()`；**禁止**未捕获的 Promise Rejection
12. **样式隔离**：组件必须显式 `options: { styleIsolation: 'isolated' }`；全局样式只放 `app.wxss`
13. **UI 优先 WeUI**：按需引入；仅在 WeUI 不支持时自研或引入第三方
14. **API 调用前查文档**：所有 `wx.*` 必须查 §3.1 官方文档确认
15. **状态管理**：`mobx-miniprogram`，store 放 `stores/`
16. **Props 必须有默认值**：自定义组件 Props 用 `interface` 定义 + `defaultProps` 或解构默认值
17. **跨端/平台隔离**：
    - 严禁 `window.*` / `document.*` / `localStorage` 等浏览器 DOM/BOM API
    - 平台判断用 `wx.getSystemInfoSync()`，**禁止**用 `userAgent`
    - JS 标准 API（`setTimeout` / `Promise` 等）可正常使用
18. **Taro 零容忍**：
    - **严禁** `import ... from '@tarojs/*'`（含 `@tarojs/taro` / `@tarojs/components` / `@tarojs/runtime`）
    - **严禁** React 风格（`useState` / `useEffect` 等 hooks、`JSX`）
    - **严禁** `NutUI`（本项目用 WeUI）
    - **严禁**写 `px` 单位（原生小程序应写 `rpx`，Taro 才用 px）
    - **严禁** `miniprogram/` 目录（项目根是 `src/`，配 `miniprogramRoot`）
19. **Page 泛型签名**：必须用 `Page<TData, TCustom>` 双泛型，**TCustom 是方法类型**（不是 data）。
    - 错误：`Page<{}, PageData>({ data: {...}, onTapFoo() {...} })` → 对象字面量触发 excess property check
    - 正确：`Page<PageData, PageMethods>({ data: {...}, onTapFoo() {...} })`
    - 原因：`miniprogram-api-typings` 的 `Options<TData, TCustom> = TCustom & Partial<Data<TData>> & ...`，TCustom 必须包含自定义方法
20. **wx 错误回调字段**：
    - `wx.onError` 回调入参是 `ListenerError`，**字段是 `message`**（**不是** `errMsg`）
    - `success`/`fail` 的 `res` 是 `GeneralCallbackResult`，**字段是 `errMsg`**
    - **禁止**混用；查 `node_modules/miniprogram-api-typings/types/wx/lib.wx.api.d.ts` 确认实际定义
21. **wx.request 边界 cast**：
    - `wx.request` 官方 TS `method` 类型**不包含 `PATCH`**（仅 OPTIONS/GET/HEAD/POST/PUT/DELETE/TRACE/CONNECT），但运行时网络层接受任意 method
    - 业务侧 `RequestMethod` 保留完整 HTTP（含 PATCH），调用 `wx.request` 时**显式 cast 到 `WxRequestMethod` 类型别名**（**禁止** `as any`）
    - `wx.request.data` 类型是 `string | IAnyObject | ArrayBuffer`，`unknown` 必须 cast（项目内 `WxRequestData` 别名）
22. **Page 接口命名（避免全局 `PageData` 冲突）**：
    - `miniprogram-api-typings` 在全局声明了同名 `PageData` 接口
    - 业务侧 `interface PageData` 会与全局 + 其他文件的 `PageData` **自动合并**，导致 `Page<TData, TCustom>` 的 `data` 字段必须满足合并后的超集
    - 实际表现：4 个 page 都用 `PageData` 时，4 个 data 字段会被合并 → tsc 报 `Type X is missing the following properties from type 'PageData': [其他 page 的字段]`
    - **强制命名规则**：每页 TData 接口用 `<Name>PageData` 形式（如 `SchedulePageData`），方法接口用 `<Name>PageMethods`（如 `SchedulePageMethods`）
    - **禁止**用通用名 `PageData` / `PageMethods` 作为业务接口名
23. **WXML 模板表达式限制**：
    - WXML 的 `{{}}` 内**不支持**：方法调用（如 `str.charAt(0)`）、nullish coalescing（`??`）、模板字符串、箭头函数
    - **支持**的运算符：三元 `?:`、逻辑 `&&` / `||`、算术 `+ - * / %`、比较 `=== !== > <`
    - 所有需要转换的数据**必须**在 TypeScript 层预计算后通过 `setData` 传入；禁止在 WXML 中写 `{{obj.someMethod()}}` 或 `{{a ?? b}}`
    - 替代：`a ?? b` → `a || b`；`str.charAt(0)` → `str[0]`；函数调用 → 预计算为 data 字段
24. **MobX store 模式（mobx-miniprogram）**：
    - Store 必须用 `interface StoreName` 显式定义类型，然后 `observable({...})` 赋值给 `const storeName: StoreName`
    - `action` 必须用 `function(this: StoreName, ...) { ... }` 匿名函数形式（非箭头函数），避免 `typeof` 循环引用
    - 页面连接 store 用 `createStoreBindings(this, { store, fields })`，返回的 `storeBindings` 对象必须在 methods 接口中声明为可选属性（`storeBindings?: { destroyStoreBindings: () => void }`）
    - 销毁在 `onUnload` 中调用 `this.storeBindings!.destroyStoreBindings()`
    - Store 内部 `action(async function(...){...})` 的 async 部分不在 action 事务内，需直接修改 observable 属性触发渲染
25. **WXSS 文件禁止 UTF-8 BOM + 重复函数零容忍**：
    - Write/Edit 工具写入 UTF-8 文件时会附带 BOM（`EF BB BF`）。微信 WXSS 编译器**不接受 BOM** → 白屏。每次修改 `.wxss` 文件后必须验证无 BOM
    - `todayStr()` / `toLocalTime()` / `toLocalDate()` 等纯工具函数**必须**集中在 `src/utils/date.ts`；新增页面时先 grep 确认，禁止拷贝粘贴

### 5.3 后端（NestJS — Module 切分，DDD 风格）

#### 5.3.1 架构原则

- **严格按业务领域（Module）切分目录**，而非全局技术层（controllers/services/models）
- 业务后端独立部署（阿里云/腾讯云 Node.js 环境），与微信云存储**解耦**
- 严禁用 Express/Koa 风格目录（无 `controllers/` / `routes/` / `middlewares/` 顶层目录）

#### 5.3.2 目录结构（强制）

```
server/
├── src/
│   ├── main.ts                 # 入口（NestFactory + ValidationPipe + 全局 Filter 注册）
│   ├── app.module.ts           # 根 Module
│   ├── common/                 # 全局基础设施
│   │   ├── filters/            # 全局 ExceptionFilter（业务异常格式化）
│   │   ├── guards/             # JwtAuthGuard / WxCodeGuard
│   │   ├── interceptors/       # LoggingInterceptor / TransformInterceptor
│   │   ├── pipes/              # class-validator 包装
│   │   ├── decorators/         # @CurrentUser / @Public 等自定义装饰器
│   │   └── exceptions/         # BusinessException 等
│   ├── config/                 # 环境变量加载（@nestjs/config + joi schema 校验）
│   ├── modules/                # 业务模块（每个 module 一个文件夹）
│   │   ├── auth/               # 鉴权
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/     # jwt.strategy.ts
│   │   │   └── dto/
│   │   ├── user/               # 用户 + 账号状态机
│   │   ├── category/           # 分类
│   │   ├── timeblock/          # 时段 + 循环
│   │   ├── todo/               # 待办
│   │   ├── calendar/           # 日/周/月聚合
│   │   ├── reminder/           # 订阅消息触发 + cron
│   │   ├── llm/                # MiniMax 代理（受保护）
│   │   └── export/             # 数据导出
│   ├── prisma/                 # Prisma 模块（NestJS 注入层）
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts   # 全局 PrismaService（含软删 $extends 拦截）
│   ├── ...                     # 以下为项目级目录（非 src/ 内）
├── prisma/                     # Prisma schema 文件与迁移历史
│   ├── schema.prisma
│   └── migrations/
│   └── jobs/                   # 定时任务（30 天物理删、提醒发送等）
├── test/                       # E2E 测试
├── docker-compose.yml          # 本地 PG
├── Dockerfile
└── .env.example
```

#### 5.3.3 编码铁律

1. **Controller 薄**：仅处理 HTTP 请求/响应、参数校验、调用 service；**严禁**直接调 Prisma / 业务逻辑
2. **Service 厚**：业务逻辑、数据访问、外部 API 调用全部在 service
3. **DTO 严格**：所有入参用 `class-validator` 装饰器；返回用 DTO/VO 而非 Prisma model 直出
4. **业务异常**：用 `BusinessException` 统一抛出，由全局 `ExceptionFilter` 格式化
5. **跨用户隔离**：所有数据访问**必须**显式带 `userId` 过滤（`where: { id, userId }`），禁止靠前端传参
6. **软删**：字段 `deleted_at`；恢复通过 `PATCH` 清空；7 天后由定时任务进入"待物理删"
7. **时间字段**：`timestamptz`（DB） + UTC（应用层）；前端展示按用户 `day_starts_at` 切分
8. **Prisma Client Extensions ($extends)**：在 `prisma.service.ts` 用 **$extends**（替代已弃用的 `$use` Middleware）注入软删除 `where: { isDeleted: false }`：
    - 拦截范围：`findMany` / `findFirst` / `findUnique` / `count`
    - 不拦截：`create` / `update`（写操作正常）
    - **不**拦截 `delete`（物理删除需走 `update { isDeleted: true }` 模式）
    - 使用方式：业务 Service 注入 PrismaService 后必须用 `this.prisma.client.timeBlock.findMany(...)` 走扩展
    - 事务内 `tx` 直接用 `this.prisma.$transaction(...)`（不要 `.client.$transaction`），类型为 `Prisma.TransactionClient`
9. **LLM 代理**：`modules/llm/` 的 service 是唯一允许调 MiniMax API 的地方；密钥从 `config` 加载
10. **测试覆盖**：核心 service 单元测试 ≥ 80%；e2e 覆盖所有 CRUD 路径
11. **Joi env 校验**：`.optional()` **不接受空字符串**。`.env.example` 用空值占位是常见做法，schema 必须 `.allow('').optional()` 放行
    - 错误：`Joi.string().optional()` + `.env` 里 `WECHAT_APPID=` → 启动报 `"WECHAT_APPID" is not allowed to be empty`
    - 正确：`Joi.string().allow('').optional()`
    - `Joi.number().port().default(3000)` 数字字段不受此影响
12. **全局响应契约（PM 拍板）**：所有 API 响应统一 `{code, message, data, path, timestamp}` 格式，**`code` = 业务错误码（5 位数字），HTTP 状态码独立**：
    - 成功：`{code: 0, message: 'success', data: T}`（`TransformInterceptor` 包装）
    - 失败：`{code: <businessCode>, message: <error>, data: null, path, timestamp}`（`AllExceptionsFilter` 包装）
    - 错误码表（业务码 5 位，前 3 位 = HTTP × 100）：

      | businessCode | HTTP | 含义       | 典型场景                     |
      |--------------|------|------------|------------------------------|
      | 0            | 200  | 成功       | 正常 CRUD 返回               |
      | 40001-40099  | 400  | 参数错误   | class-validator 失败         |
      | 40101-40199  | 401  | 未授权     | JWT 缺失 / 过期              |
      | 40201-40299  | 402  | 余额不足   | AI 额度 < 扣减量             |
      | 40301-40399  | 403  | 权限不足   | 访问他人私有 TimeBlock       |
      | 40401-40499  | 404  | 资源不存在 | id 不存在 / 软删后访问       |
      | 40901-40999  | 409  | 冲突       | 乐观锁失败 / 重复创建        |
      | 50000-50099  | 500  | 系统异常   | 未处理异常                   |

    - 业务异常用法：`throw new BusinessException(40401, '日程不存在')` 或 `throw ErrorCodes.EVENT_NOT_FOUND`
    - 前端拆包：`if (body.code === 0) resolve(data.data as T)`（注意 `data` 是嵌套）
    - 受保护模块（§10）：`request.ts` / `api.ts` / `interceptor.ts` / `filter.ts` —— 修改需 CHANGE-xxx.md
13. **乐观锁防超卖（version 字段）**：M2+ 计费 / 防超卖场景使用 Prisma 原生乐观锁：
    - Schema：`Quota.version Int @default(1)`
    - 用法：`tx.quota.update({ where: { id, version: quota.version }, data: { ..., version: { increment: 1 } } })`
    - 并发失败：Prisma 抛 `P2025` → `QuotaService` 捕获并抛 `CONCURRENT_MODIFICATION` (40901)
    - **不**引 Redis 分布式锁（与历史决策 B 一致，**收敛到 DB 层**）
    - 适用场景：扣额度 / 修改共享资源 / AI 归集
    - 与 §5.3.3 #8 Prisma $extends 配合：乐观锁放事务，软删过滤放查询
14. **void + @HttpCode(204) + TransformInterceptor 冲突**：
    - **禁止**在 Controller 方法上同时使用 `@HttpCode(HttpStatus.NO_CONTENT)` 和返回 `void`
    - `TransformInterceptor` 的 `map` 运算符尝试包装响应，但 204 No Content 发送空体后 Interceptor 无法写入 → 抛出 500
    - 正确做法：返回一个普通对象（如 `{ deleted: true }`），让 Interceptor 正常包装为 `{ code: 0, data: { deleted: true } }`
    - 示例：`DELETE` 端点应返回 `Promise<{ deleted: boolean }>` 而非 `Promise<void>`
15. **日志不得泄漏敏感信息**：禁止 `console.warn/error` 中包含 `shareToken`、`contactValue`（手机号）、`password`、`token`

### 5.4 数据库

- 所有表主键 `uuid`（`@default(uuid())`）
- 必备字段：`created_at`, `updated_at`, `deleted_at`
- 软删过滤：在 Prisma middleware 中默认注入 `where: { deletedAt: null }`
- **索引匹配查询**：每个 `findMany` 的 `where` 字段组合，必须对应 `@@index` 或已有单列索引；`parentId` 自引用模型必须加 `@@index([parentId])`
- **用户数据 isDeleted 显式过滤**：不在 `SOFT_DELETE_MODELS` 列表中的模型（如 `User`），所有查询必须手动加 `where: { isDeleted: false }`
- **时区 `+08:00`**：禁止裸 `Z` 构造日期边界（如 `new Date(date + 'T00:00:00.000Z')`），一律 `new Date(date + 'T00:00:00+08:00')`

### 5.5 通用

- **不写注释**（除非用户明确要求）
- **不写 README 文档**（除非用户明确要求；§5.2.2 第 5 条组件 README 为唯一例外）
- 提交前自查：`grep -rE "\b(TODO|FIXME)\b" src/ --include='*.ts' --include='*.wxml'` 应为空（**注意**：业务实体 `Todo` 不算 TODO，匹配的是英文注释标记）
- 不要把 `.env` / `*.local` 提交到仓库，提供 `.env.example`

---

## 6. LLM（MiniMax M3）集成

> MiniMax M3 已在 v0.45 接入后端（`server/src/modules/llm/`）。当前已实现：AI 任务拆解（`/ai/decompose`）、AI 建议时间段（`/ai/suggest-slots`）、自然语言建日程（`/ai/parse`）。仅支持文本输入，语音/图像录入推迟至验证后。

### 6.1 定位

- LLM 是产品的核心差异化卖点（AI 拆解引擎 + 自然语言建日程）
- AI 是拆解引擎和建议引擎，**不是调度引擎**（不做自动排程）
- **手动降级始终可用**：LLM 超时/失败 → 无缝切换手动输入，**绝不弹错误 Toast**

### 6.2 当前实现的 AI 场景

- **AI 任务拆解**（`/ai/decompose` SSE 流式）：任务 → 依赖步骤 → 用户确认创建 Step
- **AI 建议时间段**（`/ai/suggest-slots` 规则算法）：依赖链+空闲段 → 贪心建议
- **自然语言建日程**（`/ai/parse`）：文本 → 结构化日程/任务 → 预览确认
- **AI 拆解预览页**（`/pages/landing/ai-preview`）：免登录 Demo，增长破冰

### 6.3 集成规范

#### 6.3.1 密钥安全
- API Key **绝对禁止**硬编码在前端
- 必须从 `server/src/config/` 加载（环境变量 `MINIMAX_API_KEY`）
- **严禁**通过 wx.cloud 函数代理 MiniMax（避免绕开后端审计）

#### 6.3.2 流式传输 (SSE/Chunked)
- **必须**实现打字机效果状态机：`idle → streaming → done / error`
- 状态在 `src/stores/llm.ts` 用 mobx 管理
- 必须处理网络中断导致的流式截断，提供「重新生成」/「继续生成」按钮
- 后端用 NestJS `@Sse()` 装饰器 + `Observable<MessageEvent>`

#### 6.3.3 Prompt 管理
- System Prompt **必须**与代码逻辑分离，存放在 `src/prompts/`
- 支持变量插槽（如 `{{user_name}}` / `{{date}}`），**禁止**在代码中拼接长字符串

#### 6.3.4 内容安全与合规（强化）
- 调用大模型前后，**必须**接入微信 `msgSecCheck`（双向：入参 + 出参）
- **强制脱敏**：用户输入含手机号 / 身份证 / 银行卡 → 调用前 LLM 前置替换为占位符
- **隐私日程 AI 解析**：用户标记 nature=private 的内容，**禁止**送入 LLM
- **审核不通过时**：必须有明确的 UI 降级提示（如"内容包含敏感信息，请修改后重试"），**禁止**直接抛出底层 Error
- **审计日志**：每次 LLM 调用记录 trace_id + prompt 摘要 + response 摘要（不含原文原文）

#### 6.3.5 成本控制（强化）
- 单次请求 token 上限：2000
- 单用户日请求次数上限：50
- **三段式扣费**（V1.0 PRD §6.2）：
  - 解析预扣 0.5 点（API 1）
  - 创建实扣 0.5 点（API 3）→ 凑成 1 点/次
  - 失败 / 超时 → 退扣
- **PG advisory lock**：扣额度与创建日程**必须**在同一个数据库事务中（AGENTS §5.3.3 #13）
- 超过上限时返回明确错误码（402 = 余额不足），前端友好降级到「LLM 暂不可用」

### 6.4 受保护文件
- `server/src/modules/llm/**` 整个目录（受 §10 保护）

### 6.5 手动降级路径（关键安全网）

LLM 是核心路径，但**手动降级必须始终可用**：

| 触发场景 | 降级行为 |
|----------|----------|
| LLM 5s 未响应 | 前端阻断，提示"网络拥挤，请手动填写" |
| LLM 返回 5xx | 后端 `FallbackException`，前端切手动表单 |
| 用户额度 < 1 点 | 前端显示"额度不足，请手动创建或充值" |
| 内容审核不通过 | 前端显示"内容包含敏感信息，请修改后重试" |
| 用户主动取消 AI | 直接关闭面板，保留已输入文本 |

**降级策略**：手动表单与 AI 表单**复用**（AI 解析失败的字段留空 + 标红提示必填）。

### 6.6 AI 效率教练算法（V1.0 PRD §9 细化）

详细算法 spec 在 `conversations/2026-06-07-coach-algorithm-spec.md`，**禁止**在 service / prompt 里硬编码阈值。

3 个核心指标：
- **日程碎片化指数**：一天内相邻日程间的"空白间隙"计数；阈值**用户可调**，默认 ≥ 3 次（30min < 间隙 < 2h）触发"高度碎片化"
- **计划与实际偏差率**：`abs(actual - plan) / plan`；**>30%** 触发"显著偏差"建议
- **深度专注占比**：连续 ≥ 2h 无冲突的"工作"日程 / 总工作时长；**≥60%** 为健康；私有日程冲突**算"无冲突"**但**必须提醒**

用户配置存 `User.coachSettings: jsonb`（M2-A 加 schema）。"工作"如何定义：**已决 D（用户可配置，基线 A）**（spec §4）。

默认值与字段定义见 spec §7；M2-A 任务 = `User.coachSettings: jsonb` + 默认值 UPSERT。

---

## 7. 代码风格参考

写新页面时参照项目中已有的相似页面风格（如 `src/pages/schedule/` 或 `src/pages/tasks/`），保持 TypeScript 类型安全、WXML 模板表达式限制、WeUI 组件使用等约定一致。

---

## 8. 需求解析与变更管理

### 8.1 PRD 解析
- 优先解析 Markdown 表格、状态机、TypeScript Interface、JSON Schema
- PRD 中标注为「**CRITICAL / 不变约束**」的条目，**必须**作为最高优先级的检查条件

### 8.2 变更驱动开发 SOP（三段式）

收到 `CHANGE-xxx.md` 时**强制**执行：

**Step 1 — 影响分析 (Impact Analysis)**
- 列出受影响的文件 / 函数 / 类型 / 状态
- 明确指出哪些「CRITICAL / 不变约束」可能受威胁
- **等人工确认**，禁止输出代码

**Step 2 — 方案设计 (Solution Design)**
- 提供具体的修改清单（新增 / 修改 / 删除）
- 说明如何与现有架构（特别是 §10 受保护模块）解耦交互
- **等人工确认**，禁止输出代码

**Step 3 — 增量实施 (Incremental Implementation)**
- 逐文件输出代码
- 每次输出后简述该改动如何满足变更需求

#### CHANGE-xxx.md 模板

```markdown
# CHANGE-YYYYMMDD-<feature>

## 背景
<为什么需要这个变更，一两句话>

## 范围
<涉及哪些模块、页面、API>

## 约束
- CRITICAL: <不变约束，如"必须支持离线">
- CRITICAL: <...>

## 验收标准
- [ ] <可验收的子项>
- [ ] <...>
```

### 8.3 受保护模块
→ 见 §10

---

## 9. 质量自检清单 (Quality Gates)

每次完成代码生成 / 修改后，AI **必须**在回复末尾附带以下清单，逐项打勾或说明原因：

```
🛡️ 代码自检报告
[ ] 类型安全：无 any，新增接口/Props 已定义 TS 类型（必要时用 unknown + 类型守卫）
[ ] 平台兼容：未使用 DOM/BOM，未使用 Taro API，路由/存储走 wx.* / wx.cloud 专属 API
[ ] 架构隔离：未违规修改"受保护模块"（§10），新逻辑已做解耦处理
[ ] NestJS 分层：Controller 未直接调 Prisma，业务逻辑在 Service
[ ] 错误处理：所有异步已 try/catch 或全局拦截，无静默失败
[ ] 死代码清理：已移除本次变更产生的废弃 import / 变量 / 注释代码
[ ] UI 规范：优先使用 WeUI 组件，样式单位 rpx，组件 styleIsolation 启用
[ ] 大模型安全：(若涉及) API Key 未暴露；流式状态机完整；含 msgSecCheck 兜底
[ ] LLM 边界：LLM 是核心路径但有手动降级；核心 CRUD 手动表单路径始终可走通
[ ] Ponytail 检查：已走 The Ladder（YAGNI→stdlib→原生→现有依赖→一行→最少代码），无过度设计
[ ] PWF 规划检查：已建 task_plan.md / findings.md / progress.md（仅复杂任务），错误已记录
```

---

## 10. 受保护模块 (Protected Modules)

以下模块**默认禁止修改**，除非 `CHANGE-xxx.md` 显式声明需要修改：

| 模块 | 用途 |
|------|------|
| `src/utils/request.ts` | 网络请求层（含 Token 刷新、全局错误拦截） |
| `src/stores/auth.ts` | 认证状态 |
| `src/services/cloud-storage.ts` | 微信云存储薄封装 |
| `src/services/*`（业务 service） | 业务 API 封装（**新增**允许，**改既有**需 CHANGE） |
| `server/src/modules/llm/**` | MiniMax 代理（NestJS 端） |
| `src/types/global.d.ts` | 全局类型 |
| `src/prompts/**` | System Prompt（变更需走 §8.2 SOP） |
| `project.config.json` | WeChat 项目配置（miniprogramRoot 锁定为 src/） |

需要与这些模块交互时，通过以下方式之一：

- 新增接口（扩展函数 / 方法）
- 事件总线（`EventBus.emit` / `EventBus.on`）
- 外部组合（`HOC` / `Wrapper`）

**禁止**直接改内部实现。

---

## 11. 项目目录约定

```
timeslots-v1/
├── PRD.md                  # 产品需求
├── AGENTS.md               # 本文件
├── project.config.json     # WeChat 项目配置（miniprogramRoot 指向 src/）
├── src/                    # 微信小程序客户端（详见 §5.2.1）
├── server/                 # NestJS 后端（详见 §5.3.2）
├── docker-compose.yml      # 本地依赖（PG + 可选 Adminer）
├── .env.example
└── conversations/          # 评审 / 沟通 / 变更记录（CHANGE-xxx.md）
```

变更文件建议命名：`conversations/CHANGE-YYYYMMDD-<feature>.md`

---

## 13. 3-Strike Error Protocol (AI 错误恢复协议)

> 替代原 §13（AI 编码行为规则）。项目级规则（时区、日志、索引、BOM 等）已迁移到 §5.2.2 / §5.3.3 / §5.4。

执行以下协议处理错误，**禁止连续重复相同操作**。

### 第 1 次 — 诊断并修复
- 仔细阅读错误信息
- 识别根因
- 应用针对性修复
- 在 `progress.md` 记录：错误内容、尝试的修复、结果

### 第 2 次 — 换方法
- 相同错误再次出现？换不同的方法
- 换工具？换库？换方向？
- **禁止重复完全相同的操作**
- 在 `progress.md` 更新尝试记录

### 第 3 次 — 重新思考
- 质疑假设前提
- 搜索解决方案
- 考虑更新 `task_plan.md`
- 在 `progress.md` 更新尝试记录

### 3 次失败后 — 升级给用户
- 说明你尝试了什么
- 提供具体错误信息
- 请求指导

### 铁则
- `if action_failed: next_action != same_action`
- 致命错误（数据丢失、安全漏洞）**立即升级**，无需 3 次尝试

---

## 12. 变更记录

| 日期 | 变更 | 原因 |
|------|------|------|
| 2026-06-07 | 初版建立 | 项目启动 |
| 2026-06-07 | UI 选型从 Vant Weapp 切换到 WeUI | 用户提供官方权威文档清单 |
| 2026-06-07 | §4.1 强化前端规则：strict TS / 禁用自定义 wx 类型 / Page+Component 构造器 / Promise 化 / styleIsolation | 用户追加 5 条强制规则 |
| 2026-06-07 | §4.1 重构为「项目技术规范 - 微信小程序」：锁定技术栈版本，目录改为 `src/`，新增 5 条铁律 | 用户提供完整技术规范 |
| 2026-06-07 | 新增 `examples/` 黄金代码（**v0.1 重建后已删除**） | 用户要求引入 few-shot 模板机制 |
| 2026-06-07 | v1.1 大重构：合并 v1.0 手册全部条款 | 用户提供《OpenCode 全局 AI 辅助开发规则手册 v1.0》 |
| 2026-06-07 | **v1.2 业务定位与架构大重构**：① LLM 定位为**增值功能**（不是 MVP 核心）；② 后端锁定 **NestJS Module 切分（DDD）**，废弃 Express 风格；③ 静态资源走**微信云存储**（wx.cloud），业务后端独立部署（计算与存储分离）；④ 前端强化 **Taro 零容忍**（明禁 `@tarojs/*` / NutUI / React 风格 hooks / px / `miniprogram/` 目录）；⑤ 新增 **i18n 占坑** 规则；⑥ 受保护模块新增 `services/cloud-storage.ts` 和 `server/src/modules/llm/**`；⑦ 自检清单新增「NestJS 分层」与「LLM 边界」两项；⑧ 变更文件模板与流程文档化 | 用户最终定调决策（7 大问题） |
| 2026-06-07 | **M1 脚手架完成**：`MILESTONE-20260607-m1-scaffold.md` 落盘；AGENTS.md §5.2.2 新增 3 条铁律（Page 双泛型 / wx.onError 字段 / wx.request PATCH cast）；§5.3.3 新增 1 条铁律（Joi `.allow('').optional()`） | M1 收尾（前端 tsc + 后端 /health 验证通过） |
| 2026-06-07 | **响应码契约 reconcile（PRD v1.0 附件二）**：M1 跟随附件，`code: 0` → `code: 200`，`message: ''` → `msg: 'success'`；4 个核心文件改完（`transform.interceptor.ts` / `all-exceptions.filter.ts` / `request.ts` / `api.ts`）；AGENTS.md §5.3.3 新增 #12（错误码表）；**PG advisory lock 拍板**（不引 Redis）→ §5.3.3 新增 #13；**11 实体 ER 图**落盘 `conversations/2026-06-07-data-model-v1-er.md`；拍板决议见 `conversations/2026-06-07-pending-prd-issues.md` §10 | 用户拍板响应码 B + 锁 B + 画 ER 图；3 项 P0 关闭 |
| 2026-06-07 | **LLM 定位 reconcile（V1.0 PRD 兼容）**：从"增值功能"升为"核心引擎 (Wow Engine)"；§6.1 定位 / §6.2 场景 / §6.3.4 内容安全 / §6.3.5 成本控制 / §6.5 接入里程碑（M6→M2-A）/ §6.6 手动降级安全网 全部重写；§9 自检"LLM 边界"项重定义（"核心 CRUD 手动表单始终可走通"） | 用户拍板 LLM 定位对齐 PRD；4 项 P0 仅剩"AI 教练算法 spec" |
| 2026-06-07 | **Batch 1 (M2-A) Day 1 完成**：① Prisma 12 实体 schema（Space→Group 简化 + Project 新实体 + Quota 双字段 + EncryptedDetails）；② Event module（service+controller+DTOs）；③ Quota module（PG advisory 扣费）；④ EventVisibilityService（P0-P3 修正版）；⑤ AvailabilityService（忙闲查询）；⑥ CurrentUser decorator；⑦ mobx-miniprogram 安装；⑧ ER 图同步。**待 Day 2**：Jest + E2E + migration 验证。 | PRD 瘦身 + TDD Batch 1 实施 |
| 2026-06-07 | **Batch 2 (M2-A) Day 1 重构完成**：① Prisma schema v2（11 实体：Group→Circle/GroupMember→CircleMember/Project→TaskGroup/RSVP.userId→attendeeId/TrackingEvent 删）；② 6 项细化设计全采纳：列类型显式 @db.* + 双轨软删 isDeleted+deletedAt + summary 字段 + balanceAfter 快照 + CoachCard 重构（weekStart Date+insights 拆分）+ CoachFeedback RLHF 重构（rating 1-5 替代 action）+ coachSettings 默认值；③ EncryptionService 新增（AES-256-GCM）；④ Visibility 算法升级（PRIVATE/PUBLIC/CIRCLE_ONLY）；⑤ QuotaService 流水重写（type/amount/balanceAfter/description/relatedBlockId）；⑥ ER 图 §Batch 2 落盘。`prisma validate` ✅ `prisma generate` ✅ `tsc` 双 0 错 ✅ | V1.2 PRD V2 schema + 6 项细化设计全采纳 |
| 2026-06-07 | **Batch 3 (M2-A) PM 拍板重写**：① **响应码契约 B'**：`code=businessCode`（5 位）替代 HTTP 1:1（用户当前指令优先于历史决策 B）；② **乐观锁 B''**：`where: { id, version }` 替代 PG advisory lock（PM refactor 优先于历史决策 B）；③ **Prisma $extends** 替代已弃用的 Middleware；④ `BusinessException` 重构 + 9 个 `ErrorCodes` 预定义；⑤ `AllExceptionsFilter` 重构映射 Prisma P2002/P2025 → 业务码；⑥ `TransformInterceptor` `code: 0` 成功；⑦ `PrismaService` 加 `$extends` 软删拦截 + `get client()` 暴露扩展；⑧ `QuotaService` 双重写（`deduct` 外部事务 + `deductInTx` 内部事务共用）+ 乐观锁 P2025 → 40901；⑨ `EventService` `create` 走 `this.prisma.$transaction` + `deductInTx` 同事务；⑩ `EventVisibilityService` 重构（`checkPermission` → `ViewerContext` + `maskEvent` → `Partial<TimeBlock> \| null` + Fail-Secure 兜底）；⑪ `AvailabilityService` 重构（`getFreeSlots` 差集算法）；⑫ `JwtAuthGuard` stub + `CurrentUser` 装饰器重命名 `user.decorator.ts`（field extraction）；⑬ `EventController` 改 `@Controller('api/v1/events')` + `@UseGuards(JwtAuthGuard)` + `@CurrentUser('userId')`；⑭ Jest 配置 + 13 个测试用例（4 visibility + 4 quota + 5 visibility 兼容）全绿；⑮ AGENTS §5.3.3 #8/#12/#13 全部重写。`prisma validate` ✅ `prisma generate` ✅ `tsc` 双 0 错 ✅ `jest` 13/13 ✅ | Batch 1 PM 拍板的 3 大基石：统一错误出口 / 金融级扣费 / 读写分离日程 |
| 2026-06-07 | **Batch 4 (M2-A) 收尾验证** + **5th 路由修复**：① `PrismaService.onModuleInit` 包 try/catch，DB 不可达时仅 warn 不阻塞 server 起；② 清理 `prisma.service.ts` 公共 `client` 字段类型（去掉显式 `ReturnType<...>` 让 TS 推断）；③ `AppModule` 挂 `PrismaModule` global + 移除过时 JSDoc；④ `QuotaModule`/`EventModule` JSDoc 更新；⑤ 死代码清理：`event-response.dto.ts` + `create-quota-transaction.dto.ts` + `EventService.findById()`；⑥ **路由修复**：`HealthController` 加 `@Controller('api/v1/health')` 前缀；⑦ 端到端 curl 验证 5 个场景：`/api/v1/health` 200 / `/api/v1/events/my` 401 / `/api/v1/events` 404 / `POST /api/v1/events` 400（DTO 校验）/`POST` 400（无效 ISO）—— 响应契约 `{code, message, data, path, timestamp}` 全绿。`npx nest start` ✅（DB down 弹性启动）`curl` 5/5 ✅ | M2-A Day 2 收尾（运行时验证） |
| 2026-06-07 | **Batch 5 (M2-A) 全面自检 + 端口迁移 + 3 关键 bug 修复**：① **端口 3000 → 8000**（6 文件同步：configuration.ts / validation.ts / main.ts / .env.example / .env / request.ts BASE_URL）；② **关键 bug A**：`EncryptionService` 用 `config.get('ENCRYPTION_KEY')`（env 名）实际应 `'encryptionKey'`（camelCase 字段名）—— 修复前永远走默认全 0 密钥，**生产环境有严重数据风险**；③ **关键 bug B**：`prisma.service.ts` JSDoc 声称拦截 `findUniqueOrThrow`/`findFirstOrThrow` 但代码没实现——补齐两个 `*OrThrow` 拦截器；④ **关键 bug C**：`src/pages/index/index.wxml` 内容是 CSS（被错放）—— 重写为正确 WXML 模板（view/text/button + 三元表达式 + `bindtap`）；⑤ 死代码清理：`prisma-mock.ts` 删除未使用的 `client.timeBlock` + 顶层 `quota/quotaTransaction/timeBlock` + `txOverrides` 形参 + `buildMockPrismaService` 导出；⑥ 自检：`grep -rE "TODO|FIXME|XXX" src/` 全空；⑦ 全 4 gate 重跑：tsc 双 0 错 ✅ / `prisma validate` ✅ / `jest 13/13` ✅ / 端到端 5/5 curl ✅。详细见 `conversations/MILESTONE-20260607-batch5-audit-fixes.md` | M2-A 全面自检 + P1 修复 |
| 2026-06-07 | **Batch 6 (端口根治 + dev 工具链 + 全面审计)**：① **端口 8000 → 7777**（6 文件同步：避开 3K-8K 高频冲突区）；② 新增 `server/scripts/dev-tools.js`（check/free/scan/cleanup 四子命令，跨平台 port 管理）；③ 新增 `server/scripts/start-server.js`（Node.js `detached: true` 启动，PID 落 `.server.pid` 文件）+ `stop-server.js` 配套；④ `package.json` 加 `dev:check` / `dev:free` / `dev:scan` / `dev:cleanup` / `predev` 钩子；⑤ 新增 `server/scripts/audit.js`（33 TS 文件 3 项审计：TODO/FIXME/XXX + JSDoc 覆盖 + 未用 import）；⑥ 审计 0 命中：TODO ✅ 0 / JSDoc 缺失 ✅ 0 / 未用 import ✅ 0；⑦ 4 gate 全绿：tsc 双 0 错 ✅ / `prisma validate` ✅ / `jest 13/13` ✅ / 端到端 5/5 curl on 7777 ✅ | 端口冲突根治 + 工程化 dev 流程 |
| 2026-06-07 | **Batch 8 (5 issue + 1 schema BUG)**：① 死代码：`EncryptionService` 删 `import { Logger }` + 删 `logger` 字段（**未使用**）；② 风格：`JwtAuthGuard` 4 个 import 一行 → 拆 7 行对齐项目风格；③ 文档错误：`llm.ts:56` "M6 接入" → "**M2-A 接入**"（AGENTS §6.5 锁定 M2-A，stub 标记落后 4 里程碑）；④ stub 错误信息：同上 `deferred to M6` → `deferred to M2-A`；⑤ **真 BUG**：`CircleMember` schema 缺 `isDeleted / createdAt / updatedAt / deletedAt` 字段，但 `prisma.service.ts:14-26` 的 `SOFT_DELETE_MODELS` 列表含它——一旦 `event-visibility.service.ts:53` 走 `this.prisma.client.circleMember.findUnique`，会抛 `Unknown field 'isDeleted' on model 'CircleMember'`。补齐 4 字段 + 1 索引。**6 端点 e2e 仍全绿**（schema 变更等 migration）；详见 `conversations/MILESTONE-20260607-batch8-consistency.md` | LLM stub 里程碑对齐 + 隐藏的 schema 软删不一致 BUG |
| 2026-06-07 | **Batch 9 (4 Tab + 退 WSL + 端到端联调)**：① **4 Tab 重新梳理**：原"首页/日历/项目/我的" → **"日程/协作/任务/我的"**；PRD 新增 §2.5 详细子功能/关键页面/API 矩阵；② **退 WSL**：`wsl --unregister Ubuntu-26.04`；**装 Windows native PG 18**（winget `PostgreSQL.PostgreSQL.18`，EDB 静默装 + UAC）；PG 18.4 服务 `postgresql-x64-18` RUNNING + `localhost:5432` 直通；重置 `postgres` 密码为 `timeslots_dev` + 建 `timeslots_dev` DB；③ **Prisma migrate dev 成功**（Windows 端，`20260607133628_init`）；Prisma Client 重生成 + **7/7 端点 e2e 全绿**（health/events.my/events.post 等）；④ `app.json` 加 tabBar 4 项（text-only）+ 4 stub pages 创建（schedule/collab/tasks/mine）；**tsc 0 错**；⑤ **新增铁律 #22**：`Page<TData, TCustom>` 的 TData 接口名**禁止用 `PageData`**（会被 miniprogram-api-typings 全局同名合并 → 4 个 page 字段被合并 → tsc 报错）；命名规则：`<Name>PageData` + `<Name>PageMethods`（如 `SchedulePageData`）。详见 `conversations/MILESTONE-20260607-batch9-4tab-and-native-pg.md` | 4 Tab 产品骨架定调 + 全 Windows 部署拓扑 + tsc 0 错 |
| 2026-06-09 | **全面推翻重建**：按用户要求将全部旧代码归入 `archive-v1/`，从零开始重建 v0.1→v0.3。**变更**：WeUI 2.x→1.5.6（npm 上 2.x 不存在）；`moduleResolution: node`→`bundler`（TS 5.7+ 废弃后兼容）；Page 泛型标注双参数。**审计教训集成**：10 条教训（L1-L10）全部列入 VERSION_PLAN.md 作为新代码质量门禁 |
| 2026-06-14 | **代码巡视整改 + AI 行为规则 §13 新增**：① 修复 6 个 P0/P1 正确性 BUG（时区/软删级联/approval 缺字段/ESLint/日志泄漏）；② 前端空 catch 5 处 + bare catch 1 处加 console.error；③ 后端 User 查询补 isDeleted 过滤 2 处；④ schema 加 7 个关键复合索引；⑤ 重复函数 todayStr/toLocalTime 合并到 `utils/date.ts` 消除 3 份拷贝；⑥ prisma.service.ts 静默 catch 加日志；⑦ AGENTS.md 新增 §13 AI 编码行为规则 11 条（自 2026-06-14 强制执行） | 2026-06-14 代码巡视报告 45 个发现问题整改 |
| 2026-06-14 | **v0.45：MiniMax LLM 后端集成**：`/ai/decompose`（任务拆解 SSE 流式）+ `/ai/suggest-slots`（贪心建议）+ `/ai/parse`（自然语言建日程）三个端点完成；`server/src/modules/llm/` 受保护目录建立；Prompt 与代码分离到 `src/prompts/`；密钥安全走 config 环境变量 | M2-A LLM 核心集成 |
| 2026-06-14 | **v0.46-v0.47：审批 + 委托 + 透明度路径**：ApprovalRequest/ApprovalRecipient/Delegation 全套 CRUD 端点；审批流 3 种 recipients（friend/phone/qr）；委托转交时间块；ShareRecipient CRUD + 隐身切换；Delegation 通知 banner 在 tasks 页显示 | Path 1（协作谱）闭环 |
| 2026-06-14 | **v0.48：前端全流程联调**：delegation-detail 页（委托按钮 + 状态机 + 撤销）；tasks 页 delegation banner；透明度控制面板（recipient CRUD + 隐身切换）；mine 页入口；全部通过 tsc + jest + e2e 三 gate | Frontend delegation + transparency 完工 |
| 2026-06-14 | **v0.49：AI 自然语言建日程**：`POST /api/v1/ai/parse` 后端（`parse.md` prompt + 8s 超时 + mock fallback）；前端 NLP 输入条（debounced 500ms）→ 预览卡片（创建/修改/取消）；微信转发建日程升级为 `aiParse()` + text-split 兜底；三个路径全部闭环 | Path 3（NLP + 模板 + 转发）完工 |
| 2026-06-14 | **AGENTS.md §13 审计 + 7 项改进**：§1 项目描述去 AI 过时标记；§6 LLM 压缩（删除延迟标记 + stub 表）；§7 examples/→代码风格参考；§5.3.2 schema 路径修正；§10 移除 examples/ 保护；新增命令表 + 版本横幅；§12 changelog 补录 v0.45-v0.49 | AGENTS.md v1.3 一致性更新 |
| 2026-06-14 | **AGENTS.md §13.11 新增「WXSS 文件禁止 UTF-8 BOM」**：Write/Edit 工具引入 BOM → WXSS 编译崩溃 → 白屏；强制验证命令 + PowerShell 无 BOM 覆写 | 三次重现的 WXSS BOM 白屏（visibility-bar/index.wxss） |
| 2026-06-19 | **Ponytail + Planning-with-files 集成 AGENTS.md**：开工前必读新增 ponytail (full) 和 planning-with-files 两技能强制加载说明；§4.4 改为 PWF 文件式规划（task_plan.md/findings.md/progress.md）替代影响分析文本；§13 替换为 3-Strike Error Protocol（原 §13 项目规则迁移到 §5.2.2/§5.3.3/§5.4/§5.1）；§9 自检清单新增 Ponytail 和 PWF 两项 | 用户要求将两个 skill 设为 opencode 编程必调用规则 |
