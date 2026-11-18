# 更新日志

[English](./CHANGELOG.md) | **简体中文**

---

## [7.1.0] - 2026-11-17

### 新增

- 新增教育场景：`createAndJoin` / `join` 传入 `scene: RoomScene.Education` 即可使用。支持 1v1 和小班课（1v6），PC 与移动端可用，支持老师/学生角色入口、会前页加入或恢复课堂，以及移动端横竖屏。
- 教育场景支持白板（含批注与书写授权）、全体静音、全体禁言、进出课堂消息和新消息提醒。
- `setUIConfig` 新增 `widgetVisible`，支持隐藏内置工具栏按钮，可隐藏的按钮见 `RoomWidget`，会议与教育场景均生效。
- `createAndJoin` / `join` 新增 `mediaPreference`（`preferMicrophoneOn` / `preferCameraOn`）；全员静音时进房默认不采集麦克风，不占用上行音视频位。
- 新增导出：`RoomScene`、`RoomWidget`、`WidgetVisible`、`MediaPreference`、`UserPickerPC`、`TUICheckbox`、`TUIDatePicker`、`TUISegmented`、`EDUCATION_VIRTUAL_BACKGROUND_IMG_LIST`。

### 变更

- 升级 `tuikit-atomicx-react` 至 6.4.6。
- 屏幕共享与白板默认推流码率调整为 5000 kbps；预约时长改为 15/30/45 分钟、1/2/3 小时。
- 会中人数改用后台 `participantCount`；默认会议或课堂名称中的用户名只保留前 10 个字符。
- 音频设备菜单移除麦克风测试和扬声器测试。
- 主持人开启全体禁止屏幕共享时，普通成员已打开的白板会自动关闭。
- 退出课堂后不再重置虚拟背景。

### 修复

- 修复教育场景加载白屏、学生端露出共享设置，以及屏幕共享时成员列表布局被切换的问题。
- 修复学生再次被授权后无法擦除首次书写的笔迹，以及 Safari 下打开白板时无法开始屏幕共享的问题。
- 登录超出套餐日活上限（72000）时提示升级。
- 修复设备错误弹窗定位、字幕列表滚动、按钮图标对齐和 Tab 焦点框等界面问题。

## [7.0.0] - 2026-10-23

### 新增

- 正式发布 `@tencentcloud/roomkit-web-react` npm 包，基于 `atomicx` State 层全新重构的 React 会议 UI 组件库，提供 ESM 与 CJS 两种构建产物及完整 TypeScript 类型声明。
- 新增基于类的命令式核心 API：`RoomKit`，提供 `RoomLayoutTemplate`、`ExitReason` 及强类型的 `RoomKitJoinOptions` / `RoomKitEventMap`。
- 新增 `ConferenceView` 场景视图，PC 与移动端（H5）开箱即用。
- 支持完整会中能力：视频布局切换、摄像头/麦克风设备管理、屏幕分享、会中聊天、成员管理、会议预定、云端录制、实时字幕（转写）、小窗模式、视频特效。
- 新增会前组装能力：`SchedulePanel`、`ScheduledListPC` / `ScheduledListMobile`、`MeetingDetailMobile`、`SettingsDialogPC`、`AudioDeviceMenu`、`VideoDeviceMenu`、`LanguageButton`、`ThemeButton`、`useDeviceFault`。
- 新增主题（`ThemeName`）、国际化（`i18n` / `t` / `useI18n`）、UI 配置（`RoomKitProvider` / `setUIConfig` / `useUIConfig`，支持图标覆盖）及全套 `TUI*` 基础组件。
