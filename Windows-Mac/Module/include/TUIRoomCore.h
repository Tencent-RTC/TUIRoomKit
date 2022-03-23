// Copyright (c) 2021 Tencent. All rights reserved.
#ifndef MODULE_INCLUDE_TUIROOMCORE_H_
#define MODULE_INCLUDE_TUIROOMCORE_H_

#include <vector>
#include <mutex>
#include "TUIRoomDef.h"
#include "TUIRoomCoreCallback.h"
#include "IScreenShareManager.h"

class TUIRoomCore {
 public:
    /**
     * 用获取 TUIRoomCore 对象指针。
     *
     * @return 返回 TUIRoomCore 单例对象的指针，需要调用 DestroyInstance 释放单例指针对象。
     */
    static TUIRoomCore* GetInstance();

    /**
     * 释放 TUIRoomCore 单例对象。
     */
    static void DestroyInstance();

    /**
     * 设置回调接口 TUIRoomCoreCallback
     *
     * 您可以通过 TUIRoomCoreCallback 获得各种状态通知，详见 TUIRoomCoreCallback.h 中的定义。
     *
     * @param callback 事件回调指针。
     */
    virtual void SetCallback(TUIRoomCoreCallback* callback) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                                （一）基础接口
    //
    /////////////////////////////////////////////////////////////////////////////////
    /**
     * 1.1 登录
     *
     * 调用登录接口后，会收到来自TUIRoomCoreCallback中的OnLogin()回调通知，表面是否登录成功。
     *
     * @param  sdk_appid ：它是腾讯云用于区分客户的唯一标识
     *                    进入腾讯云实时音视频[控制台](https://console.cloud.tencent.com/rav ) 创建应用，即可看到 SDKAppId,
     * @param  user_id ：用户ID，用于区分不同用户。
     * @param  user_sig ：用户签名，用于腾讯云流量的认证。
     */
    virtual int Login(int sdk_appid, const std::string& user_id, const std::string& user_sig) = 0;

    /**
     * 1.2 退出
     *
     * 调用退出接口后，会收到来自TUIRoomCoreCallback中的OnLogout()回调通知，用于退出后的资源释放处理。
     */
    virtual int Logout() = 0;

    /**
     * 1.3 创建房间
     *
     * 根据room_id创建一个房间，创建成功后即为主持人，成员只能进入房间，不能创建。
     * 调用创建房间接口后，会收到来自TUIRoomCoreCallback中的OnCreateRoom()回调通知。
     */
    virtual int CreateRoom(const std::string& room_id, TUISpeechMode speech_mode) = 0;

    /**
     * 1.4 销毁房间
     *
     * 调用 DestroyRoom() 接口会解散房间，该接口只能是主持人调用。
     * 调用销毁房间接口后，会收到来自TUIRoomCoreCallback中的OnDestroyRoom()回调通知。
     */
    virtual int DestroyRoom() = 0;

    /**
     * 1.5 进入房间
     *
     * 调用该接口后，会收到来自TUIRoomCoreCallback中的OnEnterRoom()回调通知来确认是否进房成功。
     */
    virtual int EnterRoom(const std::string& room_id) = 0;

    /**
     * 1.6 离开房间
     *
     * 调用离开房间接口后，会收到来自TUIRoomCoreCallback中的OnExitRoom()回调通知，可根据返回code确认离开房间的具体原因。
     */
    virtual int LeaveRoom() = 0;

    /**
     * 1.7 获取房间信息
     *
     * 该接口用于获取房间的ID、房间名称、场控模式以及是否禁言等信息。
     */
    virtual TUIRoomInfo GetRoomInfo() = 0;

    /**
     * 1.8 获取房间内的用户信息列表
     *
     * 调用该接口可以获取房间内的成员列表信息。
     */
    virtual std::vector<TUIUserInfo> GetRoomUsers() = 0;

    /**
     * 1.9 获取房间内指定用户的信息
     *
     * 调用该接口可以获取房间内指定user_id的用户信息
     * @ param user_id 要获取用户信息的用户ID。
     */
    virtual const TUIUserInfo* GetUserInfo(const std::string& user_id) = 0;

    /**
     * 1.10 设置用户属性
     *
     * @param  user_name  :用户姓名，用于设置用户的名称。
     * @param  avatar_url :用户头像url，用于设置用户的头像。
     */
    virtual int SetSelfProfile(const std::string& user_name, const std::string& avatar_url) = 0;

    /**
     * 1.11 将群转交给其他用户
     *
     * @param  user_id : 用户id
     */
    virtual int TransferRoomMaster(const std::string& user_id) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                                （二）本地推流接口
    //
    /////////////////////////////////////////////////////////////////////////////////
    /**
     * 2.1 开始本地摄像头预览
     *
     * 该接口用于打开本地摄像头进行视频预览。
     *
     * @param view 承载预览画面的控件。
     */
    virtual int StartCameraPreview(const liteav::TXView& view) = 0;

    /**
     * 2.2 停止本地摄像头预览
     *
     * 该接口用于停止本地摄像头的视频预览。
     */
    virtual int StopCameraPreview() = 0;

    /**
     * 2.3 更新本地视频预览画面的窗口
     *
     * @param view 承载预览画面的控件。
     */
    virtual int UpdateCameraPreview(const liteav::TXView& view) = 0;

    /**
     * 2.4 打开本地音频设备
     *
     * @param quality 声音音质。
     */
    virtual int StartLocalAudio(const liteav::TRTCAudioQuality& quality) = 0;

    /**
     * 2.5 关闭本地音频设备
     *
     */
    virtual int StopLocalAudio() = 0;

    /**
     * 2.6 开启系统声音的采集
     *
     * 调用该接口后会开启或关闭系统声音采集的上行。
     */
    virtual int StartSystemAudioLoopback() = 0;

    /**
     * 2.7 关闭系统声音的采集
     *
     * 调用该接口后会开启或关闭系统声音采集的上行。
     */
    virtual int StopSystemAudioLoopback() = 0;

    /**
     * 2.8 镜像设置
     *
     * 该设置视频是否进行镜像翻转
     *
     * @param mirror   true开启镜像, false 关闭镜像。
     */
    virtual int SetVideoMirror(bool mirror) = 0;

    /**
     * 2.9 开启AI降噪
     * 
     * 开启AI降噪
     */
    virtual int OpenAINoiseReduction() = 0;

    /**
     * 2.10 关闭AI降噪
     *
     * 关闭AI降噪
     */
    virtual int CloseAINoiseReduction() = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                                （三）远端用户接口
    //
    /////////////////////////////////////////////////////////////////////////////////
    /**
     * 3.1 订阅远端用户的视频流
     *
     * 调用该接口订阅指定用户的视频流。
     *
     * @ param user_id 要获取用户信息的用户ID。
     * @ param view 承载预览画面的控件。
     * @ param type 流类型
     */
    virtual int StartRemoteView(const std::string& user_id, const liteav::TXView& view,
        TUIStreamType type = TUIStreamType::kStreamTypeCamera) = 0;

    /**
     * 3.2 取消订阅远端用户的视频流
     *
     * 调用该接口取消订阅指定用户的视频流。
     *
     * @ param user_id 要获取用户信息的用户ID。
     * @ param type 流类型
     */
    virtual int StopRemoteView(const std::string& user_id,
        TUIStreamType type = TUIStreamType::kStreamTypeCamera) = 0;

    /**
     * 3.3 更新远端视频预览画面的窗口
     *
     * @ param user_id 要获取用户信息的用户ID。
     * @ param view 承载预览画面的控件。
     * @ param view 承载预览画面的控件。
     */
    virtual int UpdateRemoteView(const std::string& user_id, TUIStreamType type, const liteav::TXView& view) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                                （四）发送消息
    //
    /////////////////////////////////////////////////////////////////////////////////
    /**
     * 4.1 发送文本消息
     *
     * 调用该接口，会发送一条群文本消息。
     *
     * @param  message 消息内容。
     */
    virtual int SendChatMessage(const std::string& message) = 0;

    /**
     * 4.1 发送自定义消息
     *
     * 调用该接口，会发送一条IM群消息,消息为自定义消息。
     *
     * @param  message 消息内容。
     */
    virtual int SendCustomMessage(const std::string& message) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                                （五）场控相关
    //
    /////////////////////////////////////////////////////////////////////////////////
    /**
     * 5.1 禁用/恢复某用户的麦克风
     *
     * 调用该接口，主持人禁用/恢复成员麦克风，成员端回收到OnMicrophoneMuted()回调。
     *
     * @param  user_id 用户ID。
     * @param  mute true：禁用用户ID为user_id的用户麦克风；false：恢复用户ID为user_id的用户麦克风。
     * @param  callback 信令的回调，可以根据回调知道信令是否发送成功
     */
    virtual int MuteUserMicrophone(const std::string& user_id, bool mute, Callback callback) = 0;

    /**
     * 5.2 禁用/恢复所有用户的麦克风，并且状态会同步到房间信息中
     *
     * 调用该接口，主持人禁用/恢复所有成员麦克风，成员端回收到OnMicrophoneMuted()回调。
     *
     * @param  mute true：禁用所有用户麦克风；false：恢复所有用户麦克风。
     */
    virtual int MuteAllUsersMicrophone(bool mute) = 0;

    /**
     * 5.3 禁用/恢复某用户的摄像头
     *
     * 调用该接口，主持人禁用/恢复成员摄像头，成员端回收到OnCameraMuted回调。
     *
     * @param  user_id 用户ID。
     * @param  mute true：禁用用户ID为user_id的用户摄像头；false：恢复用户ID为user_id的用户摄像头。
     * @param  callback 信令的回调，可以根据回调知道信令是否发送成功
     */
    virtual int MuteUserCamera(const std::string& user_id, bool mute, Callback callback) = 0;

    /**
     * 5.4 禁用/恢复所有用户的摄像头，并且状态会同步到房间信息中
     *
     * 调用该接口，主持人禁用/恢复所有成员摄像头，成员端回收到OnCameraMuted回调。
     *
     * @param  mute true：禁用所有用户摄像头；false：恢复所有用户摄像头。
     */
    virtual int MuteAllUsersCamera(bool mute) = 0;

    /**
     * 5.5 开启/停止聊天室禁言
     *
     * 调用该接口，主持人可以禁言/恢复房间内IM聊天，成员端会收到OnChatRoomMuted()回调。
     *
     * @param  mute true：禁言；false：恢复禁言。
     */
    virtual int MuteChatRoom(bool mute) = 0;

    /**
     * 5.6 主持人踢人
     *
     * 调用该接口，主持人踢人，成员端会收到OnExitRoom(1, "")回调。
     *
     * @param  user_id 用户ID。
     * @param  callback 信令的回调，可以根据回调知道信令是否发送成功
     */
    virtual int KickOffUser(const std::string& user_id, Callback callback) = 0;

    /**
     * 5.7 主持人开始点名
     *
     * 主持人开始点名，成员端会收到OnCallingRollStarted()回调。
     */
    virtual int StartCallingRoll() = 0;

    /**
     * 5.8 主持人结束点名
     *
     * 主持人结束点名，成员端会收到OnCallingRollStopped()回调。
     */
    virtual int StopCallingRoll() = 0;

    /**
     * 5.9 成员回复主持人点名
     *
     * 成员回复主持人点名，主持人会收到OnMemberReplyCallingRoll()回调。
     * @param  callback 信令的回调，可以根据回调知道信令是否发送成功
     */
    virtual int ReplyCallingRoll(Callback callback) = 0;

    /**
     * 5.10 主持人邀请成员发言
     *
     * 调用该接口，主持人邀请成员发言，成员端会收到OnReceiveSpeechInvitation()回调通知。
     *
     * @param  user_id 用户ID。
     * @param  callback 信令的回调，可以根据回调知道信令是否发送成功
     */
    virtual int SendSpeechInvitation(const std::string& user_id, Callback callback) = 0;
    
    /**
     * 5.11 主持人取消邀请成员发言
     *
     * 调用该接口，主持人取消邀请成员发言，成员端会收到OnReceiveInvitationCancelled()回调通知。
     *
     * @param  user_id 用户ID。
     * @param  callback 信令的回调，可以根据回调知道信令是否发送成功
     */
    virtual int CancelSpeechInvitation(const std::string& user_id, Callback callback) = 0;

    /**
     * 5.12 成员同意/拒绝主持人的发言邀请
     *
     * 在TUISpeechMode::kApplySpeech模式下，成员同意/拒绝主持人邀请发言需要调用此接口。
     * 主持人会收到OnReceiveReplyToSpeechInvitation回调通知
     *
     * @param  agree true：同意；false：拒绝。
     * @param  callback 信令的回调，可以根据回调知道信令是否发送成功
     *
     */
    virtual int ReplySpeechInvitation(bool agree, Callback callback) = 0;

    /**
     * 5.13 成员申请发言
     *
     * 调用该接口，成员申请发言，主持人端会收到OnReceiveSpeechApplication回调通知。
     * 
     * @param  callback 信令的回调，可以根据回调知道信令是否发送成功
     */
    virtual int SendSpeechApplication(Callback callback) = 0;

    /**
     * 5.14 成员取消申请发言
     *
     * 调用该接口，成员取消申请发言，主持人端会收到OnSpeechApplicationCancelled回调通知。
     * 
     * @param  callback 信令的回调，可以根据回调知道信令是否发送成功
     */
    virtual int CancelSpeechApplication(Callback callback) = 0;

    /**
     * 5.15 主持人同意/拒绝成员的申请发言
     *
     * 在TUISpeechMode::kApplySpeech模式下，主持人同意/拒绝成员的申请需要调用此接口。
     * 成员端会收到OnReceiveReplyToSpeechApplication回调通知
     * 
     * @param  user_id 用户ID。
     * @param  agree true：同意；false：拒绝。
     * @param  callback 信令的回调，可以根据回调知道信令是否发送成功
     */
    virtual int ReplySpeechApplication(const std::string& user_id, bool agree, Callback callback) = 0;

    /*
     * 5.16 主持人禁止申请发言
     *
     * 主持人禁止申请发言，成员端会收到OnSpeechApplicationForbidden回调
     *
     * @param  forbid true：禁止申请；false：取消禁止。
     */
    virtual int ForbidSpeechApplication(bool forbid) = 0;

    /**
     * 5.17 主持人令成员停止发言
     *
     * 调用该接口，主持人邀请成员停止发言，成员端会收到OnOrderedToExitSpeechState()回调通知。
     *
     * @param  user_id 用户ID。
     * @param  callback 信令的回调，可以根据回调知道信令是否发送成功
     */
    virtual int SendOffSpeaker(const std::string& user_id, Callback callback) = 0;

    /*
     * 5.18 主持人令全体停止发言
     * 
     * 主持人令所有在发言的成员停止发言，所有成员都会收到OnOrderedToExitSpeechState回调
     * 
     * @param  callback 信令的回调，可以根据回调知道信令是否发送成功
     */
    virtual int SendOffAllSpeakers(Callback callback) = 0;

    /**
     * 5.19 成员停止发言,转变为观众
     *
     * 如果成员在发言，调用该接口，则停止发言，转变为观众。
     */
    virtual int ExitSpeechState() = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                                （六）基础组件接口
    //
    /////////////////////////////////////////////////////////////////////////////////
    /**
     * 6.1 获取设备管理的对象指针
     *
     * 调用该接口，获取到设备管理对象的指针，用于设备的获取和设置。
     */
    virtual liteav::ITXDeviceManager* GetDeviceManager() = 0;

    /**
     * 6.2 获取屏幕分享管理的对象指针
     *
     * 调用该接口，获取屏幕分享管理对象的指针，用于操作和设置屏幕分享。
     */
    virtual IScreenShareManager* GetScreenShareManager() = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                                （七）云录制接口
    //
    /////////////////////////////////////////////////////////////////////////////////
    /**
     * 7.1 开始云录制
     *
     * 调用该接口，开始启动云录制。
     *
     */
    virtual int StartCloudRecord() = 0;

    /**
     * 7.2 停止云录制
     *
     * 调用该接口，停止云录制。
     */
    virtual int StopCloudRecord() = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                                （八）美颜功能接口
    //
    /////////////////////////////////////////////////////////////////////////////////
    /**
     * 8.1 设置美颜、美白、红润效果级别
     *
     * SDK 内部集成了两套风格不同的磨皮算法
     * 一套叫“光滑”，适用于美女秀场，效果比较明显
     * 另一套叫“自然”，磨皮算法更多地保留了面部细节，主观感受上会更加自然
     *
     * @param style     美颜风格，光滑或者自然，光滑风格磨皮更加明显，适合娱乐场景。
     * @param beauty_level    美颜级别，取值范围0 - 9，0表示关闭，1 - 9值越大，效果越明显
     * @param whiteness_level 美白级别，取值范围0 - 9，0表示关闭，1 - 9值越大，效果越明显
     * @param ruddiness_level 红润级别，取值范围0 - 9，0表示关闭，1 - 9值越大，效果越明显，该参数暂未生效
     */
    virtual int SetBeautyStyle(liteav::TRTCBeautyStyle style, uint32_t beauty_level,
        uint32_t whiteness_level, uint32_t ruddiness_level) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                                （九）相关设置接口
    //
    /////////////////////////////////////////////////////////////////////////////////
    /**
     * 9.1 设置网络流控相关参数
     *
     * 该设置决定了 SDK 在各种网络环境下的调控策略（例如弱网下是“保清晰”还是“保流畅”）
     *
     * @param preference    “保清晰”还是“保流畅”，参见TUIVideoQosPreference。
     */
    virtual int SetVideoQosPreference(TUIVideoQosPreference preference) = 0;

    /**
    * 9.2 设置显示仪表盘
    *
    * “仪表盘”是位于视频渲染控件之上的一个半透明的调试信息浮层，用于展示音视频信息和事件信息，便于对接和调试。
    * @param showType 0：不显示；1：显示精简版（仅显示音视频信息）；2：显示完整版（包含音视频信息和事件信息）。
    *
    */
    virtual int ShowDebugView(int showType) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                                （十）获取SDK版本接口
    //
    /////////////////////////////////////////////////////////////////////////////////
    /**
     * 10.1 获取SDK版本信息
     */
    virtual const char* GetSDKVersion() = 0;

 protected:
     virtual ~TUIRoomCore() {}

};

#endif  //  MODULE_INCLUDE_TUIROOMCORE_H_
