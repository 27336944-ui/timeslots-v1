# capsule-button 胶囊按钮

iOS 风全圆角胶囊按钮（H5 9.6）。支持 4 种 type + loading + disabled + 全宽/并排。

## Props

| 名称 | 类型 | 默认 | 说明 |
|------|------|------|------|
| text | `String` | `''` | 按钮文字 |
| type | `String` | `primary` | `primary` / `secondary` / `danger` / `amber` |
| block | `Boolean` | `true` | true=全宽独占一行；false=inline 用于 `.ts-capsule-row` 并排 |
| loading | `Boolean` | `false` | 显示 loading spinner，自动禁用点击 |
| disabled | `Boolean` | `false` | 禁用 |
| openType | `String` | `''` | 预留：微信开放能力（如 share） |

## Events

| 名称 | 说明 |
|------|------|
| tap | 点击（loading/disabled 时不触发） |

## 使用示例

### 全宽主按钮
```xml
<capsule-button text="确认" type="primary" bind:tap="onConfirm" />
```

### 并排按钮（需用 `.ts-capsule-row` 容器）
```xml
<view class="ts-capsule-row">
  <capsule-button text="返回修改" type="secondary" block="{{false}}" bind:tap="onBack" />
  <capsule-button text="分享" type="secondary" block="{{false}}" bind:tap="onShare" />
</view>
<capsule-button text="确认" type="primary" bind:tap="onConfirm" />
```

### 危险操作
```xml
<capsule-button text="删除日程" type="danger" bind:tap="onDelete" />
```

## 样式参考

- 高度：`--ts-btn-capsule-height` 100rpx（H5 50px）
- 圆角：`--ts-radius-full`
- 字号：`--ts-btn-capsule-font` (--ts-font-lg)
- 按下反馈：`opacity: 0.85`
