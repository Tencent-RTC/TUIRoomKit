# CHANGELOG

**English** | [简体中文](./CHANGELOG.zh-CN.md)

---

## [7.1.3] - 2026-11-18

### Added

- `RoomKitJoinOptions` adds `mediaPreference` (`preferMicrophoneOn` / `preferCameraOn`) to turn devices on after entering. A device is skipped while the room disables it for everyone, unless the user is the host or an admin, so large rooms that mute everyone no longer take upstream audio slots on entry.
- The room chat shows a new-message count when you scroll up, and the education scene enables it.
- Education chat shows lines when the teacher removes a student or grants or revokes whiteboard access.

### Changed

- In education rooms, the class timer counts from the booked start time. A class entered early shows no timer until the booked time arrives.
- Education teachers no longer get a toast after turning off a student's microphone or camera, or after removing a student. Teachers no longer get a toast when a student joins.
- Trophy celebration messages are sent to online members only, so a rejoin or page refresh never replays them.
- The education mobile chat placeholder follows the class mode and says when the teacher has muted class chat.
- 1v1 classes no longer show mute-all or chat silence.

### Fixed

- Fixed students being unable to erase their earlier strokes after whiteboard access is granted again.
- Fixed screen sharing failing to start on Safari while the whiteboard is open.
- Fixed the whiteboard toolbar not following the RoomKit language.
- Fixed the education leave message sometimes not reaching the chat.
- Fixed the H5 education keyboard covering the chat composer, portrait being read as landscape while typing on iOS, and doubled side insets in landscape on Chrome for iOS.
- Fixed the whiteboard access icon and the English roster column widths in education rooms.

## [7.1.2] - 2026-11-13

### Added

- Education small class (1v6) on PC and mobile, including mute-all, chat silence, and enter/leave class messages.
- `setUIConfig` adds `widgetVisible` to hide built-in toolbar controls in both the conference and education scenes.

### Changed

- The default publish bitrate for screen sharing and the whiteboard is 5000 kbps. Schedule durations are now 15/30/45 minutes and 1/2/3 hours.
- The in-room participant count uses the server `participantCount`. The default meeting or class name keeps only the first 10 characters of the user name.
- Education video tiles no longer draw an authorization border. Leaving a class no longer resets the virtual background.

### Fixed

- Fixed the education loading blank screen, the share tab showing in student settings, the member-list layout changing when screen sharing starts, and enter/leave class messages not being sent.
- Logging in past the package DAU limit (72000) now prompts an upgrade. Failed room operations toast by error code.
- Fixed the education mobile layout, whiteboard undo/redo, button icon alignment, and the Tab focus ring.

## [7.1.1] - 2026-11-05

### Changes

- Added entry points for Teacher/Student roles
- Added support for both landscape and portrait orientations on mobile devices for educational scenarios

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
