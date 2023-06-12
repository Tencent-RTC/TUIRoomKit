#ifndef __ITXVODPLAYERCALLBACK_H__
#define __ITXVODPLAYERCALLBACK_H__
#include "TXLiteAVBase.h"

/**
 * VOD 播放器错误码
 */
enum TXVodPlayerError {

    ///文件不存在
    TXVodPlayerErrorFileNotExist,

    ///格式不支持
    TXVodPlayerErrorFormatNotSupport,

    ///文件打开失败
    TXVodPlayerErrorOpenfailed,

};

/////////////////////////////////////////////////////////////////////////////////
//
//                      VOD 相关回调
//
/////////////////////////////////////////////////////////////////////////////////

class ITXVodPlayerEventCallback {
   public:
    virtual ~ITXVodPlayerEventCallback(){};

    /**
     * 当多媒体文件播放开始时，SDK会通过此回调通知
     *
     * @param msLength 多媒体文件总长度，单位毫秒
     */
    virtual void onVodPlayerStarted(uint64_t msLength) {
    }

    /**
     * 当多媒体文件播放进度改变时，SDK会通过此回调通知
     *
     * @param msPos 多媒体文件播放进度，单位毫秒
     */
    virtual void onVodPlayerProgress(uint64_t msPos) {
    }

    /**
     * 当多媒体文件播放暂停时，SDK会通过此回调通知
     */
    virtual void onVodPlayerPaused() {
    }

    /**
     * 当多媒体文件播放恢复时，SDK会通过此回调通知
     */
    virtual void onVodPlayerResumed() {
    }

    /**
     * 当多媒体文件播放停止时，SDK会通过此回调通知
     *
     * @param reason 停止原因，0表示用户主动停止，1表示文件播放完，2表示视频断流
     */
    virtual void onVodPlayerStoped(int reason) {
    }

    /**
     * 当多媒体文件播放出错时，SDK会通过此回调通知
     */
    virtual void onVodPlayerError(int error) = 0;
};

class ITXVodPlayerDataCallback {
   public:
    virtual ~ITXVodPlayerDataCallback(){};

    /**
     * Vod视频帧回调
     */
    virtual int onVodVideoFrame(TRTCVideoFrame& frame) = 0;

    /**
     * Vod 音频帧回调
     */
    virtual int onVodAudioFrame(TRTCAudioFrame& frame) = 0;
};

#endif /*__ITXVODPLAYERCALLBACK_H__ */
