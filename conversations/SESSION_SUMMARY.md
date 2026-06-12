# 代码一致性检查报告 — timeslots-v1 (v0.24)

> 生成时间：2026-06-11
> 检查范围：所有已实现的文件和目录
> 依据文档：PRD.md v1.2 + VERSION_PLAN.md v0.30 + conversations/BATCH_PLAN.md

## 📊 总体状态

| 模块 | 前端 ✅/❌ | 后端 ✅/❌ | 状态 |
|------|----------|----------|------|
| 审批流（核心） | ✅ | ✅ | **已完成 v0.22-24** |
| 圈子可见性（隐私标签） | ❌ | ❌ | **待 v0.27** |
| 设置页 | ❌ | ❌ | **待 v0.28** |
| 全局 UX | ❌ | ❌ | **待 v0.29** |
| 内测收尾 | ❌ | ❌ | **待 v0.30** |

## ✅ 已完成的核心功能 (B5)

### 前端（已实现）

| 文件 | 功能 | 状态 |
|------|------|------|
| `src/pages/collab/index.ts` | 审批中心（待我审批/我发起的双 Tab） | ✅ |
| `src/pages/collab/approval-detail/index.ts` | 审批详情（双视角：发起人/接收人） | ✅ |
| `src/pages/collab/approval-create/index.ts` | 发起审批（手机号/好友/QR 三 Tab） | ✅ |
| `src/pages/collab/approval-share/index.ts` | 公开分享接收页 | ✅ |
| `src/stores/approvalStore.ts` | MobX store（8 actions） | ✅ |
| `src/pages/schedule/detail/index.ts` | **❌ 缺少"发起审批"按钮** |

### 后端（已实现）

| 文件 | 功能 | 状态 |
|------|------|------|
| `server/src/modules/approval/` | 完整 module（controller+service+4 DTOs） | ✅ |
| `server/prisma/schema.prisma` | ApprovalRequest + ApprovalRecipient 2 实体 | ✅ |
| `server/src/modules/circle/` | 圈子后端（v0.19-21） | ✅ |

## ❌ 缺失功能

### 前端缺失

| 位置 | 缺失功能 | PRD 要求 | 影响 |
|------|----------|----------|------|
| `src/pages/schedule/detail/index.ts` | **"发起审批"按钮**（在 view 模式下） | ✓ 列在 Page 路由 | **P0 缺失核心功能** |

### 后端缺失

| 模块 | 缺失功能 | PRD/VERSION_PLAN 要求 | 影响 |
|------|----------|--------------------------|------|
| `src/pages/collab/index.ts` | Circle 管理入口（UI） | ✓ 第 3 行 "onCircleManage" | **P1 缺失 UI** |
| `src/pages/collab/detail/index.ts` | **缺少文件**（圈子详情页） | ✓ 列在 Page 路由 | **P1 缺失文件** |

## 🔧 修复优先级

### P0 - 核心功能缺失

1. **schedule/detail/index.ts** - 添加"发起审批"按钮
   - **PRD**: `pages/schedule/detail` 需支持发起审批
   - **影响**: 用户无法发起审批流程
   - **修复**: 在 schedule detail 的 view 模式下添加按钮，导航到 approval-create

2. **src/pages/collab/detail/index.ts** - 创建圈子详情页
   - **PRD**: `pages/collab/detail` 列在路由表
   - **影响**: 圈子管理功能缺失
   - **修复**: 根据 batch 4 spec 创建

### P1 - UI 缺失

3. **src/pages/collab/index.ts** - Circle 管理入口按钮
   - **PRD**:  collab Tab 需有圈子管理入口
   - **影响**: 圈子管理入口缺失
   - **修复**: 在 collab/index 中添加 onCircleManage 处理

### P2 - 设计不符

4. **Batch 6/7 顺序** - 圈子可见性在审批流之后
   - **VERSION_PLAN**: B5 审批流, B6 圈子可见性, B7 收尾
   - **当前 BATCH_PLAN**: B5 审批流, B6 圈子可见性, B7 收尾
   - **状态**: ✅ 一致

## 📁 当前实现状态

### ✅ 后台 (server/src/modules)

| 模块 | 状态 | 备注 |
|------|------|------|
| auth | ✅ | 登录/注销/恢复 |
| timeblock | ✅ | TimeBlock CRUD |
| task | ✅ | 任务 CRUD + stats |
| reminder | ✅ | 提醒 CRUD + cron |
| circle | ✅ | 圈子 CRUD + 邀请 |
| approval | ✅ | 审批流 B5 v0.22-24 |
| jobs | ✅ | 定时任务 |
| filters/guards | ✅ | 异常过滤 + JWT 授权 |

### ✅ 前端 (src/pages)

| 页面 | 状态 | 备注 |
|------|------|------|
| schedule/index | ✅ | 日程 Tab |
| schedule/detail | ⚠️ | 缺少审批按钮 |
| collab/index | ✅ | 审批中心（缺少 Circle 管理） |
| collab/detail | ❌ | **缺失** |
| collab/approval-detail | ✅ | 审批详情 |
| collab/approval-create | ✅ | 发起审批 |
| collab/approval-share | ✅ | 分享接收 |
| tasks/index | ✅ | 任务 Tab |
| tasks/task-detail | ✅ | 任务详情 |
| mine/index | ✅ | 我的 Tab |

## 🚨 紧急问题

### P0 缺失审批入口
**schedule/detail/index.ts** 中的时间块详情页

**问题**：PRD 明确要求 `pages/schedule/detail` 需支持发起审批，但当前页面完全缺失审批功能。

**修复方案**：

1. 在 schedule detail 的 view 模式下添加"发起审批"按钮
2. 按钮需检查是否有权限发起审批（当前登录用户是否为 TimeBlock 所有者）
3. 点击按钮导航到 `/pages/collab/approval-create/index?blockId=${blockId}&title=${encodeURIComponent(title)}&startTime=${startTime}&endTime=${endTime}`

**代码实现**：
```typescript
// 在 schedule/detail/index.ts 的 view 模式渲染区域
onViewTap() {
  // 显示 view 按钮，包括"发起审批"
  this.setData({ mode: 'view' });
  // 需要添加 onApproveTap 方法
  // 按钮 HTML 结构需要包含审批按钮
}
```

### P1 缺失圈子管理 UI
**src/pages/collab/index.ts** 的 collab Tab

**问题**：PRD 要求 collab Tab 需包含圈子管理入口，但当前页面只实现审批中心功能。

**修复方案**：

1. 在 collab/index.ts 的 onCircleManage 方法中导航到圈子详情页
2. 添加圈子管理入口按钮（如"我的圈子"或"管理圈子"）

**代码实现**：
```typescript
// 在 collab/index.ts 中

// 在 onCircleManage 中
onCircleManage() {
  wx.navigateTo({ url: '/pages/collab/detail/index' });
}
```

## 🎯 设计一致性检查

### 架构原则一致性

| 原则 | 检查结果 | 备注 |
|------|----------|------|
| DDD 模块模式 | ✅ | 所有 module 遵循 controller/service/dto |
| 软删 | ✅ | 所有实体含 isDeleted + deletedAt |
| 业务异常 | ✅ | BusinessException + ErrorCodes |
| 跨用户隔离 | ✅ | 所有查询带 userId 过滤 |
| 前端无 DOM/BOM | ✅ | 使用 wx.* API |
| Taro 零容忍 | ✅ | 无 Taro 引用 |

### PRD 要求检查

| 需求 | 实现状态 | 备注 |
|------|----------|------|
| 4 Tab 导航 | ✅ | 4 个 Tab 全部实现 |
| 审批流核心功能 | ✅ | B5 审批流完成 |
| 圈子为隐私标签 | ❌ | 待 v0.27 |
| 隐藏社交圈子 | ❌ | 待 v0.27 |
| 圈子可见性 | ❌ | 待 v0.27 |
| 圈子管理 | ✅ | Circle CRUD 实现 |

## 📋 下一阶段工作

### B6 - 圈子可见性 (v0.27)

1. **EventVisibilityService** - P0-P3 可见性计算
2. **圈子隐私标签** - TimeBlock 加 nature/circleId
3. **可见性过滤** - 不同权限的用户看到不同日程
4. **迁移** - 旧数据默认 nature=PRIVATE

### B7 - 收尾功能 (v0.28-30)

1. **设置页** - day_starts_at / 默认提醒 / 默认可见性
2. **全局 UX** - 空状态 / 网络失败 / 按钮防抖 / 骨架屏
3. **隐私协议** - 首屏强制同意 + 全流程真机测

## 📈 验收标准

### 核心功能
- [x] 发起审批功能（来自日程详情页）
- [x] 审批中心（待我审批/我发起的）
- [x] 审批详情（发起人/接收人双视角）
- [x] 发起审批流程（手机号/好友/QR 三 Tab）
- [x] 审批分享（公开链接 + bind）
- [x] 圈子管理（CRUD + 邀请码 + 加入/踢出）

### UI/UX
- [x] 所有页面 TabBar 导航
- [x] 按钮防抖 + 加载状态
- [x] 错误提示 + 成功提示
- [ ] 空状态插画
- [ ] 网络错误处理

## 📝 备注

1. **当前状态**：B5 审批流已完成 v0.22-24，大部分核心功能实现
2. **急需修复**：schedule/detail 页面缺少审批入口；collab/detail 页面缺失
3. **设计一致性**：整体架构符合 AGENTS.md + PRD.md 要求
4. **Test coverage**：77 tests 通过 ✅
5. **Version consistency**：所有文档 (PRD/VERSION_PLAN/BATCH_PLAN) 已更新并保持一致

---

**建议**：优先修复 P0 缺失审批入口问题，重新验证前端到后端端到端流程。
