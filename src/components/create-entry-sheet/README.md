# create-entry-sheet

5 入口创建面板（语音/AI/模板/手动/图片），从底部弹出。

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `visible` | `boolean` | `false` | 是否显示面板 |
| `context` | `string` | `'schedule'` | 上下文标识，随 select 事件透传 |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `select` | `{ type: CreateType, context: string }` | 用户选择创建方式 |
| `close` | — | 面板关闭（取消按钮或遮罩点击） |

## Usage

```xml
<create-entry-sheet
  visible="{{showSheet}}"
  context="schedule"
  bind:select="onCreateSelect"
  bind:close="onSheetClose"
/>
```

## CreateType

`'voice' | 'image' | 'ai' | 'template' | 'manual'`
