# CHANGELOG

**English** | [简体中文](./CHANGELOG.zh-CN.md)

---

## [6.0.2] - 2026-06-12

* Room: Added `renderParticipantView` prop to `ConferenceMainView`. Fixed an issue where custom overlays configured via `renderParticipantView` failed to reflect participant device status changes immediately.

### 

## [6.0.1] - 2026-06-05

### Added

- Initial release of the `@tencentcloud/roomkit-web-react` npm package, with a public API aligned with `@tencentcloud/roomkit-web-vue3`. Bundled in both ESM and CJS formats with full TypeScript declarations.
- Added two core conference views: pre-join preview (`PreConferenceView`) and in-meeting main view (`ConferenceMainView`).
- Supported full in-meeting capabilities: video layout switching, camera/microphone controls, screen sharing, in-room chat, member management, room invitation, and meeting scheduling.
- Exported `atomicx` state layer `Client` for pure JavaScript / non-React integrations.
