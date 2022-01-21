//
//  TUIRoom.h
//  Pods
//
//  Created by WesleyLei on 2021/12/8.
//  Copyright © 2021 Tencent. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "TUIRoomDefine.h"
#import "TUIRoomCoreDelegate.h"
#import "TUIRoomInfo.h"
#import "TUIRoomUserInfo.h"
#import "TUIRoomUserManage.h"

NS_ASSUME_NONNULL_BEGIN
/**
 TUIRoomCore
 */
@interface TUIRoomCore : NSObject
/**
 * 获取 TUIRoom 单例对象
 *
 * @return 返回 TUIRoomCore 单例对象，需要调用 destroyInstance 释放单例对象。
 */
+ (instancetype)shareInstance;
- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

/**
 * 销毁 TUIRoom 单例对象
 */
+ (void)destroyInstance;

/**
 * 设置组件回调接口
 *
 * 您可以通过 TUIRoomCoreDelegate 获得各种状态通知
 *
 * @param delegate 回调接口
 * @note TUIRoom 中的事件，默认是在 Main Thread 中回调给您
 */
- (void)setDelegate:(id<TUIRoomCoreDelegate>)delegate;

/**
 * 创建房间（主持人调用）
 *
 * @param roomId     房间标识，需要由您分配并进行统一管理
 * @param speechMode 发言模式
 * @param callback   创建房间的结果回调，成功时 code 为0
 */
- (void)createRoom:(NSString *)roomId
        speechMode:(TUIRoomSpeechMode)speechMode
        callback:(TUIRoomActionCallback)callback;

/**
 * 销毁房间（主持人调用）
 *
 * 主持人在创建房间后，可以调用这个函数来销毁房间
 *
 * 调用销毁房间接口后，其它成员会收到来自TUIRoomCoreListener的onDestroyRoom()回调通知
 *
 * @param callback 销毁房间的结果回调，成功时 code 为0.
 * @note 仅仅主持人调用
 */
- (void)destroyRoom:(TUIRoomActionCallback)callback;

/**
 * 进入房间（进入房间成员调用）
 *
 * @param roomId   房间标识，需要由您分配并进行统一管理
 * @param callback 结果回调，成功时 code 为0
 */
- (void)enterRoom:(NSString *)roomId
        callback:(TUIRoomActionCallback)callback;

/**
 * 离开房间（进入房间成员调用）
 *
 * @param callback 结果回调，成功时 code 为0.
 * @note 成员调用
 */
- (void)leaveRoom:(TUIRoomActionCallback)callback;

/**
 * 获取房间信息
 * 该接口用于获取房间的ID、房间名称、发言模式以及开始时间等信息
 *
 * @return 返回房间信息
 */
- (nullable TUIRoomInfo *)getRoomInfo;

/**
 * 获取房间内所有成员信息
 *
 * 调用该接口可以获取房间内的成员列表信息
 *
 * @return 返回房间人员信息列表
 */
- (nullable NSArray<TUIRoomUserInfo *> *)getRoomUsers;

/**
 * 获取房间成员信息
 *
 * 调用该接口可以获取房间内指定userId的用户信息
 *
 * @param userId  用户id
 * @param callback  房间人员详细信息回调
 */
- (void)getUserInfo:(NSString *)userId
           callback:(TUIRoomUserInfoCallback)callback;

/**
 * 将群转交给其他用户
 *
 * @param userId   转交的用户id
 * @param callback 结果回调，成功时 code 为0
 */
- (void)transferRoomMaster:(NSString *)userId
                  callback:(TUIRoomActionCallback)callback;

/**
 * 设置用户信息，您设置的用户信息会被存储于腾讯云 IM 云服务中
 *
 * @param userName  用户昵称
 * @param avatarURL 用户头像
 * @param callback  是否设置成功的结果回调
 */
- (void)setSelfProfile:(NSString *)userName
             avatarURL:(NSString *)avatarURL
              callback:(TUIRoomActionCallback)callback;

/**
 * 开启本地视频的预览画面
 *
 * @param isFront true：前置摄像头；false：后置摄像头
 * @param view    承载视频画面的控件
 */
- (void)startCameraPreview:(BOOL)isFront
                      view:(UIView *)view;

/**
 * 停止本地视频采集及预览
 */
- (void)stopCameraPreview;

/**
 * 开启麦克风采集
 *
 * @param quality 采集的声音音质 TRTC_AUDIO_QUALITY_MUSIC/TRTC_AUDIO_QUALITY_DEFAULT/TRTC_AUDIO_QUALITY_SPEECH
 */
- (void)startLocalAudio:(TRTCAudioQuality)quality;

/**
 * 停止麦克风采集
 */
- (void)stopLocalAudio;

/**
 * 设置本地画面镜像预览模式
 *
 * @param type 本地视频预览镜像类型
 */

- (void)setVideoMirror:(TRTCVideoMirrorType)type;

/**
 * 设置开启扬声器
 *
 * @param isUseSpeaker YES：扬声器 NO：听筒
 */
- (void)setSpeaker:(BOOL)isUseSpeaker;

/**
 * 订阅远端用户的视频流
 *
 * @param userId     需要观看的用户id
 * @param view       承载视频画面的 view 控件
 * @param streamType 流类型
 * @param callback   结果回调
 */
- (void)startRemoteView:(NSString *)userId
                   view:(UIView *)view
             streamType:(TUIRoomStreamType)streamType
               callback:(TUIRoomActionCallback)callback;

/**
 * 取消订阅远端用户的视频流
 *
 * @param userId   需要停止播放的用户id
 * @param streamType 流类型
 * @param callback 结果回调
 */
- (void)stopRemoteView:(NSString *)userId
            streamType:(TUIRoomStreamType)streamType
              callback:(TUIRoomActionCallback)callback;

/**
 * 切换前后摄像头
 *
 * @param isFront YES：前置摄像头；NO：后置摄像头。
 */
- (void)switchCamera:(BOOL)isFront;

/**
 * 在房间中广播文本消息，一般用于文本聊天
 *
 * @param message  文本消息
 * @param callback 发送结果回调
 */
- (void)sendChatMessage:(NSString *)message
               callback:(TUIRoomActionCallback)callback;

/**
 * 禁用/恢复某用户的麦克风
 * 调用该接口，主持人禁用/恢复成员麦克风，成员端回收到onMicrophoneMuted()回调。
 *
 * @param userId   用户id
 * @param mute     YES：禁用房间用户麦克风；NO：恢复用户麦克风
 * @param callback 结果回调，成功时 code 为0.
 */
- (void)muteUserMicrophone:(NSString *)userId
                      mute:(BOOL)mute
                  callback:(TUIRoomActionCallback)callback;

/**
 * 禁用/恢复所有用户的麦克风，并且状态会同步到房间信息中
 * 调用该接口，主持人禁用/恢复所有成员麦克风，成员端回收到onMicrophoneMuted()回调
 *
 * @param mute     YES：禁用所有用户麦克风；NO：恢复所有用户麦克风
 * @param callback 结果回调，成功时 code 为0.
 */
- (void)muteAllUsersMicrophone:(BOOL)mute
                      callback:(TUIRoomActionCallback)callback;

/**
 * 禁用/恢复某用户的摄像头
 *
 * 调用该接口，主持人禁用/恢复成员摄像头，成员端回收到onCameraMuted回调
 *
 * @param userId   用户id
 * @param mute     YES：禁用房间用户摄像头；NO：恢复用户ID为user_id的用户摄像头
 * @param callback 结果回调，成功时 code 为0.
 */
- (void)muteUserCamera:(NSString *)userId
                  mute:(BOOL)mute
              callback:(TUIRoomActionCallback)callback;

/**
 * 禁用/恢复所有用户的摄像头，并且状态会同步到房间信息中
 * 调用该接口，主持人禁用/恢复所有成员麦克风，成员端回收到onCameraMuted回调
 *
 * @param mute     YES：禁用所有用户摄像头；NO：恢复所有用户摄像头
 * @param callback 结果回调，成功时 code 为0.
 */
- (void)muteAllUsersCamera:(BOOL)mute
                  callback:(TUIRoomActionCallback)callback;

/**
 * 禁言/恢复文字聊天
 *
 * 调用该接口，主持人可以禁言/恢复房间内IM聊天
 * @param mute  mute YES：禁言；NO：恢复禁言。
 * @param callback 结果回调，成功时 code 为0.
 */
- (void)muteChatRoom:(BOOL)mute
            callback:(TUIRoomActionCallback)callback;

/**
 * 主持人踢人
 *
 * 调用该接口，主持人踢人
 * @param userId 用户ID。
 * @param callback 结果回调，成功时 code 为0.
 */
- (void)kickOffUser:(NSString *)userId
           callback:(TUIRoomActionCallback)callback;

/**
 * 主持人开始点名
 *
 * 主持人开始点名，成员端会收到onCallingRollStarted()回调
 *
 * @param callback 结果回调，成功时 code 为0
 */
- (void)startCallingRoll:(TUIRoomActionCallback)callback;

/**
 * 主持人结束点名
 *
 * @param callback 结果回调，成功时 code 为0
 * @note 主持人结束点名，成员端会收到onCallingRollStopped()回调
 */
- (void)stopCallingRoll:(TUIRoomActionCallback)callback;

/**
 * 成员回复主持人点名
 *
 * 成员回复主持人点名，主持人会收到onMemberReplyCallingRoll()回调
 * @param callback 结果回调，成功时 code 为0
 */
- (void)replyCallingRoll:(TUIRoomActionCallback)callback;

/**
 * 主持人邀请成员发言
 *
 * 调用该接口，主持人邀请成员发言，成员端会收到onReceiveSpeechInvitation()回调通知
 *
 * @param userId   用户ID
 * @param callback 结果回调，成功时 code 为0
 */
- (void)sendSpeechInvitation:(NSString *)userId
                    callback:(TUIRoomInviteeCallback)callback;

/**
 * 主持人取消邀请成员发言
 *
 * 调用该接口，主持人取消邀请成员发言，成员端会收到onReceiveInvitationCancelled()回调通知
 *
 * @param userId   用户ID
 * @param callback 结果回调，成功时 code 为0
 */
- (void)cancelSpeechInvitation:(NSString *)userId
                      callback:(TUIRoomActionCallback)callback;

/**
 * 成员同意/拒绝主持人的申请发言
 *
 * 在TUIRoomCoreDef.SpeechMode.APPLY_SPEECH模式，成员同意/拒绝主持人邀请发言需要调用此接口
 * 主持人会收到onReceiveReplyToSpeechInvitation回调通知
 *
 * @param agree    YES：同意；NO：拒绝
 * @param callback 结果回调，成功时 code 为0
 */
- (void)replySpeechInvitation:(BOOL)agree
                     callback:(TUIRoomActionCallback)callback;

/**
 * 成员申请发言
 *
 * 调用该接口，成员申请发言，主持人端会收到onReceiveSpeechApplication回调通知
 *
 * @param callback 结果回调，成功时 code 为0
 */
- (void)sendSpeechApplication:(TUIRoomInviteeCallback)callback;

/**
 * 成员取消申请发言
 *
 * 调用该接口，成员取消申请发言，主持人端会收到onSpeechApplicationCancelled回调通知
 * @param callback 结果回调，成功时 code 为0
 */
- (void)cancelSpeechApplication:(TUIRoomActionCallback)callback;

/**
 * 主持人同意/拒绝成员的申请发言
 *
 * 在TUIRoomCoreDef.SpeechMode.APPLY_SPEECH模式，主持人同意/拒绝成员的申请需要调用此接口
 *
 * @param agree    YES：同意；NO：拒绝
 * @param userId   用户ID
 * @param callback 结果回调，成功时 code 为0
 */
- (void)replySpeechApplication:(BOOL)agree
                        userId:(NSString *)userId
                      callback:(TUIRoomActionCallback)callback;

/**
 * 主持人禁止申请发言
 *
 * @param forbid YES：禁止申请；NO：取消禁止
 * @param callback 结果回调，成功时 code 为0
 * @note 主持人禁止申请发言，成员端会收到onSpeechApplicationForbidden回调
 */
- (void)forbidSpeechApplication:(BOOL)forbid
                       callback:(TUIRoomActionCallback)callback;

/**
 * 主持人令成员停止发言
 *
 * 调用该接口，主持人邀请成员停止发言，成员端会收到onOrderedToExitSpeechState()回调通知
 *
 * @param  userId 用户ID。
 * @param  callback 结果回调，成功时 code 为0
 */
- (void)sendOffSpeaker:(NSString *)userId
              callback:(TUIRoomInviteeCallback)callback;

/**
 * 主持人令全体停止发言
 *
 * @param callback 结果回调
 */
- (void)sendOffAllSpeakers:(TUIRoomInviteeCallback)callback;

/**
 * 成员停止发言,转变为观众
 * 如果成员在发言，调用该接口，则停止发言，转变为观众
 *
 * @param callback 结果回调
 */
- (void)exitSpeechState:(TUIRoomActionCallback)callback;

/**
 * 启动屏幕分享
 *
 * 手机的屏幕分享的推荐配置参数：
 * - 分辨率(videoResolution)：1280 x 720
 * - 帧率(videoFps)：10 FPS
 * - 码率(videoBitrate)：1200 kbps
 * - 分辨率自适应(enableAdjustRes)：false
 *
 * @param encParam 设置屏幕分享时的编码参数，推荐采用上述推荐配置，如果您指定 encParams 为 null，则使用您调用 startScreenCapture 之前的编码参数设置。
 */
- (void)startScreenCapture:(TRTCVideoEncParam *)encParam API_AVAILABLE(ios(11.0));

/**
 * 停止屏幕共享
 */
- (void)stopScreenCapture API_AVAILABLE(ios(11.0));

/**
 * 获取美颜管理对象
 *
 * 通过美颜管理，您可以使用以下功能：
 * - 设置"磨皮"、“美白”、“红润”等美颜特效。
 * - 设置“大眼”、“瘦脸”、“V脸”、“下巴”、“短脸”、“小鼻”、“亮眼”、“白牙”、“祛眼袋”、“祛皱纹”、“祛法令纹”等修脸特效。
 * - 设置“发际线”、“眼间距”、“眼角”、“嘴形”、“鼻翼”、“鼻子位置”、“嘴唇厚度”、“脸型”等修脸特效。
 * - 设置"眼影"、“腮红”等美妆特效。
 * - 设置动态贴纸和人脸挂件等动画特效。
 * @return TXBeautyManager
 */
- (TXBeautyManager *)getBeautyManager;

/**
 * 设置网络qos参数
 *
 * @param preference 网络流控策略
 */
- (void)setVideoQosPreference:(TRTCNetworkQosParam *)preference;

/**
 * 设置音质
 *
 * @param quality 音质
 */
- (void)setAudioQuality:(TRTCAudioQuality)quality;

/**
 * 设置分辨率
 *
 * @param resolution 视频分辨率
 */
- (void)setVideoResolution:(TRTCVideoResolution)resolution;

/**
 * 设置帧率
 *
 * @param fps 帧率数
 */
- (void)setVideoFps:(int)fps;

/**
 * 设置码率
 *
 * @param bitrate 码率，单位：kbps
 */
- (void)setVideoBitrate:(int)bitrate;

/**
 * 启用音量大小提示
 *
 * 开启后会在 onUserVolumeUpdate 中获取到 SDK 对音量大小值的评估。
 * @param enable true：打开  false：关闭
 */
- (void)enableAudioEvaluation:(BOOL)enable;

/**
 * 设置播放音量
 *
 * @param volume 播放音量 0-100
 */
- (void)setAudioPlayVolume:(NSInteger)volume;

/**
 * 设置麦克风采集音量
 *
 * @param volume 采集音量 0-100
 */
- (void)setAudioCaptureVolume:(NSInteger)volume;

/**
 * 开始录音
 *
 * 该方法调用后， SDK 会将通话过程中的所有音频（包括本地音频，远端音频，BGM 等）录制到一个文件里。
 * 无论是否进房，调用该接口都生效。
 * 如果调用 exitMeeting 时还在录音，录音会自动停止。
 * @param params 录音参数
 */
- (void)startFileDumping:(TRTCAudioRecordingParams *)params;

/**
 * 停止录音
 *
 * 如果调用 exitMeeting 时还在录音，录音会自动停止。
 */
- (void)stopFileDumping;

/**
 * 获取 SDK 版本接口函数
 * @return SDK版本号
 */
- (NSInteger)getSdkVersion;

@end

NS_ASSUME_NONNULL_END
