/**
 * Copyright (c) 2021 Tencent. All rights reserved.
 * Module:   TUIRoomObserver @ TUIKitEngine
 * Function: TUIRoomEngine的事件回调接口
 */
#ifndef TUIROOMOBSERVER_H_
#define TUIROOMOBSERVER_H_

#include "TUIRoomDefine.h"

namespace tuikit {

class TUIRoomObserver {
   public:
    ~TUIRoomObserver() {
    }

    /**
     * 1.1 错误事件回调
     *
     * 错误事件，表示 SDK 抛出的不可恢复的错误，比如进入房间失败或设备开启失败等。
     * @param errorCode 错误码，请参考：{@link TUIError}
     * @param message  错误信息
     */
    virtual void onError(TUIError errorCode, const char* message) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                   登录状态事件回调
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 2.1 用户被踢下线
     *
     * @param message 被踢下线的描述
     */
    virtual void onKickedOffLine(const char* message) = 0;

    /**
     * 2.2 用户凭证超时事件
     */
    virtual void onUserSigExpired() = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                   房间内事件回调
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 3.1 房间信息更改事件
     *
     * @param roomId 房间ID
     * @param roomInfo 房间信息
     */
    virtual void onRoomInfoChanged(const char* roomId, const TUIRoomInfo& roomInfo) = 0;

    /**
     * 3.2 房间被解散事件
     *
     * @param roomId 房间ID
     */
    virtual void onRoomDismissed(const char* roomId) = 0;

    /**
     * 3.3 被踢出房间事件
     *
     * @param roomId 房间ID
     * @param message 被踢出的描述
     */
    virtual void onKickedOutOfRoom(const char* roomId, const char* message) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                   房间内用户事件回调
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 4.1 远端用户进房事件
     *
     * @param roomId 房间ID
     * @param userInfo 用户信息
     */
    virtual void onRemoteUserEnterRoom(const char* roomId, const TUIUserInfo& userInfo) = 0;

    /**
     * 4.2 远端用户离开房间事件
     *
     * @param roomId 房间ID
     * @param userInfo 用户信息
     */
    virtual void onRemoteUserLeaveRoom(const char* roomId, const TUIUserInfo& userInfo) = 0;

    /**
     * 4.3 用户角色发生变化事件
     *
     * @param userId 用户ID
     * @param userRole用户角色 可参考 {@link TUIRole} 枚举定义
     */
    virtual void onUserRoleChanged(const char* userId, const TUIRole& role) = 0;

    /**
     * 4.4 用户视频状态发生变化事件
     *
     * @param userId 用户ID
     * @param streamType 视频流类型
     * @param hasVideo 是否有视频流
     * @param reason 视频流发生变化原因 {@link TUIChangeReason::kChangedBySelf}: 自己切换  {@link TUIChangeReason::kChangedByAdmin}: 被管理员切换
     */
    virtual void onUserVideoStateChanged(const char* userId, TUIVideoStreamType streamType, bool hasVideo, TUIChangeReason reason) = 0;

    /**
     * 4.5 用户音频状态发生变化事件
     *
     * @param userId 用户ID
     * @param hasAudio 是否有音频流
     * @param reason 视频流发生变化原因 {@link TUIChangeReason::kChangedBySelf}: 自己切换  {@link TUIChangeReason::kChangedByAdmin}: 被管理员切换
     */
    virtual void onUserAudioStateChanged(const char* userId, bool hasVideo, TUIChangeReason reason) = 0;

    /**
     * 4.6 用户音量变化事件
     *
     * @param volumeMap 用户音量字典 key: userId, value: 用于承载所有正在说话的用户的音量大小，取值范围 0 - 100。
     */
    virtual void onUserVoiceVolumeChanged(TUIMap<const char*, int>* volumeMap) = 0;

    /**
     * 4.7 用户禁言状态发生变化事件
     *
     * @param userId 用户ID
     * @param muted 是否被禁止发言 {@link true}: 用户被禁止发送消息 {@link false}: 用户被解除禁止，可以发送消息
     */
    virtual void onUserMuteStateChanged(const char* userId, bool muted) = 0;

    /**
     * 4.8 用户网络状态变化事件
     *
     * @param networkList 用户网络状态数组，可参考 {@link TUINetworkInfo} 对象
     */
    virtual void onUserNetworkQualityChanged(TUIList<TUINetwork>* networkList) = 0;

    /**
     * 4.9  屏幕分享结束
     *
     * @param reason 停止原因，0：用户主动停止；1：屏幕窗口关闭导致停止；2：表示屏幕分享的显示屏状态变更（如接口被拔出、投影模式变更等）
     */
    virtual void onUserScreenCaptureStopped(int reason) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                   房间内麦位事件回调
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 5.1 上麦控制发生变化事件
     *
     * @param enable 是否开启上麦控制
     * @param maxSeatNumber 最大麦上用户数量
     */
    virtual void onSeatControlEnabled(bool enable, int maxSeatNumber) = 0;

    /**
     * 5.2 麦位列表发生变化事件
     *
     * @param seatList 目前麦上最新的用户列表，包含新上麦的用户
     * @param seatedList 新上麦的用户列表
     * @param leftList 新下麦的用户列表
     */
    virtual void onSeatListChanged(TUIList<TUISeatInfo>* seatList, TUIList<TUISeatInfo>* seatedList, TUIList<TUISeatInfo>* leftList) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                   请求信令事件回调
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 6.1 收到请求消息事件
     *
     * @param request 请求内容，可参考 {@link TUIRequest} 对象
     */
    virtual void onRequestReceived(const TUIRequest* request) = 0;

    /**
     * 6.2 收到请求被取消的事件
     *
     * @param requestId 请求ID
     * @param userId 取消信令的用户ID
     */
    virtual void onRequestCancelled(const char* requestId, const char* userId) = 0;

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                   房间内消息事件回调
    //
    /////////////////////////////////////////////////////////////////////////////////

    /**
     * 7.1 收到普通文本消息事件
     *
     * @param roomId 房间ID
     * @param message 消息内容, 请参考: {@link TUIMessage} 定义
     */
    virtual void onReceiveTextMessage(const char* roomId, const TUIMessage& message) = 0;

    /**
     * 7.2 收到自定义消息事件
     *
     * @param roomId 房间ID
     * @param message 消息内容, 请参考: {@link TUIMessage} 定义
     */
    virtual void onReceiveCustomMessage(const char* roomId, const TUIMessage& message) = 0;

    /**
     * 7.3 收到用户被踢下麦事件
     *
     * @param userId 操作踢人的（主持人/管理员）用户id
     */
    virtual void onKickedOffSeat(const char* userId) = 0;
};

}  // namespace tuikit

#endif  // TUIROOMOBSERVER_H_
