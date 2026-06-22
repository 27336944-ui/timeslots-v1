# inset-form 分组表单容器

iOS Inset Grouped 风格表单容器（H5 9.7）。本身不渲染表单行，仅作为白底大圆角壳，由外部通过默认 slot 注入 `.ts-inset-row` 子项。

## Props

| 名称 | 类型 | 默认 | 说明 |
|------|------|------|------|
| header | `String` | `''` | 可选分组标题（uppercase 灰色小字），空则不显示 |

## Slots

| 名称 | 说明 |
|------|------|
| (default) | 表单行内容，建议使用全局工具类 `.ts-inset-row` / `.ts-inset-row-label` 等 |

## 使用示例

```xml
<inset-form header="日程信息">
  <view class="ts-inset-row">
    <text class="ts-inset-row-label">标题</text>
    <input class="ts-inset-input" placeholder="日程标题" />
  </view>
  <view class="ts-inset-row">
    <text class="ts-inset-row-label">开始日期</text>
    <picker mode="date">
      <view class="ts-inset-row-value">2026-06-16</view>
    </picker>
  </view>
</inset-form>
```

## 样式参考

- 容器：`--ts-bg-inset` 白底 + `--ts-radius-card-ios` 32rpx 圆角
- 外边距：`--ts-space-lg` 24rpx
- 阴影：`--ts-shadow-card-ios`
- header：`--ts-font-tiny` 22rpx 灰色大写
