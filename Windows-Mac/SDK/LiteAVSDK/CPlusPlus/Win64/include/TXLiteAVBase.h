/**
 * Module:   TXLiteAVBase @ liteav
 *
 * Function: SDK 公共定义头文件
 *
 */

#ifndef __TXLITEAVBASE_H__
#define __TXLITEAVBASE_H__

#ifdef _WIN32
//防止windows用户引用TXLiteAVBase.h报错
#include "TRTCTypeDef.h"
#endif

#ifdef LITEAV_EXPORTS
#define LITEAV_API __declspec(dllexport)
#else
#define LITEAV_API __declspec(dllimport)
#endif
extern "C" {
    /**
     * NTP 校时事件回调接口
     *
     * @brief NTP 校时回调，调用 TXLiveBase updateNetworkTime 后会触发
     * @param errCode 0：表示校时成功且偏差在30ms以内，1：表示校时成功但偏差可能在 30ms
     * 以上，-1：表示校时失败
     */
    typedef void (*onUpdateNetworkTime)(int errCode, const char* errMsg);
}

extern "C" {
    /// @name SDK 导出基础功能接口
    /// @{
    /**
     * \brief 获取 SDK 版本号
     *
     * \return 返回 UTF-8 编码的版本号。
     */
    LITEAV_API const char* getLiteAvSDKVersion();

    /**
     * 设置 liteav SDK 接入的环境。
     * 腾讯云在全球各地区部署的环境，按照各地区政策法规要求，需要接入不同地区接入点。
     * 
     * @param env_config 需要接入的环境，SDK 默认接入的环境是：默认正式环境。
     * @return 0：成功；其他：错误
     * @note 目标市场为中国大陆的客户请不要调用此接口，如果目标市场为海外用户，请通过技术支持联系我们，了解 env_config 的配置方法，以确保 App 遵守 GDPR 标准。
     */
    LITEAV_API int setGlobalEnv(const char* env_config);

     /**
     * 启动 NTP 校时服务
     *
     * @return 0：启动成功；< 0：启动失败
     */
    LITEAV_API int updateNetworkTime();

    /**
     * 获取 NTP 时间戳（毫秒），请在收到 onUpdateNetworkTime 回调后使用
     *
     * @return NTP 时间戳（毫秒），若返回 0：未启动 NTP 校时或校时失败，请重启校时
     */
    LITEAV_API long long getNetworkTimestamp();

    /**
     * 设置 NTP 校时事件回调。
     *
     * @param callback onUpdateNetworkTime回调指针。
     */
    LITEAV_API void setUpdateNetworkTimeCallback(onUpdateNetworkTime callback);

    /// @}
}

/**
 * 以下定义仅用于兼容原有接口，具体定义参见 TRTCTypeDef.h 文件
 */
typedef TRTCVideoBufferType LiteAVVideoBufferType;
#define LiteAVVideoBufferType_Unknown TRTCVideoBufferType_Unknown
#define LiteAVVideoBufferType_Buffer  TRTCVideoBufferType_Buffer
#define LiteAVVideoBufferType_Texture TRTCVideoBufferType_Texture

typedef TRTCVideoPixelFormat LiteAVVideoPixelFormat;
#define LiteAVVideoPixelFormat_Unknown    TRTCVideoPixelFormat_Unknown
#define LiteAVVideoPixelFormat_I420       TRTCVideoPixelFormat_I420
#define LiteAVVideoPixelFormat_Texture_2D TRTCVideoPixelFormat_Texture_2D
#define LiteAVVideoPixelFormat_BGRA32     TRTCVideoPixelFormat_BGRA32
#define LiteAVVideoPixelFormat_RGBA32     TRTCVideoPixelFormat_RGBA32

typedef TRTCAudioFrameFormat LiteAVAudioFrameFormat;
#define LiteAVAudioFrameFormatNone TRTCAudioFrameFormatNone
#define LiteAVAudioFrameFormatPCM  TRTCAudioFrameFormatPCM

typedef TRTCVideoRotation LiteAVVideoRotation;
#define LiteAVVideoRotation0   TRTCVideoRotation0
#define LiteAVVideoRotation90  TRTCVideoRotation90
#define LiteAVVideoRotation180 TRTCVideoRotation180
#define LiteAVVideoRotation270 TRTCVideoRotation270

typedef TRTCVideoFrame LiteAVVideoFrame;
typedef TRTCAudioFrame LiteAVAudioFrame;

typedef TRTCScreenCaptureSourceType LiteAVScreenCaptureSourceType;
#define LiteAVScreenCaptureSourceTypeUnknown TRTCScreenCaptureSourceTypeUnknown
#define LiteAVScreenCaptureSourceTypeWindow  TRTCScreenCaptureSourceTypeWindow
#define LiteAVScreenCaptureSourceTypeScreen  TRTCScreenCaptureSourceTypeScreen
#define LiteAVScreenCaptureSourceTypeCustom  TRTCScreenCaptureSourceTypeCustom

typedef TRTCImageBuffer LiteAVImageBuffer;
typedef TRTCScreenCaptureSourceInfo LiteAVScreenCaptureSourceInfo;
typedef ITRTCScreenCaptureSourceList ILiteAVScreenCaptureSourceList;
typedef TRTCScreenCaptureProperty LiteAVScreenCaptureProperty;

typedef ITRTCDeviceInfo ILiteAVDeviceInfo;
typedef ITRTCDeviceCollection ILiteAVDeviceCollection;
#endif /* __TXLITEAVBASE_H__ */
