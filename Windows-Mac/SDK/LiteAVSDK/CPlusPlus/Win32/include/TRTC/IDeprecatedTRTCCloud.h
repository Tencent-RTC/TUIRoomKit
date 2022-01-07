#ifndef __IDEPRECATEDTRTCCLOUD_H__
#define __IDEPRECATEDTRTCCLOUD_H__

#include "TRTCCloudCallback.h"
#include "TRTCTypeDef.h"

namespace liteav {
/// @defgroup IDeprecatedTRTCCloud_cplusplus IDeprecatedTRTCCloud
/// 腾讯云视频通话的 Windows C++ 专有废弃接口
/// @{
class IDeprecatedTRTCCloud {
   protected:
    virtual ~IDeprecatedTRTCCloud() {};

   public:
    /////////////////////////////////////////////////////////////////////////////////
    //
    //                           弃用接口函数
    //
    /////////////////////////////////////////////////////////////////////////////////
    /// @name 弃用接口函数
    /// @{

    /**
     * 开启本地音频的采集和上行
     *
     * 该函数会启动麦克风采集，并将音频数据传输给房间里的其他用户。
     * SDK 不会默认开启本地音频采集和上行，您需要调用该函数开启，否则房间里的其他用户将无法听到您的声音。
     *
     * @deprecated v8.0 版本弃用，请使用 startLocalAudio(quality) 接口
     * @note TRTC SDK 并不会默认打开本地的麦克风采集。
     */
    virtual __declspec(
        deprecated("use startLocalAudio(TRTCAudioQuality) "
                   "instead.")) void startLocalAudio() {};

    /**
     * 开始显示远端视频画面
     *
     * 在收到 SDK 的 onUserVideoAvailable(userId, true) 通知时，可以获知该远程用户开启了视频，此后调用 startRemoteView(userId) 接口加载该用户的远程画面时，
     * 可以用 loading 动画优化加载过程中的等待体验。 待该用户的首帧画面开始显示时，您会收到 onFirstVideoFrame(userId) 事件回调。
     *
     * @deprecated v8.0 版本弃用，请使用 startRemoteView(userId, streamType, rendView) 接口
     * @param userId   对方的用户标识
     * @param rendView 承载预览画面的窗口句柄
     */
    virtual __declspec(
        deprecated("use startRemoteView(userId,streamType,rendView) "
                   "instead.")) void startRemoteView(const char* userId, TXView rendView) {};

    /**
     * 停止显示远端视频画面，同时不再拉取该远端用户的视频数据流
     *
     * 调用此接口后，SDK 会停止接收该用户的远程视频流，同时会清理相关的视频显示资源。
     *
     * @deprecated v8.0 版本弃用，请使用 stopRemoteView(userId,streamType) 接口
     * @param userId 对方的用户标识
     */
    virtual __declspec(deprecated("use stopRemoteView(userId,streamType) instead."))
        void stopRemoteView(const char* userId) {};

    /**
     * 设置本地图像的填充模式
     *
     * @deprecated v8.0 版本弃用，请使用 setLocalRenderParams(TRTCRenderParams) 接口
     * @param mode 填充（画面可能会被拉伸裁剪）或适应（画面可能会有黑边），默认值：TRTCVideoFillMode_Fit
     */
    virtual __declspec(deprecated("use setLocalRenderParams(TRTCRenderParams) instead."))
        void setLocalViewFillMode(TRTCVideoFillMode mode) {};

    /**
     * 设置本地图像的顺时针旋转角度
     *
     * @deprecated v8.0 版本弃用，请使用 setLocalRenderParams(TRTCRenderParams) 接口
     * @param rotation 支持 TRTCVideoRotation90 、 TRTCVideoRotation180 以及 TRTCVideoRotation270 旋转角度，默认值：TRTCVideoRotation0
     */
    virtual __declspec(deprecated("use setLocalRenderParams(TRTCRenderParams) instead."))
        void setLocalViewRotation(TRTCVideoRotation rotation) {};

    /**
     * 设置本地摄像头预览画面的镜像模式
     *
     * @deprecated v8.0 版本弃用，请使用 setLocalRenderParams(TRTCRenderParams) 接口
     * @param mirror 镜像模式，默认值：false（非镜像模式）
     */
    virtual __declspec(deprecated("use setLocalRenderParams(TRTCRenderParams) instead."))
        void setLocalViewMirror(bool mirror) {};

    /**
     * 设置远端图像的渲染模式
     *
     * @deprecated v8.0 版本弃用，请使用 setRemoteRenderParams(userId,streamType,param) 接口
     * @param userId 用户 ID
     * @param mode 填充（画面可能会被拉伸裁剪）或适应（画面可能会有黑边），默认值：TRTCVideoFillMode_Fit
     */
    virtual __declspec(deprecated(
        "use setRemoteRenderParams(userId,streamType,param) "
        "instead.")) void setRemoteViewFillMode(const char* userId, TRTCVideoFillMode mode) {};

    /**
     * 设置远端图像的顺时针旋转角度
     *
     * @deprecated v8.0 版本弃用，请使用 setRemoteRenderParams(userId,streamType,param) 接口
     * @param userId 用户 ID
     * @param rotation 支持 TRTCVideoRotation90 、 TRTCVideoRotation180 以及 TRTCVideoRotation270 旋转角度，默认值：TRTCVideoRotation0
     */
    virtual __declspec(deprecated(
        "use setRemoteRenderParams(userId,streamType,param) "
        "instead.")) void setRemoteViewRotation(const char* userId, TRTCVideoRotation rotation) {};

    /**
     * 开始显示远端用户的辅路画面（TRTCVideoStreamTypeSub，一般用于屏幕分享）
     *
     * - startRemoteView() 用于显示主路画面（TRTCVideoStreamTypeBig，一般用于摄像头）。
     * - startRemoteSubStreamView() 用于显示辅路画面（TRTCVideoStreamTypeSub，一般用于屏幕分享）。
     *
     * @deprecated v8.0 版本弃用，请使用 startRemoteView(userId,streamType,rendView) 接口
     * @param userId  对方的用户标识
     * @param rendView 渲染画面的 TXView
     * @note 请在 onUserSubStreamAvailable 回调后再调用这个接口。
     */
    virtual __declspec(deprecated(
        "use startRemoteView(userId,streamType,rendView) "
        "instead.")) void startRemoteSubStreamView(const char* userId, TXView rendView) {};

    /**
     * 停止显示远端用户的辅路画面（TRTCVideoStreamTypeSub，一般用于屏幕分享）。
     * 
     * @deprecated v8.0 版本弃用，请使用 stopRemoteView(userId,streamType) 接口
     * @param userId 对方的用户标识
     */
    virtual __declspec(deprecated("use stopRemoteView(userId,streamType) instead."))
        void stopRemoteSubStreamView(const char* userId) {};

    /**
     * 设置辅路画面（TRTCVideoStreamTypeSub，一般用于屏幕分享）的显示模式
     * 
     * - setRemoteViewFillMode() 用于设置远端主路画面（TRTCVideoStreamTypeBig，一般用于摄像头）的显示模式。
     * - setRemoteSubStreamViewFillMode() 用于设置远端辅路画面（TRTCVideoStreamTypeSub，一般用于屏幕分享）的显示模式。
     *
     * @deprecated v8.0 版本弃用，请使用 setRemoteRenderParams(userId,streamType,param) 接口
     * @param userId 用户的 ID
     * @param mode 填充（画面可能会被拉伸裁剪）或适应（画面可能会有黑边），默认值：TRTCVideoFillMode_Fit
     */
    virtual __declspec(
        deprecated("use setRemoteRenderParams(userId,streamType,param) "
                   "instead.")) void setRemoteSubStreamViewFillMode(const char* userId,
                                                                    TRTCVideoFillMode mode) {};

    /**
     * 设置辅路画面（TRTCVideoStreamTypeSub，一般用于屏幕分享）的顺时针旋转角度
     * 
     * - setRemoteViewRotation() 用于设置远端主路画面（TRTCVideoStreamTypeBig，一般用于摄像头）的旋转角度。
     * - setRemoteSubStreamViewRotation() 用于设置远端辅路画面（TRTCVideoStreamTypeSub，一般用于屏幕分享）的旋转角度。
     *
     * @deprecated v8.0 版本弃用，请使用 setRemoteRenderParams(userId,streamType,param) 接口
     * @param userId 用户 ID
     * @param rotation 支持90、180、270旋转角度
     */
    virtual __declspec(
        deprecated("use setRemoteRenderParams(userId,streamType,param) "
                   "instead.")) void setRemoteSubStreamViewRotation(const char* userId,
                                                                    TRTCVideoRotation rotation) {};

    /**
     * 设置音频质量
     *
     * 主播端的音质越高，观众端的听感越好，但传输所依赖的带宽也就越高，在带宽有限的场景下也更容易出现卡顿。
     *
     * - {@link TRTCCloudDef#TRTCAudioQualitySpeech}，流畅：采样率：16k；单声道；音频裸码率：16kbps；适合语音通话为主的场景，比如在线会议，语音通话。
     * - {@link TRTCCloudDef#TRTCAudioQualityDefault}，默认：采样率：48k；单声道；音频裸码率：50kbps；SDK 默认的音频质量，如无特殊需求推荐选择之。
     * - {@link TRTCCloudDef#TRTCAudioQualityMusic}，高音质：采样率：48k；双声道 + 全频带；音频裸码率：128kbps；适合需要高保真传输音乐的场景，比如K歌、音乐直播等。
     *
     * @deprecated v8.0 版本弃用，请使用 startLocalAudio(TRTCAudioQuality) 接口
     * @note 该方法需要在 startLocalAudio 之前进行设置，否则不会生效。
     */
    virtual __declspec(
        deprecated("use startLocalAudio(TRTCAudioQuality) "
                   "instead.")) void setAudioQuality(TRTCAudioQuality quality) {};

    /**
     * 设定观看方优先选择的视频质量
     *
     * 低端设备推荐优先选择低清晰度的小画面。
     * 如果对方没有开启双路视频模式，则此操作无效。
     *
     * @deprecated v8.0 版本弃用，请使用 startRemoteView(userId, streamType, rendView) 接口
     * @param type 默认观看大画面还是小画面，默认为 TRTCVideoStreamTypeBig
     */
    virtual __declspec(
        deprecated("use startRemoteView(userId, streamType, rendView) "
                   "instead.")) void setPriorRemoteVideoStreamType(TRTCVideoStreamType type) {};

    /**
     * 获取摄像头设备列表
     *
     * 示例代码：
     * <pre>
     *  ITRTCDeviceCollection * pDevice = m_pCloud->getCameraDevicesList();
     *  for (int i{}; i < pDevice->getCount(); i++)
     *  {
     *      std::wstring name = UTF82Wide(pDevice->getDeviceName(i));
     *  }
     *  pDevice->release();
     *  pDevice = null;
     * </pre>
     *
     * @deprecated v8.0 版本弃用，请使用 ITXDeviceManager::getDevicesList 接口
     * @note delete ITRTCDeviceCollection* 指针会导致编译错误，SDK 维护 ITRTCDeviceCollection 对象的生命周期，使用完毕后请调用 release 方法释放资源。
     * @return 摄像头管理器对象指针 ITRTCDeviceCollection*
     */
    virtual __declspec(deprecated("use ITXDeviceManager::getDevicesList instead."))
        ITRTCDeviceCollection* getCameraDevicesList() {
        return nullptr;
    };

    /**
     * 设置要使用的摄像头
     *
     * @deprecated v8.0 版本弃用，请使用 ITXDeviceManager::setCurrentDevice 接口
     * @param deviceId 从 getCameraDevicesList 中得到的设备 ID
     */
    virtual __declspec(deprecated(
        "use ITXDeviceManager::setCurrentDevice instead.")) void setCurrentCameraDevice(const char*
                                                                                            deviceId) {};

    /**
     * 获取当前使用的摄像头
     *
     * @deprecated v8.0 版本弃用，请使用 ITXDeviceManager::getCurrentDevice 接口
     * @return ITRTCDeviceInfo 设备信息，能获取设备 ID 和设备名称
     */
    virtual __declspec(deprecated("use ITXDeviceManager::getCurrentDevice instead."))
        ITRTCDeviceInfo* getCurrentCameraDevice() {
        return nullptr;
    };

    /**
     * 获取麦克风设备列表
     *
     * 示例代码：
     * <pre>
     *  ITRTCDeviceCollection * pDevice = m_pCloud->getMicDevicesList();
     *  for (int i{}; i < pDevice->getCount(); i++)
     *  {
     *      std::wstring name = UTF82Wide(pDevice->getDeviceName(i));
     *  }
     *  pDevice->release();
     *  pDevice = null;
     * </pre>
     *
     * @deprecated v8.0 版本弃用，请使用 ITXDeviceManager::getDevicesList 接口
     * @return 麦克风管理器对象指针 ITRTCDeviceCollection*
     * @note delete ITRTCDeviceCollection* 指针会导致编译错误，SDK 维护 ITRTCDeviceCollection 对象的生命周期，使用完毕后请调用 release 方法释放资源。
     */
    virtual __declspec(deprecated("use ITXDeviceManager::getDevicesList instead."))
        ITRTCDeviceCollection* getMicDevicesList() {
        return nullptr;
    };

    /**
     * 获取当前选择的麦克风
     *
     * @deprecated v8.0 版本弃用，请使用 ITXDeviceManager::getCurrentDevice 接口
     * @return ITRTCDeviceInfo 设备信息，能获取设备 ID 和设备名称
     */
    virtual __declspec(deprecated("use ITXDeviceManager::getCurrentDevice instead."))
        ITRTCDeviceInfo* getCurrentMicDevice() {
        return nullptr;
    };

    /**
     * 设置要使用的麦克风
     *
     * 选择指定的麦克风作为录音设备，不调用该接口时，默认选择索引为0的麦克风
     *
     * @deprecated v8.0 版本弃用，请使用 ITXDeviceManager::setCurrentDevice 接口
     * @param micId 从 getMicDevicesList 中得到的设备 ID
     */
    virtual __declspec(deprecated(
        "use ITXDeviceManager::setCurrentDevice instead.")) void setCurrentMicDevice(const char*
                                                                                         micId) {};

    /**
     * 获取系统当前麦克风设备音量
     *
     * @deprecated v8.0 版本弃用，请使用 ITXDeviceManager::getCurrentDeviceVolume 接口
     * @note 查询的是系统硬件音量大小。
     *
     * @return 音量值，范围是0 - 100
     */
    virtual __declspec(deprecated("use ITXDeviceManager::getCurrentDeviceVolume instead.")) uint32_t
        getCurrentMicDeviceVolume() {
        return 0;
    };

    /**
     * 设置系统当前麦克风设备的音量
     *
     * @deprecated v8.0 版本弃用，请使用 ITXDeviceManager::setCurrentDeviceVolume 接口
     * @note 该接口的功能是调节系统采集音量，如果用户直接调节 Windows 系统设置的采集音量时，该接口的设置结果会被用户的操作所覆盖。
     *
     * @param volume 麦克风音量值，范围0 - 100
     */
    virtual __declspec(
        deprecated("use ITXDeviceManager::setCurrenDeviceVolume "
                   "instead.")) void setCurrentMicDeviceVolume(uint32_t volume) {};

    /**
     * 设置系统当前麦克风设备的是否静音
     *
     * @deprecated v8.0 版本弃用，请使用 ITXDeviceManager::setCurrentDeviceMute 接口
     * @note 该接口的功能是设置系统麦克风静音，如果用户直接设置 Windows 系统设置的麦克风静音时，该接口的设置结果会被用户的操作所覆盖。
     *
     * @param mute 设置为 true 时，则设置麦克风设备静音
     */
    virtual __declspec(
        deprecated("use ITXDeviceManager::setCurrentDeviceMute "
                   "instead.")) void setCurrentMicDeviceMute(bool mute) {};

    /**
     * 获取系统当前麦克风设备是否静音
     *
     * @deprecated v8.0 版本弃用，请使用 ITXDeviceManager::getCurrentDeviceMute 接口
     * @note 查询的是系统硬件静音状态
     *
     * @return 静音状态
     */
    virtual __declspec(deprecated(
        "use ITXDeviceManager::getCurrentDeviceMute instead.")) bool getCurrentMicDeviceMute() {
        return false;
    };

    /**
     * 获取扬声器设备列表
     *
     *  示例代码：
     * <pre>
     *  ITRTCDeviceCollection * pDevice = m_pCloud->getSpeakerDevicesList();
     *  for (int i{}; i < pDevice->getCount(); i++)
     *  {
     *      std::wstring name = UTF82Wide(pDevice->getDeviceName(i));
     *  }
     *  pDevice->release();
     *  pDevice = null;
     * </pre>
     *
     * @deprecated v8.0 版本弃用，请使用 ITXDeviceManager::getDevicesList 接口
     * @return 扬声器管理器对象指针 ITRTCDeviceCollection*
     * @note delete ITRTCDeviceCollection* 指针会导致编译错误，SDK 维护 ITRTCDeviceCollection 对象的生命周期，使用完毕后请调用 release 方法释放资源。
     */
    virtual __declspec(deprecated("use ITXDeviceManager::getDevicesList instead."))
        ITRTCDeviceCollection* getSpeakerDevicesList() {
        return nullptr;
    };

    /**
     * 获取当前的扬声器设备
     *
     * @deprecated v8.0 版本弃用，请使用 ITXDeviceManager::getCurrentDevice 接口
     * @return ITRTCDeviceInfo 设备信息，能获取设备 ID 和设备名称
     */
    virtual __declspec(deprecated("use ITXDeviceManager::getCurrentDevice instead."))
        ITRTCDeviceInfo* getCurrentSpeakerDevice() {
        return nullptr;
    };

    /**
     * 设置要使用的扬声器
     *
     * @deprecated v8.0 版本弃用，请使用 ITXDeviceManager::setCurrentDevice 接口
     * @param speakerId 从 getSpeakerDevicesList 中得到的设备 ID
     */
    virtual __declspec(deprecated(
        "use ITXDeviceManager::setCurrentDevice instead.")) void setCurrentSpeakerDevice(const char*
                                                                                             speakerId) {};

    /**
     * 获取系统当前扬声器设备音量
     *
     * @deprecated v8.0 版本弃用，请使用 ITXDeviceManager::getCurrentDeviceVolume 接口
     * @note 查询的是系统硬件音量大小。
     *
     * @return 扬声器音量，范围0 - 100
     */
    virtual __declspec(deprecated("use ITXDeviceManager::getCurrentDeviceVolume instead.")) uint32_t
        getCurrentSpeakerVolume() {
        return 0;
    };

    /**
     * 设置系统当前扬声器设备音量
     *
     * @deprecated v8.0 版本弃用，请使用 ITXDeviceManager::setCurrentDeviceVolume 接口
     * @note 该接口的功能是调节系统播放音量，如果用户直接调节 Windows 系统设置的播放音量时，该接口的设置结果会被用户的操作所覆盖。
     *
     * @param volume 设置的扬声器音量，范围0 - 100
     */
    virtual __declspec(
        deprecated("use ITXDeviceManager::setCurrentDeviceVolume "
                   "instead.")) void setCurrentSpeakerVolume(uint32_t volume) {};

    /**
     * 设置系统当前扬声器设备的是否静音
     *
     * @deprecated v8.0 版本弃用，请使用 ITXDeviceManager::setCurrentDeviceMute 接口
     * @note 该接口的功能是设置系统扬声器静音，如果用户直接设置 Windows 系统设置的扬声器静音时，该接口的设置结果会被用户的操作所覆盖。
     *
     * @param mute 设置为 true 时，则设置扬声器设备静音
     */
    virtual __declspec(
        deprecated("use ITXDeviceManager::setCurrentDeviceMute "
                   "instead.")) void setCurrentSpeakerDeviceMute(bool mute) {};

    /**
     * 获取系统当前扬声器设备是否静音
     *
     * @deprecated v8.0 版本弃用，请使用 ITXDeviceManager::getCurrentDeviceMute 接口
     * @note 查询的是系统硬件静音状态
     *
     * @return 静音状态
     */
    virtual __declspec(deprecated(
        "use ITXDeviceManager::getCurrentDeviceMute instead.")) bool getCurrentSpeakerDeviceMute() {
        return false;
    };

    /**
     * 开始进行摄像头测试
     *
     * 会触发 onFirstVideoFrame 回调接口
     *
     * @deprecated v8.0 版本弃用，请使用 ITXDeviceManager::startCameraDeviceTest 接口
     * @note 在测试过程中可以使用 setCurrentCameraDevice 接口切换摄像头。
     * @param rendView 承载预览画面的 HWND
     */
    virtual __declspec(
        deprecated("use ITXDeviceManager::startCameraDeviceTest "
                   "instead.")) void startCameraDeviceTest(TXView rendView) {};

    /**
     * 开始进行摄像头测试
     *
     * 会触发 onFirstVideoFrame 回调接口
     *
     * @deprecated v8.0 版本弃用，请使用 ITXDeviceManager::startCameraDeviceTest 接口
     * @note 在测试过程中可以使用 setCurrentCameraDevice 接口切换摄像头。
     * @param callback 摄像头预览自定义渲染画面回调
     */
    virtual __declspec(
        deprecated("use ITXDeviceManager::startCameraDeviceTest "
                   "instead.")) void startCameraDeviceTest(ITRTCVideoRenderCallback* callback) {};

    /**
     * 停止摄像头测试
     * 
     * @deprecated v8.0 版本弃用，请使用 ITXDeviceManager::stopCameraDeviceTest 接口
     */
    virtual __declspec(deprecated(
        "use ITXDeviceManager::stopCameraDeviceTest instead.")) void stopCameraDeviceTest() {};

    /**
     * 开启麦克风测试
     *
     * 回调接口 onTestMicVolume 获取测试数据
     *
     * 该方法测试麦克风是否能正常工作，volume 的取值范围为0 - 100。
     *
     * @deprecated v8.0 版本弃用，请使用 ITXDeviceManager::startMicDeviceTest 接口
     * @param interval 反馈音量提示的时间间隔（ms），建议设置到大于 200 毫秒
     */
    virtual __declspec(deprecated(
        "use ITXDeviceManager::startMicDeviceTest instead.")) void startMicDeviceTest(uint32_t
                                                                                          interval) {};

    /**
     * 停止麦克风测试
     * 
     * @deprecated v8.0 版本弃用，请使用 ITXDeviceManager::stopMicDeviceTest 接口
     */
    virtual __declspec(
        deprecated("use ITXDeviceManager::stopMicDeviceTest instead.")) void stopMicDeviceTest() {};

    /**
     * 开启扬声器测试
     *
     * 回调接口 onTestSpeakerVolume 获取测试数据
     *
     * 该方法播放指定的音频文件测试播放设备是否能正常工作。如果能听到声音，说明播放设备能正常工作。
     *
     * @deprecated v8.0 版本弃用，请使用 ITXDeviceManager::startSpeakerDeviceTest 接口
     * @param testAudioFilePath 音频文件的绝对路径，路径字符串使用 UTF-8 编码格式，支持文件格式：WAV、MP3
     */
    virtual __declspec(
        deprecated("use ITXDeviceManager::startSpeakerDeviceTest "
                   "instead.")) void startSpeakerDeviceTest(const char* testAudioFilePath) {};

    /**
     * 停止扬声器测试
     * 
     * @deprecated v8.0 版本弃用，请使用 ITXDeviceManager::stopSpeakerDeviceTest 接口
     */
    virtual __declspec(deprecated(
        "use ITXDeviceManager::stopSpeakerDeviceTest instead.")) void stopSpeakerDeviceTest() {};

    /**
     * 设置麦克风的音量大小
     *
     * @deprecated 从 v6.9 版本开始废弃，请使用 setAudioCaptureVolume 接口替代。
     */
    virtual __declspec(deprecated("use setAudioCaptureVolume instead.")) void setMicVolumeOnMixing(
        uint32_t volume) {};

    /**
     * 启动屏幕分享
     *
     * @deprecated 从 v7.2 版本开始废弃，请使用 startScreenCapture(rendView, type, params) 接口替代。
     */
    virtual __declspec(deprecated(
        "use startScreenCapture(TXView rendView, TRTCVideoStreamType type, TRTCVideoEncParam* "
        "params) instead.")) void startScreenCapture(TXView rendView) {};

    /**
     * 启动播放背景音乐
     *
     * @deprecated v7.3 版本弃用，请使用 TXAudioEffectManager startPlayMusic 接口，支持并发播放多个 BGM
     *
     * @param path 音乐文件路径，支持的文件格式：aac, mp3。
     */
    virtual __declspec(deprecated("use TXAudioEffectManager startPlayMusic instead")) void playBGM(
        const char* path) {};

    /**
     * 停止播放背景音乐
     *
     * @deprecated v7.3 版本弃用，请使用 TXAudioEffectManager stopPlayMusic 接口
     */
    virtual __declspec(deprecated("use TXAudioEffectManager stopPlayMusic instead")) void stopBGM() {};

    /**
     * 暂停播放背景音乐
     *
     * @deprecated v7.3 版本弃用，请使用 TXAudioEffectManager pausePlayMusic 接口
     */
    virtual __declspec(deprecated("use TXAudioEffectManager pausePlayMusic instead")) void pauseBGM() {};

    /**
     * 继续播放背景音乐
     *
     * @deprecated v7.3 版本弃用，请使用 TXAudioEffectManager resumePlayMusic 接口
     */
    virtual __declspec(deprecated("use TXAudioEffectManager resumePlayMusic instead")) void resumeBGM() {};

    /**
     * 获取音乐文件总时长，单位毫秒
     *
     * @deprecated v7.3 版本弃用，请使用 TXAudioEffectManager getMusicDurationInMS 接口
     * @param path 音乐文件路径，如果 path 为空，那么返回当前正在播放的 music 时长
     * @return     成功返回时长，失败返回-1
     */
    virtual __declspec(deprecated("use TXAudioEffectManager getMusicDurationInMS instead")) uint32_t
        getBGMDuration(const char* path) {
        return 0;
    };

    /**
     * 设置 BGM 播放进度
     *
     * @deprecated v7.3 版本弃用，请使用 TXAudioEffectManager seekMusicToPosInMS 接口
     * @param pos 单位毫秒
     */
    virtual __declspec(deprecated("use getAudioEffectManager instead")) void setBGMPosition(
        uint32_t pos) {};

    /**
     * 设置背景音乐播放音量的大小
     *
     * @deprecated v7.3 版本弃用，请使用 TXAudioEffectManager::setMusicPublishVolume / setMusicPlayoutVolume 接口播放背景音乐混音时使用，用来控制背景音乐播放音量的大小，
     * 该接口会同时控制远端播放音量的大小和本地播放音量的大小，因此调用该接口后，setBGMPlayoutVolume和setBGMPublishVolume设置的音量值会被覆盖。
     *
     * @param volume 音量大小，100为正常音量，取值范围为0 - 100；默认值：100
     */
    virtual __declspec(deprecated("use getAudioEffectManager instead")) void setBGMVolume(
        uint32_t volume) {};

    /**
     * 设置背景音乐本地播放音量的大小
     *
     * 播放背景音乐混音时使用，用来控制背景音乐在本地播放时的音量大小。
     *
     * @deprecated v7.3 版本弃用，请使用 TXAudioEffectManager::setMusicPlayoutVolume 接口
     * @param volume 音量大小，100为正常音量，取值范围为0 - 100；默认值：100
     */
    virtual __declspec(deprecated("use getAudioEffectManager instead")) void setBGMPlayoutVolume(
        uint32_t volume) {};

    /**
     * 设置背景音乐远端播放音量的大小
     *
     * 播放背景音乐混音时使用，用来控制背景音乐在远端播放时的音量大小。
     *
     * @deprecated v7.3 版本弃用，请使用 TXAudioEffectManager::setMusicPublishVolume 接口
     * @param volume 音量大小，100为正常音量，取值范围为0 - 100；默认值：100
     */
    virtual __declspec(deprecated("use getAudioEffectManager instead")) void setBGMPublishVolume(
        uint32_t volume) {};

    /**
     * 播放音效
     *
     * 每个音效都需要您指定具体的 ID，您可以通过该 ID 对音效的开始、停止、音量等进行设置。
     * 支持的文件格式：aac, mp3。
     *
     * @deprecated v7.3 版本弃用，请使用 TXAudioEffectManager startPlayMusic 接口
     * @note 若您想同时播放多个音效，请分配不同的 ID 进行播放。因为使用同一个 ID 播放不同音效，SDK
     * 将会停止上一个 ID 对应的音效播放，再启动新的音效播放。
     *
     * @param effect 音效
     */
    virtual __declspec(deprecated("use getAudioEffectManager instead")) void playAudioEffect(
        TRTCAudioEffectParam* effect) {};

    /**
     * 设置音效音量
     *
     * @deprecated v7.3 版本弃用，请使用 TXAudioEffectManager setMusicPublishVolume / setMusicPlayoutVolume 接口
     * @note 会覆盖通过 setAllAudioEffectsVolume 指定的整体音效音量。
     *
     * @param effectId 音效 ID
     * @param volume   音量大小，取值范围为0 - 100；默认值：100
     */
    virtual __declspec(deprecated("use getAudioEffectManager instead")) void setAudioEffectVolume(
        int effectId, int volume) {};

    /**
     * 停止音效
     *
     * @deprecated v7.3 版本弃用，请使用 TXAudioEffectManager stopPlayMusic 接口
     * @param effectId 音效 ID
     */
    virtual __declspec(deprecated("use getAudioEffectManager instead")) void stopAudioEffect(
        int effectId) {};

    /**
     * 停止所有音效
     *
     * @deprecated v7.3 版本弃用，请使用 TXAudioEffectManager stopPlayMusic 接口
     */
    virtual __declspec(
        deprecated("use getAudioEffectManager instead")) void stopAllAudioEffects() {};

    /**
     * 设置所有音效的音量
     *
     * @deprecated v7.3 版本弃用，请使用 TXAudioEffectManager setMusicPublishVolume / setMusicPlayoutVolume 接口
     * @note 该操作会覆盖通过 setAudioEffectVolume 指定的单独音效音量。
     *
     * @param volume 音量大小，取值范围为0 - 100；默认值：100
     */
    virtual __declspec(deprecated(
        "use getAudioEffectManager instead")) void setAllAudioEffectsVolume(int volume) {};

    /**
     * 暂停音效
     *
     * @deprecated v7.3 版本弃用，请使用 TXAudioEffectManager pausePlayMusic 接口
     * @param effectId 音效 Id
     */
    virtual __declspec(deprecated("use getAudioEffectManager instead")) void pauseAudioEffect(
        int effectId) {};

    /**
     * 恢复音效
     *
     * @deprecated v7.3 版本弃用，请使用 TXAudioEffectManager resumePlayMusic 接口
     * @param effectId 音效 Id
     */
    virtual __declspec(deprecated("use getAudioEffectManager instead")) void resumeAudioEffect(
        int effectId) {};

    /**
     * 设置屏幕共享参数
     *
     * @deprecated v7.9 版本弃用，请使用 selectScreenCaptureTarget(TRTCScreenCaptureSourceInfo,RECT,TRTCScreenCaptureProperty) 接口
     * @param source            指定分享源
     * @param captureRect       指定捕获的区域
     * @param captureMouse      指定是否捕获鼠标指针
     * @param highlightWindow   指定是否高亮正在共享的窗口，以及当捕获图像被遮挡时高亮遮挡窗口提示用户移走遮挡
     */
    virtual __declspec(deprecated(
        "use selectScreenCaptureTarget(TRTCScreenCaptureSourceInfo,RECT,TRTCScreenCaptureProperty) "
        "instead")) void selectScreenCaptureTarget(const TRTCScreenCaptureSourceInfo& source,
                                                   const RECT& captureRect,
                                                   bool captureMouse = true,
                                                   bool highlightWindow = true) {};

    /**
     * 启用视频自定义采集模式
     *
     * 开启该模式后，SDK 不再运行原有的视频采集流程，只保留编码和发送能力。
     * 您需要用 sendCustomVideoData() 不断地向 SDK 塞入自己采集的视频画面。
     *
     * @param enable 是否启用，默认值：false
     */
    virtual __declspec(deprecated(
        "use void enableCustomVideoCapture(TRTCVideoStreamType type, bool enable) instead")) void enableCustomVideoCapture(bool enable){};

    /**
     * TRTCVideoFrame 推荐如下填写方式（其他字段不需要填写）：
     * - pixelFormat： Windows、Android平台仅支持 TRTCVideoPixelFormat_I420，iOS、Mac平台支持TRTCVideoPixelFormat_I420和TRTCVideoPixelFormat_BGRA32
     * - bufferType：仅支持 TRTCVideoBufferType_Buffer。
     * - data：视频帧 buffer。
     * - length：视频帧数据长度，I420 格式下，其值等于：width × height × 3 / 2。
     * - width：视频图像长度。
     * - height：视频图像宽度。
     * - timestamp：如果 timestamp 间隔不均匀，会严重影响音画同步和录制出的 MP4 质量。
     *
     * 参考文档：[自定义采集和渲染](https://cloud.tencent.com/document/product/647/34066)。
     * @param frame 视频数据，支持 I420 格式数据。
     * @note - SDK 内部有帧率控制逻辑，目标帧率以您在 setVideoEncoderParam 中设置的为准，太快会自动丢帧，太慢则会自动补帧。
     *       - 可以设置 frame 中的 timestamp 为 0，相当于让 SDK 自己设置时间戳，但请“均匀”地控制 sendCustomVideoData 的调用间隔，否则会导致视频帧率不稳定。
     *       - iOS、Mac平台目前仅支持传入TRTCVideoPixelFormat_I420或TRTCVideoPixelFormat_BGRA32格式的视频帧
     *       - Windows、Android平台目前仅支持传入TRTCVideoPixelFormat_I420格式的视频帧
     */
    virtual __declspec(
        deprecated("use sendCustomVideoData(TRTCVideoStreamType type, TRTCVideoFrame* frame) "
                   "instead")) void sendCustomVideoData(TRTCVideoFrame* frame){};

    /**
    * 暂停/恢复发布本地的视频流
    *
    * 该接口可以暂停（或恢复）发布本地的视频画面，暂停之后，同一房间中的其他用户将无法继续看到自己画面。
    * 该接口等效于 start/stopLocalPreview 这两个接口，但具有更好的性能和响应速度。
    * 因为 start/stopLocalPreview 需要打开和关闭摄像头，而打开和关闭摄像头都是硬件设备相关的操作，非常耗时。
    * 相比之下，muteLocalVideo 只需要在软件层面对数据流进行暂停或者放行即可，因此效率更高，也更适合需要频繁打开关闭的场景。
    * 当暂停发布本地视频后，同一房间中的其他用户将会收到 onUserVideoAvailable(userId, false) 回调通知。
    * 当恢复发布本地视频后，同一房间中的其他用户将会收到 onUserVideoAvailable(userId, true) 回调通知。
    * @param mute true：暂停；false：恢复。
    */
    virtual __declspec(
        deprecated("use muteLocalVideo(TRTCVideoStreamType type, bool mute) "
            "instead")) void muteLocalVideo(bool mute) {};

    /**
    * 暂停/恢复订阅远端用户的视频流
    *
    * 该接口仅暂停/恢复接收指定用户的视频流，但并不释放显示资源，视频画面会被冻屏在接口调用时的最后一帧。
    * @param userId 指定远端用户的 ID。
    * @param mute 是否暂停接收。
    * @note 该接口支持您在进入房间（enterRoom）前调用，暂停状态会在退出房间（exitRoom）在之后会被重置。
    */
    virtual __declspec(
        deprecated("use muteRemoteVideoStream(const char* userId, TRTCVideoStreamType type, bool mute) "
            "instead")) void muteRemoteVideoStream(const char* userId, bool mute) {};

    /**
    *  开始进行网络测速（进入房间前使用）
    *
    * @deprecated v9.2 版本开始不推荐使用，建议使用 startSpeedTest(params) 接口替代之。
    */
    virtual __declspec(
        deprecated("use startSpeedTest(const TRTCSpeedTestParams& params) "
            "instead")) void startSpeedTest(uint32_t sdkAppId, const char* userId, const char* userSig) {};

    /// @}
};
/// @}
}

#endif /* __IDEPRECATEDTRTCCLOUD_H__ */
