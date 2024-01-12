<!--
 * @Author: adamsfliu
 * @Date: 2024-01-08 19:43:43
 * @LastEditors: adamsfliu
 * @LastEditTime: 2024-01-08 19:43:43
 * @Description: 
-->
English | [简体中文](api_change_log.zh.md)
## Interface Changes
Change Version: v2.0

Change Date: 2024-01-08

### Added classes and attributes
| Type | Name | Description | Version |
|-------|-------|-------|-------|
| Class | tui_room_device_manager | Device testing and management related class | v2.0 |
| Enum | TUISeatMode | freeToTake: Free-to-take seat mode, audience can freely take the seat without applying; applyToTake: Apply-to-take seat mode, audience needs the consent of the room owner or administrator to take the seat; Note: Only effective when the seat mode (isSeatEnabled = true) is enabled. | v2.0 |
| Enum | TUIExtensionType | getExtension interface parameter, currently only supports deviceManager type | v2.0 |
| Error Code | errRequestIdRepeat = -2312 | Repeat request error code | v2.0 |
| Error Code | errRequestIdConflict = -2313 | Request conflict error code | v2.0 |
| Error Code | errSeatNotSupportLinkMic = -2347 | Current mode does not support link mic error code | v2.0 |
| Property | TUIRoomInfo.isSeatEnabled | Whether to support seat mode | v2.0 |
| Property | TUIRoomInfo.seatMode | seat mode | v2.0 |

### Deprecated & new interfaces
| Deprecated Interface | New Interface | Description | Version |
|-------|-------|-------|-------|
|updateRoomSpeechModeByAdmin(TUISpeechMode mode) |updateRoomSeatModeByAdmin(TUISeatMode seatMode)  |updateRoomSeatModeByAdmin(TUIRoomDefine.SeatMode seatMode, TUIRoomDefine.ActionCallback callback) | Optimized room seat mode to reduce customer access comprehension cost | v2.0 |
| onRoomSpeechModeChanged = (String roomId, TUISpeechMode speechMode) {} | onRoomSeatModeChanged = (String roomId, TUISeatMode seatMode) {} | Optimized room seat mode callback to reduce customer access comprehension cost | v2.0 |
|-|getExtension(TUIExtensionType extensionType)|Newly added getExtension interface, v2.0 version currently only supports getting deviceManager extension|v2.0|
|-| sharedInstance()|Create a TUIRoomEngine instance (singleton pattern)|v2.0| 
|-| destroySharedInstance()|Destroy the TUIRoomEngine instance (singleton pattern)|v2.0|

### Removed interfaces
| Removed Interface | Suggested Usage | Description | Version |
|-------|-------|-------|-------|
| createInstance() | sharedInstance() | It is recommended to use the sharedInstance interface to create a singleton object | v2.0 |
| destroyInstance() | destroySharedInstance() | It is recommended to use the sharedInstance interface to destroy a singleton object | v2.0 |