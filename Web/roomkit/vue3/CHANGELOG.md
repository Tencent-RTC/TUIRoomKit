# CHANGELOG

**English** | [简体中文](./CHANGELOG.zh-CN.md)

---

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
