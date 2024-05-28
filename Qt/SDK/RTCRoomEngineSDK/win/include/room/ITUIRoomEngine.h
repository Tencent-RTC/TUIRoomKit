/**
 * Copyright (c) 2024 Tencent. All rights reserved.
 * Module:   TUIRoomEngine @ TUIKitEngine
 * Function: TUIRoomEngine 主功能接口
 * Version: <:Version:>
 */
#ifndef TUIROOMENGINE_H_
#define TUIROOMENGINE_H_

#include "ITUIRoomDefine.h"
#include "ITUIRoomObserver.h"
#include "ITUIRoomDeviceManager.h"
#include "IDeprecatedRoomEngineAPI.h"

namespace liteav {
class ITRTCCloud;
class ITXDeviceManager;
class ITXAudioEffectManager;
}  // namespace liteav

namespace tuikit {
class TUIRoomEngine;
}  // namespace tuikit

extern "C" {

/**
 * 创建 TUIRoomEngine 实例（单例模式）
 *
 * @note 如果您使用 sharedInstance 获取 TUIRoomEngine 实例，并请使用 destroySharedInstance 释放单例对象。
 */
TUIKIT_API tuikit::TUIRoomEngine* sharedInstance();

/**
 * 销毁 TUIRoomEngine 实例（单例模式）
 *
 * @note 使用 destroySharedInstance 释放单例对象。
 */
TUIKIT_API void destroySharedInstance();
}

namespace tuikit {
class TUIDeviceManager;
class TUIAudioEffectManager;
class TUIVideoEffectManager;

class TUIRoomEngine : IDeprecatedRoomEngineAPI {
   public:
    virtual ~TUIRoomEngine() {
    }

    /**
     * 1.1 登录接口，您需要先初始化用户信息后才能进入房间，并进行一系列的操作
     *
     * 若用户在线时被踢下线，SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onKickedOffLine} 回调通知您。
     * @param sdkAppId 它是腾讯云用于区分客户的唯一标识，进入腾讯云实时音视频 [控制台](https://console.cloud.tencent.com/rav)创建应用，即可看到SDKAppId。
     * @param userId 用户ID，用于区分不同用户。
     * @param userSig 用户签名，用于腾讯云流量的认证。
     * @param callback 调用接口的回调，用于通知接口调用的成功或者失败。
     */
    TUIKIT_API static void login(int sdkAppId, const char* userId, const char* userSig, TUICallback* callback);

    /**
     * 1.2 退出登录接口，会有主动离开房间操作、销毁资源
     *
     * @param callback 调用接口的回调，用于通知接口调用的成功或者失败。
     */
    TUIKIT_API static void logout(TUICallback* callback);

    /**
     * 1.3 设置本地用户名称和头像
     *
     * @param userName 用户名称。
     * @param avatarURL 用户头像URL地址。
     * @param callback 调用接口的回调，用于通知接口调用的成功或者失败。
     */
    TUIKIT_API static void setSelfInfo(const char* userName, const char* avatarURL, TUICallback* callback);

    /**
     * 1.4 获取本地用户登录的基本信息
     *
     * @return TUILoginUserInfo：用户登录信息。
     */
    TUIKIT_API static TUILoginUserInfo getSelfInfo();

    /**
     * 1.5 设置本地用户信息
     *
     * @param userInfo 本地用户信息。
     * @param callback 调用接口的回调，用于通知接口调用的成功或者失败。
     */
    TUIKIT_API static void setSelfInfo(const TUILoginUserInfo& userInfo, TUICallback* callback);

    /**
     * 1.6 设置事件回调
     *
     * 您可以通过 TUIRoomObserver 获得各类事件通知（例如：错误码，远端用户进房，音视频状态参数等）。
     * @param observer 监听的实例。
     */
    virtual void addObserver(TUIRoomObserver* observer) = 0;

    /**
     * 1.7 移除事件回调
     *
     * @param observer 待移除的监听回调实例。
     */
    virtual void removeObserver(TUIRoomObserver* observer) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                   房间相关主动接口
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 2.1 创建房间
     *
     * @param roomInfo 房间信息，可以初始化房间的一些设置。
     * @param callback 调用接口的回调，用于通知接口调用的成功或者失败。
     */
    virtual void createRoom(const TUIRoomInfo& roomInfo, TUICallback* callback) = 0;

    /**
     * 2.2 解散房间
     *
     * 房间解散后，SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onRoomDismissed} 回调通知房间内用户。
     * @param callback 调用接口的回调，用于通知接口调用的成功或者失败。
     */
    virtual void destroyRoom(TUICallback* callback) = 0;

    /**
     * 2.3 进入房间
     *
     * 进入房间之后，SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onRemoteUserEnterRoom} 回调通知房间内用户。
     * @param roomId 房间ID。
     * @param callback 调用接口的回调，用于通知接口调用的成功或者失败。
     */
    virtual void enterRoom(const char* roomId, TUIValueCallback<TUIRoomInfo>* callback) = 0;

    /**
     * 2.4 进入房间
     *
     * 进入房间之后，SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onRemoteUserEnterRoom} 回调通知房间内用户。
     * @param roomId 房间ID。
     * @param roomType 房间类型。
     * @param callback 调用接口的回调，用于通知接口调用的成功或者失败。
     */
    virtual void enterRoom(const char* roomId, TUIRoomType roomType, TUIValueCallback<TUIRoomInfo>* callback) = 0;

    /**
     * 2.5 离开房间
     *
     * 离开房间之后，SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onRemoteUserLeaveRoom} 回调通知房间内用户。
     * @param syncWaiting 是否同步等待接口返回。
     * @param callback 调用接口的回调，用于通知接口调用的成功或者失败。
     */
    virtual void exitRoom(bool syncWaiting, TUICallback* callback) = 0;

    /**
     * 2.6 连接其他房间
     *
     * @note 用于直播场景下的申请跨房连麦。
     * 接口调用成功后，SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onRequestReceived} 回调通知被连接房间房主。
     * @param roomId 房间ID。
     * @param userId 用户ID。
     * @param timeout 超时时间，单位秒，如果设置为 0，SDK 不会做超时检测，也不会触发超时回调。
     * @param callback 调用接口的回调，用于通知接口调用的成功或者失败。
     * @return TUIRequest 请求体。
     */
    virtual TUIRequest connectOtherRoom(const char* roomId, const char* userId, int timeout, TUIRequestCallback* callback) = 0;

    /**
     * 2.7 断开与其他房间的连接
     *
     * @note 用于直播场景下的断开跨房连麦。
     * @param callback 调用接口的回调，用于通知接口调用的成功或者失败。
     */
    virtual void disconnectOtherRoom(TUICallback* callback) = 0;

    /**
     * 2.8 获取房间信息
     *
     * @param callback 调用接口的回调，用于通知接口调用的成功或者失败。
     */
    virtual void fetchRoomInfo(TUIValueCallback<TUIRoomInfo>* callback) = 0;

    /**
     * 2.9 更新房间名称（只有管理员或房主能够调用）
     *
     * 房间名称更新后，SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onRoomNameChanged} 回调通知房间内用户。
     * @param roomName 房间名称。
     * @param callback 调用接口的回调，用于通知接口调用的成功或者失败。
     */
    virtual void updateRoomNameByAdmin(const char* roomName, TUICallback* callback) = 0;

    /**
     * 2.10 更新房间名称（只有管理员或房主能够调用）
     *
     * 房间上麦模式更新后，SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onRoomSeatModeChanged} 回调通知房间内用户。
     * @param seatMode kFreeToTake:  自由上麦模式, 台下观众可以自由上麦，无需申请;
     *                 kApplyToTake: 申请上麦模式，台下观众上麦需要房主或者管理员同意后才能上麦。
     * @param callback 调用接口的回调，用于通知接口调用的成功或者失败。
     */
    virtual void updateRoomSeatModeByAdmin(TUISeatMode seatMode, TUICallback* callback) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                   本地用户视图渲染、视频管理
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 3.1 设置本地用户视频渲染的视图控件
     *
     * @param view 视频渲染视图。
     */
    virtual void setLocalVideoView(const TUIVideoView& view) = 0;

    /**
     * 3.2 打开本地摄像头
     *
     * 在房间内打开本地摄像头后，默认推送本地视频流，SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onUserVideoStateChanged} 回调通知房间内用户。
     * @param isFront {@link true}: 前置 {@link false}: 后置。 该参数只在移动端生效。
     * @param callback 调用接口的回调，用于通知接口调用的成功或者失败。
     */
    virtual void openLocalCamera(bool isFront, TUIVideoQuality quality, TUICallback* callback) = 0;

    /**
     * 3.3 关闭本地摄像头
     *
     * 在房间内关闭本地摄像头后，SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onUserVideoStateChanged} 回调通知房间内用户。
     */
    virtual void closeLocalCamera() = 0;

    /**
     * 3.4 开始推送本地视频。默认开启
     *
     * 推送本地视频后，若您的本地摄像头已打开，SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onUserVideoStateChanged} 回调通知房间内用户。
     */
    virtual void startPushLocalVideo() = 0;

    /**
     * 3.5 停止推送本地视频
     *
     * 停止推送本地视频后，SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onUserVideoStateChanged} 回调通知房间内用户。
     */
    virtual void stopPushLocalVideo() = 0;

    /**
     * 3.6 更新本地视频编码质量设置
     */
    virtual void updateVideoQuality(TUIVideoQuality quality) = 0;

    /**
     * 3.7 设置视频编码器的编码参数
     *
     * @param streamType 视频流的类型，定义可参见 {@link TUIVideoStreamType} 的定义。
     * @param params 视频编码器的编码参数，定义可参见 {@link TUIRoomVideoEncoderParams} 的定义。
     */
    virtual void updateVideoQualityEx(TUIVideoStreamType streamType, const TUIRoomVideoEncoderParams& params) = 0;

    /**
     * 3.8 设置视频编码器分辨率模式（横屏分辨率 or 竖屏分辨率）
     *
     * @param streamType 视频流的类型，定义可参见 {@link TUIVideoStreamType} 的定义。
     * @param resolutionMode 分辨率模式，定义可参见 {@link TUIResolutionMode} 的定义。
     */
    virtual void setVideoResolutionMode(TUIVideoStreamType streamType, TUIResolutionMode resolutionMode) = 0;

    /**
     * 3.9  开始屏幕分享。
     *
     * 开始屏幕共享之后，SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onUserVideoStateChanged} 回调通知房间内用户。
     * @param sourceId 屏幕分享窗口或屏幕的句柄，可以调用GetScreenSharingTargetList获取，移动端填空即可。
     * @param callback 调用接口的回调，用于通知接口调用的成功或者失败。
     */
    virtual void startScreenSharing(const TUISourceId& sourceId, const TUIVideoView& view, TUICallback* callback) = 0;

    /**
     * 3.10  结束屏幕分享
     *
     * 结束屏幕共享之后，SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onUserVideoStateChanged} 回调通知房间内用户，同时也会通过 {@link onUserScreenCaptureStopped} 回调通知您。
     */
    virtual void stopScreenSharing() = 0;

    /**
     * 3.11  获取分享对象列表
     *
     * 当您在对接桌面端系统的屏幕分享功能时，一般都需要展示一个选择分享目标的界面，这样用户能够使用这个界面选择是分享整个屏幕还是某个窗口通过本接口，您就可以查询到当前系统中可用于分享的窗口的 ID、名称以及缩略图。
     * @param list 调用接口的回调，用于通知接口调用的成功或者失败。
     */
    virtual void getScreenSharingTargetList(TUIListCallback<TUIShareTarget>* list) = 0;

    /**
     * 3.12  选择屏幕分享对象
     *
     * 当您通过 getScreenSharingTargetList 获取到可以分享的屏幕和窗口之后，您可以调用该接口选定期望分享的目标屏幕或目标窗口。
     * @param sourceId 屏幕分享窗口或屏幕的句柄，可以调用 getScreenSharingTargetList 获取。
     */
    virtual void selectScreenSharingTarget(const TUISourceId& sourceId) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                   本地用户音频管理
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 4.1 打开本地麦克风
     *
     * 在房间内打开本地麦克风后，SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onUserAudioStateChanged} 回调通知房间内用户。
     * @param quality 音频质量。
     * @param callback 调用接口的回调，用于通知接口调用的成功或者失败。
     */
    virtual void openLocalMicrophone(TUIAudioQuality quality, TUICallback* callback) = 0;

    /**
     * 4.2 关闭本地麦克风
     *
     * 在房间内关闭本地麦克风后，SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onUserAudioStateChanged} 回调通知房间内用户。
     */
    virtual void closeLocalMicrophone() = 0;

    /**
     * 4.3 更新本地音频编码质量设置
     */
    virtual void updateAudioQuality(TUIAudioQuality quality) = 0;

    /**
     * 4.4 暂停发布本地的音频流
     *
     * 在房间内,若您已打开您的麦克风，调用此接口暂停发布本地的音频流后，SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onUserAudioStateChanged} 回调通知房间内用户。
     */
    virtual void muteLocalAudio() = 0;

    /**
     * 4.5 恢复发布本地的音频流
     *
     * 在房间内,若您已打开您的麦克风，调用此接口恢复发布本地的音频流后，SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onUserAudioStateChanged} 回调通知房间内用户。
     * @param callback 调用接口的回调，用于通知接口调用的成功或者失败。
     */
    virtual void unmuteLocalAudio(TUICallback* callback) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                   远端用户视图渲染、视频管理
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 5.1 设置远端用户视频渲染的视图控件
     *
     * @param userId 远端用户ID。
     * @param streamType 视频流的类型，定义可参见 {@link TUIVideoStreamType} 的定义。
     * @param view 视频渲染视图。
     */
    virtual void setRemoteVideoView(const char* userId, TUIVideoStreamType streamType, const TUIVideoView& view) = 0;

    /**
     * 5.2 开始播放远端用户视频
     *
     * @param userId 用户ID。
     * @param streamType 视频流的类型 详细定义可以参见 {@link TUIVideoStreamType} 的定义。
     * @param callback 调用接口的回调，用于通知播放时的状态回调。
     */
    virtual void startPlayRemoteVideo(const char* userId, TUIVideoStreamType streamType, TUIPlayCallback* callback) = 0;

    /**
     * 5.3 停止播放远端用户视频
     *
     * @param userId 用户ID。
     * @param streamType 视频流的类型 详细定义可以参见 {@link TUIVideoStreamType} 的定义。
     */
    virtual void stopPlayRemoteVideo(const char* userId, TUIVideoStreamType streamType) = 0;

    /**
     * 5.4 将远端用户静音
     *
     * @param userId 用户ID。
     * @param isMute 是否静音。
     */
    virtual void muteRemoteAudioStream(const char* userId, bool isMute) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                   房间内用户信息
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 6.1  获取房间内的成员列表
     *
     * @param nextSequence 分页拉取标志，第一次拉取填0，回调成功 如果callback返回的数据中 nextSequence 不为零，需要分页，传入再次拉取，直至为0。
     * @param callback 调用接口的回调，用于通知接口调用的成功或者失败。成功回调中包含 {@link TUIUserInfo} list。
     */
    virtual void getUserList(uint64_t nextSequence, TUIValueCallback<TUIUserListResult>* callback) = 0;

    /**
     * 6.2  获取成员信息
     *
     * @param userId 用户ID。
     * @param callback 调用接口的回调，用于通知接口调用的成功或者失败。
     */
    virtual void getUserInfo(const char* userId, TUIValueCallback<TUIUserInfo>* callback) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                   房间内用户管理
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 7.1  修改用户角色（只有管理员或房主能够调用）
     *
     * 修改用户角色后，SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onUserRoleChanged} 回调通知房间内用户。
     * @param userId 用户ID。
     * @param role 用户角色 详细定义可以参见 {@link TUIRole} 的定义。
     * @param callback 调用接口的回调，用于通知接口调用的成功或者失败。
     */
    virtual void changeUserRole(const char* userId, TUIRole role, TUICallback* callback) = 0;

    /**
     * 7.2  将远端用户踢出房间（只有管理员或房主能够调用）
     *
     * 将远端用户踢出房间后，SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onKickedOutOfRoom} 回调通知被踢出用户，同时会通过 {@link onRemoteUserLeaveRoom} 通知房间内用户。
     * @param userId 用户ID。
     * @param callback 调用接口的回调，用于通知接口调用的成功或者失败。
     */
    virtual void kickRemoteUserOutOfRoom(const char* userId, TUICallback* callback) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                   房间内用户发言管理
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 8.1 控制当前房间内所有用户是否可打开音频流、视频流采集设备的权限状态，例如：全员禁止打开麦克风、全员禁止打开摄像头（目前仅会议场景下可用，并且只有管理员或房主能够调用）
     *
     * 接口调用成功后：
     * 若device类型为 {@link MICROPHONE} ，SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onAllUserMicrophoneDisableChanged} 通知房间内用户。
     * 若device类型为 {@link CAMERA} ，SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onAllUserCameraDisableChanged} 通知房间内用户。
     * 若device类型为 {@link SCREEN_SHARING} ，SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onScreenShareForAllUserDisableChanged} 通知房间内用户。
     * @param device 设备。 详细定义参见:{@link TUIMediaDevice}。
     * @param isDisable 否禁用。
     * @param callback 操作回调。
     */
    virtual void disableDeviceForAllUserByAdmin(TUIMediaDevice device, bool isDisable, TUICallback* callback) = 0;

    /**
     * 8.2  请求远端用户打开媒体设备（只有管理员或房主能够调用,device类型不支持SCREEN_SHARING）
     *
     * 调用此接口后，SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onRequestReceived} 通知被请求用户。
     * @param userId 用户ID。
     * @param device 媒体设备。详细定义参见:{@link TUIMediaDevice}。
     * @param timeout 超时时间，单位秒，如果设置为 0，SDK 不会做超时检测，也不会触发超时回调。
     * @param callback 调用接口的回调，用于通知请求状态的回调，详细定义参见: {@link TUIRequestCallback}。
     * @return TUIRequest 请求体。
     */
    virtual TUIRequest openRemoteDeviceByAdmin(const char* userId, TUIMediaDevice device, int timeout, TUIRequestCallback* callback) = 0;

    /**
     * 8.3  关闭远端用户媒体设备（只有管理员或房主能够调用）
     *
     * 接口调用成功后：
     * 若device类型为 {@link MICROPHONE} ，SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onUserAudioStateChanged} 通知房间内用户
     * 若device类型为 {@link CAMERA} 或 {@link SCREEN_SHARING}，SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onUserVideoStateChanged} 通知房间内用户
     * @param userId 用户ID。
     * @param device 媒体设备。详细定义参见:{@link TUIMediaDevice}。
     * @param callback 调用接口的回调，用于通知接口调用的成功或者失败。
     */
    virtual void closeRemoteDeviceByAdmin(const char* userId, TUIMediaDevice device, TUICallback* callback) = 0;

    /**
     * 8.4  请求打开本地媒体设备（普通用户可用,device类型不支持SCREEN_SHARING）
     *
     * 接口调用成功后,SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onRequestRequestReceived} 通知被请求用户。
     * @param device 用户ID@param device 媒体设备。详细定义参见:{@link TUIMediaDevice}。
     * @param timeout 超时时间，单位秒，如果设置为 0，SDK 不会做超时检测，也不会触发超时回调。
     * @param callback 调用接口的回调，用于通知请求的回调状态，详细定义参见: {@link TUIRequestCallback}。
     * @return TUIRequest 请求体。
     */
    virtual TUIRequest applyToAdminToOpenLocalDevice(TUIMediaDevice device, int timeout, TUIRequestCallback* callback) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                    房间内麦位管理
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 9.1  设置最大麦位数（仅支持进房前和创建房间时设置）
     *
     * @param maxSeatCount 最大麦位数。
     * @param callback 调用接口的回调，用于通知接口调用的成功或者失败。
     */
    virtual void setMaxSeatCount(uint32_t maxSeatCount, TUICallback* callback) = 0;

    /**
     * 9.2  获取麦位列表
     *
     * @param callback 调用接口的回调，用于通知接口调用的成功或者失败，成功回调中会包含 {@link TUISeatInfo} list信息。
     */
    virtual void getSeatList(TUIListCallback<TUISeatInfo>* callback) = 0;

    /**
     * 9.3  锁定麦位（只有管理员或群主能够调用，包括位置锁定、音频状态锁定和视频状态锁定）
     *
     * @param seatIndex 麦位编号。
     * @param lockParams 锁麦参数。详情参见:{@link TUIRoomDefine.SeatLockParams} 。
     * @param callback 调用接口的回调，用于通知接口调用的成功或者失败。
     */
    virtual void lockSeatByAdmin(int seatIndex, const TUISeatLockParams& lockParams, TUICallback* callback) = 0;

    /**
     * 9.4  上麦（上麦发言模式下，需要申请）
     *
     * 上麦成功后,SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onSeatListChanged} 通知房间内用户。
     * @note 开启上麦发言模式时，需要向主持人或管理员发起申请才允许上麦。
     *       开启自由发言模式，直播场景可以自由上麦，上麦后开麦发言，会议场景无需调用该接口，即可开麦发言。
     * @param seatIndex 麦位编号。
     * @param timeout 超时时间，单位秒，如果设置为 0，SDK 不会做超时检测，也不会触发超时回调。
     * @param callback 调用接口的回调，用于通知请求的回调状态，详细定义参见: {@link TUIRequestCallback}。
     * @return TUIRequest 请求体。
     */
    virtual TUIRequest takeSeat(int seatIndex, int timeout, TUIRequestCallback* callback) = 0;

    /**
     * 9.5  下麦
     *
     * 下麦成功后,SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onSeatListChanged} 通知房间内用户。
     * @param callback 调用接口的回调，用于通知接口调用的成功或者失败。
     */
    virtual void leaveSeat(TUICallback* callback) = 0;

    /**
     * 9.6  主持人/管理员 邀请用户上麦
     *
     * 接口调用成功后,SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onRequestReceived} 通知被邀请用户。
     * @param seatIndex 麦位编号。未开启麦位，不关心麦位序列的情况下，填-1即可。
     * @param userId 用户ID。
     * @param timeout 超时时间，单位秒，如果设置为 0，SDK 不会做超时检测，也不会触发超时回调。
     * @param callback 调用接口的回调，用于通知请求的回调状态，详细定义参见: {@link TUIRequestCallback}。
     * @return TUIRequest 请求体。
     */
    virtual TUIRequest takeUserOnSeatByAdmin(int seatIndex, const char* userId, int timeout, TUIRequestCallback* callback) = 0;

    /**
     * 9.7  主持人/管理员 将用户下麦
     *
     * 接口调用成功后,SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onSeatListChanged} 通知房间内用户。
     * @param seatIndex 麦位编号。
     * @param userId 用户ID。
     * @param callback 调用接口的回调，用于通知接口调用的成功或者失败。
     */
    virtual void kickUserOffSeatByAdmin(int seatIndex, const char* userId, TUICallback* callback) = 0;

    /**
     * 9.8  主持人/管理员 获取房间内申请上麦用户的请求列表
     */
    virtual void getSeatApplicationList(TUIListCallback<TUIRequest>* callback) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                   文本消息
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 10.1  发送本文消息
     *
     * 消息发送后,SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onReceiveTextMessage} 通知房间内用户。
     * @param message 消息内容。
     * @param callback 调用接口的回调，用于通知接口调用的成功或者失败。
     */
    virtual void sendTextMessage(const char* message, TUICallback* callback) = 0;

    /**
     * 10.2  发送自定义消息
     *
     * 消息发送后,SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onReceiveCustomMessage} 通知房间内用户。
     * @param message 消息内容。
     * @param callback 调用接口的回调，用于通知接口调用的成功或者失败。
     */
    virtual void sendCustomMessage(const char* message, TUICallback* callback) = 0;

    /**
     * 10.3  禁用远端用户的发送文本消息能力（只有管理员或房主能够调用）
     *
     * 禁用远端用户的发送文本消息能力后,SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onSendMessageForUserDisableChanged} 通知被禁用用户。
     * @param userId 用户ID。
     * @param isDisable 是否禁用。
     * @param callback 调用接口的回调，用于通知接口调用的成功或者失败。
     */
    virtual void disableSendingMessageByAdmin(const char* userId, bool isDisable, TUICallback* callback) = 0;

    /**
     * 10.4  禁用所有用户的发送文本消息能力（只有管理员或房主能够调用）
     *
     * 禁用所有用户的发送文本消息能力后,SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onSendMessageForAllUserDisableChanged} 通知房间内用户。
     * @param isDisable 是否禁用。
     * @param callback 调用接口的回调，用于通知接口调用的成功或者失败。
     */
    virtual void disableSendingMessageForAllUser(bool isDisable, TUICallback* callback) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                    信令管理
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 7.1  取消请求
     *
     * 取消请求后,SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onRequestCancelled} 通知被请求用户。
     * @note 可以使用此接口来取消已发出的请求。
     * @param requestId 请求ID(发送请求的接口返回或者OnRequestReceived事件通知)。
     * @param callback 调用接口的回调，用于通知接口调用的成功或者失败。
     */
    virtual void cancelRequest(const char* requestId, TUICallback* callback) = 0;

    /**
     * 7.2  回复请求
     *
     * @note 在收到信令请求时，可以使用此接口来回复接收到的请求。
     * @param requestId 请求ID(发送请求的接口返回或者OnRequestReceived事件通知)。
     * @param agree 是否同意 {@link true}: 同意请求, {@link false}: 拒绝请求。
     * @param callback 调用接口的回调，用于通知接口调用的成功或者失败。
     */
    virtual void responseRemoteRequest(const char* requestId, bool agree, TUICallback* callback) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                    高级功能
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 8.1设置美颜级别
     *
     * @param beautyStyle 美颜风格，TXBeautyStyleSmooth：光滑；TXBeautyStyleNature：自然；TXBeautyStylePitu：优图。
     * @param beautyLevel 美颜级别，取值范围 0 - 9； 0 表示关闭，9 表示效果最明显。
     */
    virtual void setBeautyLevel(int beautyStyle, uint32_t beautyLevel) = 0;

    /**
     * 8.2设置美白级别
     *
     * @param whitenessLevel 美白级别，取值范围 0 - 9；0 表示关闭，9 表示效果最明显。
     */
    virtual void setWhitenessLevel(uint32_t whitenessLevel) = 0;

    /**
     * 8.3获取插件
     *
     * @param extensionType 插件类型。
     */
    virtual void* getExtension(TUIExtensionType extensionType) = 0;

    /**
     * 8.4 获取设备管理类
     */
    virtual ITUIRoomDeviceManager* getMediaDeviceManager() = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                    调试相关
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 9.1 调用实验性接口
     *
     * @param  jsonStr 接口信息。
     * @return 返回结果
     */
    static void* callExperimentalAPI(const char* jsonStr, void* param = nullptr);
};

}  // namespace tuikit

#endif  // TUIROOMENGINE_H_
