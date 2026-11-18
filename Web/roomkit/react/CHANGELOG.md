# CHANGELOG

**English** | [简体中文](./CHANGELOG.zh-CN.md)

---

## [7.1.0] - 2026-11-17

### Added

- Added the education scene: pass `scene: RoomScene.Education` to `createAndJoin` / `join`. It supports 1v1 and small class (1v6) on PC and mobile, teacher/student role entries, joining or resuming a class from the pre-class page, and landscape/portrait on mobile.
- Education supports the whiteboard with annotation and drawing authorization, mute-all, chat silence, enter/leave class messages, and new message reminders.
- Added `widgetVisible` to `setUIConfig` for hiding built-in toolbar controls; see `RoomWidget` for supported controls. Applies to both the conference and education scenes.
- Added `mediaPreference` (`preferMicrophoneOn` / `preferCameraOn`) to `createAndJoin` / `join`. When everyone is muted, the microphone is not captured on entry, so it does not take an upstream audio/video slot.
- Added exports: `RoomScene`, `RoomWidget`, `WidgetVisible`, `MediaPreference`, `UserPickerPC`, `TUICheckbox`, `TUIDatePicker`, `TUISegmented`, and `EDUCATION_VIRTUAL_BACKGROUND_IMG_LIST`.

### Changed

- Upgraded `tuikit-atomicx-react` to 6.4.6.
- The default publish bitrate for screen sharing and the whiteboard is 5000 kbps. Schedule durations are now 15/30/45 minutes and 1/2/3 hours.
- The in-room participant count uses the server `participantCount`. The default meeting or class name keeps only the first 10 characters of the user name.
- Removed the microphone test and speaker test from the audio device menu.
- A general participant's whiteboard is closed automatically when the host disables screen sharing for everyone.
- Leaving a class no longer resets the virtual background.

### Fixed

- Fixed the education loading blank screen, the share tab showing in student settings, and the member-list layout changing when screen sharing starts.
- Fixed students being unable to erase strokes drawn under the first authorization after being authorized again, and screen sharing failing to start in Safari while the whiteboard is open.
- Logging in past the package DAU limit (72000) now prompts an upgrade.
- Fixed the device error dialog position, caption list scrolling, button icon alignment, and the Tab focus ring.

## [7.0.0] - 2026-10-23

### Added

- Initial release of the `@tencentcloud/roomkit-web-react` npm package, a fully rebuilt React conference UI kit based on the `atomicx` state layer. Bundled in both ESM and CJS formats with full TypeScript declarations.
- Added a new class-based imperative core API: `RoomKit`, with `RoomLayoutTemplate`, `ExitReason`, and strongly typed `RoomKitJoinOptions` / `RoomKitEventMap`.
- Added the `ConferenceView` scene view, covering both PC and mobile (H5) experiences out of the box.
- Supported full in-meeting capabilities: video layout switching, camera/microphone device management, screen sharing, in-room chat, member management, meeting scheduling, cloud recording, real-time captions (transcription), mini-window mode, and video effects.
- Added pre-conference assembly features: `SchedulePanel`, `ScheduledListPC` / `ScheduledListMobile`, `MeetingDetailMobile`, `SettingsDialogPC`, `AudioDeviceMenu`, `VideoDeviceMenu`, `LanguageButton`, `ThemeButton`, and `useDeviceFault`.
- Added theming (`ThemeName`), i18n (`i18n` / `t` / `useI18n`), UI configuration (`RoomKitProvider` / `setUIConfig` / `useUIConfig`) with icon overrides, and a complete set of `TUI*` base components.
