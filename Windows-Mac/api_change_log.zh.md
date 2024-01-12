简体中文 | [English](api_change_log.md)
## 接口变更
变更版本：v2.0
变更日期：2024-01-08

### 新增类及属性
|  类型 | 名称 | 说明 | 版本 |
|-------|-------|-------|-------|
| 类 | ITUIRoomDeviceManager | 设备测试、管理相关类 |v2.0 |
| 枚举 | TUISeatMode | kFreeToTake: 自由上麦模式，台下观众可以自由上麦，无需申请；kApplyToTake: 申请上麦模式，台下观众上麦需要房主或者管理员同意后才能上麦; 注: 仅在麦位模式（isSeatEnabled = true）时生效| v2.0 |
| 枚举 | TUIExtensionType | getExtension接口入参，目前只支持kDeviceManager类型 | v2.0|
| 错误码 | ERR_REQUEST_ID_REPEAT = -2312 | 重复请求错误码 | v2.0 |
| 错误码 | ERR_REQUEST_ID_CONFLICT = -2313 | 请求冲突错误码 | v2.0 |
| 错误码 | ERR_SEAT_NOT_SUPPORT_LINK_MIC = -2347 | 当前模式不支持连麦错误码 | v2.0 |
| 属性 | TUIRoomInfo.isSeatEnabled | 是否支持麦位模式 | v2.0 |
| 属性 | TUIRoomInfo.seatMode | 麦位模式 | v2.0 |

### 废弃&新增接口
| 废弃接口 | 新增接口 | 说明 | 版本 |
|-------|-------|-------|-------|
| updateRoomSpeechModeByAdmin(TUISpeechMode mode, TUICallback* callback)| updateRoomSeatModeByAdmin(TUISeatMode seatMode, TUICallback* callback) | 优化了房间上麦模式，降低客户接入理解成本 | v2.0 |
| void onRoomSpeechModeChanged(const char* roomId, TUISpeechMode speechMode) | void onRoomSeatModeChanged(const char* roomId, TUISeatMode seatMode) |优化了房间上麦模式回调，降低客户接入理解成本 | v2.0 |
| liteav::ITXDeviceCollection* getDevicesList(liteav::TXMediaDeviceType type) | - | 建议使用TUIRoomDeviceManager中的getDevicesList接口代替 | v2.0 |
| int setCurrentDevice(liteav::TXMediaDeviceType type, const char* deviceId) | - |建议使用TUIRoomDeviceManager中的setCurrentDevice接口代替 | v2.0 |
|-|void* getExtension(TUIExtensionType extensionType)|新增获取扩展接口，v2.0版本目前仅支持获取DeviceManager扩展|v2.0|
|-|tuikit::TUIRoomEngine* sharedInstance()|创建 TUIRoomEngine 实例（单例模式）|v2.0|
|-|destroySharedInstance()|销毁 TUIRoomEngine 实例（单例模式）|v2.0|

### 移除接口
| 移除接口 | 建议使用 | 说明 | 版本 |
|-------|-------|-------|-------|
| tuikit::TUIRoomEngine* createTUIRoomEngine() | tuikit::TUIRoomEngine* sharedInstance() | 建议使用sharedInstance接口创建单例对象 | v2.0 |
| destroyTUIRoomEngine(tuikit::TUIRoomEngine* roomEngine) | destroySharedInstance() |建议使用destroySharedInstance接口销毁单例对象 | v2.0 |