//
//  TUIVideoSeatPresenter.swift
//  TUIVideoSeat
//
//  Created by WesleyLei on 2022/9/28.
//

import Foundation
import TUICore
import TUIRoomEngine
#if TXLiteAVSDK_TRTC
import TXLiteAVSDK_TRTC
#elseif TXLiteAVSDK_Professional
import TXLiteAVSDK_Professional
#endif

class TUIVideoSeatPresenter: NSObject {
    var listenerArray: [VideoSeatPresenterListener] = []
    private var roomEngine: TUIRoomEngine
    let currentUser: TUIVideoSeatAttendeeModel = TUIVideoSeatAttendeeModel()
    init(roomEngine: TUIRoomEngine, roomId: String) {
        self.roomEngine = roomEngine
        currentUser.userInfo = TUIRoomEngine.getSelfInfo()
        super.init()
        roomEngine.addObserver(self)
    }

    func addListener(listener: VideoSeatPresenterListener) {
        listenerArray.append(listener)
    }

    func setLocalVideoView(streamType: TUIVideoStreamType, view: UIView) {
        roomEngine.setLocalVideoView(streamType: streamType, view: view)
    }

    func setRemoteVideoView(userId: String, streamType: TUIVideoStreamType, view: UIView) {
        roomEngine.setRemoteVideoView(userId: userId, streamType: streamType, view: view)
    }

    func startPlayRemoteVideo(userId: String,
                              streamType: TUIVideoStreamType,
                              onPlaying: @escaping TUIPlayOnPlayingBlock,
                              onLoading: @escaping TUIPlayOnLoadingBlock,
                              onError: @escaping TUIPlayOnErrorBlock) {
        roomEngine.startPlayRemoteVideo(userId: userId, streamType: streamType, onPlaying: onPlaying, onLoading: onLoading, onError: onError)
    }

    func stopPlayRemoteVideo(userId: String, streamType: TUIVideoStreamType) {
        roomEngine.stopPlayRemoteVideo(userId: userId, streamType: streamType)
    }

    func getUserInfo(userId: String,
                     onSuccess: @escaping TUIUserInfoBlock,
                     onError: @escaping TUIErrorBlock) {
        roomEngine.getUserInfo(userId, onSuccess: onSuccess, onError: onError)
    }
    
    func getTRTCCloud() -> TRTCCloud {
        return roomEngine.getTRTCCloud()
    }

}

extension TUIVideoSeatPresenter: TUIRoomObserver {
    public func onRoomInfoChanged(roomId: String, roomInfo: TUIRoomInfo) {
        listenerArray.forEach { presenterListener in
            presenterListener.onRoomInfoChanged(roomId: roomId, roomInfo: roomInfo)
        }
    }
    public func onUserVoiceVolumeChanged(volumeMap: [String: NSNumber]) {
        listenerArray.forEach { presenterListener in
            presenterListener.onUserVoiceVolumeChanged(volumeMap: volumeMap)
        }
    }

    public func onUserVideoStateChanged(userId: String, streamType: TUIVideoStreamType, hasVideo: Bool, reason: TUIChangeReason) {
        listenerArray.forEach { presenterListener in
            presenterListener.onUserVideoStateChanged(userId: userId, streamType: streamType, hasVideo: hasVideo, reason: reason)
        }
    }

    public func onUserAudioStateChanged(userId: String, hasAudio: Bool, reason: TUIChangeReason) {
        listenerArray.forEach { presenterListener in
            presenterListener.onUserAudioStateChanged(userId: userId, hasAudio: hasAudio, reason: reason)
        }
    }

    // seatList: 当前麦位列表  seated: 新增上麦的用户列表 left: 下麦的用户列表
    public func onSeatListChanged(seatList: [TUISeatInfo], seated: [TUISeatInfo], left: [TUISeatInfo]) {
        listenerArray.forEach { presenterListener in
            presenterListener.onSeatListChanged(seatList: seatList, seated: seated, left: left)
        }
    }

    public func onUserNetworkQualityChanged(networkList: [TUINetworkInfo]) {
        listenerArray.forEach { presenterListener in
            presenterListener.onUserNetworkQualityChanged(networkList: networkList)
        }
    }
}

protocol VideoSeatPresenterListener {
    /**
     * 用户音量变化事件
     *
     * - paramete volumeMap 用户音量字典 key: userId, value: 用于承载所有正在说话的用户的音量大小，取值范围 0 - 100。
     */
    func onUserVoiceVolumeChanged(volumeMap: [String: NSNumber])
    /**
     * 用户视频状态发生变化事件
     *
     * - paramete userId 用户ID
     * - paramete streamType 视频流类型
     * - paramete hasVideo 是否有视频流
     * - paramete reason 视频流发生变化原因  .BySelf: 自己切换;  .ByAdmin: 被管理员切换
     */
    func onUserVideoStateChanged(userId: String, streamType: TUIVideoStreamType, hasVideo: Bool, reason: TUIChangeReason)
    /**
     * 用户音频状态发生变化事件
     *
     * - paramete userId 用户ID
     * - paramete hasAudio 是否有音频流
     * - paramete reason 视频流发生变化原因  .BySelf: 自己切换;  .ByAdmin: 被管理员切换
     */
    func onUserAudioStateChanged(userId: String, hasAudio: Bool, reason: TUIChangeReason)
    /**
     * 麦位列表发生变化事件
     *
     * - paramete seatList 目前麦上最新的用户列表，包含新上麦的用户
     * - paramete seatedList 新上麦的用户列表
     * - paramete leftList 新下麦的用户列表
     */
    func onSeatListChanged(seatList: [TUISeatInfo], seated: [TUISeatInfo], left: [TUISeatInfo])
    /**
     * 用户网络状态变化事件
     *
     * - paramete networkList 用户网络状态数组，可参考 TUINetworkInfo 对象
     */
    func onUserNetworkQualityChanged(networkList: [TUINetworkInfo])
    /**
     * 房间信息更改事件
     *
     * - paramete roomId 房间ID
     * - paramete roomInfo 房间信息
     */
    func onRoomInfoChanged(roomId: String, roomInfo: TUIRoomInfo)
    
}
