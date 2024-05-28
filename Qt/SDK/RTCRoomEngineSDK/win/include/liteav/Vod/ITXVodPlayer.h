#ifndef __ITXVODPLAYER_H__
#define __ITXVODPLAYER_H__

/**
 * Module:  ITXVodPlayer @ TXLiteAVSDK
 * Function: Tencent Cloud TRTC Core VOD Player Function Interface
 * Create/Use/Destroy ITXVodPlayer sample code:
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
//                    VOD player interface
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * Used to dynamically load dll, export TXVodPlayer C++ object.
 *
 * @param mediaFile meida file name
 * @param repeat Does it need to be played repeatedly true: this media file will be played repeatedly false: the media file will be played only once, and it will stop automatically after the end
 * @return ITXVodPlayer pointer note: a compilation error occurred if delete ITXVodPlayer*, please use destroyTXVodPlayer.
 */
LITEAV_API ITXVodPlayer* createTXVodPlayer(const char* mediaFile, bool repeat = false);

/**
 * Destruct the ITXVodPlayer object
 */
LITEAV_API void destroyTXVodPlayer(ITXVodPlayer** pTXVodPlayer);
}

class ITXVodPlayer {
   protected:
    virtual ~ITXVodPlayer(){};

   public:
    /**
     * Set event delegate
     */
    virtual void setEventCallback(ITXVodPlayerEventCallback* callback) = 0;

    /**
     * Video rendering callback.
     *
     * both hard solution and soft solution are supported on all platform interfaces.
     */
    virtual void setDataCallback(ITXVodPlayerDataCallback* callback) = 0;

/**
 * Set view for video rendering
 */
#if _WIN32
    virtual void setView(HWND hwnd) = 0;
#endif

    /**
     * Start playback from the specified URL, the full platform version of this interface has no parameters
     * @note Starting from version 10.7, the Licence needs to be set through {@link TXLiveBase#setLicence} before it can be played successfully, otherwise the playback will fail (black screen), and it can only be set once globally. Live Licence, UGC
     * Licence, and Player Licence can all be used. If you have not obtained the above Licence, you can [quickly apply for a beta Licence for free](https://cloud.tencent.com/act/event/License) To play, the official licence needs to be
     * [purchased](https://cloud.tencent.com/document/product/881/74588#.E8.B4.AD.E4.B9.B0.E5.B9.B6.E6.96 .B0.E5.BB.BA.E6.AD.A3.E5.BC.8F.E7.89.88-license).
     *
     * Start multimedia file playback Note that the full platform version of this interface has no parameters
     * Supported video formats include: mp4, avi, mkv, wmv, m4v.
     * Supported audio formats include: mp3, wav, wma, aac.
     */
    virtual void start() = 0;

    /**
     * Stop play
     */
    virtual void stop() = 0;

    /**
     * Pause play
     */
    virtual void pause() = 0;

    /**
     * Resume play
     */
    virtual void resume() = 0;

    /**
     * Seek to timestamp of the video
     */
    virtual void seek(uint64_t msPos) = 0;

    /**
     * Get video duration
     */
    virtual long getDuration() = 0;

    /**
     * Set video render width
     */
    virtual int getWidth() = 0;

    /**
     * Set video render height
     */
    virtual int getHeight() = 0;

    /**
     * Set the orientation of the rendered picture
     *
     * @info Set the clockwise rotation angle of the local image.
     * @param rotation Support TRTCVideoRotation90 、 TRTCVideoRotation180 and TRTCVideoRotation270 default is TRTCVideoRotation0.
     * @note For windowed rendering mode.
     */
    virtual void setRenderRotation(TRTCVideoRotation rotation) = 0;

    /**
     * Set video render fill mode
     *
     * @param mode Fill (the picture may be stretched and cropped) or fit (the picture may have black borders),default: TRTCVideoFillMode_Fit
     * @note For windowed rendering mode.
     */
    virtual void setFillMode(TRTCVideoFillMode mode) = 0;

    /**
     * Mute the audio
     */
    virtual void mute(bool mute) = 0;

    /**
     * Set the audio volume
     *
     * @param volume Volume level, 100 is the original volume, the range is: [0 ~ 150], the default value is 100.
     */
    virtual void setVolume(int volume) = 0;

    /**
     * Set play rate
     *
     * @param rate Play speed
     */
    virtual void setRate(float rate) = 0;

    /**
     * Set video render mirror mode
     */
    virtual void setMirror(bool mirror) = 0;

    /**
     * Attach the vod player to some TRTCCloud instance
     *
     * @param trtcCloud TRTC instance
     * @note It is used for auxiliary stream push. After binding, the audio playback is taken over by TRTC.
     */
    virtual void attachTRTC(void* trtcCloud) = 0;

    /**
     * Detach the vod player to some TRTCCloud instance
     */
    virtual void detachTRTC() = 0;

    /**
     * Publish the video stream to attached TRTCCloud instance
     */
    virtual void publishVideo() = 0;

    /**
     * Publish the audio stream to attached TRTCCloud instance
     */
    virtual void publishAudio() = 0;

    /**
     * Unpublish the video stream to attached TRTCCloud instance
     */
    virtual void unpublishVideo() = 0;

    /**
     * Unpublish the audio stream to attached TRTCCloud instance
     */
    virtual void unpublishAudio() = 0;
};

#endif  //__ITXVODPLAYER_H__
