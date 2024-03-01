/**
 * Copyright (c) 2023 Tencent. All rights reserved.
 * Module:   TUIRoomDeviceManager @ TUIKitEngine
 * Function: 设备测试、管理相关接口
 */
#ifndef TUIROOMDEVICEMANAGER_H_
#define TUIROOMDEVICEMANAGER_H_

#include "ITUIRoomDefine.h"

namespace tuikit {

/**
 * 设备类型
 */
enum class TUIMediaDeviceType {

    /// 未定义的设备类型
    kMediaDeviceTypeUnknown = -1,

    /// 麦克风类型设备
    kMediaDeviceTypeAudioInput = 0,

    /// 扬声器类型设备
    kMediaDeviceTypeAudioOutput = 1,

    /// 摄像头类型设备
    kMediaDeviceTypeVideoCamera = 2,

};

/**
 * 设备操作
 */
enum class TUIMediaDeviceState {

    /// 设备已被插入
    kMediaDeviceStateAdd = 0,

    /// 设备已被移除
    kMediaDeviceStateRemove = 1,

    /// 设备已启用
    kMediaDeviceStateActive = 2,

};

/**
 * 设备信息
 */
struct TUIDeviceInfo {
    /// 设备 ID
    const char* deviceId;

    /// 设备名称
    const char* deviceName;

    /// 设备属性
    const char* deviceProperties;

    TUIDeviceInfo() : deviceId(nullptr), deviceName(nullptr), deviceProperties(nullptr) {
    }
};

class TUIRoomDeviceManagerObserver {
   public:
    ~TUIRoomDeviceManagerObserver() {
    }

    /**
     * 本地设备添加事件
     *
     * @note 当本地设备（包括摄像头、麦克风以及扬声器）添加时，SDK 便会抛出此事件回调
     * @param deviceId 设备 ID。
     * @param type 设备类型。
     * @param state 通断状态，0：设备已添加；1：设备已被移除；2：设备已启用
     */
    virtual void onDeviceChanged(const char* deviceId, TUIMediaDeviceType type, TUIMediaDeviceState state) = 0;

    /**
     * 测试摄像头画面渲染成功回调
     *
     * @note 当本地测试摄像头画面渲染成功时，SDK 便会抛出此事件回调
     * @param width 画面的宽度
     * @param height 画面的高度
     */
    virtual void onTestCameraVideoFrameRendered(int width, int height) = 0;

    /**
     * 测试麦克风时的音量回调
     *
     * @note 当本地测试麦克风时，SDK 便会抛出此事件回调
     * @param volume 麦克风采集到的音量值，取值范围0 - 100。
     */
    virtual void onTestMicVolume(int volume) = 0;

    /**
     * 测试扬声器时的音量回调
     *
     * @note 当本地测试扬声器时，SDK 便会抛出此事件回调
     * @param volume SDK 提交给扬声器去播放的声音的音量，取值范围0 - 100。
     */
    virtual void onTestSpeakerVolume(int volume) = 0;
};

/////////////////////////////////////////////////////////////////////////////////
//
//                    设备管理相关接口
//
/////////////////////////////////////////////////////////////////////////////////

class ITUIRoomDeviceManager {
   public:
    /**
     * 设置事件回调
     *
     * 您可以通过 TUIRoomDeviceManagerObserver 获得各类事件通知
     * @param observer 监听的实例
     */
    virtual void setObserver(TUIRoomDeviceManagerObserver* observer) = 0;

    /**
     * 开始摄像头测试（仅适用于桌面端）
     *
     * @note 在测试过程中可以使用 {@link $setCurrentDevice$} 接口切换摄像头。
     */
    virtual void startCameraDeviceTest(const TUIVideoView& view) = 0;

    /**
     * 结束摄像头测试（仅适用于桌面端）
     */
    virtual void stopCameraDeviceTest() = 0;

    /**
     * 开始麦克风测试（仅适用于桌面端）
     *
     * 该接口可以测试麦克风是否能正常工作，测试到的麦克风采集音量的大小，会以回调的形式通知给您，其中 volume 的取值范围为0 - 100。
     * @param interval 麦克风音量的回调间隔。
     * @param playback 是否开启回播麦克风声音，开启后用户测试麦克风时会听到自己的声音。
     */
    virtual void startMicDeviceTest(uint32_t interval, bool playback) = 0;

    /**
     * 结束麦克风测试（仅适用于桌面端）
     */
    virtual void stopMicDeviceTest() = 0;

    /**
     * 开始扬声器测试（仅适用于桌面端）
     *
     * 该接口通过播放指定的音频文件，用于测试播放设备是否能正常工作。如果用户在测试时能听到声音，说明播放设备能正常工作。
     * @param filePath 声音文件的路径
     */
    virtual void startSpeakerDeviceTest(const char* filePath) = 0;

    /**
     * 结束扬声器测试（仅适用于桌面端）
     */
    virtual void stopSpeakerDeviceTest() = 0;

    /**
     * 获取设备列表（仅适用于桌面端）
     *
     * @param type  设备类型，指定需要获取哪种设备的列表。详见 {@link $TUIMediaDeviceType$} 定义。
     */
    virtual void getDevicesList(TUIMediaDeviceType type, TUIValueCallback<TUIList<TUIDeviceInfo>>* callback) = 0;

    /**
     * 设置当前要使用的设备（仅适用于桌面端）
     *
     * @param type 设备类型，详见 {@link $TUIMediaDeviceType$} 定义。
     * @param deviceId 设备ID，您可以通过接口 {@link getDevicesList} 获得设备 ID。
     */
    virtual void setCurrentDevice(TUIMediaDeviceType type, const char* deviceId) = 0;

    /**
     * 获取当前正在使用的设备（仅适用于桌面端）
     *
     * @param type 设备类型，详见 {@link $TUIMediaDeviceType$} 定义。
     */
    virtual void getCurrentDevice(TUIMediaDeviceType type, TUIValueCallback<TUIDeviceInfo>* callback) = 0;
};

}  // namespace tuikit

#endif  // TUIROOMDEVICEMANAGER_H_
