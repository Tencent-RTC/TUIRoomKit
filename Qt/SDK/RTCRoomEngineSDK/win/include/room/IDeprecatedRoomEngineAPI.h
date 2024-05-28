/**
 * Copyright (c) 2024 Tencent. All rights reserved.
 */
#ifndef __IDEPRECATEDROOMENGINEAPI_H__
#define __IDEPRECATEDROOMENGINEAPI_H__

#include "ITUIRoomDefine.h"

#ifdef __GNUC__
#define ROOM_ENGINE_GCC_VERSION_AT_LEAST(x, y) (__GNUC__ > (x) || __GNUC__ == (x) && __GNUC_MINOR__ >= (y))
#else
#define ROOM_ENGINE_GCC_VERSION_AT_LEAST(x, y) 0
#endif

#if ROOM_ENGINE_GCC_VERSION_AT_LEAST(3, 1) || defined(__clang__)
#define room_engine_attribute_deprecated __attribute__((deprecated))
#elif defined(_MSC_VER)
#define room_engine_attribute_deprecated __declspec(deprecated)
#else
#define room_engine_attribute_deprecated
#endif

namespace liteav {
class ITRTCCloud;
class ITXDeviceManager;
class ITXAudioEffectManager;
}  // namespace liteav

namespace tuikit {

class IDeprecatedRoomEngineAPI {
   public:
    /////////////////////////////////////////////////////////////////////////////////
    //
    //                    弃用接口（建议使用对应的新接口）
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 开始推送本地音频
     *
     * @deprecated v1.5.0 版本开始不推荐使用,建议使用{@link unmuteLocalAudio}代替。
     */
    room_engine_attribute_deprecated virtual void startPushLocalAudio() = 0;

    /**
     * 停止推送本地音频
     *
     * @deprecated v1.5.0 版本开始不推荐使用,建议使用{@link muteLocalAudio}代替。
     */
    room_engine_attribute_deprecated virtual void stopPushLocalAudio() = 0;

    /**
     * 获得TRTC实例对象
     *
     * @deprecated v1.5.0 版本开始不推荐使用。
     */
    room_engine_attribute_deprecated virtual void* getTRTCCloud() = 0;

    /**
     * 获得设备管理对象
     *
     * @deprecated v1.5.0 版本开始不推荐使用。
     */
    room_engine_attribute_deprecated virtual liteav::ITXDeviceManager* getDeviceManager() = 0;

    /**
     * 获得音效管理对象
     *
     * @deprecated v1.5.0 版本开始不推荐使用。
     */
    room_engine_attribute_deprecated virtual liteav::ITXAudioEffectManager* getAudioEffectManager() = 0;

    /**
     * 设置本地用户视频渲染的视图控件
     *
     * @deprecated v1.6.1 版本开始不推荐使用。
     */
    room_engine_attribute_deprecated virtual void setLocalVideoView(TUIVideoStreamType streamType, const TUIVideoView& view) = 0;

    /**
     * 设置房间管理模式（只有管理员或房主能够调用）
     *
     * @deprecated v2.0 版本开始，该功能已废弃，建议使用isSeatEnabled代替。
     * 房间麦控模式更新后，SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onRoomSpeechModeChanged} 回调通知房间内用户。
     * @param mode kFreeToSpeak: 自由发言模式, 用户可以自由开启麦克风和扬声器;
     *             kApplyToSpeak: 申请发言模式，用户requestOpenLocalMicrophone 或 requestOpenLocalCamera 向房主或管理员申请后，方可打开麦克风和摄像头开始发言;
     *             kkSpeakAfterTakingSeat: 上麦发言模式。KConference房间内，所有人在发言前，必须takeSeat，才能进行麦克风和摄像头操作。
     * @param callback 调用接口的回调，用于通知接口调用的成功或者失败。
     */
    room_engine_attribute_deprecated virtual void updateRoomSpeechModeByAdmin(TUISpeechMode mode, TUICallback* callback) = 0;

#if TARGET_PLATFORM_DESKTOP

    /**
     * 获取设备列表（仅适用于桌面端）
     *
     * @deprecated v2.0 版本开始不推荐使用,建议使用{$TUIRoomDeviceManager$}中的{@link getDevicesList}代替。
     * @param type  设备类型，指定需要获取哪种设备的列表。详见 TXMediaDeviceType 定义。
     * @note
     * - 使用完毕后请调用 release 方法释放资源，这样可以让 SDK 维护 ITXDeviceCollection 对象的生命周期。
     *   - 不要使用 delete 释放返回的 Collection 对象，delete ITXDeviceCollection* 指针会导致异常崩溃。
     *   - type 只支持 TXMediaDeviceTypeMic、TXMediaDeviceTypeSpeaker、TXMediaDeviceTypeCamera。
     *   - 此接口只支持 Mac 和 Windows 平台。
     */
    room_engine_attribute_deprecated virtual liteav::ITXDeviceCollection* getDevicesList(liteav::TXMediaDeviceType type) = 0;

    /**
     * 设置当前要使用的设备（仅适用于桌面端）
     *
     * @deprecated v2.0 版本开始不推荐使用,建议使用{$TUIRoomDeviceManager$}中的{@link setCurrentDevice}代替。
     * 设置当前要使用的设备后,SDK会通过 {@link $TUIRoomObserver$} 中的 {@link onDeviceChanged} 通知您。
     * @param type 设备类型，详见 TXMediaDeviceType 定义。
     * @param deviceId 设备ID，您可以通过接口 {@link getDevicesList} 获得设备 ID。
     * @return 0：操作成功；负数：操作失败。
     */
    room_engine_attribute_deprecated virtual int setCurrentDevice(liteav::TXMediaDeviceType type, const char* deviceId) = 0;

#endif
};
}  // namespace tuikit
#endif
