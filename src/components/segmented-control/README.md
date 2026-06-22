# segmented-control 分段控件

iOS 风格分段控件，灰底白选中态。对齐 H5 设计系统 9.8。

## Props

| 名称 | 类型 | 默认 | 说明 |
|------|------|------|------|
| items | `Array<{label, value}>` | `[]` | 选项列表 |
| value | `String` | `''` | 当前选中值（与 item.value 匹配） |
| disabled | `Boolean` | `false` | 是否禁用 |

## Events

| 名称 | payload | 说明 |
|------|---------|------|
| change | `{value: string, index: number}` | 切换选项时触发 |

## 使用示例

```xml
<segmented-control
  items="{{natureOptions}}"
  value="{{formNature}}"
  bind:change="onNatureChange"
/>
```

```ts
// page data
natureOptions: [
  { label: '公开', value: 'PUBLIC' },
  { label: '自有', value: 'PRIVATE' },
  { label: '圈子可见', value: 'CIRCLE_ONLY' },
],

onNatureChange(e) {
  this.setData({ formNature: e.detail.value });
}
```

## 样式参考

- 容器：`--ts-bg-segmented`（#EFEFF4）+ `--ts-radius-md` 圆角
- 选中项：白底 + `--ts-text-primary` + 阴影
- 未选中：`--ts-text-secondary`
