package com.tencent.liteav.tuiroom.model;

import com.tencent.trtc.TRTCCloudDef;
import com.tencent.trtc.TRTCStatistics;

import java.util.List;

public interface TUIRoomCoreListener {
    /**
     * 组件出错错误事件回调
     *
     * @param code    错误码
     * @param message 错误内容
     */
    void onError(int code, String message);

    /**
     * 房间被销毁的回调，主持人退房时，房间内的所有用户都会收到此通知
     */
    void onDestroyRoom();

    /**
     * 用户音量大小回调通知
     *
     * @param userId 本地或远端的用户标识。
     * @param volume 用户的音量大小，取值范围 0 - 100。
     */
    void onUserVoiceVolume(String userId, int volume);

    /**
     * 主持人更改回调
     *
     * @param previousUserId 更改前的主持人
     * @param currentUserId  更改后的主持人
     */
    void onRoomMasterChanged(String previousUserId, String currentUserId);

    /**
     * 远端用户进入房间回调
     *
     * @param userId 新进房成员 ID
     */
    void onRemoteUserEnter(String userId);

    /**
     * 远端用户离开房间回调
     *
     * @param userId 退房成员 ID
     */
    void onRemoteUserLeave(String userId);

    /**
     * 远端用户是否开启摄像头视频回调
     *
     * @param userId    用户信息
     * @param available 是否有视频数据
     */
    void onRemoteUserCameraAvailable(String userId, boolean available);

    /**
     * 成员 开启/关闭 视频分享的通知
     *
     * @param userId    用户ID
     * @param available 是否有屏幕分享流数据
     */
    void onRemoteUserScreenVideoAvailable(String userId, boolean available);

    /**
     * 远端用户是否开启音频上行回调
     *
     * @param userId    用户ID
     * @param available 是否有音频数据
     */
    void onRemoteUserAudioAvailable(String userId, boolean available);

    /**
     * 远端用户开始发言回调
     * 当您收到此通知时，表示该用户发言成功
     *
     * @param userId 用户ID
     */
    void onRemoteUserEnterSpeechState(String userId);

    /**
     * 远端用户结束发言回调
     * 当您收到此通知时，表示该用户下麦成功
     *
     * @param userId 用户ID
     */
    void onRemoteUserExitSpeechState(String userId);

    /**
     * 收到文本消息回调
     *
     * @param userId  用户ID
     * @param message 文本消息
     */
    void onReceiveChatMessage(String userId, String message);

    /**
     * 收到自定义消息回调
     *
     * @param userId 用户ID
     * @param data   自定义消息内容
     */
    void onReceiveRoomCustomMsg(String userId, String data);

    /**
     * 用户收到主持人发言邀请回调
     * 主持人调用sendSpeechInvitation接口邀请用户发言后，用户收到的回调，用户需要进行发言
     *
     * @param userId 主持人用户ID
     */
    void onReceiveSpeechInvitation(String userId);

    /**
     * 用户收到主持人取消发言邀请回调
     * 主持人调用cancelSpeechInvitation接口取消邀请用户发言后，用户收到的回调
     *
     * @param userId 主持人用户ID
     */
    void onReceiveInvitationCancelled(String userId);

    /**
     * 主持人收到用户发言申请的回调
     * TUIRoomCoreDef.SpeechMode.APPLY_SPEECH，用户调用sendSpeechApplication接口向主持人申请发言时，
     * 主持人收到的回调，主持人需要操作并调用agreeSpeechApplication接口对申请进行回应
     *
     * @param userId 用户ID
     */
    void onReceiveSpeechApplication(String userId);

    /**
     * 用户取消申请发言回调
     * TUIRoomCoreDef.SpeechMode.APPLY_SPEECH，用户调用cancelApplication接口取消申请发言时，主持人收到的回调
     *
     * @param userId 用户ID
     */
    void onSpeechApplicationCancelled(String userId);

    /**
     * 主持人禁止申请发言回调
     *
     * @param isForbidden true,发言申请被禁用, false 可以申请发言
     */
    void onSpeechApplicationForbidden(boolean isForbidden);

    /**
     * 成员被请求停止发言的回调
     * 主持人调用sendOffSpeaker接口请求用户停止发言后，用户收到的回调，用户需要停止发言
     *
     * @param userId 主持人用户ID
     */
    void onOrderedToExitSpeechState(String userId);

    /**
     * 主持人开始点名，成员收到的回调
     *
     * @param userId 主持人用户ID
     */
    void onCallingRollStarted(String userId);

    /**
     * 主持人结束点名，成员收到的回调
     *
     * @param userId 主持人用户ID
     */
    void onCallingRollStopped(String userId);

    /**
     * 成员回复点名，主持人收到的回调
     *
     * @param userId 用户id
     */
    void onMemberReplyCallingRoll(String userId);

    /**
     * 主持人更改聊天室是否禁言回调
     *
     * @param muted true,聊天室不可以发消息  false聊天室可以发消息
     */
    void onChatRoomMuted(boolean muted);

    /**
     * 主持人设置禁用麦克风回调
     *
     * @param muted true,用户麦克风被禁用  false用户麦克风打开
     */
    void onMicrophoneMuted(boolean muted);

    /**
     * 主持人设置禁用摄像头回调
     *
     * @param muted true,用户摄像头被禁用  false用户摄像头打开
     */
    void onCameraMuted(boolean muted);

    /**
     * 主持人踢人的回调，主持人/管理员 调用kickOffUser，用户接收到踢人事件的回调
     *
     * @param userId 主持人/管理员 用户ID
     */
    void onReceiveKickedOff(String userId);

    /**
     * 技术指标统计回调
     *
     * 如果您是熟悉音视频领域相关术语，可以通过这个回调获取 SDK 的所有技术指标。
     * 如果您是首次开发音视频相关项目，可以只关注 onNetworkQuality 回调，每2秒回调一次。
     *
     * @param statistics 统计数据，包括本地和远程的
     */
    void onStatistics(TRTCStatistics statistics);

    /**
     * 网络质量回调
     *
     * @param localQuality  上行网络质量
     * @param remoteQuality 下行网络质量
     */

    void onNetworkQuality(TRTCCloudDef.TRTCQuality localQuality, List<TRTCCloudDef.TRTCQuality> remoteQuality);

    /**
     * 开始屏幕分享回调
     */
    void onScreenCaptureStarted();

    /**
     * 停止屏幕分享回调
     *
     * @param reason 停止原因，0：用户主动停止；1：被其他应用抢占导致停止
     */
    void onScreenCaptureStopped(int reason);
}
