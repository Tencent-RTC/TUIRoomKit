# CHANGELOG

**English** | [简体中文](./CHANGELOG.zh-CN.md)

---

## [6.1.2] - 2026-07-17

### Fixed

- Fixed missing styles in the published build where components such as `ConferenceMainView` and `PreConferenceView` rendered unstyled (CSS was not injected into the main entry during build).

## [6.1.1] - 2026-07-16

### Added

- Exported the `genTestUserSig` helper to align packages and simplify integration and debugging.

### Changed

- `ConferenceMainView` and `PreConferenceView` now fill their parent container (100% width/height) by default instead of the full viewport.

## [6.1.0] - 2026-07-13

### Added

- Added cloud recording support.

### Fixed

- Fixed an issue where the AI noise suppression plugin could not be enabled before the microphone was turned on.
- Fixed RTC disconnection after the app remains idle for an extended period.

## [6.0.2] - 2026-06-12

* Room: Added `renderParticipantView` prop to `ConferenceMainView`. Fixed an issue where custom overlays configured via `renderParticipantView` failed to reflect participant device status changes immediately.

### 

## [6.0.1] - 2026-06-05

### Added

- Initial release of the `@tencentcloud/roomkit-web-react` npm package, with a public API aligned with `@tencentcloud/roomkit-web-vue3`. Bundled in both ESM and CJS formats with full TypeScript declarations.
- Added two core conference views: pre-join preview (`PreConferenceView`) and in-meeting main view (`ConferenceMainView`).
- Supported full in-meeting capabilities: video layout switching, camera/microphone controls, screen sharing, in-room chat, member management, room invitation, and meeting scheduling.
- Exported `atomicx` state layer `Client` for pure JavaScript / non-React integrations.
