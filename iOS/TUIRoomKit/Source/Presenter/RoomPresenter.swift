//
//  RoomPresenter.swift
//  TUIRoomKit
//
//  Created by WesleyLei on 2022/9/22.
//

import Foundation
import TUICore
import TUIRoomEngine
#if TXLiteAVSDK_TRTC
import TXLiteAVSDK_TRTC
#elseif TXLiteAVSDK_Professional
import TXLiteAVSDK_Professional
#endif

class RoomPresenter: NSObject {
    private var roomId: String
    init(roomId: String) {
        self.roomId = roomId
        super.init()
        if roomInfo.owner == currentUser.userInfo.userId {
            currentUser.userInfo.userRole = .roomOwner
            currentUser.isAllowAudioTurnedOn = true
            currentUser.isAllowVideoTurnedOn = true
        } else {
            currentUser.userInfo.userRole = .generalUser
            currentUser.isAllowAudioTurnedOn = roomInfo.enableAudio
            currentUser.isAllowVideoTurnedOn = roomInfo.enableVideo
        }
        roomEngine.addObserver(self)
    }

    var listenerArray: [TUIRoomPresenterListener] = []
    private var roomEngine: TUIRoomEngine {
        return EngineManager.shared.getRoomEngine(roomId: roomId)
    }

    var roomInfo: TUIRoomInfo {
        return EngineManager.shared.getRoomInfo(roomId: roomId).getEngineRoomInfo()
    }

    var currentUser: UserModel {
        return EngineManager.shared.getCurrentUserInfo()
    }

    func addListener(listener: TUIRoomPresenterListener) {
        listenerArray.append(listener)
    }

    deinit {
        roomEngine.removeObserver(self)
    }
}

extension RoomPresenter {
    func setAudioRoute(isSpeaker: Bool) {
        roomEngine.getTRTCCloud().setAudioRoute(isSpeaker ? .modeSpeakerphone : .modeEarpiece)
    }

    func switchCamera(isFront: Bool) {
        roomEngine.getTRTCCloud().getDeviceManager().switchCamera(isFront)
    }

    func showDebug(isOpen: Bool) {
        if isOpen {
            roomEngine.getTRTCCloud().setDebugViewMargin(currentUser.userInfo.userId, margin: TXEdgeInsets(top: 70, left: 10, bottom: 30, right: 10))
        }
        roomEngine.getTRTCCloud().showDebugView(isOpen ? 2 : 0)
    }
    
    func localMicrophone(isOpen: Bool, onSuccess: @escaping TUISuccessBlock, onError: @escaping TUIErrorBlock) {
        currentUser.hasAudioStream = isOpen
        if isOpen {
            roomEngine.openLocalMicrophone {
                onSuccess()
            } onError: { code , message in
                onError(code, message)
            }
        } else {
            roomEngine.closeLocalMicrophone()
            onSuccess()
        }
    }

    func localCamera(isOpen: Bool, isFront: Bool, onSuccess: @escaping TUISuccessBlock, onError: @escaping TUIErrorBlock) {
        currentUser.hasVideoStream = isOpen
        if isOpen {
            roomEngine.openLocalCamera(isFront: isFront) {
                onSuccess()
            } onError: { code, message in
                onError(code, message)
            }
        } else {
            roomEngine.closeLocalCamera()
            onSuccess()
        }
        listenerArray.forEach { presenterListener in
            presenterListener.onPresenterLocalCamera?(isOpen: isOpen)
        }
    }

    func getRoomInfo(onSuccess: @escaping TUIRoomInfoBlock, onError: @escaping TUIErrorBlock) {
        roomEngine.getRoomInfo { roomInfo in
            onSuccess(roomInfo)
        } onError: { code, message in
            onError(code, message)
        }
    }

    func updateRoomInfo(roomInfo: TUIRoomInfo, onSuccess: @escaping TUISuccessBlock, onError: @escaping TUIErrorBlock) {
        roomEngine.updateRoomInfo(roomInfo) {
            onSuccess()
        } onError: { code, message in
            onError(code, message)
        }
    }

    func getUserInfo(userID: String, onSuccess: @escaping TUIUserInfoBlock, onError: @escaping TUIErrorBlock) {
        roomEngine.getUserInfo(userID) { userInfo in
            onSuccess(userInfo)
        } onError: { code, message in
            onError(code, message)
        }
    }

    func kickOutRemoteUser(userId: String, onSuccess: @escaping TUISuccessBlock, onError: @escaping TUIErrorBlock) {
        roomEngine.kickOutRemoteUser(userId, onSuccess: {
            onSuccess()
        }, onError: { code, message in
            onError(code, message)
        })
    }

    func closeRemoteMicrophone(userId: String, onSuccess: @escaping TUISuccessBlock, onError: @escaping TUIErrorBlock) {
        roomEngine.closeRemoteMicrophone(userId: userId) {
            onSuccess()
        } onError: { code, message in
            onError(code, message)
        }
    }

    func requestToOpenRemoteMicrophone(userId: String, timeout: TimeInterval, onAccepted: @escaping TUIRequestAcceptedBlock, onRejected: @escaping
                                       TUIRequestRejectedBlock, onCancelled: @escaping TUIRequestCancelledBlock, onTimeout: @escaping
                                       TUIRequestTimeoutBlock, onError: @escaping TUIRequestErrorBlock) -> Int {
        let inviteID = roomEngine.requestToOpenRemoteMicrophone(userId: userId, timeout: timeout) { requestId, userId in
            onAccepted(requestId, userId)
        } onRejected: { requestId, userId, message in
            onRejected(requestId, userId, message)
        } onCancelled: { requestId, userId in
            onCancelled(requestId, userId)
        } onTimeout: { requestId, userId in
            onTimeout(requestId, userId)
        } onError: { requestId, userId, code, message in
            onError(requestId, userId, code, message)
        }
        return Int(inviteID)
    }

    func closeRemoteCamera(userId: String, onSuccess: @escaping TUISuccessBlock, onError: @escaping TUIErrorBlock) {
        roomEngine.closeRemoteCamera(userId: userId) {
            onSuccess()
        } onError: { code, message in
            onError(code, message)
        }
    }

    func requestToOpenRemoteCamera(userId: String, timeout: TimeInterval, onAccepted: @escaping TUIRequestAcceptedBlock, onRejected: @escaping
                                   TUIRequestRejectedBlock,onCancelled: @escaping TUIRequestCancelledBlock, onTimeout: @escaping
                                   TUIRequestTimeoutBlock, onError: @escaping TUIRequestErrorBlock) -> Int {
        let inviteID = roomEngine.requestToOpenRemoteCamera(userId: userId, timeout: timeout) { requestId, userId in
            onAccepted(requestId, userId)
        } onRejected: { requestId, userId, message in
            onRejected(requestId, userId, message)
        } onCancelled: { requestId, userId in
            onCancelled(requestId, userId)
        } onTimeout: { requestId, userId in
            onTimeout(requestId, userId)
        } onError: { requestId, userId, code, message in
            onError(requestId, userId, code, message)
        }
        return Int(inviteID)
    }

    func takeSeat(seatIndex: NSInteger, timeout: TimeInterval, requirePermission: Bool, onAccepted: @escaping TUIRequestAcceptedBlock, onRejected:
                  @escaping TUIRequestRejectedBlock, onCancelled: @escaping TUIRequestCancelledBlock, onTimeout: @escaping TUIRequestTimeoutBlock,
                  onError: @escaping TUIRequestErrorBlock) -> Int {
        var inviteID = 0
        inviteID = roomEngine.takeSeat(seatIndex, timeout: timeout, onAccepted: { requestId, userId in
            onAccepted(requestId, userId)
        }, onRejected: { requestId, userId, message in
            onRejected(requestId, userId, message)
        }, onCancelled: { requestId, userId in
            onCancelled(requestId, userId)
        }, onTimeout: { requestId, userId in
            onTimeout(requestId, userId)
        }, onError: { requestId, userId, code, message in
            onError(requestId, userId, code, message)
        })
        return Int(inviteID)
    }

    func stopScreenCapture() {
        roomEngine.stopScreenCapture()
    }

    func startPushLocalAudio() {
        roomEngine.startPushLocalAudio()
    }

    func stopPushLocalAudio() {
        roomEngine.stopPushLocalAudio()
    }

    func startPushLocalVideo() {
        roomEngine.startPushLocalVideo()
    }

    func stopPushLocalVideo() {
        roomEngine.stopPushLocalVideo()
    }

    func destroyRoom(onSuccess: @escaping TUISuccessBlock, onError: @escaping TUIErrorBlock) {
        EngineManager.shared.destroyRoom(roomId: roomId, onSuccess: onSuccess, onError: onError)
    }

    func exitRoom(onSuccess: @escaping TUISuccessBlock, onError: @escaping TUIErrorBlock) {
        EngineManager.shared.exitRoom(roomId: roomId, onSuccess: onSuccess, onError: onError)
    }

    func getTRTCCloud() -> TRTCCloud {
        return roomEngine.getTRTCCloud()
    }

    func setLocalAudioProfile(profile: TUIAudioProfile) {
        roomEngine.setLocalAudioProfile(profile)
    }

    func responseRemoteRequest(requestId: Int, agree: Bool, onSuccess: @escaping TUISuccessBlock, onError: @escaping TUIErrorBlock) {
        roomEngine.responseRemoteRequest(requestId, agree: agree, onSuccess: {
            onSuccess()
        }, onError: { code, messge in
            onError(code, messge)
        })
    }

    func startScreenCaptureByReplaykit(appGroup: String) {
        roomEngine.startScreenCapture(appGroup: appGroup)
    }
}

extension RoomPresenter: TUIRoomObserver {
    func onUserVideoStateChanged(userId: String, streamType: TUIVideoStreamType, hasVideo: Bool, reason: TUIChangeReason) {
        listenerArray.forEach { presenterListener in
            presenterListener.onPresenterUserVideoStateChanged?(userId: userId, streamType: streamType, hasVideo: hasVideo, reason: reason)
        }
    }
    
    func onUserAudioStateChanged(userId: String, hasAudio: Bool, reason: TUIChangeReason) {
        listenerArray.forEach { presenterListener in
            presenterListener.onPresenterUserAudioStateChanged?(userId: userId, hasAudio: hasAudio, reason: reason)
        }
    }
    
    func onSeatListChanged(seatList: [TUISeatInfo], seated: [TUISeatInfo], left: [TUISeatInfo]) {
        listenerArray.forEach { presenterListener in
            presenterListener.onPresenterSeatListChanged?(seatList: seatList, seated: seated, left: left)
        }
    }

    func onRoomInfoChanged(roomId: String, roomInfo: TUIRoomInfo) {
        listenerArray.forEach { presenterListener in
            presenterListener.onPresenterRoomInfoChanged?(roomId: roomId, roomInfo: roomInfo)
        }
    }

    func onKickedOutOfRoom(roomId: String, message: String) {
        if roomInfo.roomId == roomId {
            listenerArray.forEach { presenterListener in
                presenterListener.onPresenterKickedOutRoom?(message: message)
            }
        }
    }

    func onRoomDismissed(roomId: String) {
        if roomInfo.roomId == roomId {
            if !(roomInfo.owner == TUILogin.getUserID()) {
                listenerArray.forEach { presenterListener in
                    presenterListener.onPresenterRoomDismissed?()
                }
            }
        }
    }

    func onRequestReceived(request: TUIRequest) {
        listenerArray.forEach { presenterListener in
            presenterListener.onPresenterRequestReceived?(request: request)
        }
    }
    
    func onUserScreenCaptureStopped(reason: Int) {
        listenerArray.forEach { presenterListener in
            presenterListener.onPresenterUserScreenCaptureStopped?(reason: reason)
        }
    }
}

@objc protocol TUIRoomPresenterListener {
   /**
     * 用户视频状态发生变化事件
     *
     * - parameter userId    用户ID
     * - parameter streamType  视频流类型
     * - parameter hasVideo    是否有视频流
     * - parameter reason  视频流发生变化原因 .BySelf: 自己切换;  .ByAdmin: 被管理员切换
     */
    @objc optional func onPresenterUserVideoStateChanged(userId: String, streamType: TUIVideoStreamType, hasVideo: Bool,
                                                         reason: TUIChangeReason)
    /**
     * 用户音频状态发生变化事件
     *
     * - parameter userId 用户ID
     * - parameter hasAudio 是否有音频流
     * - parameter reason 音频流发生变化原因  .BySelf:  自己切换 ;  .ByAdmin:  被管理员切换
     */
    @objc optional func onPresenterUserAudioStateChanged(userId: String, hasAudio: Bool, reason: TUIChangeReason)
    /**
     * 麦位列表发生变化事件
     *
     *  - parameter seatList 目前麦上最新的用户列表，包含新上麦的用户
     *  - parameter seatedList 新上麦的用户列表
     *  - parameter leftList 新下麦的用户列表
     */
    @objc optional func onPresenterSeatListChanged(seatList: [TUISeatInfo], seated: [TUISeatInfo], left: [TUISeatInfo])
    /**
     * 房间信息更改事件
     *
     *  - parameter roomId 房间ID
     *  - parameter roomInfo 房间信息
     */
    @objc optional func onPresenterRoomInfoChanged(roomId: String, roomInfo: TUIRoomInfo)
    /**
     * 被踢出房间事件
     *
     *  - parameter message 被踢出的描述
     */
    @objc optional func onPresenterKickedOutRoom(message: String)
    /**
     * 房间被解散事件
     */
    @objc optional func onPresenterRoomDismissed()
    /**
     * 收到请求消息事件
     *
     *  - parameter request 请求内容，可参考 TUIRequest 对象
     */
    @objc optional func onPresenterRequestReceived(request: TUIRequest)
    /**
     * 屏幕分享结束
     *
     *  - parameter reason 停止原因，0：用户主动停止；1：屏幕窗口关闭导致停止；2：表示屏幕分享的显示屏状态变更（如接口被拔出、投影模式变更等）
     */
    @objc optional func onPresenterUserScreenCaptureStopped(reason: Int)
    /**
     * 本地摄像头的状态
     *
     * - parameter isOpen 摄像头是否开启
     */
    @objc optional func onPresenterLocalCamera(isOpen: Bool)
}
