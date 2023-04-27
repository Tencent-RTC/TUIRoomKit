/**
 * Copyright (c) 2021 Tencent. All rights reserved.
 * Module:   TUIRoomDefine @ TUIKitEngine
 * Function: TUIRoomEngine 关键类型定义
 */
#ifndef TUIROOMDEFINE_H_
#define TUIROOMDEFINE_H_

#include "TUICommonDefine.h"

#ifdef _WIN32
#if defined(TUIKIT_EXPORTS)
#define TUIKIT_API __declspec(dllexport)
#else
#define TUIKIT_API __declspec(dllimport)
#endif
#else
#define TUIKIT_API __attribute__((visibility("default")))
#endif

namespace tuikit {

/////////////////////////////////////////////////////////////////////////////////
//
//                    房间、角色相关枚举值定义
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * 1.1 房间类型
 */
enum class TUIRoomType {

    ///会议类型房间，适用于会议，教育场景，该房间中可以开启自由发言，申请发言、麦控等不同模式，麦位没有编号。
    kConference = 1,

    /// Open类型房间，适用于直播场景，该房间可以开启自由发言，麦位控制模式，该房间中麦位是有编号的。
    kLivingRoom = 2,

};

/**
 * 1.2 房间模式
 */
enum class TUISpeechMode {

    ///自由发言模式
    kFreeToSpeak = 1,

    ///申请发言模式。（仅在会议类型房间下生效）
    kApplyToSpeak = 2,

    ///麦控模式。
    kApplySpeakAfterTakingSeat = 3,

};

/**
 * 1.3 房间内媒体设备类型
 */
enum class TUIMediaDevice {

    ///麦克风
    kMicrophone = 1,

    ///摄像头
    kCamera = 2,

    ///屏幕共享
    kApplyScreenSharing = 3,

};

/**
 * 1.4 房间内角色类型
 */
enum class TUIRole {

    ///房主，一般指房间的创建者，房间内最高权限拥有者。
    kRoomOwner = 0,

    ///房间管理员
    kAdministrator = 1,

    ///房间内普通成员
    kGeneralUser = 2,

};

/////////////////////////////////////////////////////////////////////////////////
//
//                    音视频相关枚举值定义
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * 2.1 视频质量
 */
enum class TUIVideoQuality {

    ///低清360P
    kVideoQuality_360P = 1,

    ///标清540P
    kVideoQuality_540P = 2,

    ///高清720P
    kVideoQuality_720P = 3,

    ///超清1080P
    kVideoQuality_1080P = 4,

};

/**
 * 2.2 音频质量
 */
enum class TUIAudioQuality {

    ///人声模式
    kAudioProfileSpeech = 0,

    ///默认模式
    kAudioProfileDefault = 1,

    ///音乐模式
    kAudioProfileMusic = 2,

};

/**
 * 2.3 视频流类型
 */
enum class TUIVideoStreamType {

    ///高清摄像头视频流
    kCameraStream = 0,

    ///屏幕分享视频流
    kScreenStream = 1,

    ///低清摄像头视频流
    kCameraStreamLow = 2,

};

/**
 * 2.4 音视频状态更改原因（分类: 自己主动修改 或者 被房主、管理员修改）
 */
enum class TUIChangeReason {

    ///自己操作
    kChangedBySelf = 0,

    ///房主或管理员操作
    kChangedByAdmin = 1,

};

/**
 * 2.5 屏幕分享捕获源类型
 */
enum class TUICaptureSourceType {

    ///未定义
    kUnknown = -1,

    ///窗口
    kWindow = 0,

    ///屏幕
    kScreen = 1,

};

/////////////////////////////////////////////////////////////////////////////////
//
//                    信令请求相关枚举值定义
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * 4.1 请求类型
 */
enum class TUIRequestAction {

    ///无效请求
    kInvalidAction = 0,

    ///请求远端用户打开摄像头
    kRequestToOpenRemoteCamera = 1,

    ///请求远端用户打开麦克风
    kRequestToOpenRemoteMicrophone = 2,

    ///请求连接到其他房间
    kRequestToConnectOtherRoom = 3,

    ///请求上麦
    kRequestToTakeSeat = 4,

    ///请求远端用户上麦
    kRequestRemoteUserOnSeat = 5,

    ///向管理员请求打开本地摄像头
    kApplyToAdminToOpenLocalCamera = 6,

    ///向管理员请求打开本地麦克风
    kApplyToAdminToOpenLocalMicrophone = 7,

};

/**
 * TUIList定义
 */
template <class T>
class TUIKIT_API TUIList {
   public:
    virtual ~TUIList() {
    }
    virtual uint32_t getSize() const = 0;
    virtual const T* getElement(const uint32_t index) const = 0;
};

/**
 * TUIMap定义
 */
template <class T, class U>
class TUIKIT_API TUIMap {
   public:
    virtual ~TUIMap() {
    }
    virtual uint32_t getSize() const = 0;
    virtual const U* getValue(const T& key) = 0;
    virtual const TUIList<T>* allKeys() = 0;
};

/////////////////////////////////////////////////////////////////////////////////
//
//                      TUIRoomEngine 核心类型定义
//
/////////////////////////////////////////////////////////////////////////////////
///

/**
 * 5.1 房间信息
 *
 * TUIRoomEngine 只支持字符串房间ID
 */
struct TUIRoomInfo {
    ///房间ID(创建房间必填参数)
    const char* roomId;

    ///主持人ID: 默认为房间创建者（只读）
    const char* ownerId;

    ///房间类型（创建房间可选参数，默认Group类型），请参考：{@link TUIRoomType}。
    TUIRoomType roomType;

    ///房间名称（创建房间可选参数，默认房间ID）
    const char* name;

    ///房间发言模式
    TUISpeechMode speechMode;

    ///是否禁止打开摄像头（创建房间可选参数），默认值：{@link false}。
    bool isCameraDisableForAllUser;

    ///是否禁止打开麦克风（创建房间可选参数），默认值：{@link false}。
    bool isMicrophoneDisableForAllUser;

    ///是否禁止发送消息（创建房间可选参数），默认值：{@link false}。
    bool isMessageDisableForAllUser;

    ///最大麦位数
    int maxSeatCount;

    ///是否开启CDN直播（创建房间可选参数，直播房间使用），默认值：{@link false}。
    bool enableCDNStreaming;

    ///直播推流域名（创建房间可选参数，直播房间使用），默认值：空。
    const char* cdnStreamDomain;

    ///房间创建时间（只读）
    uint64_t createTime;

    ///房间内成员数量（只读）
    int memberCount;

    TUIRoomInfo()
        : roomId(nullptr),
          roomType(TUIRoomType::kConference),
          name(nullptr),
          speechMode(TUISpeechMode::kFreeToSpeak),
          isCameraDisableForAllUser(false),
          isMicrophoneDisableForAllUser(false),
          isMessageDisableForAllUser(false),
          maxSeatCount(0),
          enableCDNStreaming(false),
          cdnStreamDomain(nullptr),
          ownerId(nullptr),
          createTime(0),
          memberCount(0) {
    }
};

/**
 * 5.2 房间内用户信息
 */
struct TUILoginUserInfo {
    ///用户ID
    const char* userId;

    ///用户名称
    const char* userName;

    ///用户头像URL
    const char* avatarUrl;

    TUILoginUserInfo() : userId(nullptr), userName(nullptr), avatarUrl(nullptr) {
    }
};

/**
 * 5.3 房间内用户信息
 */
struct TUIUserInfo {
    ///用户ID
    const char* userId;

    ///用户名称
    const char* userName;

    ///用户头像URL
    const char* avatarUrl;

    ///用户角色类型, 请参考：{@link TUIRole}。
    TUIRole userRole;

    ///是否有音频流，默认值：{@link false}。
    bool hasAudioStream;

    ///是否有视频流，默认值：{@link false}。
    bool hasVideoStream;

    ///是否有屏幕分享流，默认值：{@link false}。
    bool hasScreenStream;

    TUIUserInfo() : userRole(TUIRole::kGeneralUser), hasAudioStream(false), hasVideoStream(false), hasScreenStream(false) {
    }
};

/**
 * 5.4 房间内座位信息
 */
struct TUISeatInfo {
    ///麦位序号
    int index;

    ///用户ID
    const char* userId;

    ///麦位是否被锁定，默认值：{@link false}。
    bool isLocked;

    ///麦位是否被禁止打开视频，默认值：{@link false}。
    bool isVideoLocked;

    ///麦位是否被禁止打开音频，默认值：{@link false}。
    bool isAudioLocked;

    TUISeatInfo() : index(-1), userId(nullptr), isLocked(false), isVideoLocked(false), isAudioLocked(false) {
    }
};

/**
 * 5.5 锁定麦位操作参数
 */
struct TUISeatLockParams {
    ///锁定麦位，默认值：{@link false}。
    bool lockSeat;

    ///锁定麦位视频，默认值：{@link false}。
    bool lockVideo;

    ///锁定麦位音频，默认值：{@link false}。
    bool lockAudio;

    TUISeatLockParams() : lockSeat(false), lockVideo(false), lockAudio(false) {
    }
};

/**
 * 5.5 房间内用户音量
 */
struct TUIUserVoiceVolume {
    ///用户ID
    const char* userId;

    ///音量 用于承载所有正在说话的用户的音量大小，取值范围 0 - 100
    int volume;

    TUIUserVoiceVolume() : userId(nullptr), volume(0) {
    }
};

/**
 * 5.6 信令请求
 */
struct TUIRequest {
    ///请求ID
    const char* requestId;

    ///请求类型
    TUIRequestAction requestAction;

    ///用户ID
    const char* userId;

    ///信令内容
    const char* content;

    ///时间戳
    uint32_t timestamp;

    TUIRequest() : requestId(nullptr), requestAction(TUIRequestAction::kInvalidAction), userId(nullptr), content(nullptr), timestamp(0) {
    }
};

/////////////////////////////////////////////////////////////////////////////////
//
//                      TUIRoomEngine 基本类型定义
//
/////////////////////////////////////////////////////////////////////////////////
///

/**
 * TUIUserListResult定义
 */
struct TUIUserListResult {
    ///获取下一批成员列表的序号
    uint64_t nextSequence;

    ///成员信息列表
    TUIList<TUIUserInfo>* userInfoList;

    TUIUserListResult() : nextSequence(0), userInfoList(nullptr) {
    }
};

/**
 * TUICallbackBase定义
 * 回调类的基类
 */
class TUIKIT_API TUICallbackBase {
   public:
    TUICallbackBase();
    virtual ~TUICallbackBase();
};

/**
 * TUICallback定义
 * 通用接口的回调类
 */
class TUICallback : public TUICallbackBase {
   public:
    ~TUICallback() override {
    }

    /**
     * 接口调用成功
     */
    virtual void onSuccess() = 0;

    /**
     * 接口调用失败
     *
     * @param code 错误码
     * @param message 错误信息
     */
    virtual void onError(const TUIError code, const char* message) = 0;
};

/**
 * TUIValueCallback定义
 * 带有返回参数的接口的回调类
 */
template <class T>
class TUIValueCallback : public TUICallbackBase {
   public:
    ~TUIValueCallback() override {
    }

    /**
     * 接口调用成功
     *
     * @param value 接口回调的值
     */
    virtual void onSuccess(T* value) = 0;

    /**
     * 接口调用失败
     *
     * @param code 错误码
     * @param message 错误信息
     */
    virtual void onError(const TUIError code, const char* message) = 0;
};

/**
 * TUIListCallback定义
 * 返回参数为list的接口的回调类
 */
template <class T>
class TUIListCallback : public TUICallbackBase {
   public:
    ~TUIListCallback() override {
    }

    /**
     * 接口调用成功
     *
     * @param list 接口回调的数据列表
     */
    virtual void onSuccess(TUIList<T>* list) = 0;

    /**
     * 接口调用失败
     *
     * @param code 错误码
     * @param message 错误信息
     */
    virtual void onError(const TUIError code, const char* message) = 0;
};

/**
 * TUIPlayCallback定义
 * 播放远端视频的回调类
 */
class TUIPlayCallback : public TUICallbackBase {
   public:
    ~TUIPlayCallback() override {
    }

    /**
     * 视频播放成功
     *
     * @param userId 用户ID
     */
    virtual void onPlaying(const char* userId) = 0;

    /**
     * 视频正在加载。
     *
     * @param userId 用户ID
     */
    virtual void onLoading(const char* userId) = 0;

    /**
     * 接口调用失败
     *
     * @param userId 用户ID
     * @param code 错误码
     * @param message 错误信息
     */
    virtual void onError(const char* userId, const TUIError code, const char* message) = 0;
};

/**
 * TUIRequestCallback定义
 * 发送请求的回调类
 */
class TUIRequestCallback : public TUICallbackBase {
   public:
    ~TUIRequestCallback() override {
    }

    /**
     * 请求被接受
     *
     * @param requestId  请求ID
     * @param userId  用户ID
     */
    virtual void onAccepted(const char* requestId, const char* userId) = 0;

    /**
     * 请求被拒绝
     *
     * @param requestId  请求ID
     * @param userId  用户ID
     * @param message  错误信息
     */
    virtual void onRejected(const char* requestId, const char* userId, const char* message) = 0;

    /**
     * 请求被取消
     *
     * @param requestId  请求ID
     * @param userId  用户ID
     */
    virtual void onCancelled(const char* requestId, const char* userId) = 0;

    /**
     * 请求超时
     *
     * @param requestId  请求ID
     * @param userId  用户ID
     */
    virtual void onTimeout(const char* requestId, const char* userId) = 0;

    /**
     * 请求错误。
     *
     * @param requestId  请求ID
     * @param userId  用户ID
     * @param code 错误码
     * @param message  错误信息
     */
    virtual void onError(const char* requestId, const char* userId, const TUIError code, const char* message) = 0;
};

///屏幕分享源句柄
typedef void* TUISourceId;

/**
 * 屏幕分享采集源信息
 */
struct TUIShareTarget {
    ///采集源的ID，对于窗口，该字段代表窗口的 ID；对于屏幕，该字段代表显示器的 ID
    TUISourceId id;

    ///采集源类型
    TUICaptureSourceType sourceType;

    ///采集源名称
    const char* sourceName;

    ///缩略图
    TUIImageBuffer thumbnailImage;

    ///图标
    TUIImageBuffer iconImage;

    ///是否最小化
    bool isMinimized;

    TUIShareTarget() : id(nullptr), sourceType(TUICaptureSourceType::kUnknown), sourceName(nullptr), isMinimized(false) {
    }
};

}  // namespace tuikit

#endif  // TUIROOMDEFINE_H_
