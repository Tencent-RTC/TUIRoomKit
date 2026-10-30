# 更新日志

[English](./CHANGELOG.md) | **简体中文**

---

## [7.1.0] - 2026-10-30

### 变更

- 升级 `tuikit-atomicx-vue3` 至 6.7.0。
- 新增教育 1v1 场景。

## [7.0.3] - 2026-10-30

### 变更

- 升级 `@tencentcloud/tuiroom-engine-js` 至 4.3.2，修复本地画面镜像问题。
- 音频设备菜单移除麦克风测试和扬声器测试。
- 主持人开启全体禁止屏幕共享时，普通成员已打开的白板会自动关闭。

### 修复

- 修复 H5 端快速连续点击切换摄像头按钮导致前后置摄像头或镜像状态错乱的问题，切换完成前按钮置灰不可点击。
- 修复主持人开启实时字幕（转写）时，其他成员未收到提示的问题。
- 修复中日韩等无空格文字的字幕超出单行字幕窗口、导致文字被挤出可视区域的问题。
- 修复 PC 端工具栏「更多」菜单中部分按钮图标显示错误，以及切换语言后文案未更新的问题。

## [7.0.2] - 2026-10-29

### 变更

- 升级 `tuikit-atomicx-vue3` 至 6.6.3。

### 修复

- 修复屏幕分享结束后，H5 端远端摄像头画面由 cover 变为 contain 模式播放的问题。
- 修复 H5 端进入全体静音房间后，麦克风按钮显示为开启、点击无响应且不提示已禁用的问题。
- 修复 Safari 下视频圆角失效，以及视频格子上说话光圈被裁切的问题。

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
