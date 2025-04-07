//
//  VideoSeatState.swift
//  TUIRoomKit
//
//  Created by CY zhao on 2024/10/23.
//

import Foundation
import Combine
import RTCRoomEngine

struct VideoSeatState {
    var videoSeatItems: [UserInfo] = []
    var offSeatItems : [UserInfo] = []
    var shareItem: UserInfo?
    var speakerItem: UserInfo?
    var isSelfScreenSharing = false
}

protocol VideoStore {
    var videoState: VideoSeatState { get }
    func subscribe<Value>(_ selector: Selector<VideoSeatState, Value>) -> AnyPublisher<Value, Never>
    var speakerChangedSubject: PassthroughSubject<UserInfo?, Never> { get }
}

class VideoStoreProvider: NSObject {
    private var lastSwitchTime = 0
    private var switchIntervalTime = 5
    private let voiceVolumeMinLimit = 10
    let speakerChangedSubject = PassthroughSubject<UserInfo?, Never>()
    
    // TODO: remove shared RoomStore
    var roomStore: RoomStore {
        EngineManager.shared.store
    }
    
    private lazy var store: Store<VideoSeatState, Void> = {
        let store = Store.init(initialState: VideoSeatState(), reducers: [VideoStateUpdater])
        return store
    }()
    
    private(set) var roomEngine = TUIRoomEngine.sharedInstance()
    private var cancellables = Set<AnyCancellable>()
    
    override init() {
        super.init()
        initVideoItems()
        initSubscriptions()
        roomEngine.addObserver(self)
    }
    
    private func initSubscriptions() {
        EngineEventCenter.shared.subscribeUIEvent(key: .TUIRoomKitService_RenewVideoSeatView, responder: self)
    }
    
    private func initVideoItems() {
        let videoItems = roomStore.roomInfo.isSeatEnabled ? roomStore.seatList : roomStore.attendeeList
        guard videoItems.count > 0 else { return }
        if !roomStore.roomInfo.isSeatEnabled {
            RoomKitLog.info("\(#file)","\(#line)","init userList: \(videoItems.map{ $0.userId })")
            self.initVideoItems(items: videoItems)
        } else {
            RoomKitLog.info("\(#file)","\(#line)","init seatList: \(videoItems.map{ $0.userId })")
            self.initVideoItems(items: videoItems)
            self.initOffSeatUsers(users: roomStore.attendeeList.filter({ !$0.isOnSeat }))
        }
        if let shareInfo = roomStore.attendeeList.first(where: { $0.hasScreenStream }) {
            if shareInfo.userId != roomStore.currentUser.userId {
                shareInfo.videoStreamType = .screenStream
                self.initShareItem(item: shareInfo)
            } else {
                updateIsSelfScreenSharing(true)
            }
        }
    }
    
    deinit {
        roomEngine.removeObserver(self)
        EngineEventCenter.shared.unsubscribeUIEvent(key: .TUIRoomKitService_RenewVideoSeatView, responder: self)
    }
}

extension VideoStoreProvider: RoomKitUIEventResponder {
    func onNotifyUIEvent(key: EngineEventCenter.RoomUIEvent, Object: Any?, info: [AnyHashable : Any]?) {
        switch key {
        case .TUIRoomKitService_RenewVideoSeatView:
            initVideoItems()
        default: break
        }
    }
}

extension VideoStoreProvider: VideoStore {
    var videoState: VideoSeatState {
        return store.state
    }
    
    func subscribe<Value>(_ selector: Selector<VideoSeatState, Value>) -> AnyPublisher<Value, Never> {
        return store.select(selector)
    }
}

extension VideoStoreProvider: TUIRoomObserver {
    func onUserAudioStateChanged(userId: String, hasAudio: Bool, reason: TUIChangeReason) {
        guard var item = videoState.videoSeatItems.first(where: { $0.userId == userId }) else { return }
        item.hasAudioStream = hasAudio
        updateVideoItem(item: item)
        
        if var shareItem = videoState.shareItem, shareItem.userId == item.userId {
            shareItem.hasAudioStream = item.hasAudioStream
            updateShareItem(item: shareItem)
        }
    }
    
    func onUserVoiceVolumeChanged(volumeMap: [String : NSNumber]) {
        guard volumeMap.count > 0  else { return }
        for (userId, volume) in volumeMap {
            guard var item = videoState.videoSeatItems.first(where: { $0.userId == userId }) else { continue }
            item.userVoiceVolume = volume.intValue
            updateVideoItem(item: item)
            
            if var shareItem = videoState.shareItem, shareItem.userId == userId {
                shareItem.userVoiceVolume = volume.intValue
                updateShareItem(item: shareItem)
            }
        }
        
        switchSpeakerItem(volumeMap: volumeMap)
    }
    
    func onUserVideoStateChanged(userId: String, streamType: TUIVideoStreamType, hasVideo: Bool, reason: TUIChangeReason) {
        RoomKitLog.info("\(#file)","\(#line)","onUserVideoStateChanged userId: \(userId), streamType: \(streamType.rawValue), hasVideo: \(hasVideo), reason: \(reason.rawValue)")
        guard var item = videoState.videoSeatItems.first(where: { $0.userId == userId }) else { return }
        if streamType == .screenStream && userId == roomStore.currentUser.userId {
            updateIsSelfScreenSharing(hasVideo)
            return
        }
        if streamType == .cameraStream || streamType == .cameraStreamLow {
            item.hasVideoStream = hasVideo
            updateVideoItem(item: item)
        } else {
            item.videoStreamType = .screenStream
            if hasVideo {
                updateShareItem(item: item)
            } else if userId == videoState.shareItem?.userId {
                updateShareItem(item: nil)
            }
        }
    }
    
    func onUserScreenCaptureStopped(reason: Int) {
        updateIsSelfScreenSharing(false)
    }
    
    func onRemoteUserEnterRoom(roomId: String, userInfo: TUIUserInfo) {
        let item = UserInfo(userInfo: userInfo)
        if !roomStore.roomInfo.isSeatEnabled {
            addVideoItem(item: item)
        } else {
            addOffSeatUser(user: item)
        }
    }
    
    func onRemoteUserLeaveRoom(roomId: String, userInfo: TUIUserInfo) {
        removeVideoItem(userId: userInfo.userId)
        removeOffSeatUser(userId: userInfo.userId)
        if videoState.speakerItem?.userId == userInfo.userId {
            updateSpeakerItem(item: nil)
        }
        if videoState.shareItem?.userId == userInfo.userId {
            updateShareItem(item: nil)
        }
    }
    
    func onUserInfoChanged(userInfo: TUIUserInfo, modifyFlag: TUIUserInfoModifyFlag) {
        if modifyFlag.contains(.nameCard) {
            onUserNameCardChanged(userInfo: userInfo)
        } else if modifyFlag.contains(.userRole) {
            onUserRoleChanged(userInfo: userInfo)
        }
    }
    
    private func onUserRoleChanged(userInfo: TUIUserInfo) {
        if var item = videoState.videoSeatItems.first(where: { $0.userId == userInfo.userId }) {
            item.userRole = userInfo.userRole
            updateVideoItem(item: item)
        }
        if var offSeatItem = videoState.offSeatItems.first(where: { $0.userId == userInfo.userId }) {
            offSeatItem.userRole = userInfo.userRole
            store.dispatch(action: VideoActions.updateOffseatItem(payload: offSeatItem))
        }
        if var shareItem = videoState.shareItem, shareItem.userId == userInfo.userId {
            shareItem.userRole = userInfo.userRole
            updateShareItem(item: shareItem)
        }
    }
    
    private func onUserNameCardChanged(userInfo: TUIUserInfo) {
        guard var item = videoState.videoSeatItems.first(where: { $0.userId == userInfo.userId }) else { return }
        item.userName = userInfo.nameCard
        updateVideoItem(item: item)
        
        if var shareItem = videoState.shareItem, shareItem.userId == userInfo.userId {
            shareItem.userName = userInfo.nameCard
            updateShareItem(item: shareItem)
        }
    }
    
    
    func onSeatListChanged(seatList: [TUISeatInfo], seated seatedList: [TUISeatInfo], left leftList: [TUISeatInfo]) {
        updateLeftSeatList(leftList: leftList)
        updateSeatedList(seatList: seatedList)
    }
    
    private func updateLeftSeatList(leftList: [TUISeatInfo]) {
        guard leftList.count > 0 else { return }
        for seatInfo: TUISeatInfo in leftList {
            guard let userId = seatInfo.userId else { continue }
            if var userItem = videoState.videoSeatItems.first(where: { $0.userId == userId }) {
                userItem.hasAudioStream = false
                userItem.hasVideoStream = false
                addOffSeatUser(user: userItem)
            }
            removeVideoItem(userId: userId)
            
            if videoState.speakerItem?.userId == userId {
                updateSpeakerItem(item: nil)
            }
        }
    }
    
    private func updateSeatedList(seatList: [TUISeatInfo]) {
        guard seatList.count > 0 else { return }
        for seatInfo: TUISeatInfo in seatList {
            guard let userId = seatInfo.userId else { continue }
            guard !videoState.videoSeatItems.contains(where: { $0.userId == userId }) else { continue }
            if let userItem = videoState.offSeatItems.first(where: { $0.userId == userId }) {
                addVideoItem(item: userItem)
            } else {
                var item = UserInfo()
                item.userId = userId
                addVideoItem(item: item)
            }
            removeOffSeatUser(userId: userId)
        }
    }
}

// MARK: private
extension VideoStoreProvider {
    private func switchSpeakerItem(volumeMap: [String : NSNumber]) {
        guard !volumeMap.isEmpty else { return }
        guard isArrivalSwitchUserTime() else { return }
        var currentSpeakerUserId = ""
        
        if let speakerId = volumeMap.first(where: { $0.value.intValue > voiceVolumeMinLimit })?.key {
            currentSpeakerUserId = speakerId
        }
        
        if let currentSpeakerItem = videoState.videoSeatItems.first(where: { $0.userId == currentSpeakerUserId }) {
            updateSpeakerItem(item: currentSpeakerItem)
        }
        
        lastSwitchTime = Int(Date().timeIntervalSince1970)
    }
    
    private func isArrivalSwitchUserTime() -> Bool {
        let currentTime = Int(Date().timeIntervalSince1970)
        return labs(currentTime - lastSwitchTime) > switchIntervalTime
    }
    
    private func updateVideoItem(item: UserInfo) {
        store.dispatch(action: VideoActions.updateVideoItem(payload: item))
    }
    
    private func addVideoItem(item: UserInfo) {
        guard !videoState.videoSeatItems.contains(where: { $0.userId == item.userId }) else { return }
        store.dispatch(action: VideoActions.addVideoItem(payload: item))
    }
    
    private func addOffSeatUser(user: UserInfo) {
        guard !videoState.offSeatItems.contains(where: { $0.userId == user.userId }) else { return }
        store.dispatch(action: VideoActions.addOffSeatUser(payload: user))
    }
    
    private func removeOffSeatUser(userId: String) {
        store.dispatch(action: VideoActions.removeOffSeatUser(payload: userId))
    }
    
    private func removeVideoItem(userId: String) {
        store.dispatch(action: VideoActions.removeVideoItem(payload: userId))
    }
    
    private func updateShareItem(item: UserInfo?) {
        store.dispatch(action: VideoActions.updateShareItem(payload: item))
    }
    
    private func updateSpeakerItem(item: UserInfo?) {
        store.dispatch(action: VideoActions.updateSpeakerItem(payload: item))
        speakerChangedSubject.send(item)
    }
    
    private func initVideoItems(items: [UserEntity]) {
        store.dispatch(action: VideoActions.initVideoItems(payload: items))
    }
    
    private func initOffSeatUsers(users: [UserEntity]) {
        store.dispatch(action: VideoActions.initOffSeatUsers(payload: users))
    }
    
    private func initShareItem(item: UserEntity) {
        store.dispatch(action: VideoActions.initShareItem(payload: item))
    }
    
    private func updateIsSelfScreenSharing(_ isSelfScreenSharing: Bool) {
        store.dispatch(action: VideoActions.updateIsSelfScreenSharing(payload: isSelfScreenSharing))
    }
}


enum VideoActions {
    static let key = "video.action"
    
    static let initVideoItems = ActionTemplate(id: key.appending(".initVideoItems"), payloadType: [UserEntity].self)
    static let initOffSeatUsers = ActionTemplate(id: key.appending(".initOffSeatUsers"), payloadType: [UserEntity].self)
    static let initShareItem = ActionTemplate(id: key.appending(".initShareItem"), payloadType: UserEntity.self)
    
    static let addVideoItem = ActionTemplate(id: key.appending(".addVideoItem"), payloadType: UserInfo.self)
    static let removeVideoItem = ActionTemplate(id: key.appending(".removeVieoItem"), payloadType: String.self)
    
    static let addOffSeatUser = ActionTemplate(id: key.appending(".addOffSeatUser"), payloadType: UserInfo.self)
    static let removeOffSeatUser = ActionTemplate(id: key.appending(".removeOffSeatUser"), payloadType: String.self)
    
    static let updateVideoItem = ActionTemplate(id: key.appending(".updateVideoItem"), payloadType: UserInfo.self)
    static let updateOffseatItem = ActionTemplate(id: key.appending(".updateOffseatItem"), payloadType: UserInfo.self)
    static let updateShareItem = ActionTemplate(id: key.appending(".updateShareItem"), payloadType: UserInfo?.self)
    static let updateSpeakerItem = ActionTemplate(id: key.appending(".updateSpeakerItem"), payloadType: UserInfo?.self)
    static let updateIsSelfScreenSharing = ActionTemplate(id: key.appending(".updateIsSelfScreenSharing"), payloadType: Bool.self)
}

let VideoStateUpdater = Reducer<VideoSeatState> (
    ReduceOn(VideoActions.initVideoItems, reduce: { state, action in
        let userItems = action.payload.map { UserInfo(userEntity: $0) }
        state.videoSeatItems = userItems
    }),
    ReduceOn(VideoActions.initOffSeatUsers, reduce: { state, action in
        let userItems = action.payload.map { UserInfo(userEntity: $0) }
        state.offSeatItems = userItems
    }),
    ReduceOn(VideoActions.initShareItem, reduce: { state, action in
        let userInfo =  UserInfo(userEntity: action.payload)
        state.shareItem = userInfo
    }),
    ReduceOn(VideoActions.addVideoItem, reduce: { state, action in
        state.videoSeatItems.append(action.payload)
    }),
    ReduceOn(VideoActions.removeVideoItem, reduce: { state, action in
        var items = state.videoSeatItems
        items.removeAll(where: { $0.userId == action.payload })
        state.videoSeatItems = items
    }),
    ReduceOn(VideoActions.addOffSeatUser, reduce: { state, action in
        state.offSeatItems.append(action.payload)
    }),
    ReduceOn(VideoActions.removeOffSeatUser, reduce: { state, action in
        var items = state.offSeatItems
        items.removeAll(where: { $0.userId == action.payload })
        state.offSeatItems = items
    }),
    ReduceOn(VideoActions.updateVideoItem, reduce: { state, action in
        let item = action.payload
        if let index = state.videoSeatItems.firstIndex(where: { $0.userId == item.userId }) {
            state.videoSeatItems[index] = item
        }
    }),
    ReduceOn(VideoActions.updateOffseatItem, reduce: { state, action in
        let item = action.payload
        if let index = state.offSeatItems.firstIndex(where: { $0.userId == item.userId }) {
            state.offSeatItems[index] = item
        }
    }),
    ReduceOn(VideoActions.updateShareItem, reduce: { state, action in
        state.shareItem = action.payload
    }),
    ReduceOn(VideoActions.updateSpeakerItem, reduce: { state, action in
        state.speakerItem = action.payload
    }),
    ReduceOn(VideoActions.updateIsSelfScreenSharing, reduce: { state, action in
        state.isSelfScreenSharing = action.payload
    })
)
