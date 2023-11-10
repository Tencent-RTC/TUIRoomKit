/**
 * Copyright (c) 2022 Tencent. All rights reserved.
 */
#ifndef __IDEPRECATEDROOMENGINEAPI_H__
#define __IDEPRECATEDROOMENGINEAPI_H__

#include "TRTCTypeDef.h"
#include "ITUIRoomDefine.h"

namespace liteav {
class ITRTCCloud;
class ITXDeviceManager;
class ITXAudioEffectManager;
}  // namespace liteav

namespace tuikit {

class IDeprecatedRoomEngineAPI {
   public:
    /////////////////////////////////////////////////////////////////////////////////
    //
    //                    弃用接口（建议使用对应的新接口）
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 开始推送本地音频
     *
     * @deprecated v1.5.0 版本开始不推荐使用,建议使用{@link unmuteLocalAudio}代替。
     */
    trtc_attribute_deprecated virtual void startPushLocalAudio() = 0;

    /**
     * 停止推送本地音频
     *
     * @deprecated v1.5.0 版本开始不推荐使用,建议使用{@link muteLocalAudio}代替。
     */
    trtc_attribute_deprecated virtual void stopPushLocalAudio() = 0;

    /**
     * 获得TRTC实例对象
     *
     * @deprecated v1.5.0 版本开始不推荐使用
     */
    trtc_attribute_deprecated virtual void* getTRTCCloud() = 0;

    /**
     * 获得设备管理对象
     *
     * @deprecated v1.5.0 版本开始不推荐使用
     */
    trtc_attribute_deprecated virtual liteav::ITXDeviceManager* getDeviceManager() = 0;

    /**
     * 获得音效管理对象
     *
     * @deprecated v1.5.0 版本开始不推荐使用
     */
    trtc_attribute_deprecated virtual liteav::ITXAudioEffectManager* getAudioEffectManager() = 0;

    /**
     * 设置本地用户视频渲染的视图控件
     *
     * @deprecated v1.6.1 版本开始不推荐使用
     */
    trtc_attribute_deprecated virtual void setLocalVideoView(TUIVideoStreamType streamType, const TUIVideoView& view) = 0;
};
}  // namespace tuikit
#endif
