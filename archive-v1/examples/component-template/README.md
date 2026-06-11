# block-card

时段卡片组件。在首页/日视图列表中复用。

## Props

| 名称 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `block` | `TimeBlockVO` | 是 | `null` | 时段数据；结构见 `src/types/api.ts` |
| `editable` | `boolean` | 否 | `false` | 是否启用长按删除手势 |

## Events

| 事件名 | 触发时机 | 事件 detail |
|--------|----------|-------------|
| `tap` | 用户点击卡片 | `{ id: string }` — 时段 id |
| `longpress` | 用户长按卡片 350ms+ | `{ id: string }` — 时段 id |

## 依赖

- WeUI 样式类（`weui-btn` 等）由父级页面或 `app.wxss` 提供
- TypeScript 类型 `TimeBlockVO` 来自 `src/types/api.ts`

## 使用示例

```xml
<block-card
  block="{{ item }}"
  bindtap="onTapBlock"
  bindlongpress="onLongPressBlock"
/>
```

```typescript
onTapBlock(event: WechatMiniprogram.CustomEvent) {
  const { id } = event.detail as { id: string };
  wx.navigateTo({ url: `/pages/time-block-detail/index?id=${id}` });
}
```

## 维护注意

- 修改 Props/Events 时**必须**同步更新本 README
- 复用此组件时，**不要**修改本文件；从父级传 prop 即可
