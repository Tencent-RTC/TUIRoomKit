#ifndef __ITXVODPLAYERCALLBACK_H__
#define __ITXVODPLAYERCALLBACK_H__
#include "TXLiteAVBase.h"

/**
 * VOD player error code
 */
enum TXVodPlayerError {

    /// file not exist
    TXVodPlayerErrorFileNotExist,

    /// file format not support
    TXVodPlayerErrorFormatNotSupport,

    /// file open failed
    TXVodPlayerErrorOpenfailed,

};

/////////////////////////////////////////////////////////////////////////////////
//
//                      VOD callback
//
/////////////////////////////////////////////////////////////////////////////////

class ITXVodPlayerEventCallback {
   public:
    virtual ~ITXVodPlayerEventCallback(){};

    /**
     * When the multimedia file playback starts, the SDK will notify through this callback.
     *
     * @param msLength The total length of the multimedia file, in milliseconds.
     */
    virtual void onVodPlayerStarted(uint64_t msLength) {
    }

    /**
     * When the playback progress of the multimedia file is changed,the SDK will notify through this callback.
     *
     * @param msPos Multimedia file playback progress, in milliseconds.
     */
    virtual void onVodPlayerProgress(uint64_t msPos) {
    }

    /**
     * When multimedia file playback is paused,the SDK will notify through this callback.
     */
    virtual void onVodPlayerPaused() {
    }

    /**
     * When multimedia file playback is resumed,the SDK will notify through this callback.
     */
    virtual void onVodPlayerResumed() {
    }

    /**
     * When multimedia file playback is stopped,the SDK will notify through this callback.
     *
     * @param reason Stop reason, 0 means the user stops actively, 1 means the file is finished playing, 2 means the video is cut off.
     */
    virtual void onVodPlayerStoped(int reason) {
    }

    /**
     * When an error occurs when a multimedia file is played,the SDK will notify through this callback.
     */
    virtual void onVodPlayerError(int error) = 0;
};

class ITXVodPlayerDataCallback {
   public:
    virtual ~ITXVodPlayerDataCallback(){};

    /**
     * Vod video frames callback.
     */
    virtual int onVodVideoFrame(TRTCVideoFrame& frame) = 0;

    /**
     * Vod audio frames callback.
     */
    virtual int onVodAudioFrame(TRTCAudioFrame& frame) = 0;
};

#endif /*__ITXVODPLAYERCALLBACK_H__ */
