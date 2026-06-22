---
name: kb-search
description: >
  Knowledge base semantic search for timeslots-v1. Load before starting any work.
  Indexes 5 flat knowledge-base files (~20KB total) with grep. No FAISS / embedding needed.
  Covers: project structure, coding rules, API reference, experience notes (36 traps),
  design tokens, component specs, and audit findings.
user-invocable: true
---

# Knowledge Base Search (timeslots-v1)

**Mandatory**: Load before any code work. Ensures all agents share the same project context.

## 1. Knowledge Base Files

| File | Content | Size |
|------|---------|------|
| `knowledge-base/project-structure.md` | Directory structure, pages, modules, subpackages, components, audit metrics | ~3KB |
| `knowledge-base/coding-rules.md` | Mandatory coding rules + Ponytail The Ladder + PWF + 3-Strike + quality gates | ~7KB |
| `knowledge-base/api-reference.md` | All backend endpoints + DTO definitions (16 modules, 80+ endpoints) | ~6KB |
| `knowledge-base/experience-notes.md` | Architecture decisions (D1-D6) + 36 coding traps (L1-L36) + audit lessons | ~5KB |
| `knowledge-base/README.md` | Index + usage guide | ~1KB |

## 2. How to Search

### 2.1 grep (primary method)

```bash
# All knowledge-base files
grep -ri "关键词" knowledge-base/

# Specific file
grep -ri "styleIsolation" knowledge-base/coding-rules.md
grep -ri "陷阱" knowledge-base/experience-notes.md
grep -ri "time-block" knowledge-base/api-reference.md
```

### 2.2 Common Keyword Mappings

| You want to... | Search for |
|----------------|------------|
| Know coding standards | `"编码规范"` `"§2."` `"§4."` |
| Know frontend page structure | `"页面路由"` `"schedule/"` `"tasks/"` |
| Know component specs | `"组件列表"` `"Props"` `"styleIsolation"` |
| Know API endpoints | `"POST /"` `"GET /"` `"DTO"` |
| Know design tokens | `"--ts-"` `"tokens"` `"CSS 变量"` |
| Know business logic | `"PRD"` `"三条路径"` `"产品哲学"` |
| Know past bugs/traps | `"L1-"` `"L25-"` `"陷阱"` `"教训"` |
| Know audit findings | `"P0-"` `"P1-"` `"审计"` `"分包"` |
| Know error handling rules | `"catch"` `"logError"` `"错误处理"` |
| Know security rules | `"Token"` `"隐私"` `"加密"` `"敏感"` |
| Know accessibility | `"可访问性"` `"aria"` `"对比度"` `"热区"` |
| Know animation rules | `"动画"` `"transition"` `"keyframes"` |
| Know time zone rules | `"时区"` `"+08:00"` `"Intl.DateTimeFormat"` |
| Know MobX patterns | `"store"` `"observable"` `"action"` `"createStoreBindings"` |

## 3. Architecture Decision Records

Quick reference (full details in `experience-notes.md`):

| ID | Decision | Key Point |
|----|----------|-----------|
| D1 | NestJS Module DDD | Controller thin, Service thick, never call Prisma from Controller |
| D2 | Unified response code | `{code: 0, data: T}` success; `{code: <5-digit>, data: null}` failure |
| D3 | Soft delete via $extends | Auto-inject `isDeleted: false`; use `tx.xxx` in transactions |
| D4 | Timezone UTC+8 | All dates `+08:00`; frontend `Intl.DateTimeFormat('Asia/Shanghai')` |
| D5 | MobX store binding | `createStoreBindings`; destroy in `onUnload`; action uses `function(this:)` |
| D6 | Frontend data flow | Page data = view only; MobX store = business data; API via `services/api.ts` |
| D7 | Design Token single source | All colors/spacing via `var(--ts-*)` in `tokens.wxss`; no hardcoded values; 30+ violations pending |
| D8 | Subpackaging (**implemented**) | 4 subpackages configured in `app.json` + preloadRule; main pkg = 6 pages only. **Verify src/app.json before changing** |
| D9 | Error observability | Global catchers must report (not just console.error); use `logError(ctx, err)` everywhere |

## 4. Critical Traps (Top 12 most dangerous)

| ID | Severity | Trap | Quick Fix |
|----|----------|------|-----------|
| L1 | P0 | `wx.onError` uses `errMsg` | Use `message` |
| L2 | P0 | Empty catch blocks | Add `logError()` |
| L25 | P0 | 40+ silent catches | Batch add `logError()` |
| L26 | P0 | Global errors only console.error | Add WeChat performance monitor / backend report |
| L28 | P0 | Token stored in plaintext | Add XOR/Base64 obfuscation |
| L3 | P0 | `charAt()` in WXML | Use `slice(0, 1)` |
| L9/L32 | P1 | Missing `styleIsolation` in component JSON | All 16 components need it in index.json |
| L29 | P1 | `formatDate` duplicated 3 times (2 copies missing timezone) | Delete day-nav/week-nav copies, import utils/date.ts |
| L30 | P1 | `new Date()` without timezone (27 places) | Add `+08:00` |
| L33 | P1 | 30+ hardcoded colors | Use `var(--ts-color-*)` design tokens |
| L11 | P2 | `new Date('...Z')` off-by-one | Use `+08:00` |
| L14 | P3 | Large images exceed main package | Each image <= 200KB |

> ⚠️ **L27 withdrawn (2026-06-20)**: Audit falsely reported "no subpackaging". Actual `app.json` already has 4 subpackages. Lesson: always verify first-party source before trusting audit/secondary docs.

## 5. Protected Modules

Do NOT modify without explicit `CHANGE-xxx.md`:

- `src/utils/request.ts` — network request layer
- `src/stores/authStore.ts` — auth state
- `src/services/*` — business API layer (additions OK, modifications need CHANGE)
- `server/src/modules/llm/**` — MiniMax proxy
- `src/types/global.d.ts` — global types
- `src/prompts/**` — system prompts
- `project.config.json` — WeChat project config

## 6. Quality Gates

Run before any commit:

```bash
cd server && npx tsc --noEmit        # Backend type check
cd server && npx jest                 # Backend tests (113 tests)
npx tsc --noEmit                      # Frontend type check
grep -rE "\b(TODO|FIXME)\b" src/ --include='*.ts' --include='*.wxml'  # Must be 0
```

## 7. Knowledge Base Update Protocol

When project changes are made:

1. **New page/component**: Update `project-structure.md` pages table + component list
2. **New API endpoint**: Update `api-reference.md` endpoint section + DTO
3. **New bug found/fixed**: Add to `experience-notes.md` traps (next L number)
4. **New coding rule**: Add to `coding-rules.md` relevant section
5. **Audit completed**: Sync all files, bump version in `README.md`
