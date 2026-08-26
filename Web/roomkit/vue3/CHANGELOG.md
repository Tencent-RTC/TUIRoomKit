# CHANGELOG

**English** | [简体中文](./CHANGELOG.zh-CN.md)

---

## [6.1.8] - 2026-08-26

### Fixed

- Fixed an issue where the PC whiteboard annotation toolbar button could not be clicked.

## [6.1.7] - 2026-08-18

### Changed

- Optimized subtitle interaction: changed the transparent text effect to a blinking-cursor typewriter effect.

## [6.1.6] - 2026-08-17

### Changed

- Optimize real-time subtitle interaction.

## [6.1.5] - 2026-08-09

### Added

- Migrated the seminar barrage (on-screen comments) feature to be maintained within RoomKit.
- Added clear error prompts for device permission capture failures, covering both PC and mobile scenarios.

### Fixed

- Fixed an issue where opening the member list while screen sharing with the top-bar layout incorrectly switched to the sidebar layout.
- Unified error handling for failed video preview rendering.
- Fixed abnormal whiteboard display caused by local preview going through `videoMixer`, and adjusted barrage styles accordingly.
- Removed obsolete virtual background code and fixed background saving compatibility when the camera is not enabled.

### Changed

Lowered the frequency and log level of `KeyMetricsStats` reporting.

## [6.1.4] - 2026-08-03

### Added

- Added interactive whiteboard support.

### Fixed

- Fixed whiteboard rendering clarity.

## [6.1.3] - 2026-07-20

- Added data reporting for start-recording and whiteboard activation API calls.

## [6.1.2] - 2026-07-17

### Fixed

- Fixed missing styles in the published build where components such as `ConferenceMainView` and `PreConferenceView` rendered unstyled (CSS was not injected into the main entry during build).

## [6.1.1] - 2026-07-16

### Added

- `setWidgetVisible` now supports toggling the whiteboard (`WhiteboardWidget`) and annotation (`AnnotationWidget`) entry buttons.
- Exported the `genTestUserSig` helper to align packages and simplify integration and debugging.

### Changed

- `ConferenceMainView` and `PreConferenceView` now fill their parent container (100% width/height) by default instead of the full viewport.

## [6.1.0] - 2026-07-13

### Added

- Added whiteboard and screen sharing annotation support.
- Added cloud recording support.

### Fixed

- Fixed an issue where the AI noise suppression plugin could not be enabled before the microphone was turned on.
- Fixed RTC disconnection after the app remains idle for an extended period.
