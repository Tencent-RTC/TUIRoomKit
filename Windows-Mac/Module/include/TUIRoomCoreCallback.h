// Copyright (c) 2021 Tencent. All rights reserved.
/*
* Module:   TUIRoomCoreCallback @
*
* Function: 腾讯云教育场景视频通话功能的回调接口类，若想从C++代码中获取到SDK的回调，
* 请继承此类并调用 AddCallback(const TUIRoomCoreCallback& callback)设置观察者
*
*/

#ifndef MODULE_INCLUDE_TUIROOMCORECALLBACK_H_
#define MODULE_INCLUDE_TUIROOMCORECALLBACK_H_

#include "TUIRoomDef.h"
#ifdef _WIN32
#include "ITXLiteAVLocalRecord.h"
#endif
#include "ITRTCStatistics.h"

/**
* 腾讯云TUIRoomCoreCallback回调接口类
*/
class TUIRoomCoreCallback {
public:
    virtual ~TUIRoomCoreCallback() {}

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                      （一）错误事件回调
    //
    /////////////////////////////////////////////////////////////////////////////////
    /// @name 错误事件回调
    /// @{
    /**
     * 1.1 错误回调
     *
     * SDK 不可恢复的错误，一定要监听，并分情况给用户适当的界面提示。
     *
     * @param code 	错误码
     * @param message 	错误信息
     */
    virtual void OnError(int code, const std::string& message) = 0;
    /// @}

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                      （二）基础事件回调
    //
    /////////////////////////////////////////////////////////////////////////////////
    /// @name 基础事件回调
    /// @{
    /**
     * 2.1 登录回调
     *
     * 用户调用Login接口，登录后返回的登录结果以及登录的信息。
     *
     * @param code 	错误码
     * @param message 	登录信息或登录失败的错误信息
     */
    virtual void OnLogin(int code, const std::string& message) = 0;

    /**
     * 2.2 登出回调
     *
     * 用户调用Logout接口,登出后返回的登出结果以及登出的信息。
     *
     * @param code 	错误码
     * @param message 	登出信息或登出失败的错误信息
     */
    virtual void OnLogout(int code, const std::string& message) = 0;

    /**
     * 2.3 创建房间回调
     *
     * 用户调用CreateRoom接口,创建房间的接口回调信息。
     *
     * @param code 	错误码
     * @param message 	创建房间的信息或创建失败的错误信息
     */
    virtual void OnCreateRoom(int code, const std::string& message) = 0;

    /**
     * 2.4 房间解散回调
     *
     * 主持人调用DestroyRoom接口,解散房间的接口回调信息。
     *
     * @param code 	错误码
     * @param message 	解散房间的信息或解散失败的错误信息
     */
    virtual void OnDestroyRoom(int code, const std::string& message) = 0;

    /**
     * 2.5 进入房间回调
     *
     * 用户调用EnterRoom接口,进入房间的接口回调信息。
     *
     * @param code 	错误码
     * @param message 	进入房间的信息或进入房间的错误信息
     */
    virtual void OnEnterRoom(int code, const std::string& message) = 0;

    /**
     * 2.6 退出房间回调
     *
     * 用户调用ExitRoom接口，主持人解散房间，主持人踢出房间，网络异常等情况下退出房间的接口回调信息。
     *
     * @param type 	  退出类型参考TUIExitRoomType定义
     * @param message 退出房间的描述
     */
    virtual void OnExitRoom(TUIExitRoomType type, const std::string& message) = 0;

    /**
     * 2.7 开始渲染自己本地或远端用户的首帧画面
     *
     * SDK 会在渲染自己本地或远端用户的首帧画面时抛出该事件，您可以通过回调事件中的 user_id 参数
     * 来判断事件来自于“本地”还是来自于“远端”。
     *
     * @param  user_id 本地或远端的用户标识，如果 user_id 为空值代表自己，user_id 不为空则代表远端用户。
     * @param  stream_type 视频流类型：主路（Main）一般用于承载摄像头画面，辅路（Sub）一般用于承载屏幕分享画面。
     */
    virtual void OnFirstVideoFrame(const std::string& user_id, const TUIStreamType stream_type) = 0;

    /**
     * 2.8 用户音量大小回调通知
     *
     * 对用户的音量大小进行回调通知，更新界面的显示
     *
     * @param user_id 本地或远端的用户标识。
     * @param volume 用户的音量大小，取值范围 0 - 100。
     */
    virtual void OnUserVoiceVolume(const std::string& user_id, int volume) {}

    /**
     * 2.9 主持人更改回调
     *
     * 主持人更改回调
     *
     * @param user_id 更改后的主持人。
     */
    virtual void OnRoomMasterChanged(const std::string& user_id) = 0;
    /// @}

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                      （三）远端用户事件回调
    //
    /////////////////////////////////////////////////////////////////////////////////
    /// @name 远端用户事件回调
    /// @{
    /**
     * 3.1 远端用户进入房间回调
     *
     * 远端用户进入房间的回调信息。
     *
     * @param user_id 	用户ID
     */
    virtual void OnRemoteUserEnter(const std::string& user_id) = 0;

    /**
     * 3.2 远端用户离开房间回调
     *
     * 远端用户离开房间的回调信息。
     *
     * @param user_id 	用户ID
     */
    virtual void OnRemoteUserLeave(const std::string& user_id) = 0;

    /**
     * 3.3 远端用户是否开启摄像头视频
     *
     * 当您收到 OnRemoteUserCameraAvailable(user_id, true) 通知时，表示该路画面已经有可用的视频数据帧到达。
     *
     * @param user_id 	用户ID
     * @param available  是否有视频数据
     */
    virtual void OnRemoteUserCameraAvailable(const std::string& user_id, bool available) = 0;

    /**
     * 3.4 远端用户是否开启屏幕分享
     *
     * 当您收到 OnRemoteUserScreenVideoAvailable(user_id, true) 通知时，表示该用户开启了屏幕分享，有可用的屏幕分享流数据帧到达。
     *
     * @param user_id 	用户ID
     * @param available  是否有屏幕分享流数据
     */
    virtual void OnRemoteUserScreenVideoAvailable(const std::string& user_id, bool available) = 0;

    /**
     * 3.5 远端用户是否开启音频上行
     *
     * 当您收到 OnRemoteUserAudioAvailable(user_id, true) 通知时，表示该用户开启了麦克风。
     *
     * @param user_id 	用户ID
     * @param available  是否有音频数据
     */
    virtual void OnRemoteUserAudioAvailable(const std::string& user_id, bool available) = 0;

    /**
     * 3.6 远端用户开始发言
     *
     * 当您收到 OnRemoteUserEnterSpeechState(user_id) 通知时，表示该用户发言成功。
     *
     * @param user_id 用户ID
     */
    virtual void OnRemoteUserEnterSpeechState(const std::string& user_id) = 0;

    /**
     * 3.7 远端用户结束发言
     *
     * 当您收到 OnRemoteUserExitSpeechState(user_id) 通知时，表示该用户已经停止发言。
     *
     * @param user_id 用户ID
     */
    virtual void OnRemoteUserExitSpeechState(const std::string& user_id) = 0;
    /// @}

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                      （四）聊天室消息事件回调
    //
    /////////////////////////////////////////////////////////////////////////////////
    /// @name 聊天室消息事件回调
    /// @{
    /**
     * 4.1 接收消息回调
     *
     * 聊天室收到消息回调信息。
     *
     * @param user_id  用户ID
     * @param message  聊天消息内容
     */
    virtual void OnReceiveChatMessage(const std::string& user_id, const std::string& message) = 0;

    /**
     * 4.2 接收自定义消息回调
     *
     * 聊天室收到消息回调信息。
     *
     * @param user_id  用户ID
     * @param message  聊天消息内容
     */
    virtual void OnReceiveCustomMessage(const std::string& user_id, const std::string& message) = 0;
    /// @}

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                      （五）场控相关事件回调
    //
    /////////////////////////////////////////////////////////////////////////////////
    /// @name 场控相关事件回调
    /// @{
    /**
     * 5.1 用户收到主持人发言邀请回调
     *
     * 主持人调用SendSpeechInvitation接口邀请用户发言后，用户收到的回调，用户需要进行回复。
     */
    virtual void OnReceiveSpeechInvitation() = 0;

    /**
     * 5.2 用户收到主持人取消发言邀请回调
     *
     * 主持人调用CancelSpeechInvitation接口取消邀请用户发言后，用户收到的回调。
     */
    virtual void OnReceiveInvitationCancelled() = 0;

    /**
     * 5.3 主持人收到用户同意邀请发言的回调
     *
     * 在TUISpeechMode::kApplySpeech模式下，用户调用ReplySpeechInvitation接口回应主持人发言邀请时，
     * 主持人收到的回调
     *
     * @param user_id  用户ID
     * @param agree    是否同意发言 true为同意， false为不同意
     */
    virtual void OnReceiveReplyToSpeechInvitation(const std::string& user_id, bool agree) = 0;

    /**
     * 5.4 主持人收到用户发言申请的回调
     *
     * 在TUISpeechMode::kApplySpeech模式下，用户调用SendSpeechApplication接口向主持人申请发言时，
     * 主持人收到的回调，主持人需要操作并调用ReplySpeechApplication接口对申请进行回应。
     *
     * @param user_id  用户ID
     */
    virtual void OnReceiveSpeechApplication(const std::string& user_id) = 0;

    /**
     * 5.5 用户取消申请发言回调
     *
     * 在TUISpeechMode::kApplySpeech模式下，用户调用CancelSpeechApplication接口取消申请发言时，主持人收到的回调。
     *
     * @param user_id  用户ID
     */
    virtual void OnSpeechApplicationCancelled(const std::string& user_id) = 0;

    /**
     * 5.6 主持人同意发言申请回调
     *
     * 在TUISpeechMode::kApplySpeech模式下，主持人调用ReplySpeechApplication接口回应用户申请发言时，
     * 用户收到的回调，用户根据主持人是否同意决定是否可以发言。
     *
     * @param agree  是否同意发言 true为同意， false为不同意
     */
    virtual void OnReceiveReplyToSpeechApplication(bool agree) = 0;

    /**
     * 5.7 主持人禁止申请发言回调
     *
     * 主持人禁止申请发言回调。
     *
     * @param forbidden true,发言申请被禁用, false 可以申请发言
     */
    virtual void OnSpeechApplicationForbidden(bool forbidden) = 0;

    /**
     * 5.8 成员被请求停止发言的回调
     *
     * 主持人调用SendOffSpeaker接口请求用户停止发言后，用户收到的回调，用户需要停止发言。
     */
    virtual void OnOrderedToExitSpeechState() = 0;

    /**
     * 5.9 主持人开始点名，成员收到的回调
     *
     * 主持人开始点名，成员收到的回调。
     */
    virtual void OnCallingRollStarted() = 0;

    /**
     * 5.10 主持人结束点名，成员收到的回调
     *
     * 主持人结束点名，成员收到的回调。
     */
    virtual void OnCallingRollStopped() = 0;

    /**
     * 5.11 成员回复点名，主持人收到的回调
     *
     * 成员回复点名，主持人收到的回调。
     *
     * @param user_id 用户id
     */
    virtual void OnMemberReplyCallingRoll(const std::string& user_id) = 0;

    /**
     * 5.12 主持人更改聊天室是否禁言回调
     *
     * 主持人设置聊天室是否禁言的回调。
     *
     * @param mute  true,聊天室不可以发消息  false聊天室可以发消息
     */
    virtual void OnChatRoomMuted(bool muted) = 0;

    /**
     * 5.13 主持人设置禁用麦克风回调
     *
     * 主持人禁用用户麦克风的回调。
     *
     * @param mute  true,用户麦克风被禁用  false用户麦克风打开
     */
    virtual void OnMicrophoneMuted(bool muted) = 0;

    /**
     * 5.14 主持人设置禁用摄像头回调
     *
     * 主持人禁用用户摄像头的回调。
     *
     * @param mute  true,用户摄像头被禁用  false用户摄像头打开
     */
    virtual void OnCameraMuted(bool muted) = 0;
    /// @}

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                      （六）统计和质量回调
    //
    /////////////////////////////////////////////////////////////////////////////////
    /// @name 统计和质量回调
    /// @{
    /**
     * 6.1 技术指标统计回调
     *
     * 如果您是熟悉音视频领域相关术语，可以通过这个回调获取 SDK 的所有技术指标。
     * 如果您是首次开发音视频相关项目，可以只关注 onNetworkQuality 回调，每2秒回调一次。
     *
     * @param statis 统计数据，包括本地和远程的
     */
    virtual void OnStatistics(const liteav::TRTCStatistics& statis) {}

    /**
     *
     * 6.2 网络质量：
     *
     * 该回调每2秒触发一次，统计当前网络的上行和下行质量
     * user_id == null 代表自己当前的视频质量
     *
     * @param local_quality 上行网络质量
     * @param remote_quality 下行网络质量
     * @param remote_quality_count 下行网络质量的数组大小
     */
    virtual void OnNetworkQuality(const liteav::TRTCQualityInfo& local_quality, liteav::TRTCQualityInfo* remote_quality,
        uint32_t remote_quality_count) {}
    /// @}

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                      （七）屏幕分享相关回调
    //
    /////////////////////////////////////////////////////////////////////////////////
    /// @name 屏幕分享相关回调
    /// @{
    /**
     * 7.1 开始屏幕分享回调
     *
     * 用户调用StartScreenCapture开始屏幕分享后的回调。
     */
    virtual void OnScreenCaptureStarted() {}

    /**
     * 7.4 停止屏幕分享回调
     *
     * 用户调用StopScreenCapture停止屏幕分享后的回调。
     *
     * @param reason 停止原因，0：用户主动停止；1：屏幕窗口关闭导致停止；2：表示屏幕分享的显示屏状态变更（如接口被拔出、投影模式变更等）。
     */
    virtual void OnScreenCaptureStopped(int reason) {}
    /// @}

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                      （八）视频录制回调
    //
    /////////////////////////////////////////////////////////////////////////////////
    /// @name 视频录制回调
    /// @{
#ifdef _WIN32
    /**
     * 8.1 录制错误回调
     *
     * 用户调用StartCloudRecord录制视频错误回调。
     *
     * @param error   错误码，错误码详情查看 TXLiteAVLocalRecordError 的定义
     * @param messgae 错误信息
     */
    virtual void OnRecordError(TXLiteAVLocalRecordError error, const std::string& messgae) {}

    /**
     * 8.2 录制完成回调
     *
     * 用户调用StopCloudRecord结束录制视频，录制完成回调。
     *
     * @param path 录制视频文件存放的路径
     */
    virtual void OnRecordComplete(const std::string& path) {}

    /**
     * 8.3 录制进度回调
     *
     * 用户调用StartCloudRecord录制视频，视频录制进度回调。
     *
     * @param duration  当前录制文件的时长，单位( MS )。
     * @param file_size 当前录制文件的大小，单位( Byte )。
     */
    virtual void OnRecordProgress(int duration, int file_size) {}
#endif
    /// @}

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                      （九）本地设备测试回调
    //
    /////////////////////////////////////////////////////////////////////////////////
    /// @name 用户音量回调
    /// @{
    /**
     * 9.1 扬声器音量大小回调
     *
     * 用户扬声器音量大小的回调。
     *
     * @param volume   音量大小
     */
    virtual void OnTestSpeakerVolume(uint32_t volume) {}
    /**
     * 9.2 麦克风音量大小回调
     *
     * 用户麦克风音量大小的回调。
     *
     * @param volume   音量大小
     */
    virtual void OnTestMicrophoneVolume(uint32_t volume) {}
    /**
     * 9.3 调节系统采集音量回调。
     *
     * 用户从系统里修改了采集音量，通过此回调通知上层。
     *
     * @param volume   表示大小
     * @param muted    麦克风是否被用户禁用了：true 被禁用，false 被启用。
     */
    virtual void OnAudioDeviceCaptureVolumeChanged(uint32_t volume, bool muted) {}
    /**
     * 9.4 调节系统播放音量回调。
     *
     * 用户从系统里修改了播放音量，通过此回调通知上层。
     *
     * @param volume   表示大小
     * @param muted    系统是否被用户静音了：true 被静音，false 已恢复。
     */
    virtual void OnAudioDevicePlayoutVolumeChanged(uint32_t volume, bool muted) {}
    /// @}
};

#endif  //  MODULE_INCLUDE_TUIROOMCORECALLBACK_H_
