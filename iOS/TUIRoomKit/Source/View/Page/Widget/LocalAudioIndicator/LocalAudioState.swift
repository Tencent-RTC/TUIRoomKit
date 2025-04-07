//
//  LocalAudioState.swift
//  Pods
//
//  Created by janejntang on 2024/12/26.
//
import Foundation
import Combine
import RTCRoomEngine
import TUICore

struct LocalAudioState {
    var volume: Int = 0
    var hasAudio: Bool = false
    var isHidden: Bool = false
}

protocol LocalAudioStore {
    var localAudioState: LocalAudioState { get }
    func subscribe<Value>(_ selector: Selector<LocalAudioState, Value>) -> AnyPublisher<Value, Never>
    func muteLocalAudio()
    func unmuteLocalAudio()
}

class LocalAudioProvider: NSObject {
    private var selfUserId = TUILogin.getUserID() ?? ""
    
    private lazy var store: Store<LocalAudioState, ServiceCenter> = {
        let store = Store.init(initialState: LocalAudioState(), environment: ServiceCenter(), reducers: [LocalAudioStateUpdater])
        store.register(effects: localAudioEffects())
        return store
    }()
    private var cancellables = Set<AnyCancellable>()
    
    private(set) var roomEngine = TUIRoomEngine.sharedInstance()
    
    // TODO: remove shared RoomStore
    var roomStore: RoomStore {
        EngineManager.shared.store
    }
    private lazy var  isSeatEnabled = {
        self.roomStore.roomInfo.isSeatEnabled
    }()
    private lazy var isSelfOnSeat = {
        self.roomStore.currentUser.isOnSeat
    }()
    private lazy var selfRole: TUIRole = {
        self.roomStore.currentUser.userRole
    }()
    
    override init() {
        super.init()
        roomEngine.addObserver(self)
        updateHasAudio(roomStore.currentUser.hasAudioStream)
    }
    
    deinit {
        roomEngine.removeObserver(self)
        store.unregisterEffects(withId: localAudioEffects.id)
        store.unregister(reducer: LocalAudioStateUpdater)
    }
    
    func updateVolume(_ volume: Int) {
        store.dispatch(action: LocalAudioActions.updateVolume(payload: volume))
    }
    
    func updateHasAudio(_ hasAudio: Bool) {
        store.dispatch(action: LocalAudioActions.updateHasAudio(payload: hasAudio))
    }
    
    func updateIsHidden(_ enableShow: Bool) {
        store.dispatch(action: LocalAudioActions.updateIsHidden(payload: enableShow))
    }
}

extension LocalAudioProvider: LocalAudioStore {
    var localAudioState: LocalAudioState {
        return store.state
    }
    
    func subscribe<Value>(_ selector: Selector<LocalAudioState, Value>) -> AnyPublisher<Value, Never> {
        return store.select(selector)
    }
    
    func muteLocalAudio() {
        store.dispatch(action: LocalAudioActions.muteLocalAudio())
    }
    
    func unmuteLocalAudio() {
        store.dispatch(action: LocalAudioActions.unmuteLocalAudio(payload: roomStore))
    }
}

enum LocalAudioActions {
    static let key = "local.audio.action"
    
    static let updateVolume = ActionTemplate(id: key.appending(".updateVolume"), payloadType: Int.self)
    static let updateHasAudio = ActionTemplate(id: key.appending(".updateHasAudio"), payloadType: Bool.self)
    static let updateIsHidden = ActionTemplate(id: key.appending(".updateIsHidden"), payloadType: Bool.self)
    static let muteLocalAudio = ActionTemplate(id: key.appending(".muteLocalAudio"))
    static let unmuteLocalAudio = ActionTemplate(id: key.appending(".unmuteLocalAudio"), payloadType: RoomStore.self)
}

let LocalAudioStateUpdater = Reducer<LocalAudioState> (
    ReduceOn(LocalAudioActions.updateVolume, reduce: { state, action in
        state.volume = action.payload
    }),
    ReduceOn(LocalAudioActions.updateHasAudio, reduce: { state, action in
        state.hasAudio = action.payload
    }),
    ReduceOn(LocalAudioActions.updateIsHidden, reduce: { state, action in
        state.isHidden = action.payload
    })
)

extension LocalAudioProvider: TUIRoomObserver {
    func onUserAudioStateChanged(userId: String, hasAudio: Bool, reason: TUIChangeReason) {
        guard userId == selfUserId else { return }
        updateHasAudio(hasAudio)
    }
    
    func onUserVoiceVolumeChanged(volumeMap: [String : NSNumber]) {
        let selfVolume = volumeMap[selfUserId] ?? 0
        updateVolume(Int(truncating: selfVolume))
    }
    
    func onUserInfoChanged(userInfo: TUIUserInfo, modifyFlag: TUIUserInfoModifyFlag) {
        guard modifyFlag.contains(.userRole) else { return }
        guard userInfo.userId == selfUserId else { return }
        self.selfRole = userInfo.userRole
        updateIsHidden(checkIsHidden())
    }
    
    func onSeatListChanged(seatList: [TUISeatInfo], seated seatedList: [TUISeatInfo], left leftList: [TUISeatInfo]) {
        isSelfOnSeat = seatList.contains(where: { $0.userId == selfUserId })
        updateIsHidden(checkIsHidden())
    }
    
    private func checkIsHidden() -> Bool {
        return isSeatEnabled && selfRole == .generalUser && !isSelfOnSeat
    }
}

class localAudioEffects: Effects {
    typealias Environment = ServiceCenter
    
    let muteLocalAudio = Effect<Environment>.nonDispatching { actions, environment in
        actions
            .wasCreated(from: LocalAudioActions.muteLocalAudio)
            .sink { action in
                environment.audioService.muteLocalAudio()
            }
    }
    
    let unmuteLocalAudio = Effect<Environment>.nonDispatching { actions, environment in
        actions
            .wasCreated(from: LocalAudioActions.unmuteLocalAudio)
            .sink { action in
                let roomInfo = action.payload.roomInfo
                let currentUser = action.payload.currentUser
                if roomInfo.isMicrophoneDisableForAllUser && currentUser.userId != roomInfo.ownerId {
                    environment.store?.dispatch(action: ViewActions.showToast(payload: ToastInfo(message: .muteAudioRoomReasonText)))
                    return
                }
                if roomInfo.isSeatEnabled, !currentUser.isOnSeat {
                    environment.store?.dispatch(action: ViewActions.showToast(payload: ToastInfo(message: .muteSeatReasonText)))
                    return
                }
                _ = environment.audioService.unmuteLocalAudio()
                guard !action.payload.audioSetting.isMicOpened else { return }
                _ = environment.audioService.openLocalMicrophone()
            }
    }
}

private extension String {
    static var muteAudioRoomReasonText: String {
        localized("All on mute audio, unable to turn on microphone")
    }
    static var muteSeatReasonText: String {
        localized("Can be turned on after taking the stage")
    }
}


