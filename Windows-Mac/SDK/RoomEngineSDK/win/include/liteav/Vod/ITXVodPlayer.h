#ifndef __ITXVODPLAYER_H__
#define __ITXVODPLAYER_H__

/**
 * Module:  ITXVodPlayer @ TXLiteAVSDK
 * Function: 腾讯云视频通话播片功能的主要接口类
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
#include "ITXVodPlayerCallback.h"
#include <memory>

class ITXVodPlayer;

extern "C" {

/////////////////////////////////////////////////////////////////////////////////
//
//                    VOD 播放器相关接口
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * 用于动态加载dll时，导出TXVodPlayer C++对象。
 *
 * @param mediaFile 媒体文件名称
 * @param repeat 是否需要重复播放 true：此媒体文件将重复播放 false：媒体文件仅播放一次，结束后自动停止
 * @return ITXVodPlayer对象指针，注意：delete ITXVodPlayer*会编译错误，需要调用destroyTXVodPlayer释放。
 */
LITEAV_API ITXVodPlayer* createTXVodPlayer(const char* mediaFile, bool repeat = false);

/**
 * 析构ITXVodPlayer对象
 */
LITEAV_API void destroyTXVodPlayer(ITXVodPlayer** pTXVodPlayer);
}

class ITXVodPlayer {
   protected:
    virtual ~ITXVodPlayer(){};

   public:
    /**
     * 事件回调
     */
    virtual void setEventCallback(ITXVodPlayerEventCallback* callback) = 0;

    /**
     * 视频渲染回调。
     *
     * 全平台接口软解硬解均支持
     */
    virtual void setDataCallback(ITXVodPlayerDataCallback* callback) = 0;

/**
 * setupContainView 创建Video渲染View,该控件承载着视频内容的展示。
 */
#if _WIN32
    virtual void setView(HWND hwnd) = 0;
#endif

    /**
     * 启动从指定URL播放,此接口的全平台版本没有参数
     * @note 10.7版本开始，需要通过 {@link TXLiveBase#setLicence} 设置 Licence 后方可成功播放， 否则将播放失败（黑屏），全局仅设置一次即可。直播 Licence、短视频 Licence 和视频播放 Licence 均可使用，若您暂未获取上述 Licence ，可[快速免费申请测试版
     * Licence](https://cloud.tencent.com/act/event/License) 以正常播放，正式版 License 需[购买](https://cloud.tencent.com/document/product/881/74588#.E8.B4.AD.E4.B9.B0.E5.B9.B6.E6.96.B0.E5.BB.BA.E6.AD.A3.E5.BC.8F.E7.89.88-license)。
     *
     * 开始多媒体文件播放 注意此接口的全平台版本没有参数
     * 支持的视频格式包括：mp4、avi、mkv、wmv、m4v。
     * 支持的音频格式包括：mp3、wav、wma、aac。
     */
    virtual void start() = 0;

    /**
     * 停止播放音视频流
     */
    virtual void stop() = 0;

    /**
     * 暂停播放
     */
    virtual void pause() = 0;

    /**
     * 继续播放
     */
    virtual void resume() = 0;

    /**
     * 播放跳转到音视频流某个时间
     */
    virtual void seek(uint64_t msPos) = 0;

    /**
     * 获取视频总时长
     */
    virtual long getDuration() = 0;

    /**
     * 视频宽度
     */
    virtual int getWidth() = 0;

    /**
     * 视频高度
     */
    virtual int getHeight() = 0;

    /**
     * 设置画面的方向
     *
     * @info 设置本地图像的顺时针旋转角度
     * @param rotation 支持 TRTCVideoRotation90 、 TRTCVideoRotation180 以及 TRTCVideoRotation270 旋转角度，默认值：TRTCVideoRotation0
     * @note 用于窗口渲染模式
     */
    virtual void setRenderRotation(TRTCVideoRotation rotation) = 0;

    /**
     * 设置画面的裁剪模式
     *
     * @param mode 填充（画面可能会被拉伸裁剪）或适应（画面可能会有黑边），默认值：TRTCVideoFillMode_Fit
     * @note 用于窗口渲染模式
     */
    virtual void setFillMode(TRTCVideoFillMode mode) = 0;

    /**
     * 设置静音
     */
    virtual void mute(bool mute) = 0;

    /**
     * 设置音量大小
     *
     * @param volume 音量大小，100为原始音量，范围是：[0 ~ 150]，默认值为100
     */
    virtual void setVolume(int volume) = 0;

    /**
     * 设置播放速率
     *
     * @param rate 播放速度
     */
    virtual void setRate(float rate) = 0;

    /**
     * 设置画面镜像
     */
    virtual void setMirror(bool mirror) = 0;

    /**
     * 将当前vodPlayer附着至TRTC
     *
     * @param trtcCloud TRTC 实例指针
     * @note 用于辅流推送，绑定后音频播放由TRTC接管
     */
    virtual void attachTRTC(void* trtcCloud) = 0;

    /**
     * 将当前vodPlayer和TRTC分离
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
};

#endif  //__ITXVODPLAYER_H__
