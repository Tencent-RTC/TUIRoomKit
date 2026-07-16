# 更新日志

[English](./CHANGELOG.md) | **简体中文**

---

## [6.1.1] - 2026-07-16

### 新增

- `setWidgetVisible` 支持控制白板（`WhiteboardWidget`）与批注（`AnnotationWidget`）入口按钮的显隐。
- 导出 `genTestUserSig` 方法，对齐各端能力，方便快速接入与调试。

### 变更

- `ConferenceMainView` 与 `PreConferenceView` 默认改为撑满父容器（宽高 100%），不再强制占满整个视口。

## [6.1.0] - 2026-07-13

### 新增

- 支持白板与屏幕共享批注能力。
- 支持云端录制能力。

### 修复

- 修复麦克风开启前无法打开 AI 降噪插件的问题。
- 修复超长时间挂机后 RTC 断连的问题。
