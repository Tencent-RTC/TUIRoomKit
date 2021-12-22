#ifndef __ITXLIVEPUSHER_H__
#define __ITXLIVEPUSHER_H__
/*
* Module:  ITXLivePusher @ TXLiteAVSDK
*
* Function: 直播推流功能的主要接口类
*
* 创建/使用/销毁ITXLivePusher对象的示例代码：
* <pre>
*     ITXLivePusher *livePusher = createTXLivePusher();
*     if(livePusher)
*     {
*         int nMicDevice = livePusher->micDeviceCount();
*     }
*     destroyTXLivePusher(&livePusher);
*     livePusher = NULL;
* </pre>
*/

#include "TXLiveTypeDef.h"
#include "TXLiteAVBase.h"
#include <Windows.h>
#include <memory>

#define MIC_DEVICE_NAME_MAX_SIZE    (512)
class ITXLivePusherCallback;
class ITXLivePusher;

extern "C" {
    /**
    * \brief 用于动态加载dll时，导出ITXLivePusher C++对象。
    *
    * \return TXLivePusher对象指针，注意：delete ITXLivePusher*会编译错误，需要调用destroyTXLivePusher释放。
    */
    LITEAV_API ITXLivePusher* createTXLivePusher();

    /**
    * \brief 析构ITXLivePusher对象
    */
    LITEAV_API void destroyTXLivePusher(ITXLivePusher** pTXlivePusher);
}

class ITXLivePusher
{
protected:
    virtual ~ITXLivePusher() {};

public:
	/**
	* \brief：设置回调 TXLivePusher 的回调代理，监听推流事件
	* \param：callback  - ITXLivePusherCallback 类型的代理指针
	* \param：pUserData - 一般情况下传 NULL 就可以了，透传用户数据到 ITXLivePusherCallback 的回调函数
	* \return 无
	*/
    virtual void setCallback(ITXLivePusherCallback* callback, void* pUserData) = 0;

    /**
    * \brief 查询摄像头列表
    *
    * \return 摄像头管理器对象指针 ITRTCDeviceCollection*
    *  示例代码：
    *  <pre>
    *      ITRTCDeviceCollection * pDevice = m_pCloud->getCameraDevicesList();
    *      for (int i = 0; i < pDevice->getCount(); i++)
    *      {
    *          std::wstring name = UTF82Wide(pDevice->getDeviceName(i));
    *      }
    *      pDevice->release();
    *      pDevice = null;
    *  </pre>
    * \note 如果delete ITRTCDeviceCollection*指针会编译错误，SDK维护ITRTCDeviceCollection对象的生命周期。
    */
    virtual ILiteAVDeviceCollection* getCameraDevicesList() = 0;

    /**
    * \brief  查询麦克风列表
    *
    * \return 麦克风管理器对象指针 ITRTCDeviceCollection*
    *  示例代码：
    *  <pre>
    *      ITRTCDeviceCollection * pDevice = m_pCloud->getMicDevicesList();
    *      for (int i = 0; i < pDevice->getCount(); i++)
    *      {
    *          std::wstring name = UTF82Wide(pDevice->getDeviceName(i));
    *      }
    *      pDevice->release();
    *      pDevice = null;
    *  </pre>
    * \note 如果delete ITRTCDeviceCollection*指针会编译错误，SDK维护ITRTCDeviceCollection对象的生命周期。
    */
    virtual ILiteAVDeviceCollection* getMicDevicesList() = 0;

    /**
    * \brief：选择指定的麦克风作为录音设备，不调用该接口时，默认选择索引为0的麦克风
    * \param：index - 麦克风设备的索引，要求index值小于 micDeviceCount 接口的返回值
    */
    virtual void selectMicDevice(unsigned int index) = 0;

    /**
    * \brief：查询已选择麦克风的音量
    * \return：音量值，范围是[0, 65535]
    */
    virtual unsigned int micVolume() = 0;

    /**
    * \brief：设置已选择麦克风的音量
    * \param：volume - 设置的音量大小，范围是[0, 65535]
    */
    virtual void setMicVolume(unsigned int volume) = 0;

    /**
    * \brief：查询已选择麦克风的能量值，指示音量的大小
    * \return：能量值，范围是[0, 100]
    */
    virtual uint32_t micVolumeIndication() = 0;

    /**
    * \brief：设置 SDK 采集音量。
    *
    * \return volume 音量大小，取值[0, 65535]，默认值为65535
    */
    virtual void setAudioCaptureVolume(int volume) = 0;

    /**
    * \brief： 获取 SDK 采集音量
    */
    virtual int getAudioCaptureVolume() = 0;

    /**
    * \brief：开启麦克风测试
    */
    virtual void openMicTest() = 0;

    /**
    * \brief：关闭麦克风测试
    */
    virtual void closeMicTest() = 0;

	/**
	@brief 打开系统声音采集。
	@details 采集系统声音。
	@param [in] szPlayerPath 播放器地址;如果用户此参数填空或不填，表示采集系统中的所有声音;
			    如果填入exe程序(如:酷狗、QQ音乐)所在路径,将会启动此程序，并只采集此程序的声音;
	*/
    virtual void openSystemVoiceInput(const char* szPlayerPath = NULL) = 0;

	/**
	@brief 关闭系统声音采集。
	*/
    virtual void closeSystemVoiceInput() = 0;

	/**
	@brief 设置系统声音采集的音量。
	@param [in] value 设置目标音量,取值范围[0,100].
	*/
    virtual void setSystemVoiceInputVolume(int value) = 0;


    /**
    * \brief：设置音频前处理开关
    * \param：preprocessType - 参考 TXLiveTypeDef.h 中定义的 TXEAudioPreprocessType。
    * \note : 默认开启AEC、AGC、NS，如需关闭回声消除预处理enableAudioPreprocess(TXE_AUDIO_PREPROCESS_AEC, false)。
    */
    virtual void enableAudioPreprocess(TXEAudioPreprocessType preprocessType, bool enable) = 0;

    /**
    * \brief：设置音频前处理开关
    * \param：channels - 参考 TXLiveTypeDef.h 中定义的 TXEAudioChannels 枚举值，SDK 内部默认选择 TXE_AUDIO_CHANNELS_1 单声道
    */
    virtual void setAudioChannels(TXEAudioChannels channels) = 0;

    /**
    * \brief：启动音频采集
    * \param：srcType - 音频数据源类型
    */
    virtual void startAudioCapture(TXEAudioCaptureSrcType srcType = TXE_AUDIO_SRC_SDK_DATA) = 0;

    /**
    * \brief：关闭音频采集
    */
    virtual void stopAudioCapture() = 0;

    /**
    * \brief：启动视频源预览
    * \param：srcType  - 参考 TXLiveTypeDef.h 中定义的 TXEVideoCaptureSrcType 枚举值
    * \param：rendHwnd - 承载预览画面的 HWND，目前 SDK 内部会向 rendHwnd (整个窗口)上绘制图像的
    * \param：dataFormat - srcType = TXE_VIDEO_SRC_USER_DATA时生效，指定传入的参数
    * \return: 成功 or 失败
    */
    virtual bool startPreview(TXEVideoCaptureSrcType srcType, HWND rendHwnd) = 0;

	/**
	* \brief：重设摄像头预览窗口
	* \param：rendHwnd - 承载预览画面的 HWND，目前 SDK 内部会向 rendHwnd (整个窗口)上绘制图像的
	* \return 无
	*/
    virtual void updatePreview(HWND rendHwnd) = 0;

	/**
	* \brief：关闭视频源预览
	* \return 无
	*/
    virtual void stopPreview() = 0;

    /**
    * \brief  【屏幕共享】枚举可共享的窗口列表，
    *
    * \param thumbSize - 指定要获取的窗口缩略图大小，缩略图可用于绘制在窗口选择界面上
    * \param iconSize  - 指定要获取的窗口图标大小
    *
    * \return 列表通过返回值 ILiteAVScreenCaptureSourceList 返回
    * \note   如果delete ILiteAVScreenCaptureSourceList*指针会编译错误，SDK维护ILiteAVScreenCaptureSourceList对象的生命周期。
    */
    virtual ILiteAVScreenCaptureSourceList* getScreenCaptureSources(const SIZE &thumbSize, const SIZE &iconSize) = 0;

    /**
    * \brief  【屏幕共享】选择要分享的目标窗口或目标区域，支持如下四种情况：
    *
    * >>> 共享整个屏幕 : sourceInfoList 中type为Screen的source，captureRect 设为 { 0, 0, 0, 0 }
    * >>> 共享指定区域 : sourceInfoList 中type为Screen的source，captureRect 设为非 NULL，比如 { 100, 100, 300, 300 }
    * >>> 共享整个窗口 : sourceInfoList 中type为Window的source，captureRect 设为 { 0, 0, 0, 0 }
    * >>> 共享窗口区域 : sourceInfoList 中type为Window的source，captureRect 设为非 NULL，比如 { 100, 100, 300, 300 }
    *
    * \note: 您可以在屏幕分享的过程中掉用该函数来切换目标窗口或者调整目标区域
    *
    * \param source             - 指定分享源
    * \param captureRect        - 指定捕获的区域
    * \param captureMouse       - 指定是否捕获鼠标指针
    * \param highlightWindow    - 指定是否高亮正在共享的窗口以及当捕获图像被遮挡时高亮遮挡窗口提示用户移走遮挡
    *
    */
    virtual void selectScreenCaptureTarget(const LiteAVScreenCaptureSourceInfo &source, const RECT& captureRect, const LiteAVScreenCaptureProperty& property) = 0;

	/**
	* \brief：推流的图像截图到本地
	* \param：filePath - 存储路径
	* \param: length - 路径字符长度
	* \return：0成功，非0失败：-1:失败，-2路径非法，-3文件存在，-4未推流
	*/
    virtual int captureVideoSnapShot(const wchar_t * filePath, unsigned int length) = 0;

	/**
	* \brief：启动推流 (在 startPush 之前需要先 startPreview 启动摄像头预览，否则推送出去的数据流里只有音频)
	* \param：url - 一个合法的推流地址，腾讯云的推流 URL 都要求带有 txSecret 和 txTime 防盗链签名，如果您发现推流推不上去，请检查这两个签名是否合法。
	* \return：成功 or 失败，内存分配、资源申请失败等原因可能会导致返回失败
	*/
    virtual bool startPush(const char * url) = 0;

	/**
	* \brief：停止推流，注意推流 url 有排他性，也就是一个推流 Url 同时只能有一个推流端向上推流
	* \param：无
	* \return:无
    * \attention: 若通过 startPreview 接口开启了预览，在调用这个接口前，请先调用 stopPreview 接口
	*/
    virtual void stopPush() = 0;

	/**
	* \brief：切换摄像头，支持在推流中动态切换
	* \param：cameraIndex : 摄像头需要，取值返回：  0 ~ (摄像头个数 - 1)
	* \return:无
	*/
    virtual void switchCamera(int cameraIndex) = 0;

    /*视频本地录制*/
    /*
    * 支持不推流录制。
    * szRecordPath:视频录制后存储路径，目前只能传 .mp4 后缀文件。
    * sliceTime:   mp4文件分片时间，单位s，默认10分钟。
    * 返回值：
    *          0 成功；
    *         -1 videoPath 为nil；
    *         -2 上次录制未结束，请先stopRecord
    */
    virtual int startLocalRecord(const char* szRecordPath, uint64_t mp4SliceTime = 10 * 60) = 0;

    /*
    * 结束录制短视频，停止推流后，如果视频还在录制中，SDK内部会自动结束录制
    * 返回值：
    *       0 成功；
    *      -1 不存在录制任务；
    */
    virtual int stopLocalRecord() = 0;

	/**
	* \brief：静音接口
	* \param：mute - 是否静音
	* \return:无
	*/
    virtual void setMute(bool mute) = 0;

    /**
    * \brief：设置图像的渲染（填充）模式
    * \param：mode - 参考 TXLiveTypeDef.h 中定义的 TXERenderMode 枚举值
    * \return:无
    */
    virtual void setRenderMode(TXERenderMode mode) = 0;

    /**
    * \brief：设置图像的顺时针旋转角度
    * \param：rotation - 参考 TXLiveTypeDef.h 中定义的 TXEVideoRotationType 枚举值
    * \return:无
    */
    virtual void setRotation(TXEVideoRotationType rotation) = 0;

	/**
	* \brief：推流的画面质量预设选项
	* \param：paramType  - 预设类型，参考 TXLiveTypeDef.h 中定义的 TXEVideoQualityParamPreset 枚举值
	* \param：ratio  - 预设画面比例，参考 TXLiveTypeDef.h 中定义的 TXEVideoResolution 枚举值
	* \return:无
	* \startPush前生效。
	*/
    virtual void setVideoQualityParamPreset(TXEVideoQualityParamPreset paramType, TXEVideoRatio ratio = TXE_VIDEO_RATIO_4_3) = 0;

	/**
	* \brief：设置视频分辨率
    * \param：resolution  - 视频分辨率，参考 TXLiveTypeDef.h 中定义的 TXEVideoResolution 枚举值
	* \return:无
	*/
    virtual void setVideoResolution(TXEVideoResolution resolution) = 0;

	/**
	* \brief：设置美颜和美白效果
	* \param：beautyStyle    - 参考 TXLiveTypeDef.h 中定义的 TXEBeautyStyle 枚举值
	* \param：beautyLevel    - 美颜级别取值范围 1 ~ 9； 0 表示关闭，1 ~ 9值越大，效果越明显
	* \param：whitenessLevel - 美白级别取值范围 1 ~ 9； 0 表示关闭，1 ~ 9值越大，效果越明显
	* \return:无
	*/
    virtual void setBeautyStyle(TXEBeautyStyle beautyStyle, int beautyLevel, int whitenessLevel) = 0;

    /**
    * \brief：设置预览渲染的镜像效果
    * \param：mirror - true表示画面左右反转，false表示保持原样
    * \return:无
    */
    virtual void setRenderYMirror(bool mirror) = 0;

    /**
    * \brief：设置推流画面的镜像效果
    * \param：mirror - true表示画面左右反转，false表示保持原样
    * \return:无
    */
    virtual void setOutputYMirror(bool mirror) = 0;

	/**
	* \brief：设置视频码率，注意，不是分辨率越高画面越清晰，是码率越高画面越清晰
	* \param：bitrate - 视频码率，单位 kbps， 比如 640x360 分辨率需要配合 800kbps 的视频码率
	* \return:无
	*/
    virtual void setVideoBitRate(unsigned long bitrate) = 0;

	/**
	* \brief：设置流控策略，即是否允许 SDK 根据当前网络情况调整视频码率，以避免网络上传速度不足导致的画面卡顿
	* \param：strategy - 参考 TXLiveTypeDef.h 中定义的 TXEAutoAdjustStrategy 枚举值
	* \return:无
	*/
    virtual void setAutoAdjustStrategy(TXEAutoAdjustStrategy strategy) = 0;

	/**
	* \brief：配合 setAutoAdjustStrategy 使用，当 AutoAdjust 策略指定为 TXE_AUTO_ADJUST_NONE 时，如下的两个函数调用均视为无效
	* \param：videoBitrateMin - 允许 SDK 输出的最小视频码率，比如 640x360 分辨率下这个值适合设置为 300kbps
	* \param：videoBitrateMax - 允许 SDK 输出的最大视频码率, 比如 640x360 分辨率下这个值适合设置为 1000kbps
	* \return:无
	*/
    virtual void setVideoBitRateMin(int videoBitrateMin) = 0;
    virtual void setVideoBitRateMax(int videoBitrateMax) = 0;

	/**
	* \brief：设置视频帧率
	* \param：fps - 视频帧率，默认值为15，重启后生效
	* \return:无
	*/
    virtual void setVideoFPS(unsigned long fps) = 0;

	/**
	* \brief：设置视频暂停
	*/
    virtual void setPauseVideo(bool pause) = 0;

    /**
    * \brief：设置是否就近选路
    * \param：enable - true表示启用，false表示禁用，SDK 默认为true
    * \return:无
    */
    virtual void setNearestIP(bool enable) = 0;

    /**
    * \brief 显示仪表盘（状态统计和事件消息浮层view），方便调试
    *
    * \param showType 0: 不显示 1: 显示精简版 2: 显示全量版
    */
    virtual void showDebugView(int showType) = 0;

    /**
    * \brief 自定义视频采集接口，startPreview的srcType = TXE_VIDEO_SRC_USER_DATA时通过此接口传入I420格式的视频数据
    *
    * \param frame.data  - 视频缓冲,目前值支持紧凑内存的I420数据
    * \param frame.lenth - 视频缓冲长度
    * \param frame.width - 视频图像长
    * \param frame.width - 视频图像宽
    * \param frame.videoFormat - 视频格式，目前只支持LiteAVVideoPixelFormat_I420格式。
    * \param frame.timestamp   - 视频帧采集的时间戳。
    */
    virtual void sendCustomVideoData(LiteAVVideoFrame* frame) = 0;

    /**
    * \brief 自定义音频采集接口，startPreview的srcType = TXE_VIDEO_SRC_USER_DATA时通过此接口传入PCM音频格式数据
    *
    * \param frame.data        - PCM缓冲
    * \param frame.length      - PCM缓冲长度
    * \param frame.sampleRate  - 音频采样率，建议48K，
    * \param frame.channel     - 音频声道数，目前只支持 1或2声道。
    * \param frame.audioFormat - 音频数据格式，目前只支持LiteAVAudioFrameFormatPCM格式。
    * \param frame.timestamp   - 音频帧采集的时间戳。
    * \note  量化位数，目前值支持16byte格式。
    */
    virtual void sendCustomAudioData(LiteAVAudioFrame* frame) = 0;
};
#endif //__ITXLIVEPUSHER_H__