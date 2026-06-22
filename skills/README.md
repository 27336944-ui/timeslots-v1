# TimeSlots v1 — Project Skills

所有 AI Agent 在本仓库工作时，必须加载并使用以下技能。这些技能随仓库分发，不依赖外部路径。

> **2026-06-20 修正**：旧版提到 Hermes `research/kb-search` 外部路径，**该路径不存在**。本项目知识库搜索统一走 `skills/kb-search/SKILL.md`（项目内置）+ grep，见下文「知识库搜索」。

## 使用方式

### opencode
```bash
skill planning-with-files    # 加载 planning-with-files SKILL.md
skill ponytail               # 加载 ponytail SKILL.md（full 级别）
```

### 通用（opencode / Hermes / 其他 Agent）
所有技能都是项目相对路径的 markdown 文件，直接读取即可加载，不依赖任何外部 profile 安装：
```bash
# 开工前必读：知识库搜索入口（自包含，含关键词映射 + Top 陷阱速查）
# 读 skills/kb-search/SKILL.md
```

## 规划与协作

| 技能 | 路径 | 加载方式 | 用途 |
|------|------|----------|------|
| planning-with-files | `planning-with-files/SKILL.md` | `skill planning-with-files` | 持久化文件式规划（task_plan.md / findings.md / progress.md） |

## Ponytail 系列（极简主义）

| 技能 | 路径 | 加载方式 | 用途 |
|------|------|----------|------|
| ponytail | `ponytail/SKILL.md` | `skill ponytail` | 核心 YAGNI 原则，最低限度代码；本仓库使用 **full** 级别 |
| ponytail-audit | `ponytail-audit/SKILL.md` | 按需激活 | 全仓库过度工程审计 |
| ponytail-review | `ponytail-review/SKILL.md` | 按需激活 | 代码审查（专注过度工程） |
| ponytail-debt | `ponytail-debt/SKILL.md` | 按需激活 | 技术债追踪（ponytail: 标记收集） |
| ponytail-gain | `ponytail-gain/SKILL.md` | 按需激活 | 性能收益展示（只读） |
| ponytail-help | `ponytail-help/SKILL.md` | 按需激活 | 工作流帮助和指导 |

## 知识库搜索（开工前必做）

**入口技能**：`skills/kb-search/SKILL.md`（自包含，含知识库文件索引 + 关键词映射表 + Top 12 陷阱速查 + 质量门禁命令）。

**实际检索方法**（kb-search 的核心）：知识库已扁平化为 5 个根文件（约 25KB），用 grep 秒出结果，**不需要 FAISS / Python 脚本**：

```bash
grep -ri "关键词" knowledge-base/
```

> ⚠️ 旧文档提到的 `knowledge-base/scripts/search_kb.py` 和 FAISS 索引**均不存在/已废弃**。`knowledge_index.json` 已废弃。统一用 grep。
> ⚠️ 旧文档提到的 Hermes `research/kb-search` 外部路径**不存在**。本项目用 `skills/kb-search/SKILL.md`。

**一手源码核对铁律**：改分包/接口/表结构前，先 grep 一手源码（`src/app.json` / `server/prisma/schema.prisma` / `*controller.ts`），不要只信知识库。详见 `knowledge-base/README.md`。

所有技能必须在开工前加载。详细规则见 `AGENTS.md` §开工前必读技能。

### 注意：opencode 上下文优化

`planning-with-files/SKILL.md` (455 行) 含大量 Claude Code 专属内容（hooks、`/plan-goal`、autonomous modes）。opencode 只需前 ~130 行（核心规则 + 3-Strike Protocol）。如需节省上下文，可改用：

```bash
sed -n '34,165p' skills/planning-with-files/SKILL.md
```

或直接读 `knowledge-base/coding-rules.md` 中的精简摘要（含 The Ladder + PWF + 3-Strike）。
