# CHANGELOG

**English** | [简体中文](./CHANGELOG.zh-CN.md)

---

## [7.1.0] - 2026-10-30

### Changed

- Upgraded `tuikit-atomicx-vue3` to 6.7.0.
- Added support for 1-on-1 educational scenarios.

## [7.0.3] - 2026-10-30

### Changed

- Upgraded `@tencentcloud/tuiroom-engine-js` to 4.3.2, which fixes a local video mirroring issue.
- Removed the microphone test and speaker test from the audio device menu.
- A general participant's whiteboard is now closed automatically when the host disables screen sharing for everyone.

### Fixed

- Fixed rapidly tapping the flip camera button on H5 leaving the camera or mirror in the wrong state. The button is now disabled until the switch completes.
- Fixed participants not being notified when the host starts real-time transcription.
- Fixed CJK captions overflowing the single-line caption window and pushing the text out of view.
- Fixed items in the PC toolbar "More" menu showing the wrong icon, or a stale label after switching languages.

## [7.0.2] - 2026-10-29

### Changed

- Upgraded `tuikit-atomicx-vue3` to 6.6.3.

### Fixed

- Fixed the remote camera video on H5 switching from cover to contain after a screen share ends.
- Fixed the microphone button on H5 showing as on, not responding to taps, and giving no disabled hint after joining a room where all microphones are muted.
- Fixed rounded video corners not taking effect in Safari, and the speaking halo on video tiles being clipped.

## [7.0.1] - 2026-10-28

### Added

- Added whiteboard annotation feature

## [7.0.0] - 2026-10-23

### Added

- Initial release of the `@tencentcloud/roomkit-web-vue3` v7.0.0 npm package, a fully rebuilt Vue 3 conference UI kit based on the `atomicx` state layer. Bundled in both ESM and CJS formats with full TypeScript declarations.
- Added a new class-based imperative core API: `RoomKit`, with `RoomLayoutTemplate`, `ExitReason`, and strongly typed `RoomKitJoinOptions` / `RoomKitEventMap`.
- Added the `ConferenceView` scene view, covering both PC and mobile (H5) experiences out of the box.
- Supported full in-meeting capabilities: video layout switching, camera/microphone device management, screen sharing, in-room chat, member management, meeting scheduling, cloud recording, real-time captions (transcription), interactive whiteboard, mini-window mode, and video effects.
- Added pre-conference assembly features: `SchedulePanel`, `ScheduledListPC` / `ScheduledListMobile`, `MeetingDetailMobile`, `SettingsDialogPC`, `AudioDeviceMenu`, `VideoDeviceMenu`, `LanguageButton`, `ThemeButton`, and `useDeviceFault`.
- Added theming (`ThemeName`), i18n (`i18n` / `t` / `useI18n`), UI configuration (`RoomKitProvider` / `setUIConfig` / `useUIConfig`) with icon overrides, and a complete set of `TUI*` base components.

### Changed

- Major version bump: v7.0.0 replaces the deprecated v6.x line (`@tencentcloud/roomkit-web-vue3` ≤ 6.2.x). The public API is not backward compatible with v6.x.
