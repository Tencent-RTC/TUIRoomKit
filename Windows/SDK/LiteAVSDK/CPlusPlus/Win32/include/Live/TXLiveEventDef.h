#ifndef __TXLIVESDKEVENTDEF_H__
#define __TXLIVESDKEVENTDEF_H__

#include "TXLiteAVCode.h"
#include "TXLiveTypeDef.h"

/**
* 推流事件列表
*/
namespace PushEvt
{
    enum PushEvent
    {
        PUSH_EVT_CONNECT_SUCC = 1001,   // 已经连接推流服务器
        PUSH_EVT_PUSH_BEGIN = 1002,   // 已经与服务器握手完毕,开始推流
        PUSH_EVT_OPEN_CAMERA_SUCC = 1003,   // 打开摄像头成功
        PUSH_EVT_CHANGE_RESOLUTION = 1005,	 // 推流动态调整分辨率
        PUSH_EVT_CHANGE_BITRATE = 1006,   // 推流动态调整码率
        PUSH_EVT_FIRST_FRAME_AVAILABLE = 1007,   // 首帧画面采集完成
        PUSH_EVT_START_VIDEO_ENCODER = 1008,   // 编码器启动
        PUSH_EVT_SNAPSHOT_RESULT = 1022, // 截图快照返回码
        PUSH_EVT_CAMERA_REMOVED = 1023,   // 摄像头设备已被移出（PC版SDK专用）
        PUSH_EVT_CAMERA_AVAILABLE = 1024,   // 摄像头设备重新可用（PC版SDK专用）
        PUSH_EVT_CAMERA_CLOSED = 1025,   // 关闭摄像头完成（PC版SDK专用）
        PUSH_EVT_LOCAL_RECORD_RESULT = 1029,// 本地录制结果
        PUSH_EVT_LOCAL_RECORD_PROGRESS  = 1030, // 本地录制状态通知

        PUSH_ERR_OPEN_CAMERA_FAIL = -1301,   // 打开摄像头失败
        PUSH_ERR_OPEN_MIC_FAIL = -1302,   // 打开麦克风失败
        PUSH_ERR_VIDEO_ENCODE_FAIL = -1303,   // 视频编码失败
        PUSH_ERR_AUDIO_ENCODE_FAIL = -1304,   // 音频编码失败
        PUSH_ERR_UNSUPPORTED_RESOLUTION = -1305,   // 不支持的视频分辨率
        PUSH_ERR_UNSUPPORTED_SAMPLERATE = -1306,   // 不支持的音频采样率
        PUSH_ERR_NET_DISCONNECT = -1307,   // 网络断连,且经多次重连抢救无效,可以放弃治疗,更多重试请自行重启推流
        PUSH_ERR_CAMERA_OCCUPY = -1316,   // 摄像头正在被占用中，可尝试打开其他摄像头（PC版SDK专用）

        PUSH_WARNING_NET_BUSY = 1101,   // 网络状况不佳：上行带宽太小，上传数据受阻
        PUSH_WARNING_RECONNECT = 1102,   // 网络断连, 已启动自动重连 (自动重连连续失败超过三次会放弃)
        PUSH_WARNING_HW_ACCELERATION_FAIL = 1103,   // 硬编码启动失败，采用软编码
        PUSH_WARNING_VIDEO_ENCODE_FAIL = 1104,   // 视频编码失败,非致命错,内部会重启编码器
        PUSH_WARNING_BEAUTYSURFACE_VIEW_INIT_FAIL = 1105,   // 视频编码码率异常，警告
        PUSH_WARNING_VIDEO_ENCODE_BITRATE_OVERFLOW = 1106,   // 视频编码码率异常，警告
        PUSH_WARNING_DNS_FAIL = 3001,   // RTMP -DNS解析失败
        PUSH_WARNING_SEVER_CONN_FAIL = 3002,   // RTMP服务器连接失败
        PUSH_WARNING_SHAKE_FAIL = 3003,   // RTMP服务器握手失败
        PUSH_WARNING_SERVER_DISCONNECT = 3004,	 // RTMP服务器主动断开，请检查推流地址的合法性或防盗链有效期
        PUSH_WARNING_SERVER_NO_DATA = 3008,         // 超过30s没有数据发送，主动断开连接。
    };
}

/**
* 播放事件列表
*/
namespace PlayEvt
{
    enum PlayEvent
    {
        PLAY_EVT_CONNECT_SUCC = 2001,   // 已经连接服务器
        PLAY_EVT_RTMP_STREAM_BEGIN = 2002,   // 已经连接服务器，开始拉流
        PLAY_EVT_RCV_FIRST_I_FRAME = 2003,   // 渲染首个视频数据包(IDR)
        PLAY_EVT_PLAY_BEGIN = 2004,   // 视频播放开始
        PLAY_EVT_PLAY_PROGRESS = 2005,   // 视频播放进度
        PLAY_EVT_PLAY_END = 2006,   // 视频播放结束
        PLAY_EVT_PLAY_LOADING = 2007,   // 视频播放loading
        PLAY_EVT_START_VIDEO_DECODER = 2008,   // 解码器启动
        PLAY_EVT_CHANGE_RESOLUTION = 2009,   // 视频分辨率改变
        PLAY_EVT_RCV_FIRST_AUDIO_FRAME = 2026,   // 音频首次播放
        PLAY_EVT_SNAPSHOT_RESULT = 1022, // 截图快照返回码
        EVT_PLAY_GET_MESSAGE = 2012,   // 消息事件

        PLAY_ERR_NET_DISCONNECT = -2301,   // 网络断连,且经多次重连抢救无效,可以放弃治疗,更多重试请自行重启播放
        PLAY_ERR_GET_RTMP_ACC_URL_FAIL = -2302,   // 获取加速拉流地址失败

        PLAY_WARNING_VIDEO_DECODE_FAIL = 2101,   // 当前视频帧解码失败
        PLAY_WARNING_AUDIO_DECODE_FAIL = 2102,   // 当前音频帧解码失败
        PLAY_WARNING_RECONNECT = 2103,   // 网络断连, 已启动自动重连 (自动重连连续失败超过三次会放弃)
        PLAY_WARNING_RECV_DATA_LAG = 2104,   // 网络来包不稳：可能是下行带宽不足，或由于主播端出流不均匀
        PLAY_WARNING_VIDEO_PLAY_LAG = 2105,   // 当前视频播放出现卡顿（用户直观感受）
        PLAY_WARNING_HW_ACCELERATION_FAIL = 2106,   // 硬解启动失败，采用软解
        PLAY_WARNING_VIDEO_DISCONTINUITY = 2107,   // 当前视频帧不连续，可能丢帧
        PLAY_WARNING_FIRST_IDR_HW_DECODE_FAIL = 2108,   // 当前流硬解第一个I帧失败，SDK自动切软解
        PLAY_WARNING_DNS_FAIL = 3001,   // RTMP -DNS解析失败
        PLAY_WARNING_SEVER_CONN_FAIL = 3002,   // RTMP服务器连接失败
        PLAY_WARNING_SHAKE_FAIL = 3003,   // RTMP服务器握手失败
        PLAY_WARNING_SERVER_DISCONNECT = 3004,	 // RTMP服务器主动断开
    };
}

class ITXLivePusherCallback
{
public:
    virtual ~ITXLivePusherCallback() {}

    /**
    * \brief：TXLivePusher的推流事件通知
    * \
    * \param：eventId    - 事件ID, 见 TXLiveEventDef.h 中的事件定义 - namespace : PushEvt
    * \param：paramCount - 事件详情是一个 <key-value> 数组，paramCount告诉您该数组中有多少个元素
    * \param：paramKeys  - 事件详情的 key 数组
    * \param：paramValues- 事件详情的 value 数组
    * \param：pUserData  - 您在调用 setCallback 时所设置的透传数据，如果您没有设置，该参数始终为 NULL
    * \return：无
    * \attention: 这里没有使用 std::string 作为出参的原因是不同版本的 vs runtime 会有 stl 版本兼容问题，目前我们的 SDK 采用 VS2015 实现。
    */
    virtual void onEventCallback(int eventId, const int paramCount, const char **paramKeys, const char **paramValues, void *pUserData) {}

    /**
    * \brief：获取 SDK 所采集的视频数据
    * \param：yuv420 - i420 格式的 YUV 视频数据 buffer
    * \param：length - buffer 的长度，单位是字节，对于i420而言， length = width * height * 3 / 2
    * \param：width  - 画面的宽度，单位 pixel
    * \param：height - 画面的高度，单位 pixel
    * \param：pUserData  - 您在调用 setCallback 时所设置的透传数据，如果您没有设置，该参数始终为 NULL
    * \return：无
    */
    virtual void onVideoCaptureCallback(char * yuv420, unsigned int length, int width, int height, void *pUserData) {}

    /**
    * \brief：获取 SDK 所采集的音频数据
    * \param：pcm       - SDK采集的音频裸数据buffer
    * \param：length    - buffer 的长度，单位是字节
    * \param：sampleRate- 音频采样率，可预期的值有： 8000、16000、32000、44100、48000
    * \param：channel   - 声道数：单声道 或者 双声道， SDK 默认是走单声道的
    * \param：timestamp - 当前这帧音频buffer的时间戳
    * \param：pUserData - 您在调用 setCallback 时所设置的透传数据，如果您没有设置，该参数始终为 NULL
    * \return：无
    */
    virtual void onAudioCaptureCallback(unsigned char * pcm, unsigned int length, unsigned int sampleRate, unsigned int channel, unsigned long long timestamp, void *pUserData) {}
};

class ITXLivePlayerCallback
{
public:
    virtual ~ITXLivePlayerCallback() {}

    /**
    * \brief：TXLivePlayer 的播放事件通知
    * \
    * \param：eventId    - 事件ID, 见 TXLiveEventDef.h 中的事件定义 - namespace : PlayEvt
    * \param：paramCount - 事件详情是一个 <key-value> 数组，paramCount告诉您该数组中有多少个元素
    * \param：paramKeys  - 事件详情的 key 数组
    * \param：paramValues- 事件详情的 value 数组
    * \param：pUserData  - 您在调用 setCallback 时所设置的透传数据，如果您没有设置，该参数始终为 NULL
    * \return：无
    * \attention: 这里没有使用 std::string 作为出参的原因是不同版本的 vs runtime 会有 stl 版本兼容问题，目前我们的 SDK 采用 VS2015 实现。
    */
    virtual void onEventCallback(int eventId, const int paramCount, const char **paramKeys, const char **paramValues, void *pUserData) {}

    /**
    * \brief：获取 SDK 要播放的视频数据，如果您需要自己渲染视频画面，只需要返回 true 即可接管画面的渲染，建议不要在回调函数做耗时操作
    * \param：data   - 视频数据 buffer
    * \param：length - buffer 的长度，单位是字节，对于i420而言， length = width * height * 3 / 2
    * \param：width  - 画面的宽度，单位 pixel
    * \param：height - 画面的高度，单位 pixel
    * \param：format - 视频格式，参考 TXLiveTypeDef.h 中定义的 TXEOutputVideoFormat 枚举值
    * \param：pUserData  - 您在调用 setCallback 时所设置的透传数据，如果您没有设置，该参数始终为 NULL
    */
    virtual void onVideoDecodeCallback(char* data, unsigned int length, int width, int height, TXEOutputVideoFormat format, void *pUserData) { return;  }

    /**
    * \brief：获取 SDK 要播放的音频数据，如果您需要自己播放声音，只需要返回 true 即可接管声音的播放，建议不要在回调函数做耗时操作
    * \param：pcm       - 音频裸数据buffer
    * \param：length    - buffer 的长度，单位是字节
    * \param：sampleRate- 音频采样率，可预期的值有： 8000、16000、32000、44100、48000
    * \param：channel   - 声道数：单声道 或者 双声道， SDK 默认是走单声道的
    * \param：timestamp - 当前这帧音频buffer的时间戳
    * \param：pUserData - 您在调用 setCallback 时所设置的透传数据，如果您没有设置，该参数始终为 NULL
    */
    virtual void onAudioDecodeCallback(unsigned char * pcm, unsigned int length, unsigned int sampleRate, unsigned int channel, unsigned long long timestamp, void *pUserData) { return; }
};

#endif /* __TXLIVESDKEVENTDEF_H__ */
