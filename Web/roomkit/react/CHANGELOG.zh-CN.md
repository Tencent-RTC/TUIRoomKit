# 更新日志

[English](./CHANGELOG.md) | **简体中文**

---

## [6.1.1] - 2026-07-16

### 新增

- 导出 `genTestUserSig` 方法，对齐各端能力，方便快速接入与调试。

### 变更

- `ConferenceMainView` 与 `PreConferenceView` 默认改为撑满父容器（宽高 100%），不再强制占满整个视口。

## [6.1.0] - 2026-07-13

### 新增

- 支持云端录制能力。

### 修复

- 修复麦克风开启前无法打开 AI 降噪插件的问题。
- 修复超长时间挂机后 RTC 断连的问题。

## [6.0.2] - 2026-06-12

* Room: `ConferenceMainView` 新增 `renderParticipantView` 属性。修复通过 `renderParticipantView` 配置自定义覆盖层后，参与者设备状态变化无法立即更新到覆盖层的问题。

### 

## [6.0.1] - 2026-06-05

### 新增

- 正式发布 `@tencentcloud/roomkit-web-react` npm 包，对外接口与 `@tencentcloud/roomkit-web-vue3` 保持一致，同时提供 ESM 与 CJS 两种构建产物及完整 TypeScript 类型声明。
- 支持进房前预览（`PreConferenceView`）与会议主界面（`ConferenceMainView`）两大核心视图。
- 支持视频布局切换、摄像头/麦克风控制、屏幕分享、会中聊天、成员管理、房间邀请、会议预定等完整会中能力。
- 导出 `atomicx` State 层 `Client`，支持纯 JavaScript / 非 React 环境调用。
