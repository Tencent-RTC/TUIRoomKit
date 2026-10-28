# 更新日志

[English](./CHANGELOG.md) | **简体中文**

---

## [7.0.1] - 2026-10-28

### 新增

- 新增白板批注功能


## [7.0.0] - 2026-10-23

### 新增

- 正式发布 `@tencentcloud/roomkit-web-vue3` v7.0.0 npm 包，基于 `atomicx` State 层全新重构的 Vue 3 会议 UI 组件库，提供 ESM 与 CJS 两种构建产物及完整 TypeScript 类型声明。
- 新增基于类的命令式核心 API：`RoomKit`，提供 `RoomLayoutTemplate`、`ExitReason` 及强类型的 `RoomKitJoinOptions` / `RoomKitEventMap`。
- 新增 `ConferenceView` 场景视图，PC 与移动端（H5）开箱即用。
- 支持完整会中能力：视频布局切换、摄像头/麦克风设备管理、屏幕分享、会中聊天、成员管理、会议预定、云端录制、实时字幕（转写）、互动白板、小窗模式、视频特效。
- 新增会前组装能力：`SchedulePanel`、`ScheduledListPC` / `ScheduledListMobile`、`MeetingDetailMobile`、`SettingsDialogPC`、`AudioDeviceMenu`、`VideoDeviceMenu`、`LanguageButton`、`ThemeButton`、`useDeviceFault`。
- 新增主题（`ThemeName`）、国际化（`i18n` / `t` / `useI18n`）、UI 配置（`RoomKitProvider` / `setUIConfig` / `useUIConfig`，支持图标覆盖）及全套 `TUI*` 基础组件。

### 变更

- 语义化版本跃迁：v7.0.0 取代已废弃的 v6.x 版本线（`@tencentcloud/roomkit-web-vue3` ≤ 6.2.x）。对外 API 与 v6.x 不兼容。
