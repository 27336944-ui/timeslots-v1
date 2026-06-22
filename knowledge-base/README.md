# TimeSlots v1 — 共享知识库

> **强制要求**: 所有 Agent 开工前必须先检索本知识库（AGENTS.md §1），确保对项目上下文理解完全一致。不搜索直接改代码 = 违规。
> 最后更新: 2026-06-20
> 版本: v3.0（集成 2026-06-19 全量前端审计 + kb-search 技能）

## 文件清单

| 文件 | 内容 | 更新要点 |
|------|------|----------|
| `project-structure.md` | 项目目录结构、分包规则（**已实施 4 分包**）、页面路由、后端 18 模块、审计数据、16 组件清单 | 2026-06-20 核对 app.json |
| `coding-rules.md` | 强制编码规范 + Ponytail + PWF + 3-Strike + 自检清单 + **Design Token(D7) + 无障碍 + 动画 + 时间处理** | 2026-06-20 加 §2.12-2.15 |
| `api-reference.md` | 后端接口文档（18 模块、80+ 端点，含 DTO + SSE/鉴权标注） | 2026-06-20 补 Health + AI 控制器拆分 |
| `experience-notes.md` | 架构决策 D1-D9 + 陷阱清单 L1-L43（含审计新增 L25-L43 + 元教训） | 2026-06-20 纠正 L27 误报 |
| ~~`knowledge_index.json`~~ | FAISS 索引（**已废弃**，huggingface 不可达无法重建） | 用 grep 替代 |

## 使用方式

### 1. 加载 kb-search 技能（推荐入口）
技能文件：`skills/kb-search/SKILL.md`（自包含，含关键词映射表 + Top 陷阱速查 + 质量门禁命令）
```bash
# opencode / Hermes 通用
# 直接读 skills/kb-search/SKILL.md 获取开工所需 80% 上下文
```

### 2. 全文检索（实际工作方法）
```bash
grep -ri "关键词" knowledge-base/
```
5 个文件总计约 25KB，grep 秒出结果。**不需要 FAISS / Python 脚本**（`knowledge-base/scripts/search_kb.py` 不存在；旧文档提到的 FAISS 索引已废弃）。

### 3. 常见关键词映射
| 任务 | 搜索关键词 |
|------|------------|
| 改前端页面 | `Page泛型` `WXML` `styleIsolation` |
| 改后端接口 | `api-reference` `DTO` `事务` `乐观锁` |
| 新增组件 | `组件规范` `styleIsolation` `design token` |
| 改工具函数 | `request` `storage` `date` `formatDate` |
| 理解业务 | `PRD` `三条路径` |
| 排查问题 | `experience-notes` `陷阱` `L1-L43` |
| 遵守编码 | `coding-rules` `受保护模块` `自检清单` |
| 改分包 | `subPackages`（**先 grep src/app.json 核对现状**） |
| 改样式/主题 | `Design Token` `D7` `tokens.wxss` |

## 一手源码核对原则（铁律）

> 2026-06-20 元教训：审计/会话记忆是二手信息，曾误报"无分包"（实际已实施 4 分包）。

改以下内容前，**必须**核对一手源码，不要只信知识库：
| 改动 | 核对源 |
|------|--------|
| 分包 / 页面路由 | `src/app.json` |
| 数据库表 / 字段 | `server/prisma/schema.prisma` |
| 接口端点 | `server/src/modules/*/`*.controller.ts` |
| 组件清单 | `src/components/*/index.json` |
| TS 配置 | `tsconfig.json` |
| 依赖版本 | `package.json` / `server/package.json` |

## 更新知识库

项目变更时同步更新对应文件。重大决策（如 D7/D8/D9）记录到 `experience-notes.md` 的「架构决策记录」段。
