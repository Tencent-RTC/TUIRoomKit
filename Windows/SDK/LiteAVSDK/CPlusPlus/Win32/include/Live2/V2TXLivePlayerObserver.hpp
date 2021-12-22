/// @defgroup V2TXLivePlayerObserver_cplusplus V2TXLivePlayerObserver
/// 腾讯云直播的播放器回调通知。<br/>
/// 可以接收 V2TXLivePlayer 播放器的一些回调通知，包括播放器状态、播放音量回调、音视频首帧回调、统计数据、警告和错误信息等。
/// @{

#ifndef MODULE_CPP_V2TXLIVEPLAYEROBSERVER_H_
#define MODULE_CPP_V2TXLIVEPLAYEROBSERVER_H_

#include "V2TXLiveDef.hpp"

namespace liteav {
class V2TXLivePlayer;

class V2TXLivePlayerObserver {
   public:
    virtual ~V2TXLivePlayerObserver(){};

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                   直播播放器事件回调
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 直播播放器错误通知，播放器出现错误时，会回调该通知
     *
     * @param player    回调该通知的播放器对象
     * @param code      错误码 {@link V2TXLiveCode}
     * @param msg       错误信息
     * @param extraInfo 扩展信息
     */
    virtual void onError(V2TXLivePlayer* player, int32_t code, const char* msg, void* extraInfo){};

    /**
     * 直播播放器警告通知
     *
     * @param player    回调该通知的播放器对象
     * @param code      警告码 {@link V2TXLiveCode}
     * @param msg       警告信息
     * @param extraInfo 扩展信息
     */
    virtual void onWarning(V2TXLivePlayer* player, int32_t code, const char* msg, void* extraInfo){};

    /**
     * 已经成功连接到服务器
     *
     * @param player    回调该通知的播放器对象
     * @param extraInfo 扩展信息
     */
    virtual void onConnected(V2TXLivePlayer* player, void* extraInfo){};

    /**
     * 视频播放事件
     *
     * @param player    回调该通知的播放器对象
     * @param firstPlay 第一次播放标志
     * @param extraInfo 扩展信息
     */
    virtual void onVideoPlaying(V2TXLivePlayer* player, bool firstPlay, void* extraInfo){};

    /**
     * 音频播放事件
     *
     * @param player    回调该通知的播放器对象
     * @param firstPlay 第一次播放标志
     * @param extraInfo 扩展信息
     */
    virtual void onAudioPlaying(V2TXLivePlayer* player, bool firstPlay, void* extraInfo){};

    /**
     * 视频加载事件
     *
     * @param player    回调该通知的播放器对象
     * @param extraInfo 扩展信息
     */
    virtual void onVideoLoading(V2TXLivePlayer* player, void* extraInfo){};

    /**
     * 音频加载事件
     *
     * @param player    回调该通知的播放器对象
     * @param extraInfo 扩展信息
     */
    virtual void onAudioLoading(V2TXLivePlayer* player, void* extraInfo){};

    /**
     * 播放器音量大小回调
     *
     * @param player 回调该通知的播放器对象
     * @param volume 音量大小
     * @note  调用 {@link V2TXLivePlayer#enableVolumeEvaluation(int)} 开启播放音量大小提示之后，会收到这个回调通知。
     */
    virtual void onPlayoutVolumeUpdate(V2TXLivePlayer* player, int32_t volume){};

    /**
     * 直播播放器统计数据回调
     *
     * @param player     回调该通知的播放器对象
     * @param statistics 播放器统计数据 {@link V2TXLivePlayerStatistics}
     */
    virtual void onStatisticsUpdate(V2TXLivePlayer* player, V2TXLivePlayerStatistics statistics){};

    /**
     * 截图回调
     *
     * @note  调用 [snapshot](@ref V2TXLivePlayer#snapshot) 截图之后，会收到这个回调通知
     *
     * @param player 回调该通知的播放器对象
     * @param image  已截取的视频画面
     * @param length 截图数据长度，对于BGRA32而言，length = width * height * 4
     * @param width  截图画面的宽度
     * @param height 截图画面的高度
     * @param format 截图数据格式，目前只支持 V2TXLivePixelFormatBGRA32
     */
    virtual void onSnapshotComplete(V2TXLivePlayer* player, const char* image, int length, int width, int height, V2TXLivePixelFormat format){};

    /**
     * 自定义视频渲染回调
     *
     * @param player     回调该通知的播放器对象
     * @param videoFrame 视频帧数据 {@link V2TXLiveVideoFrame}
     * @note  需要您调用 [enableObserveVideoFrame](@ref V2TXLivePlayer#enableObserveVideoFrame:pixelFormat:bufferType:) 开启回调开关
     */
    virtual void onRenderVideoFrame(V2TXLivePlayer* player, const V2TXLiveVideoFrame* videoFrame){};

    /**
     * 收到 SEI 消息的回调，发送端通过 {@link V2TXLivePusher} 中的 `sendSeiMessage` 来发送 SEI 消息。
     *
     * @note  调用 {@link V2TXLivePlayer} 中的 `enableReceiveSeiMessage` 开启接收 SEI 消息之后，会收到这个回调通知
     *
     * @param player   回调该通知的播放器对象
     * @param payloadType   收到 SEI 消息的 payloadType
     * @param data     数据
     * @param dataSize 数据大小
     */
    virtual void onReceiveSeiMessage(V2TXLivePlayer* player, int payloadType, const uint8_t* data, uint32_t dataSize){};
};

}  // namespace liteav

#endif  // MODULE_CPP_V2TXLIVEPLAYEROBSERVER_H_
/// @}
