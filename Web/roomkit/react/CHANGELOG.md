# CHANGELOG

**English** | [简体中文](./CHANGELOG.zh-CN.md)

---

## [7.0.0] - 2026-10-23

### Added

- Initial release of the `@tencentcloud/roomkit-web-react-next` npm package, a fully rebuilt React conference UI kit based on the `atomicx` state layer. Bundled in both ESM and CJS formats with full TypeScript declarations.
- Added a new class-based imperative core API: `RoomKit`, with `RoomLayoutTemplate`, `ExitReason`, and strongly typed `RoomKitJoinOptions` / `RoomKitEventMap`.
- Added the `ConferenceView` scene view, covering both PC and mobile (H5) experiences out of the box.
- Supported full in-meeting capabilities: video layout switching, camera/microphone device management, screen sharing, in-room chat, member management, meeting scheduling, cloud recording, real-time captions (transcription), mini-window mode, and video effects.
- Added pre-conference assembly features: `SchedulePanel`, `ScheduledListPC` / `ScheduledListMobile`, `MeetingDetailMobile`, `SettingsDialogPC`, `AudioDeviceMenu`, `VideoDeviceMenu`, `LanguageButton`, `ThemeButton`, and `useDeviceFault`.
- Added theming (`ThemeName`), i18n (`i18n` / `t` / `useI18n`), UI configuration (`RoomKitProvider` / `setUIConfig` / `useUIConfig`) with icon overrides, and a complete set of `TUI*` base components.
