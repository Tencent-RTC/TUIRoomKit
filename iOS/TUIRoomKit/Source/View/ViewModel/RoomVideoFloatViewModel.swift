//
//  RoomVideoFloatViewModel.swift
//  TUIRoomKit
//
//  Created by janejntang on 2023/7/11.
//

import Foundation
import RTCRoomEngine
import Factory
import Combine

protocol RoomVideoFloatViewResponder: NSObject {
    func updateUserStatus(user: UserEntity)
    func makeToast(text: String)
    func showAvatarImageView(isShow: Bool)
    func getRenderView() -> UIView
    func updateUserVolume(volume: Int)
    func updateUserAudio(hasAudio: Bool)
}

class RoomVideoFloatViewModel: NSObject {
    var displayUserId: String = ""
    var displayStreamType: TUIVideoStreamType = .cameraStream
    weak var viewResponder: RoomVideoFloatViewResponder?
    private var lastSwitchTime = 0
    private var switchIntervalTime = 5
    private let voiceVolumeMinLimit = 10
    var engineManager: EngineManager {
        EngineManager.shared
    }
    var roomInfo: TUIRoomInfo {
        engineManager.store.roomInfo
    }
    var currentUser: UserEntity {
        engineManager.store.currentUser
    }
    
    override init() {
        super.init()
        subscribeEngine()
        subLogoutNotification()
    }
    
    private func subscribeEngine() {
        EngineEventCenter.shared.subscribeEngine(event: .onUserVideoStateChanged, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onRoomDismissed, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onKickedOutOfRoom, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onUserAudioStateChanged, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onUserVoiceVolumeChanged, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onKickedOffLine, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onRemoteUserLeaveRoom, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onUserRoleChanged, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onUserInfoChanged, observer: self)
    }
    
    private func unsubscribeEngine() {
        EngineEventCenter.shared.unsubscribeEngine(event: .onUserVideoStateChanged, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onRoomDismissed, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onKickedOutOfRoom, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onUserAudioStateChanged, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onUserVoiceVolumeChanged, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onKickedOffLine, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onRemoteUserLeaveRoom, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onUserRoleChanged, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onUserInfoChanged, observer: self)
    }
    
    private func subLogoutNotification() {
        NotificationCenter.default.addObserver(self,
                                               selector: #selector(dismissFloatViewForLogout),
                                               name: NSNotification.Name.TUILogoutSuccess, object: nil)
    }
    
    private func unsubLogoutNotification() {
        NotificationCenter.default.removeObserver(self, name: NSNotification.Name.TUILogoutSuccess, object: nil)
    }
    
    func showRoomMainView() {
        if engineManager.store.isEnteredRoom {
            EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_ShowRoomMainView, param: [:])
        }
    }
    
    func showFloatWindowViewVideo() {
        if let userItem = getScreenUserItem() {
            switchScreenStreamUser(userItem: userItem)
        } else if getRoomOwnerUser() != nil {
            switchToRoomOwnerUser()
        } else {
            switchToSelfUser()
        }
    }
    
    func getUserEntity(userId: String) -> UserEntity? {
        return engineManager.store.attendeeList.first(where: { $0.userId == userId })
    }
    
    @objc private func dismissFloatViewForLogout() {
        RoomVideoFloatView.dismiss()
    }
    
    deinit {
        unsubscribeEngine()
        unsubLogoutNotification()
        debugPrint("deinit \(self)")
    }
    
    @Injected(\.conferenceStore) var operation: ConferenceStore
}

extension RoomVideoFloatViewModel {
    private func getScreenUserItem() -> UserEntity? {
        return engineManager.store.attendeeList.first(where: { $0.hasScreenStream == true })
    }
    
    private func showScreenStream(userItem: UserEntity) {
        startPlayVideo(userId: userItem.userId, streamType: .screenStream)
        changePlayingState(userId: userItem.userId, streamType: .screenStream)
        viewResponder?.updateUserStatus(user: userItem)
        viewResponder?.showAvatarImageView(isShow: false)
    }
    
    private func showCameraStream(userItem: UserEntity) {
        viewResponder?.updateUserStatus(user: userItem)
        if userItem.hasVideoStream {
            startPlayVideo(userId: userItem.userId, streamType: .cameraStream)
        } else {
            viewResponder?.showAvatarImageView(isShow: true)
        }
        changePlayingState(userId: userItem.userId, streamType: .cameraStream)
    }
    
    private func isArrivalSwitchUserTime() -> Bool {
        let currentTime = Int(Date().timeIntervalSince1970)
        return labs(currentTime - lastSwitchTime) > switchIntervalTime
    }
    
    private func getMaxVoiceVolumeMap(volumeMap: [String : NSNumber]) -> [String : Int]? {
        guard let maxElement = volumeMap.max(by: { $0.value.compare($1.value) == .orderedAscending }) else { return nil }
        return [maxElement.key : maxElement.value.intValue]
    }
    
    private func isSwitchOriginalUser(originalUserId: String, volumeMap: [String : NSNumber]) -> Bool {
        let originalUserVolume = volumeMap[originalUserId]?.intValue ?? 0
        guard originalUserVolume < voiceVolumeMinLimit else { return false }
        guard let maxVolume = getMaxVoiceVolumeMap(volumeMap: volumeMap)?.values.first else { return false }
        return maxVolume >= voiceVolumeMinLimit
    }
    
    private func switchToRoomOwnerUser() {
        guard let ownerUser = getRoomOwnerUser() else { return }
        if displayUserId.isEmpty {
            showCameraStream(userItem: ownerUser)
        } else if displayUserId != ownerUser.userId || displayStreamType != .cameraStream {
            stopPlayVideo(userId: displayUserId, streamType: displayStreamType)
            showCameraStream(userItem: ownerUser)
        }
    }
    
    private func switchToSelfUser() {
        if displayUserId.isEmpty {
            showCameraStream(userItem: currentUser)
        } else if displayUserId != currentUser.userId || displayStreamType != .cameraStream {
            stopPlayVideo(userId: displayUserId, streamType: displayStreamType)
            showCameraStream(userItem: currentUser)
        }
    }
    
    private func getRoomOwnerUser() -> UserEntity? {
        return engineManager.store.attendeeList.first(where: { $0.userRole == .roomOwner })
    }
    
    private func switchCameraStreamUser(volumeMap: [String : NSNumber]) {
        guard !volumeMap.isEmpty else { return }
        guard isArrivalSwitchUserTime() else { return }
        var latestDisplayUserId: String
        if !isSwitchOriginalUser(originalUserId: displayUserId, volumeMap: volumeMap) {
            latestDisplayUserId = displayUserId
        } else if let maxVolumeMap = getMaxVoiceVolumeMap(volumeMap: volumeMap)?.first, maxVolumeMap.value >= voiceVolumeMinLimit {
            latestDisplayUserId = maxVolumeMap.key
        } else if let user = getRoomOwnerUser() {
            latestDisplayUserId = user.userId
        } else {
            latestDisplayUserId = currentUser.userId
        }
        guard let latestDisplayUserItem = getUserEntity(userId: latestDisplayUserId) else { return }
        if displayUserId.isEmpty {
            showCameraStream(userItem: latestDisplayUserItem)
            lastSwitchTime = Int(Date().timeIntervalSince1970)
        } else if latestDisplayUserId != displayUserId || displayStreamType != .cameraStream {
            stopPlayVideo(userId: displayUserId, streamType: displayStreamType)
            showCameraStream(userItem: latestDisplayUserItem)
            lastSwitchTime = Int(Date().timeIntervalSince1970)
        }
    }
    
    private func switchScreenStreamUser(userItem: UserEntity) {
        if !displayUserId.isEmpty {
            stopPlayVideo(userId: displayUserId, streamType: displayStreamType)
        }
        if userItem.userId == currentUser.userId {
            showCameraStream(userItem: userItem)
        } else {
            showScreenStream(userItem: userItem)
        }
        lastSwitchTime = Int(Date().timeIntervalSince1970)
    }
    
    private func startPlayVideo(userId: String, streamType: TUIVideoStreamType) {
        if userId == currentUser.userId {
            engineManager.setLocalVideoView(streamType: streamType, view: viewResponder?.getRenderView())
        } else {
            engineManager.setRemoteVideoView(userId: userId, streamType: streamType, view: viewResponder?.getRenderView())
            engineManager.startPlayRemoteVideo(userId: userId, streamType: streamType)
        }
        viewResponder?.showAvatarImageView(isShow: false)
    }
    
    private func stopPlayVideo(userId: String, streamType: TUIVideoStreamType) {
        if userId == currentUser.userId {
            engineManager.setLocalVideoView(streamType: streamType, view: nil)
            return
        }
        engineManager.setRemoteVideoView(userId: userId, streamType: streamType, view: nil)
        guard let userItem = getUserEntity(userId: userId) else { return }
        if streamType == .screenStream, userItem.hasScreenStream {
            engineManager.stopPlayRemoteVideo(userId: userId, streamType: .screenStream)
        } else if streamType == .cameraStream, userItem.hasVideoStream {
            engineManager.stopPlayRemoteVideo(userId: userId, streamType: .cameraStream)
        }
    }
    
    private func changePlayingState(userId: String, streamType: TUIVideoStreamType) {
        self.displayUserId = userId
        self.displayStreamType = streamType
    }
}

extension RoomVideoFloatViewModel: RoomEngineEventResponder {
    func onEngineEvent(name: EngineEventCenter.RoomEngineEvent, param: [String : Any]?) {
        switch name {
        case .onRoomDismissed:
            handleRoomDismissed()
        case .onKickedOutOfRoom:
            handleKickedOutOfRoom()
        case .onUserVideoStateChanged:
            guard let userId = param?["userId"] as? String else { return }
            guard let streamType = param?["streamType"] as? TUIVideoStreamType else { return }
            guard let hasVideo = param?["hasVideo"] as? Bool else { return }
            handleUserVideoStateChanged(userId: userId, streamType: streamType, hasVideo: hasVideo)
        case .onUserAudioStateChanged:
            guard let userId = param?["userId"] as? String else { return }
            guard let hasAudio = param?["hasAudio"] as? Bool else { return }
            handleUserAudioStateChanged(userId: userId, hasAudio: hasAudio)
        case .onUserVoiceVolumeChanged:
            guard let volumeMap = param as? [String : NSNumber] else { return }
            handleUserVoiceVolumeChanged(volumeMap: volumeMap)
        case .onKickedOffLine:
            RoomVideoFloatView.dismiss()
            operation.dispatch(action: RoomResponseActions.onExitSuccess())
        case .onRemoteUserLeaveRoom :
            guard let userInfo = param?["userInfo"] as? TUIUserInfo else { return }
            handleRemoteUserLeaveRoom(useInfo: userInfo)
        case .onUserRoleChanged:
            guard let userId = param?["userId"] as? String else { return }
            guard let userRole = param?["userRole"] as? TUIRole else { return }
            handleUserRoleChanged(userId: userId, userRole: userRole)
        case .onUserInfoChanged:
            guard let userInfo = param?["userInfo"] as? TUIUserInfo, userInfo.userId == displayUserId else { return }
            guard let modifyFlag = param?["modifyFlag"] as? TUIUserInfoModifyFlag, modifyFlag.contains(.nameCard) else { return }
            guard let userItem = getUserEntity(userId: displayUserId) else { return }
            viewResponder?.updateUserStatus(user: userItem)
        default: break
        }
    }
    
    private func handleRoomDismissed() {
        engineManager.destroyEngineManager()
        RoomVideoFloatView.dismiss()
    }
    
    private func handleKickedOutOfRoom() {
        engineManager.destroyEngineManager()
        RoomVideoFloatView.dismiss()
        operation.dispatch(action: RoomResponseActions.onExitSuccess())
    }
    
    private func handleUserVideoStateChanged(userId: String, streamType: TUIVideoStreamType, hasVideo: Bool) {
        if streamType == .screenStream {
            if hasVideo {
                guard let userItem = getUserEntity(userId: userId) else { return }
                switchScreenStreamUser(userItem: userItem)
            } else if getRoomOwnerUser() != nil {
                switchToRoomOwnerUser()
            } else {
                switchToSelfUser()
            }
            return
        }
        guard getScreenUserItem() == nil || getScreenUserItem()?.userId == currentUser.userId else { return }
        guard userId == displayUserId else { return }
        if hasVideo {
            startPlayVideo(userId: userId, streamType: streamType)
        } else {
            viewResponder?.showAvatarImageView(isShow: true)
        }
    }
    
    private func handleUserAudioStateChanged(userId: String, hasAudio: Bool) {
        guard userId == displayUserId else { return }
        viewResponder?.updateUserAudio(hasAudio: hasAudio)
    }
    
    private func handleUserVoiceVolumeChanged(volumeMap: [String : NSNumber]) {
        if getScreenUserItem() == nil {
            switchCameraStreamUser(volumeMap: volumeMap)
        }
        let userVolume = volumeMap[displayUserId]?.intValue ?? 0
        viewResponder?.updateUserVolume(volume: userVolume)
    }
    
    private func handleRemoteUserLeaveRoom(useInfo: TUIUserInfo) {
        guard displayUserId == useInfo.userId else { return }
        if getRoomOwnerUser() != nil {
            switchToRoomOwnerUser()
        } else {
            switchToSelfUser()
        }
    }
    
    private func handleUserRoleChanged(userId: String, userRole: TUIRole) {
        if getScreenUserItem() == nil, userRole == .roomOwner {
            switchToRoomOwnerUser()
        }
        guard let userItem = getUserEntity(userId: displayUserId) else { return }
        viewResponder?.updateUserStatus(user: userItem)
    }
}

