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
| Class | TUIRoomDeviceManager | Device testing and management related class | v2.0 |
| Enum | SeatMode | FREE_TO_TAKE: Free-to-take seat mode, audience can freely take the seat without applying; APPLY_TO_TAKE: Apply-to-take seat mode, audience needs the consent of the room owner or administrator to take the seat; Note: Only effective when the seat mode (isSeatEnabled = true) is enabled. | v2.0 |
| Enum | ExtensionType | getExtension interface parameter, currently only supports DEVICE_MANAGER type | v2.0 |
| Error Code | REQUEST_ID_REPEAT = -2312 | Repeat request error code | v2.0 |
| Error Code | REQUEST_ID_CONFLICT = -2313 | Request conflict error code | v2.0 |
| Error Code | SEAT_NOT_SUPPORT_LINK_MIC = -2347 | Current mode does not support link mic error code | v2.0 |
| Property | TUIRoomInfo.isSeatEnabled | Whether to support seat mode | v2.0 |
| Property | TUIRoomInfo.seatMode | seat mode | v2.0 |

### Deprecated & new interfaces
| Deprecated Interface | New Interface | Description | Version |
|-------|-------|-------|-------|
|updateRoomSpeechModeByAdmin(TUIRoomDefine.SpeechMode mode, TUIRoomDefine.ActionCallback callback) |updateRoomSeatModeByAdmin(TUIRoomDefine.SeatMode seatMode, TUIRoomDefine.ActionCallback callback) | Optimized room seat mode to reduce customer access comprehension cost | v2.0 |
| onRoomSpeechModeChanged(String roomId, TUIRoomDefine.SpeechMode speechMode) | onRoomSeatModeChanged(String roomId, TUIRoomDefine.SeatMode seatMode) | Optimized room seat mode callback to reduce customer access comprehension cost | v2.0 |
| int switchCamera(boolean frontCamera) | - | It is recommended to use the switchCamera interface in TUIRoomDeviceManager instead | v2.0 |
|-|Object getExtension(TUICommonDefine.ExtensionType extensionType)|Newly added getExtension interface, v2.0 version currently only supports getting DeviceManager extension|v2.0|
|-| sharedInstance()|Create a TUIRoomEngine instance (singleton pattern)|v2.0| 
|-| destroySharedInstance()|Destroy the TUIRoomEngine instance (singleton pattern)|v2.0|

### Removed interfaces
| Removed Interface | Suggested Usage | Description | Version |
|-------|-------|-------|-------|
| createInstance() | sharedInstance() | It is recommended to use the sharedInstance interface to create a singleton object | v2.0 |
| destroyInstance() | destroySharedInstance() | It is recommended to use the sharedInstance interface to destroy a singleton object | v2.0 |