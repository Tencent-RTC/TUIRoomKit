/**
 * Copyright (c) 2021 Tencent. All rights reserved.
 * Module:   TRTCCloud @ TXLiteAVSDK
 * Function: 腾讯云 TRTC 主功能接口
 * Version: <:Version:>
 */
#ifndef __ITRTCCLOUD_H__
#define __ITRTCCLOUD_H__
#include "TRTCCloudCallback.h"
#include "TRTCTypeDef.h"
#include "ITXAudioEffectManager.h"
#include "ITXDeviceManager.h"
#include "IDeprecatedTRTCCloud.h"
#if defined(_WIN32) || (!__ANDROID__ && __linux__)
#include "TXLiteAVBase.h"
#endif
namespace liteav {
class ITRTCCloud;
}

/**
 * 利用 C 函数获取 TRTC 实例
 *
 * 你可以按照下列方式创建和销毁 TRTC Instance
 * <pre>
 * ITRTCCloud *trtcCloud = getTRTCShareInstance();
 * if(trtcCloud) {
 *     std::string version(trtcCloud->getSDKVersion());
 * }
 * destroyTRTCShareInstance();
 * trtcCloud = nullptr;
 * </pre>
 */
extern "C" {
#ifdef __ANDROID__
TRTC_API liteav::ITRTCCloud* getTRTCShareInstance(void* context);
#else
TRTC_API liteav::ITRTCCloud* getTRTCShareInstance();
#endif
TRTC_API void destroyTRTCShareInstance();
}

namespace liteav {

class ITRTCCloud : public IDeprecatedTRTCCloud {
   protected:
    virtual ~ITRTCCloud() {
    }

   public:
/////////////////////////////////////////////////////////////////////////////////
//
//                    创建实例和事件回调
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * 1.1 创建 TRTCCloud 实例（单例模式）
 *
 * @param context 仅适用于 Android 平台，SDK 内部会将其转化为 Android 平台的 ApplicationContext 用于调用 Androud System API。
 *        如果传入的 context 参数为空，SDK 内部会自动获取当前进程的 ApplicationContext。
 * @note
 * 1. 如果您使用 delete ITRTCCloud* 会导致编译错误，请使用 destroyTRTCCloud 释放对象指针。
 * 2. 在 Windows、Mac 和 iOS 平台上，请调用 getTRTCShareInstance() 接口。
 * 3. 在 Android 平台上，请调用 getTRTCShareInstance(void *context) 接口。
 */
#ifdef __ANDROID__
    TRTC_API static liteav::ITRTCCloud* getTRTCShareInstance(void* context);
#else
    TRTC_API static liteav::ITRTCCloud* getTRTCShareInstance();
#endif

    /**
     * 1.2 销毁 TRTCCloud 实例（单例模式）
     */
    TRTC_API static void destroyTRTCShareInstance();

    /**
     * 1.3 设置 TRTC 事件回调
     *
     * 您可以通过 {@link ITRTCCloudCallback} 获得来自 SDK 的各类事件通知（比如：错误码，警告码，音视频状态参数等）。
     * @param listener 回调实例。
     */
    virtual void addCallback(ITRTCCloudCallback* callback) = 0;

    /**
     * 1.4 移除 TRTC 事件回调
     *
     * @param callback 回调指针
     */
    virtual void removeCallback(ITRTCCloudCallback* callback) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                    房间相关接口函数
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 2.1 进入房间
     *
     * TRTC 的所有用户都需要进入房间才能“发布”或“订阅”音视频流，“发布”是指将自己的音频和视频推送到云端，“订阅”是指从云端拉取房间里其他用户的音视频流。
     * 调用该接口时，您需要指定您的应用场景 {@link TRTCAppScene} 以获取最佳的音视频传输体验，这些场景可以分成两大类：
     * **实时通话：**
     * 包括 {@link TRTCAppSceneVideoCall} 和 {@link TRTCAppSceneAudioCall} 两个可选项，分别是视频通话和语音通话，该模式适合 1对1 的音视频通话，或者参会人数在 300 人以内的在线会议。
     * **在线直播：**
     * 包括 {@link TRTCAppSceneLIVE} 和 {@link TRTCAppSceneVoiceChatRoom} 两个可选项，分别是视频直播和语音直播，该模式适合十万人以内的在线直播场景，但需要您在接下来介绍的 TRTCParams 参数中指定 **角色(role)** 这个字段，也就是将房间中的用户区分为
     * **主播** ({@link TRTCRoleAnchor}) 和 **观众** ({@link TRTCRoleAudience}) 两种不同的角色。 调用该接口后，您会收到来自 {@link ITRTCCloudCallback} 中的 onEnterRoom(result) 回调：
     *  - 如果进房成功，参数 result 会是一个正数（result > 0），表示从函数调用到进入房间所花费的时间，单位是毫秒（ms）。
     *  - 如果进房失败，参数 result 会是一个负数（result < 0），表示进房失败的[错误码](https://cloud.tencent.com/document/product/647/32257)。
     * @param param 进房参数，用于指定用户的身份、角色和安全票据等信息，详情请参见  {@link TRTCParams} 。
     * @param scene 应用场景，用于指定您的业务场景，同一个房间内的所有用户需要设定相同的 {@link TRTCAppScene}。
     * @note
     *   1. 同一个房间内的所有用户需要设定相同的 scene。不同的 scene 会导致偶现的异常问题。
     *   2. 当您指定参数 scene 为 {@link TRTCAppSceneLIVE} 或 {@link TRTCAppSceneVoiceChatRoom} 时，您必须通过 {@link TRTCParams} 中的 “role” 字段为当前用户设定他/她在房间中的角色。
     *   3. 请您尽量保证 {@link enterRoom} 与 {@link exitRoom} 前后配对使用，即保证”先退出前一个房间再进入下一个房间”，否则会导致很多异常问题。
     */
    virtual void enterRoom(const TRTCParams& param, TRTCAppScene scene) = 0;

    /**
     * 2.2 离开房间
     *
     * 调用该接口会让用户离开自己所在的音视频房间，并释放摄像头、麦克风、扬声器等设备资源。
     * 等资源释放完毕之后，SDK 会通过 {@link ITRTCCloudCallback} 中的 {@link onExitRoom} 回调向您通知。
     * 如果您要再次调用  {@link enterRoom}  或者切换到其他的供应商的 SDK，建议等待 {@link onExitRoom} 回调到来之后再执行之后的操作，以避免摄像头或麦克风被占用的问题。
     */
    virtual void exitRoom() = 0;

    /**
     * 2.3 切换角色
     *
     * 调用本接口可以实现用户在`主播`和`观众`两种角色之间来回切换。
     * 由于视频直播和语音聊天室需要支持多达10万名观众同时观看，所以设定了 **只有主播才能发布自己的音视频** 的规则。因此，当有些观众希望发布自己的音视频流（以便能跟主播互动）时，就需要先把自己的角色切换成 **主播**。
     * 您可以在进入房间时通过 {@link TRTCParams} 中的 role 字段事先确定用户的角色，也可以在进入房间后通过 switchRole 接口动态切换角色。
     * @param role 角色，默认为 **主播**。
     * - {@link TRTCRoleAnchor} ：主播，可以发布自己的音视频，同一个房间里最多支持50个主播同时发布音视频。
     * - {@link TRTCRoleAudience} ：观众，不能发布自己的音视频流，只能观看房间中其他主播的音视频。如果要发布自己的音视频，需要先通过 {@link switchRole} 切换成 **主播**，同一个房间内同时最多可以容纳 10 万名观众。
     * @note
     * 1. 该接口仅适用于视频直播（{@link TRTCAppSceneLIVE}）和语音聊天室（{@link TRTCAppSceneVoiceChatRoom}）这两个场景。
     * 2. 如果您在 {@link enterRoom} 时指定的 scene 为 {@link TRTCAppSceneVideoCall} 或 {@link TRTCAppSceneAudioCall}，请不要调用这个接口。
     */
    virtual void switchRole(TRTCRoleType role) = 0;

    /**
     * 2.4 切换角色（支持设置权限位）
     *
     * 调用本接口可以实现用户在`主播`和`观众`两种角色之间来回切换。
     * 由于视频直播和语音聊天室需要支持多达10万名观众同时观看，所以设定了“只有主播才能发布自己的音视频”的规则。
     * 因此，当有些观众希望发布自己的音视频流（以便能跟主播互动）时，就需要先把自己的角色切换成“主播”。
     * 您可以在进入房间时通过 {@link TRTCParams} 中的 role 字段事先确定用户的角色，也可以在进入房间后通过 switchRole 接口动态切换角色。
     * @param role 角色，默认为“主播”：
     * - {@link TRTCRoleAnchor} ：主播，可以发布自己的音视频，同一个房间里最多支持50个主播同时发布音视频。
     * - {@link TRTCRoleAudience} ：观众，不能发布自己的音视频流，只能观看房间中其他主播的音视频。如果要发布自己的音视频，需要先通过 {@link switchRole} 切换成“主播”，同一个房间内同时最多可以容纳 10 万名观众。
     * @param privateMapKey 用于权限控制的权限票据，当您希望某个房间只能让特定的 userId 进入或者上行视频时，需要使用 privateMapKey 进行权限保护。
     * - 仅建议有高级别安全需求的客户使用，更多详情请参见 [开启高级权限控制](https://cloud.tencent.com/document/product/647/32240)。
     * @note
     * 1. 该接口仅适用于视频直播（{@link TRTCAppSceneLIVE}）和语音聊天室（{@link TRTCAppSceneVoiceChatRoom}）这两个场景。
     * 2. 如果您在 {@link enterRoom} 时指定的 scene 为 {@link TRTCAppSceneVideoCall} 或 {@link TRTCAppSceneAudioCall}，请不要调用这个接口。
     */
    virtual void switchRole(TRTCRoleType role, const char* privateMapKey) = 0;

    /**
     * 2.5 切换房间
     *
     * 使用该接口可以让用户可以快速从一个房间切换到另一个房间。
     * - 如果用户的身份是“观众”，该接口的调用效果等同于 exitRoom(当前房间) + enterRoom（新的房间）。
     * - 如果用户的身份是“主播”，该接口在切换房间的同时还会保持自己的音视频发布状态，因此在房间切换过程中，摄像头的预览和声音的采集都不会中断。
     * 该接口适用于在线教育场景中，监课老师在多个房间中进行快速切换的场景。在该场景下使用 switchRoom 可以获得比 exitRoom+enterRoom 更好的流畅性和更少的代码量。
     * 接口调用结果会通过 {@link ITRTCCloudCallback} 中的 onSwitchRoom(errCode, errMsg) 回调。
     * @param config 房间参数，详情请参见 {@link TRTCSwitchRoomConfig}。
     * @note 由于对老版本 SDK 兼容的需求，参数 config 中同时包含 roomId 与 strRoomId 两个参数，这两个参数的填写格外讲究，请注意如下事项：
     *  1. 若您选用 strRoomId，则 roomId 需要填写为0。若两者都填，将优先选用 roomId。
     *  2. 所有房间需要同时使用 strRoomId 或同时使用 roomId，不可混用，否则将会出现很多预期之外的 bug。
     */
    virtual void switchRoom(const TRTCSwitchRoomConfig& config) = 0;

    /**
     * 2.6 请求跨房通话
     *
     * 默认情况下，只有同一个房间中的用户之间可以进行音视频通话，不同的房间之间的音视频流是相互隔离的。
     * 但您可以通过调用该接口，将另一个房间中某个主播音视频流发布到自己所在的房间中，与此同时，该接口也会将自己的音视频流发布到目标主播的房间中。
     * 也就是说，您可以使用该接口让身处两个不同房间中的主播进行跨房间的音视频流分享，从而让每个房间中的观众都能观看到这两个主播的音视频。该功能可以用来实现主播之间的 PK 功能。
     * 跨房通话的请求结果会通过 {@link ITRTCCloudCallback} 中的 {@link onConnectOtherRoom} 回调通知给您。
     * 例如：当房间“101”中的主播 A 通过 connectOtherRoom() 跟房间“102”中的主播 B 建立跨房通话后，
     * - 房间“101”中的用户都会收到主播 B 的 onRemoteUserEnterRoom(B) 和 onUserVideoAvailable(B,true) 这两个事件回调，即房间“101”中的用户都可以订阅主播 B 的音视频。
     * - 房间“102”中的用户都会收到主播 A 的 onRemoteUserEnterRoom(A) 和 onUserVideoAvailable(A,true) 这两个事件回调，即房间“102”中的用户都可以订阅主播 A 的音视频。
     * ![](https://qcloudimg.tencent-cloud.cn/raw/c5e6c72fc163ad5c0b6b7b00e1da55b5.png)
     * 跨房通话的参数考虑到后续扩展字段的兼容性问题，暂时采用了 JSON 格式的参数：
     * **情况一：数字房间号**
     * 如果房间“101”中的主播 A 要跟房间“102”中的主播 B 连麦，那么主播 A 调用该接口时需要传入：{"roomId": 102, "userId": "userB"}
     * 示例代码如下：
     * <pre>
     *   Json::Value jsonObj;
     *   jsonObj["roomId"] = 102;
     *   jsonObj["userId"] = "userB";
     *   Json::FastWriter writer;
     *   std::string params = writer.write(jsonObj);
     *   trtc.ConnectOtherRoom(params.c_str());
     * </pre>
     *
     * **情况二：字符串房间号**
     * 如果您使用的是字符串房间号，务必请将 json 中的 “roomId” 替换成 “strRoomId”: {"strRoomId": "102", "userId": "userB"}
     * 示例代码如下：
     * <pre>
     *   Json::Value jsonObj;
     *   jsonObj["strRoomId"] = "102";
     *   jsonObj["userId"] = "userB";
     *   Json::FastWriter writer;
     *   std::string params = writer.write(jsonObj);
     *   trtc.ConnectOtherRoom(params.c_str());
     * </pre>
     *
     * @param param 需要你传入 JSON 格式的字符串参数，roomId 代表数字格式的房间号，strRoomId 代表字符串格式的房间号，userId 代表目标主播的用户 ID。
     */
    virtual void connectOtherRoom(const char* param) = 0;

    /**
     * 2.7 退出跨房通话
     *
     * 退出结果会通过 {@link ITRTCCloudCallback} 中的 {@link onDisconnectOtherRoom} 回调通知给您。
     */
    virtual void disconnectOtherRoom() = 0;

    /**
     * 2.8 设置订阅模式（需要在进入房前设置才能生效）
     *
     * 您可以通过该接口在“自动订阅”和“手动订阅”两种模式下进行切换：
     * - 自动订阅：默认模式，用户在进入房间后会立刻接收到该房间中的音视频流，音频会自动播放，视频会自动开始解码（依然需要您通过 {@link startRemoteView} 接口绑定渲染控件）。
     * - 手动订阅：在用户进入房间后，需要手动调用 {@link startRemoteView} 接口才能启动视频流的订阅和解码，需要手动调用 {@link muteRemoteAudio} (false) 接口才能启动声音的播放。
     * 在绝大多数场景下，用户进入房间后都会订阅房间中所有主播的音视频流，因此 TRTC 默认采用了自动订阅模式，以求得最佳的“秒开体验”。
     * 如果您的应用场景中每个房间同时会有很多路音视频流在发布，而每个用户只想选择性地订阅其中的 1-2 路，则推荐使用“手动订阅”模式以节省流量费用。
     * @param autoRecvAudio true：自动订阅音频；false：需手动调用 muteRemoteAudio(false) 订阅音频。默认值：true。
     * @param autoRecvVideo true：自动订阅视频；false：需手动调用 startRemoteView 订阅视频。默认值：true。
     * @note
     * 1. 需要在进入房间前调用该接口进行设置才能生效。
     * 2. 在自动订阅模式下，如果用户在进入房间后没有调用  {@link startRemoteView} 订阅视频流，SDK 会自动停止订阅视频流，以便达到节省流量的目的。
     */
    virtual void setDefaultStreamRecvMode(bool autoRecvAudio, bool autoRecvVideo) = 0;

    /**
     * 2.9 创建子房间实例（用于多房间并发观看）
     *
     * TRTCCloud 一开始被设计成单例模式，限制了多房间并发观看的能力。
     * 通过调用该接口，您可以创建出多个 TRTCCloud 实例，以便同时进入多个不同的房间观看音视频流。
     * 但需要注意的是，您在多个 TRTCCloud 实例中发布音视频流的能力会受到一定限制。
     * 该功能主要用于在线教育场景中一种被称为“超级小班课”的业务场景中，用于解决“每个 TRTC 的房间中最多只能有 50 人同时发布自己音视频流”的限制。
     * 示例代码如下：
     * <pre>
     *     //In the small room that needs interaction, enter the room as an anchor and push audio and video streams
     *     ITRTCCloud *mainCloud = getTRTCShareInstance();
     *     TRTCParams mainParams;
     *     //Fill your params
     *     mainParams.role = TRTCRoleAnchor;
     *     mainCloud->enterRoom(mainParams, TRTCAppSceneLIVE);
     *     //...
     *     mainCloud->startLocalAudio(TRTCAudioQualityDefault);
     *     mainCloud->startLocalPreview(renderView);
     *
     *     //In the large room that only needs to watch, enter the room as an audience and pull audio and video streams
     *     ITRTCCloud *subCloud = mainCloud->createSubCloud();
     *     TRTCParams subParams;
     *     //Fill your params
     *     subParams.role = TRTCRoleAudience;
     *     subCloud->enterRoom(subParams, TRTCAppSceneLIVE);
     *     //...
     *     subCloud->startRemoteView(userId, TRTCVideoStreamTypeBig, renderView);
     *     //...
     *     //Exit from new room and release it.
     *     subCloud->exitRoom();
     *     mainCloud->destroySubCloud(subCloud);
     * </pre>
     *
     * @note
     * - 同一个用户，可以使用同一个 userId 进入多个不同 roomId 的房间。
     * - 两台不同的终端设备不可以同时使用同一个 userId 进入同一个 roomId 的房间。
     * - 您可以分别为不同实例分别设置 {@link ITRTCCloudCallback} 获取各自的事件通知。
     * - 同一个用户可以在多个 TRTCCloud 实例中推流，也可以调用子实例中与本地音视频相关的接口。但需要注意：
     *    - 多实例的音频需要同时为麦克风采集或自定义采集，而且与音频设备相关的接口调用会以最后一次为准；
     *    - 与摄像头相关的调用会以最后一次为准：{@link startLocalPreview}。
     * @return 子 TRTCCloud 实例
     */
    virtual ITRTCCloud* createSubCloud() = 0;

    /**
     * 2.10 销毁子房间实例
     *
     * @param subCloud 子房间实例
     */
    virtual void destroySubCloud(ITRTCCloud* subCloud) = 0;

    /**
     * 2.11 更改跨房主播在本房间的上行能力
     *
     * 通常情况下，在调用 connectOtherRoom 接口与另一个房间的主播进行跨房通话后，本房间内的所有观众都将收到该主播发布的音视频流。
     * 您可以通过调用该接口，限制跨房主播在本房间内的上行能力，禁止或允许跨房主播发布音频/主路视频/辅路视频，该行为会影响房间内的所有用户。
     * 在禁用跨房主播某种上行能力后，本房间内所有用户将无法收到对应音视频流，且无法再订阅对应的音视频。
     * 需要注意的是，该接口只能由进行跨房通话的主播调用，且通过该接口设置的限制会因为跨房通话的中断或对应主播退房重置。
     * 该接口的调用结果会通过 {@link ITRTCCloudCallback} 中的 {@link onUpdateOtherRoomForwardMode} 回调通知给您。
     * 例如：
     * 房间“101”中有主播 A 与观众 B，房间“102”中有主播 C，主播 C 正常发布音视频流。主播 A 通过 connectOtherRoom() 跟主播 C 建立跨房通话。
     * - 此时，主播 A 与观众 B 都会收到主播 C 的 onRemoteUserEnterRoom(C) 和 onUserVideoAvailable(C,true)、onUserAudioAvailable(C,true) 这三个事件回调，可以订阅主播 C 的音视频。
     * 之后，主播 A 调用该接口禁用主播 C 在本房间发布音频的能力。
     * - 此后，主播 C 的音频流将无法发布至房间“101”，主播 A 与观众 B 都将收到 onUserAudioAvailable(C,false) 事件回调，且无法再通过 muteRemoteAudio(C,false) 订阅主播 C 的音频。
     * - 主播 C 的视频流将不受影响。房间“102”中的其他观众也不受影响，可以正常订阅主播 C 的音频。
     * 该接口的参数考虑到后续扩展字段的兼容性问题，暂时采用了 JSON 格式的参数，示例如下：
     * **情况一：数字房间号**
     * <pre>
     * {
     *   "roomId":102,
     *   "userId":"userC",
     *   "muteAudio":false,
     *   "muteVideo":true,
     *   "muteSubStream":false
     * }
     * </pre>
     *
     * **情况二：字符串房间号**
     * <pre>
     * {
     *   "strRoomId":"102",
     *   "userId":"userC",
     *   "muteAudio":false,
     *   "muteVideo":true,
     *   "muteSubStream":false
     * }
     * </pre>
     *
     * @param param 需要你传入 JSON 格式的字符串参数，roomId 代表数字格式的房间号，strRoomId 代表字符串格式的房间号，userId 代表目标主播的用户
     * ID，muteAudio、muteVideo、muteSubStream均为可选项，分表代表禁止或允许跨房主播发布音频/主路视频/辅路视频的能力。
     */
    virtual void updateOtherRoomForwardMode(const char* param) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                    CDN 相关接口函数
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 3.1 开始向腾讯云直播 CDN 上发布音视频流
     *
     * 该接口会向 TRTC 服务器发送指令，要求其将当前用户的音视频流旁路到直播 CDN 上。您可以通过参数 streamId 设定直播流的 StreamId，从而可以指定该用户的音视频流对应在直播 CDN 上的播放地址。
     * 例如：您可以通过该接口将当前用户的直播流 ID 指定为 user_stream_001，那么该用户音视频流对应的 CDN 播放地址为：
     * “http://yourdomain/live/user_stream_001.flv”，其中 yourdomain 为您自己备案的播放域名，
     * 您可以在[直播控制台](https://console.cloud.tencent.com/live) 配置您的播放域名，腾讯云不提供默认的播放域名。
     * 您也可以在设置 enterRoom 的参数 TRTCParams 时指定 streamId, 而且我们更推荐您采用这种方案。
     * @param streamId 自定义流 ID。
     * @param streamType 仅支持 {@link TRTCVideoStreamTypeBig} 和 {@link TRTCVideoStreamTypeSub}。
     * @note 您需要提前在 [实时音视频控制台](https://console.cloud.tencent.com/trtc/) 中的功能配置页面上开启“启用旁路推流”才能生效。
     * - 若您选择“指定流旁路”，则您可以通过该接口将对应音视频流推送到腾讯云 CDN 且指定为填写的流 ID。
     * - 若您选择“全局自动旁路”，则您可以通过该接口调整默认的流 ID。
     */
    virtual void startPublishing(const char* streamId, TRTCVideoStreamType streamType) = 0;

    /**
     * 3.2 停止向腾讯云直播 CDN 上发布音视频流
     */
    virtual void stopPublishing() = 0;

    /**
     * 3.3 开始向非腾讯云 CDN 上发布音视频流
     *
     * 该接口跟 startPublishing 功能类似，不同之处在于，startPublishing 仅支持向腾讯云的 CDN 发布，而本接口支持向非腾讯云的直播 CDN 上转推音视频流。
     * @param param CDN 转推参数，详情请参见 {@link TRTCPublishCDNParam}
     * @note
     * - 使用 startPublishing 接口向腾讯云的直播 CDN 上发布音视频流不会收取额外费用。
     * - 使用 startPublishCDNStream 接口向非腾讯云的直播 CDN 上发布音视频流，需要收取额外的转推带宽费用。
     */
    virtual void startPublishCDNStream(const TRTCPublishCDNParam& param) = 0;

    /**
     * 3.4 停止向非腾讯云 CDN 上发布音视频流
     */
    virtual void stopPublishCDNStream() = 0;

    /**
     * 3.5 设置云端混流的排版布局和转码参数
     *
     * 在一个直播间中可能同时会有多个主播发布自己的音视频流，但对于直播 CDN 上的观众而言，只需要观看一条 HTTP-FLV 或 HLS 格式的视频流即可。
     * 当您调用本接口函数时，SDK 会向腾讯云的 TRTC 混流服务器发送一条指令，混流服务器会将房间里的多路音视频流混合成一路。
     * 您可以通过 {@link TRTCTranscodingConfig} 参数来调整每一路画面的排版布局，也可以设置混合后的音视频流的各项编码参数。
     * 参考文档：[云端混流转码](https://cloud.tencent.com/document/product/647/16827)。
     * ![](https://qcloudimg.tencent-cloud.cn/raw/c9e87b2e5799db9da4f50af3c0f2e7a9.png)
     * @param config 如果 config 不为空，则开启云端混流，如果 config 为空则停止云端混流。详情请参见 {@link TRTCTranscodingConfig} 。
     * @note 关于云端混流的注意事项：
     * - 混流转码为收费功能，调用接口将产生云端混流转码费用，详见 [云端混流转码计费说明](https://cloud.tencent.com/document/product/647/49446) 。
     * - 调用该接口的用户，如果没设定 config 参数中的 streamId 字段，TRTC 会将房间中的多路画面混合到当前用户所对应的音视频流上，即 A + B => A。
     * - 调用该接口的用户，如果设定了 config 参数中的 streamId 字段，TRTC 会将房间中的多路画面混合到您指定的 streamId 上，即 A + B => streamId。
     * - 请注意，若您还在房间中且不再需要混流，请务必再次调用本接口并将 config 设置为空以进行取消，不及时取消混流可能会引起不必要的计费损失。
     * - 请放心，当您退房时 TRTC 会自动取消混流状态。
     */
    virtual void setMixTranscodingConfig(TRTCTranscodingConfig* config) = 0;

    /**
     * 3.6  开始发布媒体流
     *
     * 该接口会向 TRTC 服务器发送指令，要求其将当前用户的音视频流转推/转码到直播 CDN 或者回推到 TRTC 房间中您可以通过 {@link TRTCPublishTarget} 配置中的 {@link TRTCPublishMode} 指定具体的发布模式
     * @param target 媒体流发布的目标地址，具体配置参考 {@link TRTCPublishTarget}。支持转推/转码到腾讯或者第三方 CDN，也支持转码回推到 TRTC 房间中。
     * @param params 媒体流编码输出参数，具体配置参考 {@link TRTCStreamEncoderParam}。转码和回推到 TRTC 房间中时为必填项，您需要指定您预期的转码输出参数。在转推时，为了更好的转推稳定性和 CDN 兼容性，也建议您进行配置。
     * @param config 媒体流转码配置参数。具体配置参考 {@link TRTCStreamMixingConfig}。转码和回推到 TRTC 房间中时为必填项，您需要指定您预期的转码配置参数。转推模式下则无效。
     * @note
     * 1. SDK 会通过回调 {@link onStartPublishMediaStream} 带给您后台启动的任务标识（即 taskId）。
     * 2. 同一个任务（TRTCPublishMode 与 TRTCPublishCdnUrl 均相同）仅支持启动一次。若您后续需要更新或者停止该项任务，需要记录并使用返回的 taskId，通过 {@link updatePublishMediaStream} 或者 {@link stopPublishMediaStream} 来操作。
     * 3. target 支持同时配置多个 CDN URL（最多同时 10 个）。若您的同一个转推/转码任务需要发布至多路 CDN，则仅需要在 target 中配置多个 CDN URL 即可。同一个转码任务即使有多个转推地址，对应的转码计费仍只收取一份。
     * 4. 使用时需要注意不要多个任务同时往相同的 URL 地址推送，以免引起异常推流状态。一种推荐的方案是 URL 中使用 “sdkappid_roomid_userid_main” 作为区分标识，这中命名方式容易辨认且不会在您的多个应用中发生冲突。
     */
    virtual void startPublishMediaStream(TRTCPublishTarget* target, TRTCStreamEncoderParam* params, TRTCStreamMixingConfig* config) = 0;

    /**
     * 3.7 更新发布媒体流
     *
     * 该接口会向 TRTC 服务器发送指令，更新通过 {@link startPublishMediaStream} 启动的媒体流
     * @param taskId 通过回调 {@link onStartPublishMediaStream} 带给您后台启动的任务标识（即 taskId）
     * @param target 媒体流发布的目标地址，具体配置参考 {@link TRTCPublishTarget}。支持转推/转码到腾讯或者第三方 CDN，也支持转码回推到 TRTC 房间中。
     * @param params 媒体流编码输出参数，具体配置参考 {@link TRTCStreamEncoderParam}。转码和回推到 TRTC 房间中时为必填项，您需要指定您预期的转码输出参数。在转推时，为了更好的转推稳定性和 CDN 兼容性，也建议您进行配置。
     * @param config 媒体流转码配置参数。具体配置参考 {@link TRTCStreamMixingConfig}。转码和回推到 TRTC 房间中时为必填项，您需要指定您预期的转码配置参数。转推模式下则无效。
     * @note
     * 1. 您可以通过本接口来更新发布的 CDN URL（支持增删，最多同时 10 个），但您使用时需要注意不要多个任务同时往相同的 URL 地址推送，以免引起异常推流状态。
     * 2. 您可以通过 taskId 来更新调整转推/转码任务。例如在 pk 业务中，您可以先通过 {@link startPublishMediaStream} 发起转推，接着在主播发起 pk 时，通过 taskId 和本接口将转推更新为转码任务。此时，CDN
     * 播放将连续并且不会发生断流（您需要保持媒体流编码输出参数 param 一致）。
     * 3. 同一个任务不支持纯音频、音视频、纯视频之间的切换。
     */
    virtual void updatePublishMediaStream(const char* taskId, TRTCPublishTarget* target, TRTCStreamEncoderParam* params, TRTCStreamMixingConfig* config) = 0;

    /**
     * 3.8 停止发布媒体流
     *
     * 该接口会向 TRTC 服务器发送指令，停止通过 {@link startPublishMediaStream} 启动的媒体流
     * @param taskId 通过回调 {@link onStartPublishMediaStream} 带给您后台启动的任务标识（即 taskId）
     * @note
     * 1. 若您的业务后台并没有保存该 taskId，在您的主播异常退房重进后，如果您需要重新获取 taskId，您可以再次调用 {@link startPublishMediaStream} 启动任务。此时 TRTC 后台会返回任务启动失败，同时带给您上一次启动的 taskId
     * 2. 若 taskId 填空字符串，将会停止该用户所有通过 {@link startPublishMediaStream} 启动的媒体流，如果您只启动了一个媒体流或者想停止所有通过您启动的媒体流，推荐使用这种方式。
     */
    virtual void stopPublishMediaStream(const char* taskId) = 0;

/////////////////////////////////////////////////////////////////////////////////
//
//                    视频相关接口函数
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * 4.1 开启本地摄像头的预览画面（移动端）
 *
 * 在 enterRoom 之前调用此函数，SDK 只会开启摄像头，并一直等到您调用 enterRoom 之后才开始推流。
 * 在 enterRoom 之后调用此函数，SDK 会开启摄像头并自动开始视频推流。当开始渲染首帧摄像头画面时，您会收到 {@link ITRTCCloudCallback} 中的 onCameraDidReady 回调通知。
 * @param frontCamera true：前置摄像头；false：后置摄像头。
 * @param view 承载视频画面的控件。
 * @note 如果希望开播前预览摄像头画面并通过 BeautyManager 调节美颜参数，您可以：
 * - 方案一：在调用 enterRoom 之前调用 startLocalPreview。
 * - 方案二：在调用 enterRoom 之后调用 startLocalPreview + muteLocalVideo(true)。
 */
#if TARGET_PLATFORM_PHONE
    virtual void startLocalPreview(bool frontCamera, TXView view) = 0;
#endif

/**
 * 4.2 开启本地摄像头的预览画面（桌面端）
 *
 * 在调用该接口之前，您可以先调用 setCurrentCameraDevice 选择使用 Mac 自带摄像头或外接摄像头。
 * 在 enterRoom 之前调用此函数，SDK 只会开启摄像头，并一直等到您调用 enterRoom 之后才开始推流。
 * 在 enterRoom 之后调用此函数，SDK 会开启摄像头并自动开始视频推流。
 * 当开始渲染首帧摄像头画面时，您会收到 {@link TRTCCloudDelegate}  中的 onCameraDidReady 回调通知。
 * @param view 承载视频画面的控件。
 * @note 如果希望开播前预览摄像头画面并通过 BeautyManager 调节美颜参数，您可以：
 * - 方案一：在调用 enterRoom 之前调用 startLocalPreview。
 * - 方案二：在调用 enterRoom 之后调用 startLocalPreview + muteLocalVideo(true)。
 */
#if TARGET_PLATFORM_DESKTOP
    virtual void startLocalPreview(TXView view) = 0;
#endif

    /**
     * 4.3 更新本地摄像头的预览画面
     */
    virtual void updateLocalView(TXView view) = 0;

    /**
     * 4.4 停止摄像头预览
     */
    virtual void stopLocalPreview() = 0;

    /**
     * 4.5 暂停/恢复发布本地的视频流
     *
     * 该接口可以暂停（或恢复）发布本地的视频画面，暂停之后，同一房间中的其他用户将无法继续看到自己画面。
     * 该接口在指定 TRTCVideoStreamTypeBig 时等效于 start/stopLocalPreview 这两个接口，但具有更好的响应速度。
     * 因为 start/stopLocalPreview 需要打开和关闭摄像头，而打开和关闭摄像头都是硬件设备相关的操作，非常耗时。
     * 相比之下，muteLocalVideo 只需要在软件层面对数据流进行暂停或者放行即可，因此效率更高，也更适合需要频繁打开关闭的场景。
     * 当暂停/恢复发布指定 TRTCVideoStreamTypeBig 后，同一房间中的其他用户将会收到 onUserVideoAvailable 回调通知。
     * 当暂停/恢复发布指定 TRTCVideoStreamTypeSub 后，同一房间中的其他用户将会收到 onUserSubStreamAvailable 回调通知。
     * @param streamType 要暂停/恢复的视频流类型（仅支持 {@link TRTCVideoStreamTypeBig} 和 {@link TRTCVideoStreamTypeSub}）。
     * @param mute true：暂停；false：恢复。
     */
    virtual void muteLocalVideo(TRTCVideoStreamType streamType, bool mute) = 0;

    /**
     * 4.6 设置本地画面被暂停期间的替代图片
     *
     * 当您调用 muteLocalVideo(true) 暂停本地画面时，您可以通过调用本接口设置一张替代图片，设置后，房间中的其他用户会看到这张替代图片，而不是黑屏画面。
     * @param image 设置替代图片，空值代表在 muteLocalVideo 之后不再发送视频流数据，默认值为空。
     * @param fps 设置替代图片帧率，最小值为5，最大值为10，默认5。
     */
    virtual void setVideoMuteImage(TRTCImageBuffer* image, int fps) = 0;

    /**
     * 4.7 订阅远端用户的视频流，并绑定视频渲染控件
     *
     * 调用该接口可以让 SDK 拉取指定 userid 的视频流，并渲染到参数 view 指定的渲染控件上。您可以通过 {@link setRemoteRenderParams} 设置画面的显示模式。
     * - 如果您已经知道房间中有视频流的用户的 userid，可以直接调用 startRemoteView 订阅该用户的画面。
     * - 如果您不知道房间中有哪些用户在发布视频，您可以在 enterRoom 之后等待来自 {@link onUserVideoAvailable} 的通知。
     * 调用本接口只是启动视频流的拉取，此时画面还需要加载和缓冲，当缓冲完毕后您会收到来自 {@link onFirstVideoFrame} 的通知。
     * @param userId 指定远端用户的 ID。
     * @param streamType 指定要观看 userId 的视频流类型。
     *    - 高清大画面：{@link TRTCVideoStreamTypeBig}。
     *    - 低清小画面：{@link TRTCVideoStreamTypeSmall}（需要远端用户通过 {@link enableSmallVideoStream} 开启双路编码后才有效果）。
     *    - 辅流画面（常用于屏幕分享）：{@link TRTCVideoStreamTypeSub}。
     * @param view 用于承载视频画面的渲染控件。
     * @note 注意几点规则需要您关注：
     *  1. SDK 支持同时观看某 userid 的大画面和辅路画面，或者同时观看某 userid 的小画面和辅路画面，但不支持同时观看大画面和小画面。
     *  2. 只有当指定的 userid 通过 {@link enableSmallVideoStream} 开启双路编码后，才能观看该用户的小画面。
     *  3. 当指定的 userid 的小画面不存在时，SDK 默认切换到该用户的大画面。
     */
    virtual void startRemoteView(const char* userId, TRTCVideoStreamType streamType, TXView view) = 0;

    /**
     * 4.8 更新远端用户的视频渲染控件
     *
     * 该接口可用于更新远端视频画面的渲染控件，常被用于切换显示区域的交互场景中。
     * @param view 承载视频画面的控件。
     * @param streamType 要设置预览窗口的流类型（仅支持 {@link TRTCVideoStreamTypeBig} 和 {@link TRTCVideoStreamTypeSub}）。
     * @param userId 指定远端用户的 ID。
     */
    virtual void updateRemoteView(const char* userId, TRTCVideoStreamType streamType, TXView view) = 0;

    /**
     * 4.9 停止订阅远端用户的视频流，并释放渲染控件
     *
     * 调用此接口会让 SDK 停止接收该用户的视频流，并释放该路视频流的解码和渲染资源。
     * @param userId 指定远端用户的 ID。
     * @param streamType 指定要观看 userId 的视频流类型。
     * - 高清大画面：{@link TRTCVideoStreamTypeBig}。
     * - 低清小画面：{@link TRTCVideoStreamTypeSmall}。
     * - 辅流画面（常用于屏幕分享）：{@link TRTCVideoStreamTypeSub}。
     */
    virtual void stopRemoteView(const char* userId, TRTCVideoStreamType streamType) = 0;

    /**
     * 4.10 停止订阅所有远端用户的视频流，并释放全部渲染资源
     *
     * 调用此接口会让 SDK 停止接收所有来自远端的视频流，并释放全部的解码和渲染资源。
     * @note 如果当前有正在显示的辅路画面（屏幕分享）也会一并被停止。
     */
    virtual void stopAllRemoteView() = 0;

    /**
     * 4.11 暂停/恢复订阅远端用户的视频流
     *
     * 该接口仅暂停/恢复接收指定用户的视频流，但并不释放显示资源，视频画面会被冻屏在接口调用时的最后一帧。
     * @param userId 指定远端用户的 ID。
     * @param streamType 要暂停/恢复的视频流类型。
     * - 高清大画面：{@link TRTCVideoStreamTypeBig}。
     * - 低清小画面：{@link TRTCVideoStreamTypeSmall}。
     * - 辅流画面（常用于屏幕分享）：{@link TRTCVideoStreamTypeSub}。
     * @param mute 是否暂停接收。
     * @note 该接口支持您在进入房间（enterRoom）前调用，暂停状态会在退出房间（exitRoom）在之后会被重置。
     */
    virtual void muteRemoteVideoStream(const char* userId, TRTCVideoStreamType streamType, bool mute) = 0;

    /**
     * 4.12 暂停/恢复订阅所有远端用户的视频流
     *
     * 该接口仅暂停/恢复接收所有用户的视频流，但并不释放显示资源，视频画面会被冻屏在接口调用时的最后一帧。
     * @param mute  是否暂停接收。
     * @note 该接口支持您在进入房间（enterRoom）前调用，暂停状态会在退出房间（exitRoom）在之后会被重置。
     */
    virtual void muteAllRemoteVideoStreams(bool mute) = 0;

    /**
     * 4.13 设置视频编码器的编码参数
     *
     * 该设置能够决定远端用户看到的画面质量，同时也能决定云端录制出的视频文件的画面质量。
     * @param param 用于设置视频编码器的相关参数，详情请参见 {@link TRTCVideoEncParam}。
     */
    virtual void setVideoEncoderParam(const TRTCVideoEncParam& param) = 0;

    /**
     * 4.14 设置网络质量控制的相关参数
     *
     * 该设置决定在差网络环境下的质量调控策略，如“画质优先”或“流畅优先”等策略。
     * @param param 用于设置网络质量控制的相关参数，详情请参见 {@link TRTCNetworkQosParam}。
     */
    virtual void setNetworkQosParam(const TRTCNetworkQosParam& param) = 0;

    /**
     * 4.15 设置本地画面的渲染参数
     *
     * 可设置的参数包括有：画面的旋转角度、填充模式以及左右镜像等。
     * @param params 画面渲染参数，详情请参见 {@link TRTCRenderParams}。
     */
    virtual void setLocalRenderParams(const TRTCRenderParams& params) = 0;

    /**
     * 4.16 设置远端画面的渲染模式
     *
     * 可设置的参数包括有：画面的旋转角度、填充模式以及左右镜像等。
     * @param userId 指定远端用户的 ID。
     * @param streamType 可以设置为主路画面（{@link TRTCVideoStreamTypeBig}）或辅路画面（{@link TRTCVideoStreamTypeSub}）。
     * @param params 画面渲染参数，详情请参见 {@link TRTCRenderParams}。
     */
    virtual void setRemoteRenderParams(const char* userId, TRTCVideoStreamType streamType, const TRTCRenderParams& params) = 0;

    /**
     * 4.17 设置视频编码器输出的画面方向
     *
     * 该设置不影响本地画面的预览方向，但会影响房间中其他用户所观看到（以及云端录制文件）的画面方向。
     * 当用户将手机或 Pad 上下颠倒时，由于摄像头的采集方向没有变，所以房间中其他用户所看到的画面会变成上下颠倒的，
     * 在这种情况下，您可以通过调用该接口将 SDK 编码出的画面方向旋转180度，如此一来，房间中其他用户所看到的画面可保持正常的方向。
     * 如果您希望实现上述这种友好的交互体验，我们更推荐您直接调用 {@link setGSensorMode} 实现更加智能的方向适配，无需您手动调用本接口。
     * @param rotation 目前支持 0、90、180、270 两个旋转角度，默认值：TRTCVideoRotation_0，即不旋转。
     */
    virtual void setVideoEncoderRotation(TRTCVideoRotation rotation) = 0;

    /**
     * 4.18 设置编码器输出的画面镜像模式
     *
     * 该设置不影响本地画面的镜像模式，但会影响房间中其他用户所观看到（以及云端录制文件）的镜像模式。
     * @param mirror 是否开启远端镜像，true：开启远端画面镜像；false：关闭远端画面镜像，默认值：false。
     */
    virtual void setVideoEncoderMirror(bool mirror) = 0;

    /**
     * 4.20 开启大小画面双路编码模式
     *
     * 开启双路编码模式后，当前用户的编码器会同时输出【高清大画面】和【低清小画面】两路视频流（但只有一路音频流）。
     * 如此以来，房间中的其他用户就可以根据自身的网络情况或屏幕大小选择订阅【高清大画面】或是【低清小画面】。
     * @param enable 是否开启小画面编码，默认值：false。
     * @param smallVideoEncParam 小流的视频参数。
     * @return 0：成功；-1：当前大画面已被设置为较低画质，开启双路编码已无必要。
     * @note 双路编码开启后，会消耗更多的 CPU 和 网络带宽，所以 Mac、Windows 或者高性能 Pad 可以考虑开启，不建议手机端开启。
     */
    virtual void enableSmallVideoStream(bool enable, const TRTCVideoEncParam& smallVideoEncParam) = 0;

    /**
     * 4.21 切换指定远端用户的大小画面
     *
     * 当房间中某个主播开启了双路编码之后，房间中其他用户通过 {@link startRemoteView} 订阅到的画面默认会是【高清大画面】。
     * 您可以通过此接口选定希望订阅的画面是大画面还是小画面，该接口在 {@link startRemoteView} 之前和之后调用均可生效。
     * @param userId 指定远端用户的 ID。
     * @param streamType 视频流类型，即选择看大画面还是小画面，默认为大画面。
     * @note 此功能需要目标用户已经通过 {@link enableSmallVideoStream} 提前开启了双路编码模式，否则此调用无实际效果。
     */
    virtual void setRemoteVideoStreamType(const char* userId, TRTCVideoStreamType streamType) = 0;

/**
 * 4.22 视频画面截图
 *
 * 您可以通过本接口截取本地的视频画面，远端用户的主路画面以及远端用户的辅路（屏幕分享）画面。
 * @param userId 用户 ID，如指定空置表示截取本地的视频画面。
 * @param streamType 视频流类型，可选择截取主路画面（{@link TRTCVideoStreamTypeBig}，常用于摄像头）或辅路画面（{@link TRTCVideoStreamTypeSub}，常用于屏幕分享）。
 * @param sourceType 画面来源，可选择截取视频流画面（{@link TRTCSnapshotSourceTypeStream}）或视频渲染画面（{@link TRTCSnapshotSourceTypeView}），前者一般更清晰。
 * @note Windows 平台目前仅支持截取 {@link TRTCSnapshotSourceTypeStream} 来源的视频画面。
 */
#if _WIN32 || __APPLE__ || (!__ANDROID__ && __linux__)
    virtual void snapshotVideo(const char* userId, TRTCVideoStreamType streamType, TRTCSnapshotSourceType sourceType) = 0;
#endif

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                    音频相关接口函数
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 5.1 开启本地音频的采集和发布
     *
     * SDK 默认不开启麦克风，当用户需要发布本地音频时，需要调用该接口开启麦克风采集，并将音频编码并发布到当前的房间中。
     * 开启本地音频的采集和发布后，房间中的其他用户会收到 {@link onUserAudioAvailable}(userId, true) 的通知。
     * @param quality 声音音质
     * - {@link TRTCAudioQualitySpeech}，流畅：采样率：16k；单声道；音频裸码率：16kbps；适合语音通话为主的场景，比如在线会议，语音通话。
     * - {@link TRTCAudioQualityDefault}，默认：采样率：48k；单声道；音频裸码率：50kbps；SDK 默认的音频质量，如无特殊需求推荐选择之。
     * - {@link TRTCAudioQualityMusic}，高音质：采样率：48k；双声道 + 全频带；音频裸码率：128kbps；适合需要高保真传输音乐的场景，比如在线K歌、音乐直播等。
     * @note 该函数会检查麦克风的使用权限，如果当前 App 没有麦克风权限，SDK 会自动向用户申请麦克风使用权限。
     */
    virtual void startLocalAudio(TRTCAudioQuality quality) = 0;

    /**
     * 5.2 停止本地音频的采集和发布
     *
     * 停止本地音频的采集和发布后，房间中的其他用户会收到 {@link onUserAudioAvailable}(userId, false) 的通知。
     */
    virtual void stopLocalAudio() = 0;

    /**
     * 5.3 暂停/恢复发布本地的音频流
     *
     * 当您暂停发布本地音频流之后，房间中的其他他用户会收到 {@link onUserAudioAvailable}(userId, false) 的通知。
     * 当您恢复发布本地音频流之后，房间中的其他他用户会收到 {@link onUserAudioAvailable}(userId, true) 的通知。
     * 与 {@link stopLocalAudio} 的不同之处在于，muteLocalAudio(true) 并不会释放麦克风权限，而是继续发送码率极低的静音包。
     * 这对于需要云端录制的场景非常适用，因为 MP4 等格式的视频文件，对于音频数据的连续性要求很高，使用 {@link stopLocalAudio} 会导致录制出的 MP4 文件不易播放。
     * 因此在对录制文件的质量要求较高的场景中，建议选择 muteLocalAudio 而不建议使用 stopLocalAudio。
     * @param mute true：静音；false：恢复。
     */
    virtual void muteLocalAudio(bool mute) = 0;

    /**
     * 5.4 暂停/恢复播放远端的音频流
     *
     * 当您静音某用户的远端音频时，SDK 会停止播放指定用户的声音，同时也会停止拉取该用户的音频数据数据。
     * @param userId 用于指定远端用户的 ID。
     * @param mute true：静音；false：取消静音。
     * @note 在进入房间（enterRoom）之前或之后调用本接口均生效，静音状态在退出房间（exitRoom） 之后会被重置为 false。
     */
    virtual void muteRemoteAudio(const char* userId, bool mute) = 0;

    /**
     * 5.5 暂停/恢复播放所有远端用户的音频流
     *
     * 当您静音所有用户的远端音频时，SDK 会停止播放所有来自远端的音频流，同时也会停止拉取所有用户的音频数据。
     * @param mute true：静音；false：取消静音。
     * @note 在进入房间（enterRoom）之前或之后调用本接口均生效，静音状态在退出房间（exitRoom） 之后会被重置为 false。
     */
    virtual void muteAllRemoteAudio(bool mute) = 0;

    /**
     * 5.7 设定某一个远端用户的声音播放音量
     *
     * 您可以通过 setRemoteAudioVolume(userId, 0) 将某一个远端用户的声音静音。
     * @param userId 用于指定远端用户的 ID。
     * @param volume 音量大小，取值范围为0 - 100，默认值：100。
     * @note 如果将 volume 设置成 100 之后感觉音量还是太小，可以将 volume 最大设置成 150，但超过 100 的 volume 会有爆音的风险，请谨慎操作。
     */
    virtual void setRemoteAudioVolume(const char* userId, int volume) = 0;

    /**
     * 5.8 设定本地音频的采集音量
     *
     * @param volume 音量大小，取值范围为0 - 100；默认值：100。
     * @note 如果将 volume 设置成 100 之后感觉音量还是太小，可以将 volume 最大设置成 150，但超过 100 的 volume 会有爆音的风险，请谨慎操作。
     */
    virtual void setAudioCaptureVolume(int volume) = 0;

    /**
     * 5.9 获取本地音频的采集音量
     */
    virtual int getAudioCaptureVolume() = 0;

    /**
     * 5.10 设定远端音频的播放音量
     *
     * 该接口会控制 SDK 最终交给系统播放的声音音量，调节效果会影响到本地音频录制文件的音量大小，但不会影响到耳返的音量大小。
     * @param volume 音量大小，取值范围为0 - 100，默认值：100。
     * @note 如果将 volume 设置成 100 之后感觉音量还是太小，可以将 volume 最大设置成 150，但超过 100 的 volume 会有爆音的风险，请谨慎操作。
     */
    virtual void setAudioPlayoutVolume(int volume) = 0;

    /**
     * 5.11 获取远端音频的播放音量
     */
    virtual int getAudioPlayoutVolume() = 0;

    /**
     * 5.12 启用音量大小提示
     *
     * 开启此功能后，SDK 会在 {@link ITRTCCloudCallback} 中的 {@link onUserVoiceVolume} 回调中反馈本地或远端用户的音频音量评估信息，包括音量大小、人声检测、音频频谱等。
     * @param enable 是否启用音量提示，默认为关闭状态。
     * @param params 音量评估等相关参数，请参见 {@link TRTCAudioVolumeEvaluateParams}。
     */
    virtual void enableAudioVolumeEvaluation(bool enable, const TRTCAudioVolumeEvaluateParams& params) = 0;

    /**
     * 5.13 开始录音
     *
     * 当您调用该接口后， SDK 会将本地和远端的所有音频（包括本地音频，远端音频，背景音乐和音效等）混合并录制到一个本地文件中。
     * 该接口在进入房间前后调用均可生效，如果录制任务在退出房间前尚未通过 stopAudioRecording 停止，则退出房间后录制任务会自动被停止。
     * @param param 录音参数，请参见 {@link TRTCAudioRecordingParams}。
     * @return 0：成功；-1：录音已开始；-2：文件或目录创建失败；-3：后缀指定的音频格式不支持。
     */
    virtual int startAudioRecording(const TRTCAudioRecordingParams& param) = 0;

    /**
     * 5.14 停止录音
     *
     * 如果录制任务在退出房间前尚未通过本接口停止，则退出房间后录音任务会自动被停止。
     */
    virtual void stopAudioRecording() = 0;

    /**
     * 5.15 开启本地媒体录制
     *
     * 开启后把直播过程中的音视频内容录制到本地的一个文件中。
     * @param params 录制参数，请参见 {@link TRTCLocalRecordingParams}。
     */
    virtual void startLocalRecording(const TRTCLocalRecordingParams& params) = 0;

    /**
     * 5.16 停止本地媒体录制
     *
     * 如果录制任务在退出房间前尚未通过本接口停止，则退出房间后录音任务会自动被停止。
     */
    virtual void stopLocalRecording() = 0;

    /**
     * 5.18 设置远端音频流智能并发播放策略
     *
     * 设置远端音频流智能并发播放策略，适用于上麦人数比较多的场景。
     * @param params 音频并发参数，请参见 {@link TRTCAudioParallelParams}。
     */
    virtual void setRemoteAudioParallelParams(const TRTCAudioParallelParams& params) = 0;

    /**
     * 5.19 启用 3D 音效
     *
     * 启用 3D 音效。注意需使用流畅音质 {@link TRTCAudioQualitySpeech} 或默认音质 {@link TRTCAudioQualityDefault}。
     * @param enabled 是否启用 3D 音效，默认为关闭状态。
     */
    virtual void enable3DSpatialAudioEffect(bool enabled) = 0;

    /**
     * 5.20 设置 3D 音效中自身坐标及朝向信息
     *
     * 更新自身在世界坐标系中的位置和朝向， SDK 会根据该方法参数计算自身和远端用户之间的相对位置，进而渲染出空间音效。注意各参数应分别传入长度为 3 的数组。
     * @param position 自身在世界坐标系中的坐标，三个值依次表示前、右、上坐标值。
     * @param axisForward 自身坐标系前轴在世界坐标系中的单位向量，三个值依次表示前、右、上坐标值。
     * @param axisRight 自身坐标系右轴在世界坐标系中的单位向量，三个值依次表示前、右、上坐标值。
     * @param axisUp 自身坐标系上轴在世界坐标系中的单位向量，三个值依次表示前、右、上坐标值。
     * @note 请适当限制调用频率，推荐两次坐标设置至少间隔 100ms。
     */
    virtual void updateSelf3DSpatialPosition(int position[3], float axisForward[3], float axisRight[3], float axisUp[3]) = 0;

    /**
     * 5.21 设置 3D 音效中远端用户坐标信息
     *
     * 更新远端用户在世界坐标系中的位置，SDK 会根据自身和远端用户之间的相对位置，进而渲染出空间音效。注意参数为长度等于 3 的数组。
     * @param userId 指定远端用户的 ID。
     * @param position 该远端用户在世界坐标系中的坐标，三个值依次表示前、右、上坐标值。
     * @note 请适当限制调用频率，推荐同一远端用户两次坐标设置至少间隔 100ms。
     */
    virtual void updateRemote3DSpatialPosition(const char* userId, int position[3]) = 0;

    /**
     * 5.22 设置指定用户所发出声音的可被接收范围
     *
     * 设置该范围大小之后，该指定用户的声音将在该范围内可被听见，超出该范围将被衰减为 0。
     * @param userId 指定远端用户的 ID。
     * @param range 声音最大可被接收范围。
     */
    virtual void set3DSpatialReceivingRange(const char* userId, int range) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                    设备管理相关接口
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 6.1 获取设备管理类（TXDeviceManager）
     */
    virtual ITXDeviceManager* getDeviceManager() = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                    美颜特效和图像水印
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 7.1 设置美颜、美白、红润等特效
     *
     * SDK 内部集成了两套风格不同的磨皮算法：
     * -“光滑”：算法比较激进，磨皮效果比较明显，适用于秀场直播。
     * -“自然”：算法更多地保留了面部细节，磨皮效果更加自然，适用于绝大多数直播场景。
     * @param style 磨皮算法，有“光滑”和“自然”两种算法。
     * @param beautyLevel 美颜级别，取值范围0 - 9，0表示关闭，1 - 9值越大，效果越明显。
     * @param whitenessLevel 美白级别，取值范围0 - 9，0表示关闭，1 - 9值越大，效果越明显。
     * @param ruddinessLevel 红润级别，取值范围0 - 9，0表示关闭，1 - 9值越大，效果越明显。
     */
    virtual void setBeautyStyle(TRTCBeautyStyle style, uint32_t beautyLevel, uint32_t whitenessLevel, uint32_t ruddinessLevel) = 0;

    /**
     * 7.2 添加水印
     *
     * 水印的位置是通过 xOffset, yOffset, fWidthRatio 来指定的。
     * - xOffset：水印的坐标，取值范围为0 - 1的浮点数。
     * - yOffset：水印的坐标，取值范围为0 - 1的浮点数。
     * - fWidthRatio：水印的大小比例，取值范围为0 - 1的浮点数。
     * @param streamType 要设置水印的流类型（TRTCVideoStreamTypeBig、TRTCVideoStreamTypeSub）。
     * @param srcData    水印图片源数据（传 nullptr 表示去掉水印）。
     * @param srcType    水印图片源数据类型。
     * @param nWidth     水印图片像素宽度（源数据为文件路径时忽略该参数）。
     * @param nHeight    水印图片像素高度（源数据为文件路径时忽略该参数）。
     * @param xOffset    水印显示的左上角 x 轴偏移。
     * @param yOffset    水印显示的左上角 y 轴偏移。
     * @param fWidthRatio 水印显示的宽度占画面宽度比例（水印按该参数等比例缩放显示）。
     * @param isVisibleOnLocalPreview true：本地预览显示水印；false：本地预览不显示水印，仅在win/mac下生效。
     * @note 本接口只支持给主路视频添加图片水印。
     */
    virtual void setWaterMark(TRTCVideoStreamType streamType, const char* srcData, TRTCWaterMarkSrcType srcType, uint32_t nWidth, uint32_t nHeight, float xOffset, float yOffset, float fWidthRatio, bool isVisibleOnLocalPreview = false) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                    背景音乐和声音特效
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 8.1 获取音效管理类（TXAudioEffectManager）
     *
     * TXAudioEffectManager 是音效管理接口，您可以通过该接口实现如下功能：
     * - 背景音乐：支持在线音乐和本地音乐，支持变速、变调等特效、支持原生和伴奏并播放和循环播放。
     * - 耳机耳返：麦克风捕捉的声音实时通过耳机播放，常用于音乐直播。
     * - 混响效果：KTV、小房间、大会堂、低沉、洪亮...。
     * - 变声特效：萝莉、大叔、重金属...。
     * - 短音效：鼓掌声、欢笑声等简短的音效文件（对于小于10秒的文件，请将 isShortFile 参数设置为 true）。
     */
    virtual ITXAudioEffectManager* getAudioEffectManager() = 0;

/**
 * 8.2 开启系统声音采集（仅适用于桌面系统）
 *
 * 该接口会从电脑的声卡中采集音频数据，并将其混入到 SDK 当前的音频数据流中，从而使房间中的其他用户也能听到主播的电脑所播放出的声音。
 * 在线教育场景中，老师可以使用此功能让 SDK 采集教学影片中的声音，并广播给同房间中的学生。
 * 音乐直播场景中，主播可以使用此功能让 SDK 采集音乐播放器中的音乐，从而为自己的直播间增加背景音乐。
 * @param deviceName 您可以指定该参数为空值（nullptr），代表让 SDK 采集整个系统的声音。
 * @note
 * 在 Windows 平台下，您也可以将参数 deviceName 设置为某个应用程序的可执行文件（如 QQMuisc.exe）的绝对路径，此时 SDK 只会采集该应用程序的声音（仅支持 32 位版本的 SDK）。
 * 您也可以指定该参数为某个扬声器设备的名称来采集特定扬声器声音（通过接口 {@link TXDeviceManager} 中的 getDevicesList 接口，可以获取类型为 {@link TXMediaDeviceTypeSpeaker} 的扬声器设备）。
 */
#if TARGET_PLATFORM_DESKTOP
    virtual void startSystemAudioLoopback(const char* deviceName = nullptr) = 0;
#endif

/**
 * 8.3 停止系统声音采集（仅适用于桌面系统和 Android 系统）
 */
#if TARGET_PLATFORM_DESKTOP
    virtual void stopSystemAudioLoopback() = 0;
#endif

/**
 * 8.4 设置系统声音的采集音量
 *
 * @param volume 设置的音量大小，范围是：[0 ~ 150]，默认值为100。
 */
#if TARGET_PLATFORM_DESKTOP || TARGET_OS_IPHONE
    virtual void setSystemAudioLoopbackVolume(uint32_t volume) = 0;
#endif

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                    屏幕分享相关接口
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 9.1 启动屏幕分享
     *
     * 该接口可以抓取整个屏幕的内容，或抓取您指定的某个应用的窗口内容，并将其分享给同房间中的其他用户。
     * @param view 渲染控件所在的父控件，可以设置为空值，表示不显示屏幕分享的预览效果。
     * @param streamType 屏幕分享使用的线路，可以设置为主路（TRTCVideoStreamTypeBig）或者辅路（TRTCVideoStreamTypeSub），推荐使用辅路。
     * @param encParam 屏幕分享的画面编码参数，SDK 会优先使用您通过此接口设置的编码参数：
     *   - 如果您设置 encParam 为空值，且您已通过 setSubStreamEncoderParam 设置过辅路视频编码参数，SDK 将使用您设置过的辅路编码参数进行屏幕分享。
     *   - 如果您设置 encParam 为空值，且您未通过 setSubStreamEncoderParam 设置过辅路视频编码参数，SDK 将自动选择一个最佳的编码参数进行屏幕分享。
     * @note
     * 1. 同一个用户同时最多只能发布一路主路（{@link TRTCVideoStreamTypeBig}）画面和一路辅路（{@link TRTCVideoStreamTypeSub}）画面。
     * 2. 默认情况下，屏幕分享使用辅路画面。如果使用主路做屏幕分享，您需要提前停止摄像头采集（{@link stopLocalPreview}）以避免相互冲突。
     * 3. 同一个房间中同时只能有一个用户使用辅路做屏幕分享，也就是说，同一个房间中同时只允许一个用户开启辅路。
     * 4. 当房间中已经有其他用户在使用辅路分享屏幕时，此时调用该接口会收到来自 {@link ITRTCCloudCallback} 的 onError(ERR_SERVER_CENTER_ANOTHER_USER_PUSH_SUB_VIDEO) 回调。
     */
    virtual void startScreenCapture(TXView view, TRTCVideoStreamType streamType, TRTCVideoEncParam* encParam) = 0;

    /**
     * 9.2 停止屏幕分享
     */
    virtual void stopScreenCapture() = 0;

    /**
     * 9.3 暂停屏幕分享
     */
    virtual void pauseScreenCapture() = 0;

    /**
     * 9.4 恢复屏幕分享
     */
    virtual void resumeScreenCapture() = 0;

/**
 * 9.5 枚举可分享的屏幕和窗口（该接口仅支持桌面系统）
 *
 * 当您在对接桌面端系统的屏幕分享功能时，一般都需要展示一个选择分享目标的界面，这样用户能够使用这个界面选择是分享整个屏幕还是某个窗口。
 * 通过本接口，您就可以查询到当前系统中可用于分享的窗口的 ID、名称以及缩略图。我们在 Demo 中提供了一份默认的界面实现供您参考。
 * @param thumbnailSize 指定要获取的窗口缩略图大小，缩略图可用于绘制在窗口选择界面上。
 * @param iconSize 指定要获取的窗口图标大小。
 * @return 窗口列表包括屏幕。
 * @note
 * 1. 返回的列表中包含屏幕和应用窗口，屏幕是列表中的第一个元素。如果用户有多个显示器，那么每个显示器都是一个分享目标。
 * 2. 请不要使用 delete ITRTCScreenCaptureSourceList* 删除 SourceList，这很容易导致崩溃，请使用 ITRTCScreenCaptureSourceList 中的 release 方法释放列表。
 */
#if TARGET_PLATFORM_DESKTOP
    virtual ITRTCScreenCaptureSourceList* getScreenCaptureSources(const SIZE& thumbnailSize, const SIZE& iconSize) = 0;
#endif

/**
 * 9.6 选取要分享的屏幕或窗口（该接口仅支持桌面系统）
 *
 * 当您通过 getScreenCaptureSources 获取到可以分享的屏幕和窗口之后，您可以调用该接口选定期望分享的目标屏幕或目标窗口。
 * 在屏幕分享的过程中，您也可以随时调用该接口以切换分享目标。
 * 支持如下四种情况：
 * - 共享整个屏幕：sourceInfoList 中 type 为 Screen 的 source，captureRect 设为 { 0, 0, 0, 0 }
 * - 共享指定区域：sourceInfoList 中 type 为 Screen 的 source，captureRect 设为非 nullptr，例如 { 100, 100, 300, 300 }
 * - 共享整个窗口：sourceInfoList 中 type 为 Window 的 source，captureRect 设为 { 0, 0, 0, 0 }
 * - 共享窗口区域：sourceInfoList 中 type 为 Window 的 source，captureRect 设为非 nullptr，例如 { 100, 100, 300, 300 }
 * @param source        指定分享源
 * @param captureRect   指定捕获的区域
 * @param property      指定屏幕分享目标的属性，包括捕获鼠标，高亮捕获窗口等，详情参考TRTCScreenCaptureProperty 定义
 * @note 设置高亮边框颜色、宽度参数在 Mac 平台不生效。
 */
#if TARGET_PLATFORM_DESKTOP
    virtual void selectScreenCaptureTarget(const TRTCScreenCaptureSourceInfo& source, const RECT& captureRect, const TRTCScreenCaptureProperty& property) = 0;
#endif

    /**
     * 9.7 设置屏幕分享（即辅路）的视频编码参数（桌面系统和移动系统均已支持）
     *
     * 该接口可以设定远端用户所看到的屏幕分享（即辅路）的画面质量，同时也能决定云端录制出的视频文件中屏幕分享的画面质量。
     * 请注意如下两个接口的差异：
     * - {@link setVideoEncoderParam} 用于设置主路画面（{@link TRTCVideoStreamTypeBig}，一般用于摄像头）的视频编码参数。
     * - {@link setSubStreamEncoderParam} 用于设置辅路画面（{@link TRTCVideoStreamTypeSub}，一般用于屏幕分享）的视频编码参数。
     * @param param 辅流编码参数，详情请参见 {@link TRTCVideoEncParam}。
     * @note 即使您使用主路传输屏幕分享（在调用 startScreenCapture 时设置 type = TRTCVideoStreamTypeBig），依然要使用 {@link setSubStreamEncoderParam} 设定屏幕分享的编码参数，而不要使用 {@link setVideoEncoderParam} 。
     */
    virtual void setSubStreamEncoderParam(const TRTCVideoEncParam& param) = 0;

/**
 * 9.8 设置屏幕分享时的混音音量大小（该接口仅支持桌面系统）
 *
 * 这个数值越高，屏幕分享音量的占比就越高，麦克风音量占比就越小，所以不推荐设置得太大，否则麦克风的声音就被压制了。
 * @param volume 设置的混音音量大小，范围0 - 100。
 */
#if TARGET_PLATFORM_DESKTOP
    virtual void setSubStreamMixVolume(uint32_t volume) = 0;
#endif

/**
 * 9.9 将指定窗口加入屏幕分享的排除列表中（该接口仅支持桌面系统）
 *
 * 加入排除列表中的窗口不会被分享出去，常见的用法是将某个应用的窗口加入到排除列表中以避免隐私问题。
 * 支持启动屏幕分享前设置过滤窗口，也支持屏幕分享过程中动态添加过滤窗口。
 * @param windowID 不希望分享出去的窗口
 * @note
 *  1. 该接口只有在 {@link TRTCScreenCaptureSourceInfo} 中的 type 指定为 {@link TRTCScreenCaptureSourceTypeScreen} 时生效，即只有在分享整个屏幕内容时，排除指定窗口的功能才生效。
 *  2. 使用该接口添加到排除列表中的窗口会在退出房间后被 SDK 自动清除。
 *  3. Mac 平台下请传入窗口 ID（即 CGWindowID），您可以通过 {@link TRTCScreenCaptureSourceInfo} 中的 sourceId 成员获得。
 */
#if TARGET_PLATFORM_DESKTOP
    virtual void addExcludedShareWindow(TXView windowID) = 0;
#endif

/**
 * 9.10 将指定窗口从屏幕分享的排除列表中移除（该接口仅支持桌面系统）
 *
 * @param windowID 要排除的窗口 id。
 */
#if TARGET_PLATFORM_DESKTOP
    virtual void removeExcludedShareWindow(TXView windowID) = 0;
#endif

/**
 * 9.11 将所有窗口从屏幕分享的排除列表中移除（该接口仅支持桌面系统）
 */
#if TARGET_PLATFORM_DESKTOP
    virtual void removeAllExcludedShareWindow() = 0;
#endif

/**
 * 9.12 将指定窗口加入屏幕分享的包含列表中（该接口仅支持桌面系统）
 *
 * 该接口只有在 {@link TRTCScreenCaptureSourceInfo} 中的 type 指定为 {@link TRTCScreenCaptureSourceTypeWindow} 时生效。即只有在分享窗口内容时，额外包含指定窗口的功能才生效。
 * 您在 {@link startScreenCapture} 之前和之后调用均可。
 * @param windowID 希望被分享出去的窗口（Windows 平台下为窗口句柄： HWND）
 * @note 通过该方法添加到包含列表中的窗口，会在退出房间后被 SDK 自动清除。
 */
#if TARGET_PLATFORM_DESKTOP
    virtual void addIncludedShareWindow(TXView windowID) = 0;
#endif

/**
 * 9.13 将指定窗口从屏幕分享的包含列表中移除（该接口仅支持桌面系统）
 *
 * 该接口只有在 {@link TRTCScreenCaptureSourceInfo} 中的 type 指定为 {@link TRTCScreenCaptureSourceTypeWindow} 时生效。
 * 即只有在分享窗口内容时，额外包含指定窗口的功能才生效。
 * @param windowID 希望被分享出去的窗口（Mac 平台：窗口 ID；Windows 平台：HWND）
 */
#if TARGET_PLATFORM_DESKTOP
    virtual void removeIncludedShareWindow(TXView windowID) = 0;
#endif

/**
 * 9.14 将全部窗口从屏幕分享的包含列表中移除（该接口仅支持桌面系统）
 *
 * 该接口只有在 {@link TRTCScreenCaptureSourceInfo} 中的 type 指定为 {@link TRTCScreenCaptureSourceTypeWindow} 时生效。
 * 即只有在分享窗口内容时，额外包含指定窗口的功能才生效。
 */
#if TARGET_PLATFORM_DESKTOP
    virtual void removeAllIncludedShareWindow() = 0;
#endif

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                    自定义采集和自定义渲染
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 10.1 启用/关闭视频自定义采集模式
     *
     * 开启该模式后，SDK 不在运行原有的视频采集流程，即不再继续从摄像头采集数据和美颜，而是只保留视频编码和发送能力。
     * 您需要通过 {@link sendCustomVideoData} 不断地向 SDK 塞入自己采集的视频画面。
     * @param streamType 用于指定视频流类型，{@link TRTCVideoStreamTypeBig}：高清大画面；{@link TRTCVideoStreamTypeSub}：辅路画面。
     * @param enable 是否启用，默认值：false。
     */
    virtual void enableCustomVideoCapture(TRTCVideoStreamType streamType, bool enable) = 0;

    /**
     * 10.2 向 SDK 投送自己采集的视频帧
     *
     * 使用此接口可以向 SDK 投送自己采集的视频帧，SDK 会将视频帧进行编码并通过自身的网络模块传输出去。
     * 参数 {@link TRTCVideoFrame} 推荐下列填写方式（其他字段不需要填写）：
     * - pixelFormat：Windows 和 Android 平台仅支持 {@link TRTCVideoPixelFormat_I420}，iOS 和 Mac平台支持 {@link TRTCVideoPixelFormat_I420} 和 {@link TRTCVideoPixelFormat_BGRA32}。
     * - bufferType：推荐选择 {@link TRTCVideoBufferType_Buffer}。
     * - data：用于承载视频帧数据的 buffer。
     * - length：视频帧数据长度，如果 pixelFormat 设定为 I420 格式，length 可以按照如下公式计算：length = width × height × 3 / 2。
     * - width：视频图像的宽度，如 640 px。
     * - height：视频图像的高度，如 480 px。
     * - timestamp：时间戳，单位为毫秒（ms），请使用视频帧在采集时被记录下来的时间戳（可以在采集到一帧视频帧之后，通过调用 {@link generateCustomPTS} 获取时间戳）。
     *
     * 参考文档：[自定义采集和渲染](https://cloud.tencent.com/document/product/647/34066)。
     * @param streamType 用于指定视频流类型，{@link TRTCVideoStreamTypeBig}： 高清大画面；{@link TRTCVideoStreamTypeSub}： 辅路画面。
     * @param frame 视频数据，支持 I420 格式数据。
     * @note
     * 1. 推荐您在采集到的一帧视频帧后，即调用 {@link generateCustomPTS} 接口获取该帧的 timestamp 数值，这样可以获得最佳的音画同步效果。
     * 2. SDK 最终编码出的视频帧率并不是由您调用本接口的频率决定的，而是由您在 {@link setVideoEncoderParam} 中所设置的 FPS 决定的。
     * 3. 请尽量保持本接口的调用间隔是均匀的，否则会导致编码器输出帧率不稳或者音画不同步等问题。
     * 4. iOS 和 Mac平台目前支持传入 {@link TRTCVideoPixelFormat_I420} 或 {@link TRTCVideoPixelFormat_BGRA32} 格式的视频帧。
     * 5. Windows 和 Android 平台目前仅支持传入 {@link TRTCVideoPixelFormat_I420} 格式的视频帧。
     */
    virtual void sendCustomVideoData(TRTCVideoStreamType streamType, TRTCVideoFrame* frame) = 0;

    /**
     * 10.3 启用音频自定义采集模式
     *
     * 开启该模式后，SDK 不在运行原有的音频采集流程，即不再继续从麦克风采集音频数据，而是只保留音频编码和发送能力。
     * 您需要通过 {@link sendCustomAudioData} 不断地向 SDK 塞入自己采集的音频数据。
     * @param enable 是否启用，默认值：false。
     * @note 由于回声抵消（AEC）需要严格的控制声音采集和播放的时间，所以开启自定义音频采集后，AEC 能力可能会失效。
     */
    virtual void enableCustomAudioCapture(bool enable) = 0;

    /**
     * 10.4 向 SDK 投送自己采集的音频数据
     *
     * 参数 {@link TRTCAudioFrame} 推荐下列填写方式（其他字段不需要填写）：
     * - audioFormat：音频数据格式，仅支持 TRTCAudioFrameFormatPCM。
     * - data：音频帧 buffer。音频帧数据只支持 PCM 格式，支持[5ms ~ 100ms]帧长，推荐使用 20ms 帧长，长度计算方法：【48000采样率、单声道的帧长度：48000 × 0.02s × 1 × 16bit = 15360bit = 1920字节】。
     * - sampleRate：采样率，支持：16000、24000、32000、44100、48000。
     * - channel：声道数（如果是立体声，数据是交叉的），单声道：1； 双声道：2。
     * - timestamp：时间戳，单位为毫秒（ms），请使用音频帧在采集时被记录下来的时间戳（可以在采集到一帧音频帧之后，通过调用 {@link generateCustomPTS} 获取时间戳）。
     *
     * 参考文档：[自定义采集和渲染](https://cloud.tencent.com/document/product/647/34066)。
     * @param frame 音频数据
     * @note 请您精准地按每帧时长的间隔调用本接口，数据投送间隔不均匀时极易触发声音卡顿。
     */
    virtual void sendCustomAudioData(TRTCAudioFrame* frame) = 0;

    /**
     * 10.5 启用/关闭自定义音轨
     *
     * 开启后，您可以通过本接口向 SDK 混入一条自定义的音轨。通过两个布尔型参数，您可以控制该音轨是否要在远端和本地播放。
     * @param enablePublish 控制混入的音轨是否要在远端播放，默认值：false。
     * @param enablePlayout 控制混入的音轨是否要在本地播放，默认值：false。
     * @note 如果您指定参数 enablePublish 和 enablePlayout 均为 false，代表完全关闭您的自定义音轨。
     */
    virtual void enableMixExternalAudioFrame(bool enablePublish, bool enablePlayout) = 0;

    /**
     * 10.6 向 SDK 混入自定义音轨
     *
     * 调用该接口之前，您需要先通过 {@link enableMixExternalAudioFrame} 开启自定义音轨，之后就可以通过本接口将自己的音轨以 PCM 格式混入到 SDK 中。
     * 理想情况下，我们期望您的代码能够以非常均匀的速度向 SDK 提供音轨数据。但我们也非常清楚，完美的调用间隔是一个巨大的挑战。
     * 所以 SDK 内部会开启一个音轨数据的缓冲区，该缓冲区的作用类似一个“蓄水池”，它能够暂存您传入的音轨数据，平抑由于接口调用间隔的抖动问题。
     * 本接口的返回值代表这个音轨缓冲区的大小，单位是毫秒（ms），比如：如果该接口返回 50，则代表当前的音轨缓冲区有 50ms 的音轨数据。因此只要您在 50ms 内再次调用本接口，SDK 就能保证您混入的音轨数据是连续的。
     * 当您调用该接口后，如果发现返回值 > 100ms，则可以等待一帧音频帧的播放时间之后再次调用；如果返回值 < 100ms，则代表缓冲区比较小，您可以再次混入一些音轨数据以确保音轨缓冲区的大小维持在“安全水位”以上。
     * 参数 {@link TRTCAudioFrame} 推荐下列填写方式（其他字段不需要填写）：
     * - data：音频帧 buffer。音频帧数据只支持 PCM 格式，支持[5ms ~ 100ms]帧长，推荐使用 20ms 帧长，长度计算方法：【48000采样率、单声道的帧长度：48000 × 0.02s × 1 × 16bit = 15360bit = 1920字节】。
     * - sampleRate：采样率，支持：16000、24000、32000、44100、48000。
     * - channel：声道数（如果是立体声，数据是交叉的），单声道：1； 双声道：2。
     * - timestamp：时间戳，单位为毫秒（ms），请使用音频帧在采集时被记录下来的时间戳（可以在获得一帧音频帧之后，通过调用 {@link generateCustomPTS} 获得时间戳）。
     *
     * @param frame 音频数据
     *
     * @return >= 0 缓冲的长度，单位：ms。< 0 错误（-1 未启用 mixExternalAudioFrame）
     *
     * @note 请您精准地按每帧时长的间隔调用本接口，数据投送间隔不均匀时极易触发声音卡顿。
     */
    virtual int mixExternalAudioFrame(TRTCAudioFrame* frame) = 0;

    /**
     * 10.7 设置推流时混入外部音频的推流音量和播放音量
     *
     * @param publishVolume 设置的推流音量大小，范围0 - 100，-1表示不改变。
     * @param playoutVolume 设置的播放音量大小，范围0 - 100，-1表示不改变。
     */
    virtual void setMixExternalAudioVolume(int publishVolume, int playoutVolume) = 0;

    /**
     * 10.8 生成自定义采集时的时间戳
     *
     * 本接口仅适用于自定义采集模式，用于解决音视频帧的采集时间（capture time）和投送时间（send time）不一致所导致的音画不同步问题。
     * 当您通过 {@link sendCustomVideoData} 或 {@link sendCustomAudioData} 等接口进行自定义视频或音频采集时，请按照如下操作使用该接口：
     *  1. 首先，在采集到一帧视频或音频帧时，通过调用本接口获得当时的 PTS 时间戳。
     *  2. 之后可以将该视频或音频帧送入您使用的前处理模块（如第三方美颜组件，或第三方音效组件）。
     *  3. 在真正调用 {@link sendCustomVideoData} 或 {@link sendCustomAudioData} 进行投送时，请将该帧在采集时记录的 PTS 时间戳赋值给 {@link TRTCVideoFrame} 或 {@link TRTCAudioFrame} 中的 timestamp 字段。
     *
     * @return 时间戳（单位：ms）
     */
    virtual uint64_t generateCustomPTS() = 0;

    /**
     * 10.9 设置第三方美颜的视频数据回调
     *
     * 设置该回调之后，SDK 会把采集到的视频帧通过您设置的 callback 回调出来，用于第三方美颜组件进行二次处理，之后 SDK 会将处理后的视频帧进行编码和发送。
     * @param pixelFormat 指定回调的像素格式，出于数据处理效率的考虑，目前仅支持 OpenGL 纹理格式数据。
     * @param bufferType  指定视频数据结构类型，出于数据处理效率的考虑，目前仅支持 OpenGL 纹理格式数据。
     * @param callback    自定义渲染回调，详见 {@link ITRTCVideoFrameCallback}。
     * @return 0：成功；<0：错误
     */
    virtual int setLocalVideoProcessCallback(TRTCVideoPixelFormat pixelFormat, TRTCVideoBufferType bufferType, ITRTCVideoFrameCallback* callback) = 0;

    /**
     * 10.10 设置本地视频自定义渲染回调
     *
     * 设置该回调之后，SDK 内部会跳过原来的渲染流程，并把采集到的数据回调出来，您需要自己完成画面渲染。
     * - 您可以通过调用 setLocalVideoRenderCallback(TRTCVideoPixelFormat_Unknown, TRTCVideoBufferType_Unknown, nullptr) 停止回调。
     * - iOS、Mac、Windows 平台目前仅支持回调 {@link TRTCVideoPixelFormat_I420} 或 {@link TRTCVideoPixelFormat_BGRA32} 像素格式的视频帧。
     * - Android 平台目前仅支持传入 {@link TRTCVideoPixelFormat_I420}, {@link TRTCVideoPixelFormat_RGBA32} 或 {@link TRTCVideoPixelFormat_Texture_2D} 像素格式的视频帧。
     * @param pixelFormat 指定回调的像素格式
     * @param bufferType  指定视频数据结构类型，目前只支持 {@link TRTCVideoBufferType_Buffer}
     * @param callback    自定义渲染回调
     * @return 0：成功；<0：错误
     */
    virtual int setLocalVideoRenderCallback(TRTCVideoPixelFormat pixelFormat, TRTCVideoBufferType bufferType, ITRTCVideoRenderCallback* callback) = 0;

    /**
     * 10.11 设置远端视频自定义渲染回调
     *
     * 设置该回调之后，SDK 内部会跳过原来的渲染流程，并把采集到的数据回调出来，您需要自己完成画面渲染。
     * - 您可以通过调用 setLocalVideoRenderCallback(TRTCVideoPixelFormat_Unknown, TRTCVideoBufferType_Unknown, nullptr) 停止回调。
     * - iOS、Mac、Windows 平台目前仅支持回调 {@link TRTCVideoPixelFormat_I420} 或 {@link TRTCVideoPixelFormat_BGRA32} 像素格式的视频帧。
     * - Android 平台目前仅支持传入 {@link TRTCVideoPixelFormat_I420}, {@link TRTCVideoPixelFormat_RGBA32} 或 {@link TRTCVideoPixelFormat_Texture_2D} 像素格式的视频帧。
     *
     * @note 实际使用时，需要先调用 startRemoteView(userid, nullptr) 来获取远端用户的视频流（view 设置为 nullptr 即可），否则不会有数据回调出来。
     * @param userId 远端用户id
     * @param pixelFormat 指定回调的像素格式
     * @param bufferType  指定视频数据结构类型，目前只支持 {@link TRTCVideoBufferType_Buffer}
     * @param callback    自定义渲染回调
     * @return 0：成功；<0：错误
     */
    virtual int setRemoteVideoRenderCallback(const char* userId, TRTCVideoPixelFormat pixelFormat, TRTCVideoBufferType bufferType, ITRTCVideoRenderCallback* callback) = 0;

    /**
     * 10.12 设置音频数据自定义回调
     *
     * 设置该回调之后，SDK 内部会把音频数据（PCM 格式）回调出来，包括：
     * - {@link onCapturedAudioFrame}：本地麦克风采集到的音频数据回调
     * - {@link onLocalProcessedAudioFrame}：本地采集并经过音频模块前处理后的音频数据回调
     * - {@link onPlayAudioFrame}：混音前的每一路远程用户的音频数据
     * - {@link onMixedPlayAudioFrame}：将各路音频混合之后并最终要由系统播放出的音频数据回调
     *
     * @note 设置回调为空即代表停止自定义音频回调，反之，设置回调不为空则代表启动自定义音频回调。
     */
    virtual int setAudioFrameCallback(ITRTCAudioFrameCallback* callback) = 0;

    /**
     * 10.13 设置本地麦克风采集出的音频帧回调格式
     *
     * 本接口用于设置 {@link onCapturedAudioFrame} 回调出来的 AudioFrame 的格式：
     * - sampleRate：采样率，支持：16000、32000、44100、48000。
     * - channel：声道数（如果是立体声，数据是交叉的），单声道：1； 双声道：2。
     * - samplesPerCall：采样点数，定义回调数据帧长。帧长必须为 10ms 的整数倍。
     * 如果希望用毫秒数计算回调帧长，则将毫秒数转换成采样点数的公式为：采样点数 = 毫秒数 * 采样率 / 1000。
     * 举例：48000 采样率希望回调 20ms 帧长的数据，则采样点数应该填：960 = 20 * 48000 / 1000。
     * @param format 音频数据回调格式。
     * @return 0：成功；<0：错误
     * @note
     * 最终回调的帧长度是以字节为单位，采样点数转换成字节数的计算公式为：字节数 = 采样点数 * channel * 2（位宽）举例：48000 采样率，双声道，20ms 帧长，采样点数为 960，字节数为 3840 = 960 * 2 * 2
     */
    virtual int setCapturedAudioFrameCallbackFormat(TRTCAudioFrameCallbackFormat* format) = 0;

    /**
     * 10.14 设置经过前处理后的本地音频帧回调格式
     *
     * 本接口用于设置 {@link onLocalProcessedAudioFrame} 回调出来的 AudioFrame 的格式：
     * - sampleRate：采样率，支持：16000、32000、44100、48000。
     * - channel：声道数（如果是立体声，数据是交叉的），单声道：1； 双声道：2。
     * - samplesPerCall：采样点数，定义回调数据帧长。帧长必须为 10ms 的整数倍。
     * 如果希望用毫秒数计算回调帧长，则将毫秒数转换成采样点数的公式为：采样点数 = 毫秒数 * 采样率 / 1000。
     * 举例：48000 采样率希望回调20ms帧长的数据，则采样点数应该填: 960 = 20 * 48000 / 1000。
     * @param format 音频数据回调格式。
     * @return 0：成功；<0：错误
     * @note
     * 最终回调的帧长度是以字节为单位，采样点数转换成字节数的计算公式为：字节数 = 采样点数 * channel * 2（位宽） 举例：48000 采样率，双声道，20ms 帧长，采样点数为 960，字节数为 3840 = 960 * 2 * 2
     */
    virtual int setLocalProcessedAudioFrameCallbackFormat(TRTCAudioFrameCallbackFormat* format) = 0;

    /**
     * 10.15 设置最终要由系统播放出的音频帧回调格式
     *
     * 本接口用于设置 {@link onMixedPlayAudioFrame} 回调出来的 AudioFrame 的格式：
     * - sampleRate：采样率，支持：16000、32000、44100、48000。
     * - channel：声道数（如果是立体声，数据是交叉的），单声道：1； 双声道：2。
     * - samplesPerCall：采样点数，定义回调数据帧长。帧长必须为 10ms 的整数倍。
     * 如果希望用毫秒数计算回调帧长，则将毫秒数转换成采样点数的公式为：采样点数 = 毫秒数 * 采样率 / 1000。
     * 举例：48000 采样率希望回调20ms帧长的数据，则采样点数应该填: 960 = 20 * 48000 / 1000。
     * @param format 音频数据回调格式。
     * @return 0：成功；<0：错误
     * @note
     * 最终回调的帧长度是以字节为单位，采样点数转换成字节数的计算公式为：字节数 = 采样点数 * channel * 2（位宽） 举例：48000 采样率，双声道，20ms 帧长，采样点数为 960，字节数为 3840 = 960 * 2 * 2
     */
    virtual int setMixedPlayAudioFrameCallbackFormat(TRTCAudioFrameCallbackFormat* format) = 0;

    /**
     * 10.16 开启音频自定义播放
     *
     * 如果您需要外接一些特定的音频设备，或者希望自己掌控音频的播放逻辑，您可以通过该接口启用音频自定义播放。
     * 启用音频自定义播放后，SDK 将不再调用系统的音频接口播放数据，您需要通过 {@link getCustomAudioRenderingFrame} 获取 SDK 要播放的音频帧并自行播放。
     * @param enable 是否启用音频自定义播放，默认为关闭状态。
     * @note 需要您在进入房间前设置才能生效，暂不支持进入房间后再设置。
     */
    virtual void enableCustomAudioRendering(bool enable) = 0;

    /**
     * 10.17 获取可播放的音频数据
     *
     * 调用该接口之前，您需要先通过 {@link enableCustomAudioRendering} 开启音频自定义播放。
     * 参数 {@link TRTCAudioFrame} 推荐下列填写方式（其他字段不需要填写）：
     * - sampleRate：采样率，必填，支持 16000、24000、32000、44100、48000。
     * - channel：声道数，必填，单声道请填1，双声道请填2，双声道时数据是交叉的。
     * - data：用于获取音频数据的 buffer。需要您根据一帧音频帧的帧长度分配好 data 的内存大小。获取的 PCM 数据支持 10ms 或 20ms 两种帧长，推荐使用 20ms 的帧长。
     * 计算公式为：采样率 x 播放时长 x 声道数量 x 2（每个样点的字节数）， 例如： 48000采样率、单声道、且播放时长为 20ms 的一帧音频帧的 buffer 大小为 48000 × 0.02s × 1 × 16bit = 15360bit = 1920字节。
     * @param audioFrame 音频数据帧。
     * @note
     *   1. 参数 audioFrame 中的 sampleRate、channel 需提前设置好，同时分配好所需读取帧长的 data 空间。
     *   2. SDK 内部会根据 sampleRate 和 channel 自动填充 data 数据。
     *   3. 建议由系统的音频播放线程直接驱动该函数的调用，在播放完一帧音频之后，即调用该接口获取下一帧可播放的音频数据。
     */
    virtual void getCustomAudioRenderingFrame(TRTCAudioFrame* audioFrame) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                    自定义消息发送接口
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 11.1 使用 UDP 通道发送自定义消息给房间内所有用户
     *
     * 该接口可以让您借助 TRTC 的 UDP 通道，向当前房间里的其他用户广播自定义数据，以达到传输信令的目的。
     * 房间中的其他用户可以通过 {@link ITRTCCloudCallback} 中的 onRecvCustomCmdMsg 回调接收消息。
     * @param cmdID 消息 ID，取值范围为1 - 10。
     * @param data 待发送的消息，单个消息的最大长度被限制为 1KB。
     * @param reliable 是否可靠发送，可靠发送可以获得更高的发送成功率，但可靠发送比不可靠发送会带来更大的接收延迟。
     * @param ordered 是否要求有序，即是否要求接收端的数据包顺序和发送端的数据包顺序一致（这会带来一定的接收延时）。
     * @return true：消息已经发出；false：消息发送失败。
     * @note
     * 1. 发送消息到房间内所有用户（暂时不支持 Web/小程序端），每秒最多能发送30条消息。
     * 2. 每个包最大为 1KB，超过则很有可能会被中间路由器或者服务器丢弃。
     * 3. 每个客户端每秒最多能发送总计 8KB 数据。
     * 4. 请将 reliable 和 ordered 同时设置为 true 或同时设置为 false，暂不支持交叉设置。
     * 5. 强烈建议您将不同类型的消息设定为不同的 cmdID，这样可以在要求有序的情况下减小消息时延。
     * 6. 目前仅支持主播身份。
     */
    virtual bool sendCustomCmdMsg(uint32_t cmdId, const uint8_t* data, uint32_t dataSize, bool reliable, bool ordered) = 0;

    /**
     * 11.2 使用 SEI 通道发送自定义消息给房间内所有用户
     *
     * 该接口可以让您借助 TRTC 的 SEI 通道，向当前房间里的其他用户广播自定义数据，已达到传输信令的目的。
     * 视频帧的头部有一个叫做 SEI 的头部数据块，该接口的原理就是利用这个被称为 SEI 的头部数据块，将您要发送的自定义信令嵌入其中，使其同视频帧一并发送出去。
     * 因此，与 {@link sendCustomCmdMsg} 相比，SEI 通道传输的信令具有更好的兼容性：信令可以伴随着视频帧一直传输到直播 CDN 上。
     * 不过，由于视频帧头部的数据块不能太大，建议您使用该接口时，尽量将信令控制在几个字节的大小。
     * 最常见的用法是把自定义的时间戳（timestamp）用本接口嵌入视频帧中，实现消息和画面的完美对齐（比如：教育场景下的课件和视频信号的对齐）。
     * 房间中的其他用户可以通过 {@link ITRTCCloudCallback} 中的 onRecvSEIMsg 回调接收消息。
     * @param data 待发送的数据，最大支持 1KB（1000字节）的数据大小
     * @param repeatCount 发送数据次数
     * @return true：消息已通过限制，等待后续视频帧发送；false：消息被限制发送
     * @note 本接口有以下限制：
     * 1. 数据在接口调用完后不会被即时发送出去，而是从下一帧视频帧开始带在视频帧中发送。
     * 2. 发送消息到房间内所有用户，每秒最多能发送 30 条消息（与 sendCustomCmdMsg 共享限制）。
     * 3. 每个包最大为 1KB，若发送大量数据，会导致视频码率增大，可能导致视频画质下降甚至卡顿（与 sendCustomCmdMsg 共享限制）。
     * 4. 每个客户端每秒最多能发送总计8KB数据（与 sendCustomCmdMsg 共享限制）。
     * 5. 若指定多次发送（repeatCount > 1），则数据会被带在后续的连续 repeatCount 个视频帧中发送出去，同样会导致视频码率增大。
     * 6. 如果 repeatCount > 1，多次发送，接收消息 onRecvSEIMsg 回调也可能会收到多次相同的消息，需要去重。
     */
    virtual bool sendSEIMsg(const uint8_t* data, uint32_t dataSize, int32_t repeatCount) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                    网络测试接口
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 12.1 开始进行网速测试（进入房间前使用）
     *
     * @param params 测速选项
     * @return 接口调用结果，< 0：失败
     * @note
     * 1. 测速过程将产生少量的基础服务费用，详见 [计费概述 > 基础服务](https://cloud.tencent.com/document/product/647/17157#.E5.9F.BA.E7.A1.80.E6.9C.8D.E5.8A.A1) 文档说明。
     * 2. 请在进入房间前进行网速测试，在房间中网速测试会影响正常的音视频传输效果，而且由于干扰过多，网速测试结果也不准确。
     * 3. 同一时间只允许一项网速测试任务运行。
     */
    virtual int startSpeedTest(const TRTCSpeedTestParams& params) = 0;

    /**
     * 12.2 停止网络测速
     */
    virtual void stopSpeedTest() = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                    调试相关接口
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 13.1 获取 SDK 版本信息
     */
    virtual const char* getSDKVersion() = 0;

    /**
     * 13.2 设置 Log 输出级别
     *
     * @param level 参见 {@link TRTCLogLevel}，默认值：{@link TRTCLogLevelNone}
     */
    virtual void setLogLevel(TRTCLogLevel level) = 0;

    /**
     * 13.3 启用/禁用控制台日志打印
     *
     * @param enabled 指定是否启用，默认：禁止状态。
     */
    virtual void setConsoleEnabled(bool enabled) = 0;

    /**
     * 13.4 启用/禁用日志的本地压缩
     *
     * 开启压缩后，Log 存储体积明显减小，但需要腾讯云提供的 Python 脚本解压后才能阅读。
     * 禁用压缩后，Log 采用明文存储，可以直接用记事本打开阅读，但占用空间较大。
     * @param enabled 指定是否启用，默认为启动状态
     */
    virtual void setLogCompressEnabled(bool enabled) = 0;

    /**
     * 13.5 设置本地日志的保存路径
     *
     * 通过该接口您可以更改 SDK 本地日志的默认存储路径，SDK 默认的本地日志的存储位置：
     * - Windows 平台：在 C:/Users/[系统用户名]/AppData/Roaming/liteav/log，即 %appdata%/liteav/log 下。
     * - iOS 或 Mac 平台：在 sandbox Documents/log 下。
     * - Android 平台：在 /app私有目录/files/log/liteav/ 下。
     *
     * @note 请务必在所有其他接口之前调用，并且保证您指定的目录是存在的，并且您的应用程序拥有对该目录的读写权限。
     * @param path 存储日志的路径
     */
    virtual void setLogDirPath(const char* path) = 0;

    /**
     * 13.6 设置日志回调
     */
    virtual void setLogCallback(ITRTCLogCallback* callback) = 0;

    /**
     * 13.7 显示仪表盘
     *
     * “仪表盘”是位于视频渲染控件之上的一个半透明的调试信息浮层，用于展示音视频信息和事件信息，便于对接和调试。
     * @param showType 0：不显示；1：显示精简版（仅显示音视频信息）；2：显示完整版（包含音视频信息和事件信息）。
     */
    virtual void showDebugView(int showType) = 0;

    /**
     * 13.9 调用实验性接口
     */
    virtual const char* callExperimentalAPI(const char* jsonStr) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                    加密接口
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 14.1 开启或关闭媒体流私有加密
     *
     * 在安全要求较高的场景下，TRTC 建议您在加入房间前，调用 enablePayloadPrivateEncryption 方法开启媒体流私有加密。
     * 用户退出房间后，SDK 会自动关闭私有加密。如需重新开启私有加密，您需要在用户再次加入房间前调用该方法。
     * @param enabled 是否开启媒体流私有加密。
     * @param config 配置媒体流私有加密的算法和密钥，参见 {@link TRTCPayloadPrivateEncryptionConfig}。
     * @return 接口调用结果，0: 方法调用成功， -1: 传入参数无效， -2: 功能已过期。若需解锁：请前往中国大陆站点开通 [TRTC 旗舰版套餐](https://buy.cloud.tencent.com/trtc?tab=month&trtcversion=ultimate)。
     * @note TRTC 已经内置对媒体流进行加密后再传输，启用媒体流私有加密后将使用您传入的密匙与初始向量进行再次加密。
     */
    virtual int enablePayloadPrivateEncryption(bool enabled, const TRTCPayloadPrivateEncryptionConfig& config) = 0;

    using IDeprecatedTRTCCloud::enableAudioVolumeEvaluation;
    using IDeprecatedTRTCCloud::enableCustomVideoCapture;
    using IDeprecatedTRTCCloud::getBGMDuration;
    using IDeprecatedTRTCCloud::muteLocalVideo;
    using IDeprecatedTRTCCloud::muteRemoteVideoStream;
    using IDeprecatedTRTCCloud::pauseAudioEffect;
    using IDeprecatedTRTCCloud::pauseBGM;
    using IDeprecatedTRTCCloud::playAudioEffect;
    using IDeprecatedTRTCCloud::playBGM;
    using IDeprecatedTRTCCloud::resumeAudioEffect;
    using IDeprecatedTRTCCloud::resumeBGM;
    using IDeprecatedTRTCCloud::sendCustomVideoData;
    using IDeprecatedTRTCCloud::setAllAudioEffectsVolume;
    using IDeprecatedTRTCCloud::setAudioEffectVolume;
    using IDeprecatedTRTCCloud::setAudioQuality;
    using IDeprecatedTRTCCloud::setBGMPosition;
    using IDeprecatedTRTCCloud::setBGMPublishVolume;
    using IDeprecatedTRTCCloud::setBGMVolume;
    using IDeprecatedTRTCCloud::setLocalViewFillMode;
    using IDeprecatedTRTCCloud::setLocalViewMirror;
    using IDeprecatedTRTCCloud::setLocalViewRotation;
    using IDeprecatedTRTCCloud::setMicVolumeOnMixing;
    using IDeprecatedTRTCCloud::setPriorRemoteVideoStreamType;
    using IDeprecatedTRTCCloud::setRemoteSubStreamViewFillMode;
    using IDeprecatedTRTCCloud::setRemoteSubStreamViewRotation;
    using IDeprecatedTRTCCloud::setRemoteViewFillMode;
    using IDeprecatedTRTCCloud::setRemoteViewRotation;
    using IDeprecatedTRTCCloud::startLocalAudio;
    using IDeprecatedTRTCCloud::startRemoteView;
    using IDeprecatedTRTCCloud::startScreenCapture;
    using IDeprecatedTRTCCloud::startSpeedTest;
    using IDeprecatedTRTCCloud::stopAllAudioEffects;
    using IDeprecatedTRTCCloud::stopAudioEffect;
    using IDeprecatedTRTCCloud::stopBGM;
    using IDeprecatedTRTCCloud::stopRemoteSubStreamView;
    using IDeprecatedTRTCCloud::stopRemoteView;

#if TARGET_PLATFORM_DESKTOP
    using IDeprecatedTRTCCloud::getCameraDevicesList;
    using IDeprecatedTRTCCloud::getCurrentCameraDevice;
    using IDeprecatedTRTCCloud::getCurrentMicDevice;
    using IDeprecatedTRTCCloud::getCurrentMicDeviceMute;
    using IDeprecatedTRTCCloud::getCurrentMicDeviceVolume;
    using IDeprecatedTRTCCloud::getCurrentSpeakerDevice;
    using IDeprecatedTRTCCloud::getCurrentSpeakerDeviceMute;
    using IDeprecatedTRTCCloud::getCurrentSpeakerVolume;
    using IDeprecatedTRTCCloud::getMicDevicesList;
    using IDeprecatedTRTCCloud::getSpeakerDevicesList;
    using IDeprecatedTRTCCloud::selectScreenCaptureTarget;
    using IDeprecatedTRTCCloud::setCurrentCameraDevice;
    using IDeprecatedTRTCCloud::setCurrentMicDevice;
    using IDeprecatedTRTCCloud::setCurrentMicDeviceMute;
    using IDeprecatedTRTCCloud::setCurrentMicDeviceVolume;
    using IDeprecatedTRTCCloud::setCurrentSpeakerDevice;
    using IDeprecatedTRTCCloud::setCurrentSpeakerDeviceMute;
    using IDeprecatedTRTCCloud::setCurrentSpeakerVolume;
    using IDeprecatedTRTCCloud::startCameraDeviceTest;
    using IDeprecatedTRTCCloud::startMicDeviceTest;
    using IDeprecatedTRTCCloud::startSpeakerDeviceTest;
    using IDeprecatedTRTCCloud::stopCameraDeviceTest;
    using IDeprecatedTRTCCloud::stopMicDeviceTest;
    using IDeprecatedTRTCCloud::stopSpeakerDeviceTest;
#endif
};
}  // namespace liteav
#endif
