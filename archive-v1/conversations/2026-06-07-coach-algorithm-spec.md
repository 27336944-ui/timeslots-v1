# 2026-06-07 AI 效率教练算法 Spec（V1.0 PRD §9 细化）

> 用户拍板决议。3 指标已 spec，"工作"如何定义 pending。
> 代码实现时必须引用本文件，**禁止**在 service / prompt 里硬编码阈值/公式。

---

## 1. 日程碎片化指数 (Fragmentation Index)

### 1.1 算法

```
gaps = []
sorted_blocks = sort(time_blocks, by=startTime)
for i in range(len(sorted_blocks) - 1):
    gap_minutes = (sorted_blocks[i+1].startTime - sorted_blocks[i].endTime) / 60000
    if min_gap_minutes < gap_minutes < max_gap_minutes:
        gaps.append(gap_minutes)

if len(gaps) >= threshold:
    verdict = "高度碎片化"
```

### 1.2 阈值（用户可调）

| 参数 | 默认值 | 用户可调范围 | 存储 |
|------|--------|--------------|------|
| `min_gap_minutes` | 30 | 15 ~ 60 | `User.coachSettings` (jsonb) |
| `max_gap_minutes` | 120 | 60 ~ 240 | 同上 |
| `threshold` | 3 | 1 ~ 10 | 同上 |

### 1.3 教练建议生成

- 当日碎片化指数 ≥ 用户阈值 → 触发"建议合并零碎时间"
- 建议内容由 LLM 生成（prompt 模板 `src/prompts/coach/fragmentation.ts`，v1 起）
- 建议可包含："把 X/Y/Z 段时间合并处理邮件 / 深度思考"

### 1.4 范围

- 统计窗口：当日 00:00 ~ 23:59 (用户时区，按 `User.dayStartsAt` 切分)
- 统计范围：**所有 nature** 的日程（不过滤 work/life/private）

---

## 2. 计划与实际偏差率 (Plan vs Actual Deviation)

### 2.1 算法

```
plan_minutes = (timeBlock.endTime - timeBlock.startTime) / 60000
actual_minutes = timeBlock.actualDurationMinutes  // 复盘时填, 选填
if actual_minutes is null:
    # 尚未复盘
    return SKIP

deviation_rate = abs(actual_minutes - plan_minutes) / plan_minutes
if deviation_rate > trigger_threshold:
    verdict = "显著偏差"
```

### 2.2 触发阈值

| 参数 | 默认值 | 用户可调 | 存储 |
|------|--------|----------|------|
| `trigger_threshold` | 0.30 (30%) | 0.10 ~ 1.00 | `User.coachSettings` |

### 2.3 教练建议生成

- 显著偏差 → 触发"建议预留缓冲"卡片
- 建议内容由 LLM 生成，结合多日偏差做趋势分析

### 2.4 范围

- 仅统计**已完成复盘**的日程（有 `actualDurationMinutes`）
- 跨多日聚合（统计窗口 = 7 天，对齐周报）

---

## 3. 深度专注占比 (Deep Work Ratio)

### 3.1 算法

```
# Step 1: 取当日 work 日程（"工作"定义见 §4，pending）
work_blocks = filter(time_blocks, where=is_work)

# Step 2: 按时间排序
sorted_blocks = sort(work_blocks, by=startTime)

# Step 3: 找连续 ≥ 2h 的 run（私有冲突"算无冲突"，见 §3.3）
focused_runs = []
current_run = []
for block in sorted_blocks:
    if current_run is empty:
        current_run = [block]
    else:
        gap = block.startTime - current_run[-1].endTime
        if gap <= 0:  # 紧接或重叠
            current_run.append(block)
        else:
            # 当前 run 结束，判断是否 ≥ 2h
            run_duration = current_run[-1].endTime - current_run[0].startTime
            if run_duration >= min_focus_minutes:
                focused_runs.append(current_run)
            current_run = [block]

# 处理最后一个 run
if current_run:
    run_duration = current_run[-1].endTime - current_run[0].startTime
    if run_duration >= min_focus_minutes:
        focused_runs.append(current_run)

# Step 4: 算占比
focused_minutes = sum(run.endTime - run.startTime for run in focused_runs)
total_work_minutes = sum(block.endTime - block.startTime for block in work_blocks)
ratio = focused_minutes / total_work_minutes if total_work_minutes > 0 else 0
```

### 3.2 健康阈值

| 参数 | 默认值 | 用户可调 | 存储 |
|------|--------|----------|------|
| `min_focus_minutes` | 120 (2h) | 60 ~ 240 | `User.coachSettings` |
| `health_threshold` | 0.60 (60%) | 0.30 ~ 0.90 | `User.coachSettings` |

### 3.3 私有日程冲突规则

**关键设计**：
- 私有日程冲突 **算"无冲突"**（不打断专注 run）
- 但 **必须** 提醒用户："您有 N 个私有日程与专注时间重叠"

理由：用户标记 private 的日程可能是"深度工作"或"私事"，不应当作"被打断"。但要诚实地告诉用户时间被占用了。

### 3.4 提醒内容

- 触发条件：focused_run 区间内存在任何 nature=private 日程
- 提醒文本模板："您今天有 N 段专注时间，但其中 M 段时间内还有 X 个私有日程。是否需要调整？"
- 提醒放在 CoachCard 的二级信息（不阻断主建议）

---

## 4. "工作"如何定义（已决：D 用户可配置）

> 用户拍板：D. 用户可配置（基线 A + settings 调）
> 2026-06-07 决议。

### 4.1 决策

- **基线**：A 方案 `nature = 'work'`
- **用户可调**：settings UI 提供 4 选 1 切换
- **存储**：`User.coachSettings.workFilter` (jsonb)
- **默认**：`workFilter: 'nature_work'`

### 4.2 4 选 1 候选项

| 值 | 判定 | 适用场景 |
|----|------|----------|
| `nature_work` | `nature = 'work'` | 默认；与 V1.0 PRD §3 一致 |
| `nature_work_and_not_private` | `nature = 'work' AND nature != 'private'` | 排除私人工作 |
| `nature_work_and_open` | `nature = 'work' AND privacy = 'open'` | 严格：工作 + 共享 |
| `privacy_open` | `privacy = 'open'` | 独立开发者/纯共享场景 |

### 4.3 算法接入

```
is_work = evaluate_filter(timeBlock, user.coachSettings.workFilter)
work_blocks = filter(time_blocks, where=is_work)
```

### 4.4 M2-A / M2-B 任务拆分

- **M2-A**：Prisma schema 加 `User.coachSettings: jsonb` 字段（默认值见 §7）
- **M2-B**：设置页 UI「我的 → 教练设置」加 4 选 1 切换
- **M2-C**：CoachCard 标记位存 `workFilter`（用于回溯算法版本）

### 4.5 影响

- §3 算法中 `work_blocks = filter(time_blocks, where=is_work)` 的 `is_work` 谓词（动态注入）
- §1 / §2 **不受影响**（统计所有 nature）
- ER 图：User.coachSettings 字段 + 关键设计决策 #7 同步（已更新 data-model-v1-er.md）

---

## 5. 实施备注

### 5.1 触发时机

- 周一 08:30 → 周报（统计上周 7 天，输出周 CoachCard）
- 每日 21:00 → 日复盘（统计今日，输出日 CoachCard）
- 用户进入「我的」Tab 触发增量计算（不生成新 CoachCard，只更新现有）

### 5.2 缓存

- CoachCard 表存历史结果（不实时算）
- 实时统计仅在用户主动点击"刷新建议"时跑

### 5.3 时区

- 全部按 `User.dayStartsAt` 切分日界
- "周一 08:30" 的"周一"= 用户当地周一（不是 UTC 周一）

### 5.4 隐私

- 教练算法可读 nature=private 日程（用于 §3.3 提醒），但**不读** private 日程的 details（标题/地点/备注）
- 数据库查询：`SELECT startTime, endTime, nature, actualDurationMinutes FROM time_blocks WHERE ...`，**不 SELECT** title/location/notes

---

## 6. 受影响文件

| 用途 | 文件 |
|------|------|
| 算法实现 | `server/src/modules/coach/metrics/` (待建) |
| 用户配置存储 | `User.coachSettings: jsonb` (Prisma 待加) |
| LLM prompt 模板 | `src/prompts/coach/{fragmentation,deviation,deep-work}.ts` (待建) |
| 数据库 | `CoachCard.metrics: jsonb` (ER §10.1 已定) |
| 前端卡片展示 | `src/pages/me/coach/` (待建) |
| 设置 UI | `src/pages/me/settings/coach.ts` (待建) |

---

## 7. 默认 User.coachSettings 接口

```typescript
interface UserCoachSettings {
  fragmentation: {
    minGapMinutes: number;        // 默认 30, 范围 15~60
    maxGapMinutes: number;        // 默认 120, 范围 60~240
    threshold: number;            // 默认 3, 范围 1~10
  };
  deviation: {
    triggerThreshold: number;     // 默认 0.30, 范围 0.10~1.00
  };
  deepWork: {
    minFocusMinutes: number;      // 默认 120, 范围 60~240
    healthThreshold: number;      // 默认 0.60, 范围 0.30~0.90
  };
  workFilter: WorkFilter;         // 默认 'nature_work'
}

type WorkFilter =
  | 'nature_work'
  | 'nature_work_and_not_private'
  | 'nature_work_and_open'
  | 'privacy_open';
```

**完整默认值**（首次进入设置页时 UPSERT）：

```json
{
  "fragmentation": { "minGapMinutes": 30, "maxGapMinutes": 120, "threshold": 3 },
  "deviation": { "triggerThreshold": 0.30 },
  "deepWork": { "minFocusMinutes": 120, "healthThreshold": 0.60 },
  "workFilter": "nature_work"
}
```
