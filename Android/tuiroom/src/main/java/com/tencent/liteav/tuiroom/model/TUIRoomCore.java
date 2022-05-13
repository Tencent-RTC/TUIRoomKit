package com.tencent.liteav.tuiroom.model;

import android.content.Context;

import com.tencent.liteav.beauty.TXBeautyManager;
import com.tencent.liteav.tuiroom.model.impl.TUIRoomCoreImpl;
import com.tencent.rtmp.ui.TXCloudVideoView;
import com.tencent.trtc.TRTCCloudDef;

import java.util.List;

public abstract class TUIRoomCore {
    /**
     * 获取 TUIRoom 单例对象
     *
     * @return 返回 TUIRoomCore 单例对象，需要调用 destroyInstance 释放单例对象。
     */
    public static TUIRoomCore getInstance(Context context) {
        return TUIRoomCoreImpl.getInstance(context);
    }

    /**
     * 销毁 TUIRoom 单例对象
     */
    public abstract void destroyInstance();

    /**
     * 设置组件回调接口
     *
     * 您可以通过 TUIRoomCoreListener 获得各种状态通知
     *
     * @param listener 回调接口
     * @note TUIRoom 中的事件，默认是在 Main Thread 中回调给您
     */
    public abstract void setListener(TUIRoomCoreListener listener);

    /**
     * 创建房间（主持人调用）
     *
     * @param roomId     房间标识，需要由您分配并进行统一管理
     * @param speechMode 发言模式, TUIRoomCoreDef.SpeechMode.FREE_SPEECH 自由发言模式, UIRoomDef.SpeechMode.APPLY_SPEECH
     *                   申请发言模式
     * @param callback   创建房间的结果回调，成功时 code 为0
     */
    public abstract void createRoom(String roomId, TUIRoomCoreDef.SpeechMode speechMode,
                                    TUIRoomCoreCallback.ActionCallback callback);

    /**
     * 销毁房间（主持人调用）
     *
     * 主持人在创建房间后，可以调用这个函数来销毁房间
     *
     * 调用销毁房间接口后，其它成员会收到来自TUIRoomCoreListener的onDestroyRoom()回调通知
     *
     * @param callback 销毁房间的结果回调，成功时 code 为0.
     */
    public abstract void destroyRoom(TUIRoomCoreCallback.ActionCallback callback);

    /**
     * 进入房间（进入房间成员调用）
     *
     * @param roomId   房间标识，需要由您分配并进行统一管理
     * @param callback 结果回调，成功时 code 为0
     */
    public abstract void enterRoom(String roomId, TUIRoomCoreCallback.ActionCallback callback);

    /**
     * 离开房间（进入房间成员调用）
     *
     * @param callback 结果回调，成功时 code 为0.
     */
    public abstract void leaveRoom(TUIRoomCoreCallback.ActionCallback callback);

    /**
     * 获取房间信息
     * 该接口用于获取房间的ID、房间名称、发言模式以及开始时间等信息
     *
     * @return 返回房间信息
     */
    public abstract TUIRoomCoreDef.RoomInfo getRoomInfo();

    /**
     * 获取房间内所有成员信息
     *
     * 调用该接口可以获取房间内的成员列表信息
     *
     * @return 返回房间人员信息列表
     */
    public abstract List<TUIRoomCoreDef.UserInfo> getRoomUsers();

    /**
     * 获取房间成员信息
     *
     * 调用该接口可以获取房间内指定userId的用户信息
     *
     * @param userId  用户id
     * @param callback  房间人员详细信息回调
     */
    public abstract void getUserInfo(String userId, TUIRoomCoreCallback.UserInfoCallback callback);

    /**
     * 将群转交给其他用户
     *
     * @param userId   转交的用户id
     * @param callback 结果回调，成功时 code 为0
     */
    public abstract void transferRoomMaster(String userId, TUIRoomCoreCallback.ActionCallback callback);

    /**
     * 设置用户信息，您设置的用户信息会被存储于腾讯云 IM 云服务中
     *
     * @param userName  用户昵称
     * @param avatarURL 用户头像
     * @param callback  是否设置成功的结果回调
     */
    public abstract void setSelfProfile(String userName, String avatarURL, TUIRoomCoreCallback.ActionCallback callback);

    /**
     * 开启本地视频的预览画面
     *
     * @param isFront true：前置摄像头；false：后置摄像头
     * @param view    承载视频画面的控件
     */
    public abstract void startCameraPreview(boolean isFront, TXCloudVideoView view);

    /**
     * 停止本地视频采集及预览
     */
    public abstract void stopCameraPreview();

    /**
     * 开启麦克风采集
     *
     * @param quality 采集的声音音质 TRTC_AUDIO_QUALITY_MUSIC/TRTC_AUDIO_QUALITY_DEFAULT/TRTC_AUDIO_QUALITY_SPEECH
     */
    public abstract void startLocalAudio(int quality);

    /**
     * 停止麦克风采集
     */
    public abstract void stopLocalAudio();

    /**
     * 设置本地画面镜像预览模式
     *
     * @param type 镜像类型，TRTCCloudDef.TRTC_VIDEO_MIRROR_TYPE_AUTO / TRTC_VIDEO_MIRROR_TYPE_ENABLE /
     *             TRTC_VIDEO_MIRROR_TYPE_DISABLE
     */
    public abstract void setVideoMirror(int type);

    /**
     * 设置开启扬声器
     * @param isUseSpeaker true:扬声器 false:听筒
     */
    public abstract void setSpeaker(boolean isUseSpeaker);

    /**
     * 订阅远端用户的视频流
     *
     * @param userId     需要观看的用户id
     * @param view       承载视频画面的 view 控件
     * @param streamType 流类型
     * @param callback   结果回调
     */
    public abstract void startRemoteView(String userId, TXCloudVideoView view, TUIRoomCoreDef.SteamType streamType,
                                         TUIRoomCoreCallback.ActionCallback callback);

    /**
     * 取消订阅远端用户的视频流
     *
     * @param userId   需要停止播放的用户id
     * @param streamType 流类型
     * @param callback 结果回调
     */
    public abstract void stopRemoteView(String userId, TUIRoomCoreDef.SteamType streamType,
                                        TUIRoomCoreCallback.ActionCallback callback);


    /**
     * 切换前后摄像头
     *
     * @param isFront true：前置摄像头；false：后置摄像头
     */
    public abstract void switchCamera(boolean isFront);

    /**
     * 在房间中广播文本消息，一般用于文本聊天
     *
     * @param message  消息内容
     * @param callback 发送结果回调
     */
    public abstract void sendChatMessage(String message, TUIRoomCoreCallback.ActionCallback callback);

    /**
     * 发送自定义消息
     *
     * 调用该接口，会发送一条IM群消息,消息为自定义消息。
     *
     * @param  data     消息内容
     * @param  callback 发送结果回调
     */
    public abstract void sendCustomMessage(String data, TUIRoomCoreCallback.ActionCallback callback);

    /**
     * 禁用/恢复某用户的麦克风
     * 调用该接口，主持人禁用/恢复成员麦克风，成员端回收到onMicrophoneMuted()回调。
     *
     * @param userId   用户id
     * @param mute     true：禁用房间用户麦克风；false：恢复用户麦克风
     * @param callback 结果回调，成功时 code 为0.
     */
    public abstract void muteUserMicrophone(String userId, boolean mute, TUIRoomCoreCallback.ActionCallback callback);

    /**
     * 禁用/恢复所有用户的麦克风，并且状态会同步到房间信息中
     * 调用该接口，主持人禁用/恢复所有成员麦克风，成员端回收到onMicrophoneMuted()回调
     *
     * @param mute     true：禁用所有用户麦克风；false：恢复所有用户麦克风
     * @param callback 结果回调，成功时 code 为0.
     */
    public abstract void muteAllUsersMicrophone(boolean mute, TUIRoomCoreCallback.ActionCallback callback);

    /**
     * 禁用/恢复某用户的摄像头
     *
     * 调用该接口，主持人禁用/恢复成员摄像头，成员端回收到onCameraMuted回调
     *
     * @param userId   用户id
     * @param mute     true：禁用房间用户摄像头；false：恢复用户ID为user_id的用户摄像头
     * @param callback 结果回调，成功时 code 为0.
     */
    public abstract void muteUserCamera(String userId, boolean mute, TUIRoomCoreCallback.ActionCallback callback);


    /**
     * 禁用/恢复所有用户的摄像头，并且状态会同步到房间信息中
     * 调用该接口，主持人禁用/恢复所有成员麦克风，成员端回收到onCameraMuted回调
     *
     * @param mute     true：禁用所有用户摄像头；false：恢复所有用户摄像头
     * @param callback 结果回调，成功时 code 为0.
     */
    public abstract void muteAllUsersCamera(boolean mute, TUIRoomCoreCallback.ActionCallback callback);

    /**
     * 禁言/恢复文字聊天
     * 调用该接口，主持人可以禁言/恢复房间内IM聊天，成员端会收到onChatRoomMuted()回调
     *
     * @param mute     mute true：禁言；false：恢复禁言
     * @param callback 结果回调，成功时 code 为0.
     */
    public abstract void muteChatRoom(boolean mute, TUIRoomCoreCallback.ActionCallback callback);

    /**
     * 主持人踢人
     * 调用该接口，主持人踢人，成员端会收到onReceiveKickedOff()回调
     *
     * @param userId   用户ID
     * @param callback 结果回调，成功时 code 为0.
     */
    public abstract void kickOffUser(String userId, TUIRoomCoreCallback.ActionCallback callback);

    /**
     * 主持人开始点名
     *
     * 主持人开始点名，成员端会收到onCallingRollStarted()回调
     *
     * @param callback 结果回调，成功时 code 为0
     */
    public abstract void startCallingRoll(TUIRoomCoreCallback.ActionCallback callback);

    /**
     * 主持人结束点名
     *
     * 主持人结束点名，成员端会收到onCallingRollStopped()回调
     * @param callback 结果回调，成功时 code 为0
     */
    public abstract void stopCallingRoll(TUIRoomCoreCallback.ActionCallback callback);

    /**
     * 成员回复主持人点名
     *
     * 成员回复主持人点名，主持人会收到onMemberReplyCallingRoll()回调
     * @param callback 结果回调，成功时 code 为0
     */
    public abstract void replyCallingRoll(TUIRoomCoreCallback.ActionCallback callback);

    /**
     * 主持人邀请成员发言
     *
     * 调用该接口，主持人邀请成员发言，成员端会收到onReceiveSpeechInvitation()回调通知
     *
     * @param userId   用户ID
     * @param callback 结果回调，成功时 code 为0
     */
    public abstract void sendSpeechInvitation(String userId, TUIRoomCoreCallback.InvitationCallback callback);

    /**
     * 主持人取消邀请成员发言
     *
     * 调用该接口，主持人取消邀请成员发言，成员端会收到onReceiveInvitationCancelled()回调通知
     *
     * @param userId   用户ID
     * @param callback 结果回调，成功时 code 为0
     */
    public abstract void cancelSpeechInvitation(String userId, TUIRoomCoreCallback.ActionCallback callback);

    /**
     * 成员同意/拒绝主持人的申请发言
     *
     * 在TUIRoomCoreDef.SpeechMode.APPLY_SPEECH模式，成员同意/拒绝主持人邀请发言需要调用此接口
     * 主持人会收到onReceiveReplyToSpeechInvitation回调通知
     *
     * @param agree    true：同意；false：拒绝
     * @param callback 结果回调，成功时 code 为0
     */
    public abstract void replySpeechInvitation(boolean agree, TUIRoomCoreCallback.ActionCallback callback);

    /**
     * 成员申请发言
     *
     * 调用该接口，成员申请发言，主持人端会收到onReceiveSpeechApplication回调通知
     *
     * @param callback 结果回调，成功时 code 为0
     */
    public abstract void sendSpeechApplication(TUIRoomCoreCallback.InvitationCallback callback);

    /**
     * 成员取消申请发言
     *
     * 调用该接口，成员取消申请发言，主持人端会收到onSpeechApplicationCancelled回调通知
     * @param callback 结果回调，成功时 code 为0
     */
    public abstract void cancelSpeechApplication(TUIRoomCoreCallback.ActionCallback callback);

    /**
     * 主持人同意/拒绝成员的申请发言
     *
     * 在TUIRoomCoreDef.SpeechMode.APPLY_SPEECH模式，主持人同意/拒绝成员的申请需要调用此接口
     * 成员端会收到onReceiveReplyToSpeechApplication回调通知
     *
     * @param agree    true：同意；false：拒绝
     * @param userId   用户ID
     * @param callback 结果回调，成功时 code 为0
     */
    public abstract void replySpeechApplication(boolean agree, String userId,
                                                TUIRoomCoreCallback.ActionCallback callback);

    /**
     * 主持人禁止申请发言
     *
     * 主持人禁止申请发言，成员端会收到onSpeechApplicationForbidden回调
     *
     * @param forbid true：禁止申请；false：取消禁止
     * @param callback 结果回调，成功时 code 为0
     */
    public abstract void forbidSpeechApplication(boolean forbid, TUIRoomCoreCallback.ActionCallback callback);

    /**
     * 主持人令成员停止发言
     *
     * 调用该接口，主持人邀请成员停止发言，成员端会收到onOrderedToExitSpeechState()回调通知
     *
     * @param  userId 用户ID。
     * @param  callback 结果回调，成功时 code 为0
     */
    public abstract void sendOffSpeaker(String userId, TUIRoomCoreCallback.ActionCallback callback);

    /**
     * 主持人令全体停止发言
     *
     * @param callback 结果回调
     */
    public abstract void sendOffAllSpeakers(TUIRoomCoreCallback.ActionCallback callback);

    /**
     * 成员停止发言,转变为观众
     * 如果成员在发言，调用该接口，则停止发言，转变为观众
     *
     * @param callback 结果回调
     */
    public abstract void exitSpeechState(TUIRoomCoreCallback.ActionCallback callback);

    /**
     * 启动屏幕分享
     *
     * Android 手机的屏幕分享的推荐配置参数：
     * - 分辨率(videoResolution)：1280 x 720
     * - 帧率(videoFps)：10 FPS
     * - 码率(videoBitrate)：1200 kbps
     * - 分辨率自适应(enableAdjustRes)：false
     *
     * @param encParams         设置屏幕分享时的编码参数，推荐采用上述推荐配置，如果您指定 encParams 为 null，则使用您调用 startScreenCapture 之前的编码参数设置
     * @param screenShareParams 设置屏幕分享的特殊配置，其中推荐设置 floatingView，一方面可以避免 App 被系统强杀；另一方面也能助于保护用户隐私
     */
    public abstract void startScreenCapture(TRTCCloudDef.TRTCVideoEncParam encParams,
                                            TRTCCloudDef.TRTCScreenShareParams screenShareParams);

    /**
     * 停止屏幕共享
     */
    public abstract void stopScreenCapture();

    /**
     * 获取美颜管理对象
     *
     * 通过美颜管理，您可以使用以下功能：
     * - 设置”美颜风格”、”美白”、“红润”、“大眼”、“瘦脸”、“V脸”、“下巴”、“短脸”、“瘦鼻”、“亮眼”、“白牙”、“祛眼袋”、“祛皱纹”、“祛法令纹”等美容效果
     * - 调整“发际线”、“眼间距”、“眼角”、“嘴形”、“鼻翼”、“鼻子位置”、“嘴唇厚度”、“脸型”
     * - 设置人脸挂件（素材）等动态效果
     * - 添加美妆
     * - 进行手势识别
     *
     * @return
     */
    public abstract TXBeautyManager getBeautyManager();

    /**
     * 设置网络qos参数
     *
     * @param preference 网络流控策略
     */
    public abstract void setVideoQosPreference(TRTCCloudDef.TRTCNetworkQosParam preference);

    /**
     * 设置音质
     *
     * @param quality TRTC_AUDIO_QUALITY_MUSIC/TRTC_AUDIO_QUALITY_DEFAULT/TRTC_AUDIO_QUALITY_SPEECH
     */
    public abstract void setAudioQuality(int quality);

    /**
     * 设置分辨率
     *
     * @param resolution 详细设置见 TRTCCloudDef.TRTC_VIDEO_RESOLUTION_xx
     */
    public abstract void setVideoResolution(int resolution);

    /**
     * 设置帧率
     *
     * @param fps
     */
    public abstract void setVideoFps(int fps);

    /**
     * 设置码率
     *
     * @param bitrate 码率
     */
    public abstract void setVideoBitrate(int bitrate);

    /**
     * 启用音量大小提示
     * 开启后会在 onUserVolumeUpdate 中获取到 SDK 对音量大小值的评估。
     *
     * @param enable true 打开 false 关闭
     */
    public abstract void enableAudioEvaluation(boolean enable);

    /**
     * 设置播放音量
     *
     * @param volume 播放音量 0-100
     */
    public abstract void setAudioPlayVolume(int volume);

    /**
     * 设置麦克风采集音量
     *
     * @param volume 采集音量 0-100
     */
    public abstract void setAudioCaptureVolume(int volume);

    /**
     * 开始录音
     * 该方法调用后， SDK 会将通话过程中的所有音频（包括本地音频，远端音频，BGM 等）录制到一个文件里。
     * 无论是否进房，调用该接口都生效。
     * 如果调用 leaveRoom 时还在录音，录音会自动停止。
     *
     * @param params
     */
    public abstract void startFileDumping(TRTCCloudDef.TRTCAudioRecordingParams params);

    /**
     * 停止录音
     * 如果调用 leaveRoom 时还在录音，录音会自动停止。
     */
    public abstract void stopFileDumping();

    /**
     * 获取 SDK 版本接口函数
     * @return SDK版本号
     */
    public abstract int getSdkVersion();
}