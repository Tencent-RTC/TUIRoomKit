/**
 * Copyright (c) 2021 Tencent. All rights reserved.
 * Module:   V2TXLivePusherObserver @ TXLiteAVSDK
 * Function: 腾讯云直播推流的回调通知
 * **功能**
 * 腾讯云直播的推流回调通知。
 * **介绍**
 * 可以接收 {@link V2TXLivePusher} 推流器的一些推流通知，包括推流器连接状态、音视频首帧回调、统计数据、警告和错误信息等。
 */
#ifndef MODULE_CPP_V2TXLIVEPUSHEROBSERVER_H_
#define MODULE_CPP_V2TXLIVEPUSHEROBSERVER_H_

#include "V2TXLiveDef.hpp"

namespace liteav {

class V2TXLivePusherObserver {
   public:
    virtual ~V2TXLivePusherObserver(){};

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                   直播推流器事件回调
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 直播推流器错误通知，推流器出现错误时，会回调该通知
     *
     * @param code      错误码 {@link V2TXLiveCode}。
     * @param msg       错误信息。
     * @param extraInfo 扩展信息。
     */
    virtual void onError(int32_t code, const char* msg, void* extraInfo){};

    /**
     * 直播推流器警告通知
     *
     * @param code      警告码 {@link V2TXLiveCode}。
     * @param msg       警告信息。
     * @param extraInfo 扩展信息。
     */
    virtual void onWarning(int32_t code, const char* msg, void* extraInfo){};

    /**
     * 首帧音频采集完成的回调通知
     */
    virtual void onCaptureFirstAudioFrame(){};

    /**
     * 首帧视频采集完成的回调通知
     */
    virtual void onCaptureFirstVideoFrame(){};

    /**
     * 麦克风采集音量值回调
     *
     * @param volume 音量大小。
     * @note  调用 {@link enableVolumeEvaluation} 开启采集音量大小提示之后，会收到这个回调通知。
     */
    virtual void onMicrophoneVolumeUpdate(int32_t volume){};

    /**
     * 推流器连接状态回调通知
     *
     * @param status    推流器连接状态 {@link V2TXLivePushStatus}。
     * @param msg       连接状态信息。
     * @param extraInfo 扩展信息。
     */
    virtual void onPushStatusUpdate(V2TXLivePushStatus state, const char* msg, void* extraInfo){};

    /**
     * 直播推流器统计数据回调
     *
     * @param statistics 推流器统计数据 {@link V2TXLivePusherStatistics}
     */
    virtual void onStatisticsUpdate(V2TXLivePusherStatistics statistics){};

    /**
     * 截图回调
     *
     * @note  调用 {@link snapshot} 截图之后，会收到这个回调通知。
     * @param image  已截取的视频画面。
     * @param length 截图数据长度，对于BGRA32而言，length = width * height * 4。
     * @param width  截图画面的宽度。
     * @param height 截图画面的高度。
     * @param format 截图数据格式，目前只支持 V2TXLivePixelFormatBGRA32。
     */
    virtual void onSnapshotComplete(const char* image, int length, int width, int height, V2TXLivePixelFormat format){};

    /**
     * 自定义视频渲染回调
     *
     * @note  调用 {@link enableCustomVideoRender} 开启本地视频自定义渲染之后，会收到这个回调通知。
     * @param videoFrame 视频帧数据 {@link V2TXLiveVideoFrame}。
     */
    virtual void onRenderVideoFrame(const V2TXLiveVideoFrame* videoFrame){};

    /**
     * 自定义视频预处理数据回调
     *
     * @note  调用 {@link enableCustomVideoProcessing} 接口开启/关闭自定义视频处理回调。Windows 暂时只支持 YUV420 格式。
     * @param srcFrame 处理前的视频帧。
     * @param dstFrame 处理后的视频帧。
     * @return - 0：   成功。
     *         - 其他： 错误。
     */
    virtual int onProcessVideoFrame(V2TXLiveVideoFrame* srcFrame, V2TXLiveVideoFrame* dstFrame) {
        return 0;
    };

    /**
     * 当屏幕分享开始时，SDK 会通过此回调通知
     */
    virtual void onScreenCaptureStarted(){};

    /**
     * 当屏幕分享停止时，SDK 会通过此回调通知
     *
     * @param reason 停止原因
     *               - 0：表示用户主动停止。
     *               - 1：iOS 表示录屏被系统中断；Mac、Windows 表示屏幕分享窗口被关闭。
     *               - 2：Windows 表示屏幕分享的显示屏状态变更（如接口被拔出、投影模式变更等）；其他平台不抛出。
     */
    virtual void onScreenCaptureStoped(int reason){};
};
}  // namespace liteav
#endif
