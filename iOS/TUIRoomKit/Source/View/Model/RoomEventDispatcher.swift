//
//  RoomEventDispatcher.swift
//  TUIRoomKit
//
//  Created by janejntang on 2023/8/14.
//

import Foundation
import RTCRoomEngine
import Factory

class RoomEventDispatcher: NSObject {
    var engineManager: EngineManager {
        EngineManager.shared
    }
    var store: RoomStore {
        engineManager.store
    }
    var roomInfo: TUIRoomInfo {
        store.roomInfo
    }
    var currentUser: UserEntity {
        store.currentUser
    }
    
    deinit {
        debugPrint("deinit")
    }
    
    // MARK: - private property.
    @WeakLazyInjected(\.conferenceStore) private var operation
}

extension RoomEventDispatcher: TUIRoomObserver {
    // MARK: - Room event callback
    func onAllUserMicrophoneDisableChanged(roomId: String, isDisable: Bool) {
        roomInfo.isMicrophoneDisableForAllUser = isDisable
        let param = [
            "roomId" : roomId,
            "isDisable" : isDisable,
        ] as [String : Any]
        EngineEventCenter.shared.notifyEngineEvent(event: .onAllUserMicrophoneDisableChanged, param: param)
    }
    
    func onAllUserCameraDisableChanged(roomId: String, isDisable: Bool) {
        roomInfo.isCameraDisableForAllUser = isDisable
        let param = [
            "roomId" : roomId,
            "isDisable" : isDisable,
        ] as [String : Any]
        EngineEventCenter.shared.notifyEngineEvent(event: .onAllUserCameraDisableChanged, param: param)
    }
    
    func onSendMessageForAllUserDisableChanged(roomId: String, isDisable: Bool) {
        roomInfo.isMessageDisableForAllUser = isDisable
    }
    
    func onRoomDismissed(roomId: String, reason: TUIRoomDismissedReason) {
        let param: [String : Any] = [
            "roomInfo" : roomInfo,
            "reason" : ConferenceFinishedReason.finishedByOwner,
        ]
        EngineEventCenter.shared.notifyEngineEvent(event: .onRoomDismissed, param: param)
    }
    
    func onKickedOutOfRoom(roomId: String, reason: TUIKickedOutOfRoomReason, message: String) {
        let kickedReason: ConferenceExitedReason = switch reason {
            case .byAdmin:
                .exitedByAdminKickOut
            case .byLoggedOnOtherDevice:
                .exitedByJoinedOnOtherDevice
            case .byServer:
                .exitedByServerKickOut
            default:
                .exitedByAdminKickOut
        }
        let param: [String : Any] = [
            "roomInfo" : roomInfo,
            "reason" : kickedReason,
        ]
        EngineEventCenter.shared.notifyEngineEvent(event: .onKickedOutOfRoom, param: param)
    }

    func onRoomNameChanged(roomId: String, roomName: String) {
        roomInfo.name = roomName
    }
    
    // MARK: - User event callback in the room
    func onRemoteUserEnterRoom(roomId: String, userInfo: TUIUserInfo) {
        store.remoteUserEnterRoom(userInfo: userInfo)
        let param = [
            "roomId" : roomId,
            "userInfo" : userInfo,
        ] as [String : Any]
        EngineEventCenter.shared.notifyEngineEvent(event: .onRemoteUserEnterRoom, param: param)
    }
    
    func onRemoteUserLeaveRoom(roomId: String, userInfo: TUIUserInfo) {
        store.remoteUserLeaveRoom(userInfo: userInfo)
        let param = [
            "roomId" : roomId,
            "userInfo" : userInfo,
        ] as [String : Any]
        EngineEventCenter.shared.notifyEngineEvent(event: .onRemoteUserLeaveRoom, param: param)
    }
    
    func onUserVideoStateChanged(userId: String, streamType: TUIVideoStreamType, hasVideo: Bool, reason: TUIChangeReason) {
        userVideoStateChanged(userId: userId, streamType: streamType, hasVideo: hasVideo, reason: reason)
        let param = [
            "userId" : userId,
            "streamType" : streamType,
            "hasVideo" : hasVideo,
            "reason" : reason,
        ] as [String : Any]
        EngineEventCenter.shared.notifyEngineEvent(event: .onUserVideoStateChanged, param: param)
    }
    
    func onUserAudioStateChanged(userId: String, hasAudio: Bool, reason: TUIChangeReason) {
        userAudioStateChanged(userId: userId, hasAudio: hasAudio, reason: reason)
        let param = [
            "userId" : userId,
            "hasAudio" : hasAudio,
            "reason" : reason,
        ] as [String : Any]
        EngineEventCenter.shared.notifyEngineEvent(event: .onUserAudioStateChanged, param: param)
    }
    
    func onUserVoiceVolumeChanged(volumeMap: [String : NSNumber]) {
        userVoiceVolumeChanged(volumeMap: volumeMap)
        EngineEventCenter.shared.notifyEngineEvent(event: .onUserVoiceVolumeChanged, param: volumeMap)
    }
    
    func onUserScreenCaptureStopped(reason: Int) {
        userScreenCaptureStopped()
        EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_SomeoneSharing, param: ["userId":currentUser.userId, "hasVideo": false])
    }
    
    func onSeatListChanged(seatList: [TUISeatInfo], seated seatedList: [TUISeatInfo], left leftList: [TUISeatInfo]) {
        seatListChanged(seatList: seatList,seated: seatedList, left: leftList)
        let param = [
            "seatList": seatList,
            "seated": seatedList,
            "left": leftList,
        ] as [String : Any]
        EngineEventCenter.shared.notifyEngineEvent(event: .onSeatListChanged, param: param)
    }
    
    func OnSendMessageForUserDisableChanged(roomId: String, userId: String, isDisable muted: Bool) {
        store.updateUserDisableSendingMessage(userId: userId, isDisable: muted)
        let param = [
            "roomId": roomId,
            "userId": userId,
            "muted": muted,
        ] as [String : Any]
        EngineEventCenter.shared.notifyEngineEvent(event: .onSendMessageForUserDisableChanged, param: param)
    }
    
    // MARK: - Signaling request related callbacks
    func onRequestReceived(request: TUIRequest) {
        requestReceived(request: request)
        EngineEventCenter.shared.notifyEngineEvent(event: .onRequestReceived, param: ["request": request,])
    }
    
    func onRequestCancelled(request: TUIRequest, operateUser: TUIUserInfo) {
        store.deleteTakeSeatRequest(requestId: request.requestId)
    }
    
    func onRequestProcessed(request: TUIRequest, operateUser: TUIUserInfo) {
        store.deleteTakeSeatRequest(requestId: request.requestId)
    }
    
    func onKickedOffSeat(seatIndex: Int, operateUser: TUIUserInfo) {
        let param = [
            "userId": operateUser.userId,
        ] as [String : Any]
        EngineEventCenter.shared.notifyEngineEvent(event: .onKickedOffSeat, param: param)
    }
    
    func onKickedOffLine(message: String) {
        kickedOffLine()
        let param: [String : Any] = [
            "roomInfo" : roomInfo,
            "reason" : ConferenceExitedReason.exitedByKickedOutOfLine,
        ]
        EngineEventCenter.shared.notifyEngineEvent(event: .onKickedOffLine, param: param)
    }

    func onUserSigExpired() {
        let param: [String : Any] = [
            "roomInfo" : roomInfo,
            "reason" : ConferenceExitedReason.exitedByUserSigExpired,
        ]
        EngineEventCenter.shared.notifyEngineEvent(event: .onUserSigExpired, param: param)
    }
    
    func onUserInfoChanged(userInfo: TUIUserInfo, modifyFlag: TUIUserInfoModifyFlag) {
        if modifyFlag.contains(.nameCard) {
            store.changeUserName(userId: userInfo.userId, userName: userInfo.nameCard)
        } else if modifyFlag.contains(.userRole) {
            userRoleChanged(userId: userInfo.userId, userRole: userInfo.userRole)
        }
        let param = [
            "userInfo": userInfo,
            "modifyFlag": modifyFlag,
        ] as [String : Any]
        EngineEventCenter.shared.notifyEngineEvent(event: .onUserInfoChanged, param: param)
    }
    
    func onScreenShareForAllUserDisableChanged(roomId: String, isDisable: Bool) {
        roomInfo.isScreenShareDisableForAllUser = isDisable
        guard let operation = operation else { return }
        var roomState = operation.selectCurrent(RoomSelectors.getRoomState)
        roomState.isScreenShareDisableForAllUser = isDisable
        operation.dispatch(action: RoomActions.updateRoomState(payload: roomState))
    }
}

extension RoomEventDispatcher {
    private func seatListChanged(seatList: [TUISeatInfo], seated: [TUISeatInfo], left leftList: [TUISeatInfo]) {
        store.updateLeftSeatList(leftList: leftList)
        store.updateSeatedList(seatList: seated)
    }
    
    private func userAudioStateChanged(userId: String, hasAudio: Bool, reason: TUIChangeReason) {
        if userId == currentUser.userId {
            EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_CurrentUserHasAudioStream, param: ["hasAudio": hasAudio, "reason": reason])
            currentUser.hasAudioStream = hasAudio
        }
        guard let userModel = store.attendeeList.first(where: { $0.userId == userId }) else { return }
        userModel.hasAudioStream = hasAudio
        EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_RenewUserList, param: [:])
    }
    
    private func userVideoStateChanged(userId: String, streamType: TUIVideoStreamType, hasVideo: Bool, reason: TUIChangeReason) {
        switch streamType {
        case .screenStream:
            if userId == currentUser.userId {
                currentUser.hasScreenStream = hasVideo
            }
            if let userModel = store.attendeeList.first(where: { $0.userId == userId }) {
                userModel.hasScreenStream = hasVideo
            }
            EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_SomeoneSharing, param: ["userId": userId, "hasVideo": hasVideo])
            guard let operation = operation else { return }
            var hasScreenStreamUsers = operation.selectCurrent(UserSelectors.getHasScreenStreamUsers)
            if hasVideo {
                hasScreenStreamUsers.insert(userId)
            } else {
                hasScreenStreamUsers.remove(userId)
            }
            operation.dispatch(action: UserActions.updateHasScreenStreamUsers(payload: hasScreenStreamUsers))
        case .cameraStream:
            if userId == currentUser.userId {
                EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_CurrentUserHasVideoStream,
                                                       param: ["hasVideo": hasVideo, "reason": reason])
                currentUser.hasVideoStream = hasVideo
                store.videoSetting.isCameraOpened = hasVideo
            }
            guard let userModel = store.attendeeList.first(where: { $0.userId == userId }) else { return }
            userModel.hasVideoStream = hasVideo
            EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_RenewUserList, param: [:])
        default: break
        }
    }
    
    private func userRoleChanged(userId: String, userRole: TUIRole) {
        RoomKitLog.info("\(#file)","\(#line)","userRoleChanged, userId: \(userId), userRole: \(userRole)")
        RoomKitLog.info("\(#file)","\(#line)","current uerInfo, userId: \(currentUser.userId), onSeat: \(currentUser.isOnSeat)")
        let isSelfRoleChanged = userId == currentUser.userId
        let isRoomOwnerChanged = userRole == .roomOwner
        if let userInfo = store.attendeeList.first(where: { $0.userId == userId }) {
            userInfo.userRole = userRole
            EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_RenewUserList, param: ["userRole": userRole])
        }
        if isSelfRoleChanged {
            store.currentUser.userRole = userRole
            EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_CurrentUserRoleChanged, param: ["userRole": userRole])
            if let operation = operation {
                var selfInfo = operation.selectCurrent(UserSelectors.getSelfInfo)
                selfInfo.userRole = userRole
                operation.dispatch(action: UserActions.updateSelfInfo(payload: selfInfo))
            } else {
                RoomKitLog.error("\(#file)","\(#line)","conference store resolve error!")
            }
        }
        if isRoomOwnerChanged {
            EngineManager.shared.fetchRoomInfo(roomId: roomInfo.roomId) { _ in
                EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_RoomOwnerChanged, param: ["owner": userId])
            }
        }
        if checkAutoTakeSeatForOwner(userId: userId, userRole: userRole) {
           let _ = engineManager.takeSeat()
        }
        if checkAutoSendingMessageForOwner(userId: userId, userRole: userRole) {
            engineManager.disableSendingMessageByAdmin(userId: userId, isDisable: false)
        }
        if isSelfRoleChanged, userRole != .generalUser {
            engineManager.updateSeatApplicationList()
        }
    }
    
    private func checkAutoTakeSeatForOwner(userId: String, userRole: TUIRole) -> Bool {
        let isSelfRoleChanged = userId == currentUser.userId
        let isRoomOwnerChanged = userRole == .roomOwner
        return isSelfRoleChanged && isRoomOwnerChanged && roomInfo.isSeatEnabled && !currentUser.isOnSeat
    }
    
    private func checkAutoSendingMessageForOwner(userId: String, userRole: TUIRole) -> Bool {
        let isSelfRoleChanged = userId == currentUser.userId
        let isRoomOwnerChanged = userRole == .roomOwner
        return isSelfRoleChanged && isRoomOwnerChanged && currentUser.disableSendingMessage
    }
    
    private func requestReceived(request: TUIRequest) {
        switch request.requestAction {
        case .takeSeat:
            store.addInviteSeatUser(request: request)
        default: break
        }
    }
    
    private func userVoiceVolumeChanged(volumeMap: [String : NSNumber]) {
        for (userId, volume) in volumeMap {
            guard let userModel = store.attendeeList.first(where: { $0.userId == userId}) else { continue }
            userModel.userVoiceVolume = volume.intValue
        }
    }
    
    private func userScreenCaptureStopped() {
        currentUser.hasScreenStream = false
        guard let userModel = store.attendeeList.first(where: { $0.userId == currentUser.userId }) else { return }
        userModel.hasScreenStream = false
        guard let operation = operation else { return }
        var hasScreenStreamUsers = operation.selectCurrent(UserSelectors.getHasScreenStreamUsers)
        hasScreenStreamUsers.remove(currentUser.userId)
        operation.dispatch(action: UserActions.updateHasScreenStreamUsers(payload: hasScreenStreamUsers))
    }
    
    private func kickedOffLine() {
        engineManager.destroyEngineManager()
    }
}
