/// Copyright (c) 2022 Tencent. All rights reserved.
#ifndef __IDEPRECATEDTRTCCLOUD_H__
#define __IDEPRECATEDTRTCCLOUD_H__

#include "TRTCTypeDef.h"
#include "TRTCCloudCallback.h"

namespace liteav {

class IDeprecatedTRTCCloud {
   public:
    /////////////////////////////////////////////////////////////////////////////////
    //
    //                    弃用接口（建议使用对应的新接口）
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 启用音量大小提示
     *
     * @deprecated v10.1 版本开始不推荐使用，建议使用 {@link enableAudioVolumeEvaluation}(interval, enable_vad) 替代之。
     */
    trtc_attribute_deprecated virtual void enableAudioVolumeEvaluation(uint32_t interval) = 0;

    /**
     * 设置音频质量
     *
     * @deprecated v8.0 版本开始不推荐使用，建议使用 {@link startLocalAudio} 替代之。
     */
    trtc_attribute_deprecated virtual void startLocalAudio() = 0;

    /**
     * 开始显示远端视频画面
     *
     * @deprecated v8.0 版本开始不推荐使用，建议使用 {@link startRemoteView} 替代之。
     */
    trtc_attribute_deprecated virtual void startRemoteView(const char* userId, TXView rendView) = 0;

    /**
     * 停止显示远端视频画面，同时不再拉取该远端用户的视频数据流
     *
     * @deprecated v8.0 版本开始不推荐使用，建议使用 {@link stopRemoteView} 替代之。
     */
    trtc_attribute_deprecated virtual void stopRemoteView(const char* userId) = 0;

    /**
     * 设置本地图像的渲染模式
     *
     * @deprecated v8.0 版本开始不推荐使用，建议使用 {@link setLocalRenderParams} 替代之。
     */
    trtc_attribute_deprecated virtual void setLocalViewFillMode(TRTCVideoFillMode mode) = 0;

    /**
     * 设置本地图像的顺时针旋转角度
     *
     * @deprecated v8.0 版本开始不推荐使用，建议使用 {@link setLocalRenderParams} 替代之。
     */
    trtc_attribute_deprecated virtual void setLocalViewRotation(TRTCVideoRotation rotation) = 0;

    /**
     * 设置本地摄像头预览画面的镜像模式
     *
     * @deprecated v8.0 版本开始不推荐使用，建议使用 {@link setLocalRenderParams} 替代之。
     */
    trtc_attribute_deprecated virtual void setLocalViewMirror(bool mirror) = 0;

    /**
     * 设置远端图像的渲染模式
     *
     * @deprecated v8.0 版本开始不推荐使用，建议使用 {@link setRemoteRenderParams} 替代之。
     */
    trtc_attribute_deprecated virtual void setRemoteViewFillMode(const char* userId, TRTCVideoFillMode mode) = 0;

    /**
     * 设置远端图像的顺时针旋转角度
     *
     * @deprecated v8.0 版本开始不推荐使用，建议使用 {@link setRemoteRenderParams} 替代之。
     */
    trtc_attribute_deprecated virtual void setRemoteViewRotation(const char* userId, TRTCVideoRotation rotation) = 0;

    /**
     * 开始显示远端用户的辅路画面
     *
     * @deprecated v8.0 版本开始不推荐使用，建议使用 {@link startRemoteView} 替代之。
     */
    trtc_attribute_deprecated virtual void startRemoteSubStreamView(const char* userId, TXView rendView) = 0;

    /**
     * 停止显示远端用户的辅路画面
     *
     * @deprecated v8.0 版本开始不推荐使用，建议使用 {@link stopRemoteView} 替代之。
     */
    trtc_attribute_deprecated virtual void stopRemoteSubStreamView(const char* userId) = 0;

    /**
     * 设置辅路画面的填充模式
     *
     * @deprecated v8.0 版本开始不推荐使用，建议使用 {@link setRemoteRenderParams} 替代之。
     */
    trtc_attribute_deprecated virtual void setRemoteSubStreamViewFillMode(const char* userId, TRTCVideoFillMode mode) = 0;

    /**
     * 设置辅路画面的顺时针旋转角度
     *
     * @deprecated v8.0 版本开始不推荐使用，建议使用 {@link setRemoteRenderParams}:streamType:params: 替代之。
     */
    trtc_attribute_deprecated virtual void setRemoteSubStreamViewRotation(const char* userId, TRTCVideoRotation rotation) = 0;

    /**
     * 设置音频质量
     *
     * @deprecated v8.0 版本开始不推荐使用，建议使用 {@link startLocalAudio} 替代之。
     */
    trtc_attribute_deprecated virtual void setAudioQuality(TRTCAudioQuality quality) = 0;

    /**
     * 设定优先观看大画面还是小画面
     *
     * @deprecated v8.0 版本开始不推荐使用，建议使用 {@link startRemoteView}:streamType:view: 替代之。
     */
    trtc_attribute_deprecated virtual void setPriorRemoteVideoStreamType(TRTCVideoStreamType type) = 0;

    /**
     * 设置麦克风音量大小
     */
    trtc_attribute_deprecated virtual void setMicVolumeOnMixing(uint32_t volume) = 0;

    /**
     * 启动播放背景音乐
     *
     * @deprecated v7.3 版本开始不推荐使用，建议使用 {@link getAudioEffectManager} 替代之。
     */
    trtc_attribute_deprecated virtual void playBGM(const char* path) = 0;

    /**
     * 停止播放背景音乐
     *
     * @deprecated v7.3 版本开始不推荐使用，建议使用 {@link getAudioEffectManager} 替代之。
     */
    trtc_attribute_deprecated virtual void stopBGM() = 0;

    /**
     * 停止播放背景音乐
     *
     * @deprecated v7.3 版本开始不推荐使用，建议使用 {@link getAudioEffectManager} 替代之。
     */
    trtc_attribute_deprecated virtual void pauseBGM() = 0;

    /**
     * 停止播放背景音乐
     *
     * @deprecated v7.3 版本开始不推荐使用，建议使用 {@link getAudioEffectManager} 替代之。
     */
    trtc_attribute_deprecated virtual void resumeBGM() = 0;

    /**
     * 获取背景音乐总时长（单位：毫秒）
     *
     * @deprecated v7.3 版本开始不推荐使用，建议使用 {@link TXAudioEffectManager} 中的 {@link getMusicDurationInMS} 替代之。
     */
    trtc_attribute_deprecated virtual uint32_t getBGMDuration(const char* path) = 0;

    /**
     * 设置背景音乐的播放进度
     *
     * @deprecated v7.3 版本开始不推荐使用，建议使用 {@link TXAudioEffectManager} 中的 {@link seekMusicToPosInMS} 替代之。
     */
    trtc_attribute_deprecated virtual void setBGMPosition(uint32_t pos) = 0;

    /**
     * 设置背景音乐的音量大小
     *
     * @deprecated v7.3 版本开始不推荐使用，建议使用 {@link TXAudioEffectManager} 中的 {@link setMusicVolume} 替代之。
     */
    trtc_attribute_deprecated virtual void setBGMVolume(uint32_t volume) = 0;

    /**
     * 设置背景音乐的本地播放音量
     *
     * @deprecated v7.3 版本开始不推荐使用，建议使用 {@link TXAudioEffectManager} 中的 {@link setMusicPlayoutVolume} 替代之。
     */
    trtc_attribute_deprecated virtual void setBGMPlayoutVolume(uint32_t volume) = 0;

    /**
     * 设置背景音乐的远端播放音量
     *
     * @deprecated v7.3 版本开始不推荐使用，建议使用 {@link TXAudioEffectManager} 中的 {@link setBGMPublishVolume} 替代之。
     */
    trtc_attribute_deprecated virtual void setBGMPublishVolume(uint32_t volume) = 0;

    /**
     * 播放音效
     *
     * @deprecated v7.3 版本开始不推荐使用，建议使用 {@link TXAudioEffectManager} 中的 {@link startPlayMusic} 替代之。
     */
    trtc_attribute_deprecated virtual void playAudioEffect(TRTCAudioEffectParam* effect) = 0;

    /**
     * 设置音效音量
     *
     * @deprecated v7.3 版本开始不推荐使用，建议使用 {@link TXAudioEffectManager} 中的 {@link setMusicPublishVolume} 和 {@link setMusicPlayoutVolume} 替代之。
     */
    trtc_attribute_deprecated virtual void setAudioEffectVolume(int effectId, int volume) = 0;

    /**
     * 停止播放音效
     *
     * @deprecated v7.3 版本开始不推荐使用，建议使用 {@link TXAudioEffectManager} 中的 {@link stopPlayMusic} 替代之。
     */
    trtc_attribute_deprecated virtual void stopAudioEffect(int effectId) = 0;

    /**
     * 停止所有音效
     *
     * @deprecated v7.3 版本开始不推荐使用，建议使用 {@link TXAudioEffectManager} 中的 {@link stopPlayMusic} 替代之。
     */
    trtc_attribute_deprecated virtual void stopAllAudioEffects() = 0;

    /**
     * 设置所有音效音量
     *
     * @deprecated v7.3 版本开始不推荐使用，建议使用 {@link TXAudioEffectManager} 中的 {@link setMusicPublishVolume} 和{@link setMusicPlayoutVolume} 替代之。
     */
    trtc_attribute_deprecated virtual void setAllAudioEffectsVolume(int volume) = 0;

    /**
     * 暂停音效
     *
     * @deprecated v7.3 版本开始不推荐使用，建议使用 {@link TXAudioEffectManager} 中的 {@link pauseAudioEffect} 替代之。
     */
    trtc_attribute_deprecated virtual void pauseAudioEffect(int effectId) = 0;

    /**
     * 暂停音效
     *
     * @deprecated v7.3 版本开始不推荐使用，建议使用 {@link TXAudioEffectManager} 中的 {@link resumePlayMusic} 替代之。
     */
    trtc_attribute_deprecated virtual void resumeAudioEffect(int effectId) = 0;

    /**
     * 启用视频自定义采集模式
     *
     * @deprecated v8.5 版本开始不推荐使用，建议使用 {@link enableCustomVideoCapture}(streamType, enable) 接口替代之。
     */
    trtc_attribute_deprecated virtual void enableCustomVideoCapture(bool enable) = 0;

    /**
     * 投送自己采集的视频数据
     *
     * @deprecated v8.5 版本开始不推荐使用，建议使用 {@link sendCustomVideoData}(streamType, TRTCVideoFrame) 接口替代之。
     */
    trtc_attribute_deprecated virtual void sendCustomVideoData(TRTCVideoFrame* frame) = 0;

    /**
     * 暂停/恢复发布本地的视频流
     *
     * @deprecated v8.9 版本开始不推荐使用，建议使用 {@link muteLocalVideo}(streamType, mute) 接口替代之。
     */
    trtc_attribute_deprecated virtual void muteLocalVideo(bool mute) = 0;

    /**
     * 暂停 / 恢复订阅远端用户的视频流
     *
     * @deprecated v8.9 版本开始不推荐使用，建议使用 {@link muteRemoteVideoStream}(userId, streamType, mute) 接口替代之。
     */
    trtc_attribute_deprecated virtual void muteRemoteVideoStream(const char* userId, bool mute) = 0;

    /**
     *  开始进行网络测速（进入房间前使用）
     *
     * @deprecated v9.2 版本开始不推荐使用，建议使用 {@link startSpeedTest}(params) 接口替代之。
     */
    trtc_attribute_deprecated virtual void startSpeedTest(uint32_t sdkAppId, const char* userId, const char* userSig) = 0;

    /**
     * 启动屏幕分享
     *
     * @deprecated v7.2 版本开始不推荐使用，建议使用 {@link startScreenCapture} 替代之。
     */
    trtc_attribute_deprecated virtual void startScreenCapture(TXView rendView) = 0;

/**
 * 获取摄像头设备列表
 *
 * @deprecated v8.0 版本开始不推荐使用，建议使用 {@link TXDeviceManager} 中的 {@link getDevicesList} 接口替代之。
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual ITRTCDeviceCollection* getCameraDevicesList() = 0;
#endif

/**
 * 选定当前要使用的摄像头
 *
 * @deprecated v8.0 版本开始不推荐使用，建议使用 {@link TXDeviceManager} 中的 {@link setCurrentDevice} 接口替代之。
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual void setCurrentCameraDevice(const char* deviceId) = 0;
#endif

/**
 * 获取当前使用的摄像头
 *
 * @deprecated v8.0 版本开始不推荐使用，建议使用 {@link TXDeviceManager} 中的 {@link getCurrentDevice} 接口替代之。
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual ITRTCDeviceInfo* getCurrentCameraDevice() = 0;
#endif

/**
 * 获取麦克风设备列表
 *
 * @deprecated v8.0 版本开始不推荐使用，建议使用 {@link TXDeviceManager} 中的 {@link getDevicesList} 接口替代之。
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual ITRTCDeviceCollection* getMicDevicesList() = 0;
#endif

/**
 * 获取当前的麦克风设备
 *
 * @deprecated v8.0 版本开始不推荐使用，建议使用 {@link TXDeviceManager} 中的 {@link getCurrentDevice} 接口替代之。
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual ITRTCDeviceInfo* getCurrentMicDevice() = 0;
#endif

/**
 * 选定当前使用的麦克风
 *
 * @deprecated v8.0 版本开始不推荐使用，建议使用 {@link TXDeviceManager} 中的 {@link setCurrentDevice} 接口替代之。
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual void setCurrentMicDevice(const char* micId) = 0;
#endif

/**
 * 获取当前麦克风的设备音量
 *
 * @deprecated v8.0 版本开始不推荐使用，建议使用 {@link TXDeviceManager} 中的 {@link getCurrentDeviceVolume} 接口替代之。
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual uint32_t getCurrentMicDeviceVolume() = 0;
#endif

/**
 * 设置当前麦克风的设备音量
 *
 * @deprecated v8.0 版本开始不推荐使用，建议使用 {@link TXDeviceManager} 中的 {@link setCurrentDeviceVolume} 接口替代之。
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual void setCurrentMicDeviceVolume(uint32_t volume) = 0;
#endif

/**
 * 设置系统当前麦克风设备的静音状态
 *
 * @deprecated v8.0 版本开始不推荐使用，建议使用 {@link TXDeviceManager} 中的 {@link setCurrentDeviceMute} 接口替代之。
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual void setCurrentMicDeviceMute(bool mute) = 0;
#endif

/**
 * 获取系统当前麦克风设备是否静音
 *
 * @deprecated v8.0 版本开始不推荐使用，建议使用 {@link TXDeviceManager} 中的 {@link getCurrentDeviceMute} 接口替代之。
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual bool getCurrentMicDeviceMute() = 0;
#endif

/**
 * 获取扬声器设备列表
 *
 * @deprecated v8.0 版本开始不推荐使用，建议使用 {@link TXDeviceManager} 中的 {@link getDevicesList} 接口替代之。
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual ITRTCDeviceCollection* getSpeakerDevicesList() = 0;
#endif

/**
 * 获取当前的扬声器设备
 *
 * @deprecated v8.0 版本开始不推荐使用，建议使用 {@link TXDeviceManager} 中的 {@link getCurrentDevice} 接口替代之。
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual ITRTCDeviceInfo* getCurrentSpeakerDevice() = 0;
#endif

/**
 * 设置要使用的扬声器
 *
 * @deprecated v8.0 版本开始不推荐使用，建议使用 {@link TXDeviceManager} 中的 {@link setCurrentDevice} 接口替代之。
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual void setCurrentSpeakerDevice(const char* speakerId) = 0;
#endif

/**
 * 获取当前扬声器的设备音量
 *
 * @deprecated v8.0 版本开始不推荐使用，建议使用 {@link TXDeviceManager} 中的 {@link getCurrentDeviceVolume} 接口替代之。
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual uint32_t getCurrentSpeakerVolume() = 0;
#endif

/**
 * 设置当前扬声器的设备音量
 *
 * @deprecated v8.0 版本开始不推荐使用，建议使用 {@link TXDeviceManager} 中的 {@link setCurrentDeviceVolume} 接口替代之。
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual void setCurrentSpeakerVolume(uint32_t volume) = 0;
#endif

/**
 * 获取系统当前扬声器设备是否静音
 *
 * @deprecated v8.0 版本开始不推荐使用，建议使用 {@link TXDeviceManager} 中的 {@link getCurrentDeviceMute} 接口替代之。
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual bool getCurrentSpeakerDeviceMute() = 0;
#endif

/**
 * 设置系统当前扬声器设备的静音状态
 *
 * @deprecated v8.0 版本开始不推荐使用，建议使用 {@link TXDeviceManager} 中的 {@link setCurrentDeviceMute} 接口替代之。
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual void setCurrentSpeakerDeviceMute(bool mute) = 0;
#endif

/**
 * 开始进行摄像头测试
 *
 * @deprecated v8.0 版本开始不推荐使用，建议使用 {@link TXDeviceManager} 中的 {@link startCameraDeviceTest} 接口替代之。
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual void startCameraDeviceTest(TXView renderView) = 0;
#endif

/**
 * 开始进行摄像头测试
 */
#if _WIN32
    trtc_attribute_deprecated virtual void startCameraDeviceTest(ITRTCVideoRenderCallback* callback) = 0;
#endif

/**
 * 停止进行摄像头测试
 *
 * @deprecated v8.0 版本开始不推荐使用，建议使用 {@link TXDeviceManager} 中的 {@link stopCameraDeviceTest} 接口替代之。
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual void stopCameraDeviceTest() = 0;
#endif

/**
 * 开始进行麦克风测试
 *
 * @deprecated v8.0 版本开始不推荐使用，建议使用 {@link TXDeviceManager} 中的 {@link startMicDeviceTest} 接口替代之。
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual void startMicDeviceTest(uint32_t interval) = 0;
#endif

/**
 * 开始进行麦克风测试
 *
 * @deprecated v8.0 版本开始不推荐使用，建议使用 {@link TXDeviceManager} 中的 {@link stopMicDeviceTest} 接口替代之。
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual void stopMicDeviceTest() = 0;
#endif

/**
 * 开始进行扬声器测试
 *
 * @deprecated v8.0 版本开始不推荐使用，建议使用 {@link TXDeviceManager} 中的 {@link startSpeakerDeviceTest} 接口替代之。
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual void startSpeakerDeviceTest(const char* testAudioFilePath) = 0;
#endif

/**
 * 停止进行扬声器测试
 *
 * @deprecated v8.0 版本开始不推荐使用，建议使用 {@link TXDeviceManager} 中的 {@link stopSpeakerDeviceTest} 接口替代之。
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual void stopSpeakerDeviceTest() = 0;
#endif

/**
 * 开始应用内的屏幕分享（iOS）
 *
 * @deprecated v8.6 版本开始不推荐使用，建议使用 {@link startScreenCaptureInApp} 接口替代之。
 */
#if TARGET_PLATFORM_DESKTOP
    trtc_attribute_deprecated virtual void selectScreenCaptureTarget(const TRTCScreenCaptureSourceInfo& source, const RECT& captureRect, bool captureMouse = true, bool highlightWindow = true) = 0;
#endif
};
}  // namespace liteav
#endif
