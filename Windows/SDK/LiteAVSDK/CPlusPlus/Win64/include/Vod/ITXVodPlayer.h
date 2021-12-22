#ifndef __ITXVODPLAYER_H__
#define __ITXVODPLAYER_H__
/*
* Module:  ITXVodPlayer @ TXLiteAVSDK
*
* Function: 腾讯云视频通话播片功能的主要接口类
*
* 创建/使用/销毁ITXVodPlayer对象的示例代码：
* <pre>
*     ITXVodPlayer *vodPlayer = createTXVodPlayer("D:/video/test.mp4");
*     if(vodPlayer)
*     {
*         vodPlayer->start();
*     }
*     ----------------------------------
*     destroyTXVodPlayer(&vodPlayer);
*     vodPlayer = NULL;
* </pre>
*/

#include "TXLiteAVBase.h"
#include <memory>

class ITXVodPlayerEventCallback;
class ITXVodPlayerDataCallback;
class ITXVodPlayer;

extern "C" {
    /**
    * \brief 用于动态加载dll时，导出TXVodPlayer C++对象。
    *
    * \return ITXVodPlayer对象指针，注意：delete ITXVodPlayer*会编译错误，需要调用destroyTXVodPlayer释放。
    */
    LITEAV_API ITXVodPlayer* createTXVodPlayer(const char *mediaFile, bool repeat = false);

    /**
    * \brief 析构ITXVodPlayer对象
    */
    LITEAV_API void destroyTXVodPlayer(ITXVodPlayer** pTXVodPlayer);
}

class ITXVodPlayer
{
protected:
    virtual ~ITXVodPlayer() {};

public:
    /**
     * 绑定 TRTC SDK
     * param trtcCloud TRTC 实例指针
     * note 用于辅流推送，绑定后音频播放由TRTC接管
     */
    virtual void attachTRTC(void* trtcCloud) = 0;

     /**
      * 解绑TRTC SDK
      */
    virtual void detachTRTC() = 0; 

    /**
     * 开始向TRTC发布辅路视频流
     */
    virtual void publishVideo() = 0; 

    /**
     * 开始向TRTC发布辅路音频流
     */
    virtual void publishAudio() = 0; 

    /**
     * 结束向TRTC发布辅路视频流
     */
    virtual void unpublishVideo() = 0; 

    /**
     * 结束向TRTC发布辅路音频流
     */
    virtual void unpublishAudio() = 0; 
    
     /**
     * 设置多媒体事件回调
     * param callback 要使用的多媒体文件播放回调接收实例
     */
    virtual void setEventCallback(ITXVodPlayerEventCallback* callback) = 0;

     /**
     * 设置多媒体文件播放回调
     * param callback 要使用的多媒体文件播放回调接收实例
     */
    virtual void setDataCallback(ITXVodPlayerDataCallback* callback) = 0;

    /**
    * 开始多媒体文件播放
    *  支持的视频格式包括：mp4、avi、mkv、wmv、m4v。
    *  支持的音频格式包括：mp3、wav、wma、aac。
    */
    virtual void start() = 0;

    /**
    * 暂停多媒体文件播放
    */
    virtual void pause() = 0;

    /**
    * 恢复多媒体文件播放
    */
    virtual void resume() = 0;

    /**
    * 停止多媒体文件播放
    */
    virtual void stop() = 0;

    /**
    * 设置多媒体文件播放进度
    * param msPos 播放进度（单位毫秒）
    */
    virtual void seek(uint64_t msPos) = 0;

    /**
     * 设置多媒体文件播放速度
     * param rate 播放速度（0.5-2.0）
     */
    virtual void setRate(float rate) = 0;

     /**
     * 设置播放渲染句柄
     * param hwnd 窗口句柄
     */
    virtual void setView(HWND hwnd) = 0;

     /**
     * 获取多媒体文件总时长
     */
    virtual long getDuration() = 0;

    /**
     * 获取视频宽度
     */
    virtual int getWidth() = 0;

     /**
     * 获取视频高度
     */
    virtual int getHeight() = 0;

     /**
     * 设置多媒体音量
     * param volume 音量大小，100为原始音量，范围是：[0 ~ 150]，默认值为100
     */
    virtual void setVolume(int volume) = 0;

     /**
     * 静音/取消静音
     * param mute true：静音；false：取消静音
     */
    virtual void mute(bool mute) = 0;

    /**
     * \brief 设置本地图像的顺时针旋转角度
     * \param rotation 支持 TRTCVideoRotation90 、 TRTCVideoRotation180 以及 TRTCVideoRotation270
     * 旋转角度，默认值：TRTCVideoRotation0
     * \note 用于窗口渲染模式
     */
    virtual void setRenderRotation(TRTCVideoRotation rotation) = 0;

     /**
     * 设置本地图像的填充模式
     * param mode
     * 填充（画面可能会被拉伸裁剪）或适应（画面可能会有黑边），默认值：TRTCVideoFillMode_Fit
     * note 用于窗口渲染模式
     */
    virtual void setFillMode(TRTCVideoFillMode mode) = 0;

     /**
     * 设置本地图像的镜像模式
     * param mirror 镜像模式，默认值：false（非镜像模式）
     * note 用于窗口渲染模式
     */
    virtual void setMirror(bool mirror) = 0;
};

enum TXVodPlayerError
{
    TXVodPlayerErrorFileNotExist,
    TXVodPlayerErrorFormatNotSupport,
    TXVodPlayerErrorOpenfailed
};

class ITXVodPlayerDataCallback {
   public:
    virtual ~ITXVodPlayerDataCallback(){};

    /**
     * Vod视频帧回调
     * param frame 视频帧数据
     */
    virtual int onVodVideoFrame(TRTCVideoFrame& frame) = 0;

    /**
     * Vod音频帧回调
     * param frame 音频帧数据
     */
    virtual int onVodAudioFrame(TRTCAudioFrame& frame) = 0;
};

class ITXVodPlayerEventCallback {
public:
    virtual ~ITXVodPlayerEventCallback(){};

    /**
    * 当多媒体文件播放开始时，SDK会通过此回调通知
    *
    * param msLength 多媒体文件总长度，单位毫秒
    */
    virtual void onVodPlayerStarted(uint64_t msLength) {}

    /**
    * 当多媒体文件播放进度改变时，SDK会通过此回调通知
    *
    * param msPos 多媒体文件播放进度，单位毫秒
    */
    virtual void onVodPlayerProgress(uint64_t msPos) {}

    /**
    * 当多媒体文件播放暂停时，SDK会通过此回调通知
    */
    virtual void onVodPlayerPaused() {};

    /**
    * 当多媒体文件播放恢复时，SDK会通过此回调通知
    */
    virtual void onVodPlayerResumed() {};

    /**
    * 当多媒体文件播放停止时，SDK会通过此回调通知
    *
    * param reason 停止原因，0表示用户主动停止，1表示文件播放完，2表示视频断流
    */
    virtual void onVodPlayerStoped(int reason) {};

    /**
    * 当多媒体文件播放出错时，SDK会通过此回调通知
    *
    * param error 错误码
    */
    virtual void onVodPlayerError(int error) = 0;
};

#endif //__ITXVODPLAYER_H__