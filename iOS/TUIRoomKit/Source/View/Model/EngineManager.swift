//
//  EngineManager.swift
//  TUIRoomKit
//
//  Created by WesleyLei on 2022/9/22.
//  Copyright © 2022 Tencent. All rights reserved.
//

import Foundation
import TUICore
import Factory
import RTCRoomEngine
#if canImport(TXLiteAVSDK_TRTC)
    import TXLiteAVSDK_TRTC
#elseif canImport(TXLiteAVSDK_Professional)
    import TXLiteAVSDK_Professional
#endif

class EngineManager: NSObject {
    static private(set) var shared = EngineManager()
    @WeakLazyInjected(\.conferenceStore) private var operation

    private(set) lazy var store: RoomStore = {
        let store = RoomStore()
        return store
    }()
    
    private(set) var roomEngine = TUIRoomEngine.sharedInstance()
    
    private lazy var eventDispatcher: RoomEventDispatcher = {
        let eventDispatcher = RoomEventDispatcher()
        return eventDispatcher
    }()
    private lazy var observer: TRTCObserver = {
        let observer = TRTCObserver()
        return observer
    }()
    private lazy var conferenceListObserver: ConferenceListObserver = {
        return ConferenceListObserver()
    }()
    private lazy var conferenceListManager: TUIConferenceListManager? = {
        guard let listManager = roomEngine.getExtension(extensionType: .conferenceListManager) as? TUIConferenceListManager else { return nil }
        return listManager
    }()
    private lazy var trtcCloudShared: TRTCCloud = {
        TRTCCloud.sharedInstance()
    }()
    private let takeSeatTimeOutNumber: Double = 60
    private let openRemoteDeviceTimeOutNumber: Double = 15
    private let rootRouter: RoomRouter = RoomRouter.shared
    private var isLoginEngine: Bool = false
    private let appGroupString: String = ConferenceSession.sharedInstance.implementation.appGroup
    private let volumeCallbackInterval: UInt = 300
    
    override private init() {
        super.init()
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
    
    func setSelfInfo(userName: String, avatarURL: String, onSuccess: @escaping TUISuccessBlock, onError: @escaping TUIErrorBlock) {
        store.currentUser.userName = userName
        store.currentUser.avatarUrl = avatarURL
        TUIRoomEngine.setSelfInfo(userName: userName, avatarUrl: avatarURL) {
            onSuccess()
        } onError: { code, message in
            onError(code, message)
            debugPrint("---setSelfInfo,code:\(code),message:\(message)")
        }
    }
    
    func getSelfInfo() -> TUILoginUserInfo {
        return TUIRoomEngine.getSelfInfo()
    }
    
    func createRoom(roomInfo: TUIRoomInfo, onSuccess: @escaping TUISuccessBlock, onError: @escaping TUIErrorBlock) {
        roomInfo.name = transferConferenceName(conferenceName: roomInfo.name)
        if !isLoginEngine {
            self.login(sdkAppId: Int(TUILogin.getSdkAppID()), userId: TUILogin.getUserID() ?? "", userSig: TUILogin.getUserSig() ?? "")
            { [weak self] in
                guard let self = self else { return }
                self.isLoginEngine = true
                self.createEngineRoom(roomInfo: roomInfo, onSuccess: onSuccess, onError: onError)
            } onError: { code, message in
                onError(code, message)
            }
        } else {
            createEngineRoom(roomInfo: roomInfo, onSuccess: onSuccess, onError: onError)
        }
    }
    
    func enterRoom(roomId: String, options: TUIEnterRoomOptions? = nil, enableAudio: Bool, enableVideo: Bool, isSoundOnSpeaker: Bool,
                   onSuccess: @escaping TUIRoomInfoBlock, onError: @escaping TUIErrorBlock) {
        store.videoSetting.isCameraOpened = enableVideo
        store.audioSetting.isSoundOnSpeaker = isSoundOnSpeaker
        setFramework()
        if !isLoginEngine {
            self.login(sdkAppId: Int(TUILogin.getSdkAppID()), userId: TUILogin.getUserID() ?? "", userSig: TUILogin.getUserSig() ?? "")
            { [weak self] in
                guard let self = self else { return }
                self.isLoginEngine = true
                self.enterEngineRoom(roomId: roomId, options: options, enableAudio: enableAudio, onSuccess: onSuccess, onError: onError)
            } onError: { code, message in
                onError(code, message)
            }
        } else {
            enterEngineRoom(roomId: roomId, options: options, enableAudio: enableAudio, onSuccess: onSuccess, onError: onError)
        }
    }
    
    func exitRoom(syncWaiting: Bool = true, onSuccess: TUISuccessBlock? = nil, onError: TUIErrorBlock? = nil) {
        roomEngine.exitRoom(syncWaiting: syncWaiting) { [weak self] in
            guard let self = self else { return }
            self.operation?.dispatch(action: RoomResponseActions.onExitSuccess())
            onSuccess?()
        } onError: { code, message in
            onError?(code, message)
        }
        handleExitRoomResult()
    }
    
    func destroyRoom(onSuccess: TUISuccessBlock? = nil, onError: TUIErrorBlock? = nil) {
        roomEngine.destroyRoom { [weak self] in
            guard let self = self else { return }
            self.handleDestroyRoomResult()
            onSuccess?()
        } onError: { [weak self] code, message in
            guard let self = self else { return }
            self.handleDestroyRoomResult()
            onError?(code, message)
        }
    }
    
    func destroyEngineManager() {
        removeEngineObserver()
        unsubLogoutNotification()
        isLoginEngine = false
        store.reset()
    }
    
    func muteLocalAudio() {
        roomEngine.muteLocalAudio()
    }
    
    func unmuteLocalAudio(onSuccess:TUISuccessBlock? = nil, onError: TUIErrorBlock? = nil) {
        roomEngine.unmuteLocalAudio {
            onSuccess?()
        } onError: { code, message in
            onError?(code, message)
        }
    }
    
    func openLocalMicrophone(onSuccess: TUISuccessBlock? = nil, onError: TUIErrorBlock? = nil) {
        let actionBlock = { [weak self] in
            guard let self = self else { return }
            self.roomEngine.openLocalMicrophone(self.store.audioSetting.audioQuality) { [weak self] in
                guard let self = self else { return }
                self.store.audioSetting.isMicOpened = true
                onSuccess?()
            } onError: { code, message in
                onError?(code, message)
            }
        }
        if RoomCommon.checkAuthorMicStatusIsDenied() {
            actionBlock()
        } else {
            RoomCommon.micStateActionWithPopCompletion { granted in
                if granted {
                    actionBlock()
                }
            }
        }
    }
    
    func closeLocalCamera() {
        store.videoSetting.isCameraOpened = false
        roomEngine.closeLocalCamera()
    }
    
    func openLocalCamera(onSuccess: TUISuccessBlock? = nil, onError: TUIErrorBlock? = nil) {
        let actionBlock = { [weak self] in
            guard let self = self else { return }
            self.store.videoSetting.isCameraOpened = true
            self.roomEngine.openLocalCamera(isFront: self.store.videoSetting.isFrontCamera, quality:
                                                self.store.videoSetting.videoQuality) {
                onSuccess?()
            } onError: { code, message in
                onError?(code, message)
            }
        }
        if RoomCommon.checkAuthorCamaraStatusIsDenied() {
            actionBlock()
        } else {
            RoomCommon.cameraStateActionWithPopCompletion { granted in
                if granted {
                    actionBlock()
                }
            }
        }
    }
    
    func switchCamera() {
        store.videoSetting.isFrontCamera = !store.videoSetting.isFrontCamera
        roomEngine.getMediaDeviceManager().switchCamera(store.videoSetting.isFrontCamera)
    }
    
    func muteAllAudioAction(isMute: Bool, onSuccess: @escaping TUISuccessBlock, onError: @escaping TUIErrorBlock) {
        store.roomInfo.isMicrophoneDisableForAllUser = isMute
        roomEngine.disableDeviceForAllUserByAdmin(device: .microphone, isDisable:
                                                    store.roomInfo.isMicrophoneDisableForAllUser) {
            onSuccess()
        } onError: { code, message in
            onError(code, message)
        }
    }
    
    func muteAllVideoAction(isMute: Bool, onSuccess: @escaping TUISuccessBlock, onError: @escaping TUIErrorBlock) {
        store.roomInfo.isCameraDisableForAllUser = isMute
        roomEngine.disableDeviceForAllUserByAdmin(device: .camera, isDisable:
                                                    store.roomInfo.isCameraDisableForAllUser) {
            onSuccess()
        } onError: { code, message in
            onError(code, message)
        }
    }
    
    func muteAllShareScreenAction(isMute: Bool, onSuccess: TUISuccessBlock? = nil, onError: TUIErrorBlock? = nil) {
        roomEngine.disableDeviceForAllUserByAdmin(device: .screenSharing, isDisable: isMute) { [weak self] in
            guard let self = self else { return }
            self.store.roomInfo.isScreenShareDisableForAllUser = isMute
            if var roomState = self.operation?.selectCurrent(RoomSelectors.getRoomState) {
                roomState.isScreenShareDisableForAllUser = isMute
                self.operation?.dispatch(action: RoomActions.updateRoomState(payload: roomState))
            }
            onSuccess?()
        } onError: { code, message in
            onError?(code, message)
        }
    }
    
    func takeUserOnSeatByAdmin(userId: String, timeout: Double,
                               onAccepted: @escaping TUIRequestAcceptedBlock,
                               onRejected: @escaping TUIRequestRejectedBlock,
                               onCancelled: @escaping TUIRequestCancelledBlock,
                               onTimeout: @escaping TUIRequestTimeoutBlock,
                               onError: @escaping TUIRequestErrorBlock) {
        roomEngine.takeUserOnSeatByAdmin(-1, userId: userId, timeout: timeout) { requestId, userId in
            onAccepted(requestId, userId)
        } onRejected: { requestId, userId, message in
            onRejected( requestId, userId, message)
        } onCancelled: { requestId, userId in
            onCancelled(requestId, userId)
        } onTimeout: { requestId, userId in
            onTimeout(requestId, userId)
        } onError: { requestId, userId, code, message in
            onError(requestId, userId, code, message)
        }
    }
    
    func setAudioRoute(isSoundOnSpeaker: Bool) {
        store.audioSetting.isSoundOnSpeaker = isSoundOnSpeaker
        let route: TUIAudioRoute = isSoundOnSpeaker ? .speakerphone : .earpiece
        roomEngine.getMediaDeviceManager().setAudioRoute(route)
    }
    
    func takeSeat(onAccepted: TUIRequestAcceptedBlock? = nil,
                  onRejected: TUIRequestRejectedBlock? = nil,
                  onCancelled: TUIRequestCancelledBlock? = nil,
                  onTimeout: TUIRequestTimeoutBlock? = nil,
                  onError: TUIRequestErrorBlock? = nil) -> TUIRequest {
        let request = self.roomEngine.takeSeat(-1, timeout: takeSeatTimeOutNumber) { [weak self] requestId, userId in
            guard let self = self else { return }
            self.store.currentUser.isOnSeat = true
            self.store.selfTakeSeatRequestId = nil
            onAccepted?(requestId, userId)
        } onRejected: { [weak self] requestId, userId, message in
            guard let self = self else { return }
            self.store.selfTakeSeatRequestId = nil
            onRejected?(requestId, userId, message)
        } onCancelled: { [weak self] requestId, userId in
            guard let self = self else { return }
            self.store.selfTakeSeatRequestId = nil
            onCancelled?(requestId, userId)
        } onTimeout: { [weak self] requestId, userId in
            guard let self = self else { return }
            self.store.selfTakeSeatRequestId = nil
            onTimeout?(requestId, userId)
        } onError: { [weak self] requestId, userId, code, message in
            guard let self = self else { return }
            self.store.selfTakeSeatRequestId = nil
            onError?(requestId, userId, code, message)
        }
        store.selfTakeSeatRequestId = request.requestId
        return request
    }
    
    func cancelTakeSeatRequest() {
        guard let requestId = store.selfTakeSeatRequestId else { return }
        cancelRequest(requestId)
        store.selfTakeSeatRequestId = nil
    }
    
    func fetchRoomInfo(roomId: String ,onSuccess: TUIRoomInfoBlock? = nil, onError: TUIErrorBlock? = nil) {
        roomEngine.fetchRoomInfo(roomId: roomId, roomType: .conference) { [weak self] roomInfo in
            guard let self = self, let roomInfo = roomInfo else { return }
            if roomId == self.store.roomInfo.roomId {
                self.store.initialRoomInfo(roomInfo)
            }
            onSuccess?(roomInfo)
        } onError: { code, message in
            onError?(code, message)
            debugPrint("fetchRoomInfo,code:\(code), message:\(message)")
        }
    }
    
    func setLocalVideoView(_ view: UIView?) {
        roomEngine.setLocalVideoView(view: view)
    }
    
    func changeUserRole(userId: String, role: TUIRole, onSuccess: @escaping TUISuccessBlock, onError: @escaping TUIErrorBlock) {
        roomEngine.changeUserRole(userId: userId, role: role, onSuccess: onSuccess, onError: onError)
    }
    
    func responseRemoteRequest(_ requestId: String, agree: Bool, onSuccess: TUISuccessBlock? = nil, onError: TUIErrorBlock? = nil) {
        roomEngine.responseRemoteRequest(requestId, agree: agree) {
            onSuccess?()
        } onError: { code, message in
            onError?(code, message)
        }
    }
    
    func getUserInfo(_ userId: String, onSuccess: @escaping TUIUserInfoBlock, onError: @escaping TUIErrorBlock) {
        roomEngine.getUserInfo(userId, onSuccess: onSuccess, onError: onError)
    }
    
    func stopScreenCapture() {
        roomEngine.stopScreenCapture()
    }
    
    func setVideoEncoder(videoQuality: TUIVideoQuality? = nil, bitrate: Int? = nil, fps: Int? = nil) {
        let param = TUIRoomVideoEncoderParams()
        store.videoSetting.videoQuality = videoQuality ?? store.videoSetting.videoQuality
        param.videoResolution = store.videoSetting.videoQuality
        store.videoSetting.videoBitrate = bitrate ?? store.videoSetting.videoBitrate
        param.bitrate = store.videoSetting.videoBitrate
        store.videoSetting.videoFps = fps ?? store.videoSetting.videoFps
        param.fps = store.videoSetting.videoFps
        roomEngine.updateVideoQualityEx(streamType: .cameraStream, params: param)
    }
    
    func cancelRequest(_ requestId: String, onSuccess: TUISuccessBlock? = nil, onError: TUIErrorBlock? = nil) {
        roomEngine.cancelRequest(requestId) {
            onSuccess?()
        } onError: { code, message in
            onError?(code, message)
        }
    }
    
    func leaveSeat(onSuccess: TUISuccessBlock? = nil, onError: TUIErrorBlock? = nil) {
        roomEngine.leaveSeat {
            onSuccess?()
        } onError: { code, message in
            onError?(code, message)
        }
    }
    
    func startScreenCapture() {
        roomEngine.startScreenCapture(appGroup: appGroupString)
    }
    
    func stopPlayRemoteVideo(userId: String, streamType: TUIVideoStreamType) {
        roomEngine.stopPlayRemoteVideo(userId: userId, streamType: streamType)
    }
    
    func setRemoteVideoView(userId: String, streamType: TUIVideoStreamType, view: UIView?) {
        roomEngine.setRemoteVideoView(userId: userId, streamType: streamType, view: view)
    }
    
    func startPlayRemoteVideo(userId: String, streamType: TUIVideoStreamType, onSuccess: TUISuccessBlock? = nil,
                              onLoading: TUIPlayOnLoadingBlock? = nil, onError: TUIPlayOnErrorBlock? = nil) {
        roomEngine.startPlayRemoteVideo(userId: userId, streamType: streamType, onPlaying: { _ in
            guard let onSuccess = onSuccess else { return }
            onSuccess()
        }, onLoading: { userId in
            guard let onLoading = onLoading else { return }
            onLoading(userId)
        }, onError: { userId, code, message in
            guard let onError = onError else { return }
            onError(userId, code, message)
        })
    }
    
    func setAudioCaptureVolume(_ captureVolume: Int) {
        store.audioSetting.captureVolume = captureVolume
        trtcCloudShared.setAudioCaptureVolume(captureVolume)
    }
    
    func setAudioPlayoutVolume(_ playVolume: Int) {
        store.audioSetting.playVolume = playVolume
        trtcCloudShared.setAudioPlayoutVolume(playVolume)
    }
    
    func enableAudioVolumeEvaluation(isVolumePrompt: Bool) {
        store.audioSetting.volumePrompt = isVolumePrompt
        let volumeEvaluateParams = TRTCAudioVolumeEvaluateParams()
        volumeEvaluateParams.interval = isVolumePrompt ? volumeCallbackInterval : 0
        trtcCloudShared.enableAudioVolumeEvaluation(isVolumePrompt, with: volumeEvaluateParams)
    }
    
    func closeRemoteDeviceByAdmin(userId: String, device: TUIMediaDevice, onSuccess: TUISuccessBlock? = nil, onError: TUIErrorBlock? = nil) {
        roomEngine.closeRemoteDeviceByAdmin(userId: userId, device: device) {
            onSuccess?()
        } onError: { code, message in
            onError?(code, message)
        }
    }
    
    func openRemoteDeviceByAdmin(userId: String, device: TUIMediaDevice,
                                 onAccepted: TUIRequestAcceptedBlock? = nil,
                                 onRejected: TUIRequestRejectedBlock? = nil,
                                 onCancelled: TUIRequestCancelledBlock? = nil,
                                 onTimeout: TUIRequestTimeoutBlock? = nil,
                                 onError: TUIRequestErrorBlock? = nil) {
        roomEngine.openRemoteDeviceByAdmin(userId: userId, device: device, timeout: openRemoteDeviceTimeOutNumber, onAccepted: { requestId, userId in
            onAccepted?(requestId, userId)
        }, onRejected: { requestId, userId, message in
            onRejected?(requestId, userId, message)
        }, onCancelled: { requestId, userId in
            onCancelled?(requestId, userId)
        }, onTimeout: { requestId, userId in
            onTimeout?(requestId, userId)
        }) { requestId, userId, code, message in
            onError?(requestId, userId, code, message)
        }
    }
    
    func disableSendingMessageByAdmin(userId: String, isDisable: Bool, onSuccess: TUISuccessBlock? = nil, onError: TUIErrorBlock? = nil) {
        roomEngine.disableSendingMessageByAdmin(userId: userId, isDisable: isDisable) {
            onSuccess?()
        } onError: { code, message in
            onError?(code, message)
        }
    }
    
    func kickUserOffSeatByAdmin(userId: String, onSuccess: TUISuccessBlock? = nil, onError: TUIErrorBlock? = nil) {
        roomEngine.kickUserOffSeatByAdmin(-1, userId: userId) {
            onSuccess?()
        } onError: { code, message in
            onError?(code, message)
        }
    }
    
    func kickRemoteUserOutOfRoom(userId: String, onSuccess: TUISuccessBlock? = nil, onError: TUIErrorBlock? = nil) {
        roomEngine.kickRemoteUserOutOfRoom(userId) {
            onSuccess?()
        } onError: { code, message in
            onError?(code, message)
        }
    }
    
    func initUserList(onSuccess: TUISuccessBlock? = nil, onError: TUIErrorBlock? = nil) {
        self.getUserList(nextSequence: 0, localUserList: []) { [weak self] in
            guard let self = self else { return }
            if self.store.roomInfo.isSeatEnabled {
                self.getSeatList {
                    onSuccess?()
                } onError: { code, message in
                    onError?(code, message)
                }
            } else {
                onSuccess?()
            }
            self.updateScreenStreamUsers()
            self.updateDisableMessageUsers()
        } onError: { code, message in
            onError?(code, message)
        }
    }
    
    func updateVideoQuality(quality: TUIVideoQuality) {
        roomEngine.updateVideoQuality(quality)
    }
    
    func enableGravitySensor(enable: Bool) {
        roomEngine.enableGravitySensor(enable: enable)
    }
    
    func setVideoResolutionMode(streamType: TUIVideoStreamType, resolutionMode: TUIResolutionMode) {
        roomEngine.setVideoResolutionMode(streamType: streamType, resolutionMode: resolutionMode)
    }
    
    func changeRaiseHandNoticeState(isShown: Bool) {
        store.isShownRaiseHandNotice = isShown
    }
    
    func updateSeatApplicationList() {
        roomEngine.getSeatApplicationList { [weak self] list in
            guard let self = self else { return }
            self.store.setInviteSeatList(list: list)
        } onError: { code, message in
            debugPrint("getSeatApplicationList,code:\(code),message:\(message)")
        }
    }
    
    func changeUserNameCard(userid: String, nameCard: String, onSuccess: TUISuccessBlock? = nil, onError: TUIErrorBlock? = nil) {
        roomEngine.changeUserNameCard(userId: userid, nameCard: nameCard) {
            onSuccess?()
        } onError: { code, message in
            onError?(code, message)
        }
    }
}

// MARK: - Private
extension EngineManager {
    private func login(sdkAppId: Int, userId: String, userSig: String, onSuccess: @escaping TUISuccessBlock, onError: @escaping TUIErrorBlock) {
        V2TIMManager.sharedInstance().initSDK(Int32(sdkAppId), config: V2TIMSDKConfig())
        store.currentUser.userId = userId
        TUIRoomEngine.login(sdkAppId: sdkAppId, userId: userId, userSig: userSig) { [weak self] in
            guard let self = self else { return }
            self.isLoginEngine = true
            onSuccess()
        } onError: { code, message in
            onError(code, message)
        }
    }
    
    private func createEngineRoom(roomInfo: TUIRoomInfo, onSuccess: @escaping TUISuccessBlock, onError: @escaping TUIErrorBlock) {
        guard !store.isEnteredRoom else {
            if store.roomInfo.roomId == roomInfo.roomId {
                RoomVideoFloatView.dismiss()
                onSuccess()
            } else {
                onError(.failed, .inAnotherRoomText)
            }
            return
        }
        self.store.roomInfo = roomInfo
        self.roomEngine.createRoom(roomInfo) {
            onSuccess()
        } onError: { [weak self] code, message in
            guard let self = self else { return }
            self.destroyEngineManager()
            onError(code, message)
        }
    }
    
    private func transferConferenceName(conferenceName: String?) -> String {
        if let confName = conferenceName, !confName.isEmpty {
            return confName
        }
        let selfInfo = TUIRoomEngine.getSelfInfo()
        let name: String = selfInfo.userName.isEmpty ? selfInfo.userId : selfInfo.userName
        return localizedReplace(.quickConferenceText, replace: name)
    }
    
    private func enterEngineRoom(roomId: String, options: TUIEnterRoomOptions? = nil, enableAudio: Bool, onSuccess: @escaping TUIRoomInfoBlock, onError: @escaping TUIErrorBlock) {
        guard !store.isEnteredRoom else {
            if store.roomInfo.roomId == roomId {
                onSuccess(store.roomInfo)
            } else {
                onError(.failed, .inAnotherRoomText)
            }
            return
        }
        if let options = options {
            roomEngine.enterRoom(roomId, roomType: .conference, options: options) { [weak self] roomInfo in
                guard let self = self else { return }
                guard let roomInfo = roomInfo else { return }
                self.handleEnterRoomResult(roomInfo: roomInfo, enableAudio: enableAudio, onSuccess: onSuccess, onError: onError)
            } onError: { [weak self] code, message in
                guard let self = self else { return }
                self.destroyEngineManager()
                onError(code, message)
            }
        } else {
            roomEngine.enterRoom(roomId) { [weak self] roomInfo in
                guard let self = self else { return }
                guard let roomInfo = roomInfo else { return }
                self.handleEnterRoomResult(roomInfo: roomInfo, enableAudio: enableAudio, onSuccess: onSuccess, onError: onError)
            } onError: { [weak self] code, message in
                guard let self = self else { return }
                self.destroyEngineManager()
                onError(code, message)
            }
        }
    }
    
    private func handleEnterRoomResult(roomInfo: TUIRoomInfo, enableAudio: Bool, onSuccess: @escaping TUIRoomInfoBlock, onError: @escaping TUIErrorBlock) {
        //Update the room entry data stored
        addEngineObserver()
        store.initialRoomInfo(roomInfo)
        store.initialRoomCurrentUser()
        //Initialize user list
        initUserList()
        //Initialize video settings
        initLocalVideoState()
        subLogoutNotification()
        updateSeatApplicationList()
        if !isNeededAutoTakeSeat() {
            operateLocalMicrophone(enableAudio: enableAudio)
            updateCameraState()
            store.initalEnterRoomMessage()
            onSuccess(roomInfo)
        } else {
            autoTakeSeatForOwner { [weak self] in
                guard let self = self else { return }
                self.operateLocalMicrophone(enableAudio: enableAudio)
                self.updateCameraState()
                self.store.initalEnterRoomMessage()
                onSuccess(roomInfo)
            } onError: { [weak self] code, message in
                guard let self = self else { return }
                self.destroyEngineManager()
                onError(code, message)
            }
        }
    }
    
    private func updateCameraState() {
        if store.roomInfo.isSeatEnabled && !store.currentUser.isOnSeat {
            store.videoSetting.isCameraOpened = false
            return
        }
        operateLocalCamera()
    }
    
    private func isNeededAutoTakeSeat() -> Bool {
        return store.roomInfo.isSeatEnabled && store.currentUser.userId == store.roomInfo.ownerId
    }
    
    private func autoTakeSeatForOwner(onSuccess: @escaping TUISuccessBlock, onError: @escaping TUIErrorBlock) {
        _ = self.takeSeat() { _,_ in
            onSuccess()
        } onError: { _, _, code, message in
            if code == .alreadyInSeat {
                onSuccess()
            } else {
                onError(code, message)
            }
        }
    }
    
    private func isPushLocalAudioStream(enableAudio: Bool) -> Bool {
        if !enableAudio {
            return false
        }
        if store.roomInfo.isMicrophoneDisableForAllUser, store.currentUser.userId != store.roomInfo.ownerId {
            return false
        }
        if store.roomInfo.isSeatEnabled, store.currentUser.userId != store.roomInfo.ownerId {
            return false
        }
        return true
    }
    
    private func operateLocalMicrophone(enableAudio: Bool ,onSuccess: TUISuccessBlock? = nil, onError: TUIErrorBlock? = nil) {
        if isPushLocalAudioStream(enableAudio: enableAudio) {
            openLocalMicrophone()
        } else if RoomCommon.checkAuthorMicStatusIsDenied() {
            muteLocalAudio()
            openLocalMicrophone()
        }
    }
    
    private func operateLocalCamera() {
        let openLocalCameraActionBlock = { [weak self] in
            guard let self = self else { return }
            setLocalVideoView(nil)
            openLocalCamera()
        }
        if store.videoSetting.isCameraOpened && !store.roomInfo.isCameraDisableForAllUser {
            if RoomCommon.checkAuthorCamaraStatusIsDenied() {
                openLocalCameraActionBlock()
            } else {
                RoomCommon.cameraStateActionWithPopCompletion { granted in
                    if granted {
                        openLocalCameraActionBlock()
                    }
                }
            }
        }
    }
    
    private func initLocalVideoState() {
        setVideoParam()
        enableGravitySensor(enable: true)
        let resolutionMode: TUIResolutionMode = isLandscape ? .landscape : .portrait
        setVideoResolutionMode(streamType: .cameraStream, resolutionMode: resolutionMode)
        setVideoResolutionMode(streamType: .cameraStreamLow, resolutionMode: resolutionMode)
    }
    
    private func setVideoParam() {
        setVideoEncoder(videoQuality: store.videoSetting.videoQuality, bitrate: store.videoSetting.videoBitrate, 
                        fps: store.videoSetting.videoFps)
    }
    
    private func getUserList(nextSequence: Int, localUserList: [UserEntity], onSuccess: @escaping TUISuccessBlock, onError: @escaping TUIErrorBlock) {
        roomEngine.getUserList(nextSequence: nextSequence) { [weak self] list, nextSequence in
            guard let self = self else { return }
            var localUserList = localUserList
            list.forEach { userInfo in
                if userInfo.userName.isEmpty {
                    userInfo.userName = userInfo.userId
                }
                let userModel = UserEntity()
                userModel.update(userInfo: userInfo)
                localUserList.append(userModel)
            }
            if nextSequence != 0 {
                self.getUserList(nextSequence: nextSequence, localUserList: localUserList, onSuccess: onSuccess, onError: onError)
            } else {
                self.store.attendeeList = localUserList
                onSuccess()
                if !self.store.roomInfo.isSeatEnabled {
                    EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_RenewVideoSeatView, param: [:])
                }
                EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_RenewUserList, param: [:])
                EngineEventCenter.shared.notifyEngineEvent(event: .onGetUserListFinished, param: [:])
            }
        } onError: { code, message in
            onError(code, message)
            debugPrint("getUserList:code:\(code),message:\(message)")
        }
    }
    
    private func updateScreenStreamUsers() {
        let hasScreenStreamUsers = store.attendeeList.filter({ $0.hasScreenStream })
        let hasScreenStreamUserIdArray: [String] = hasScreenStreamUsers.map { $0.userId }
        let hasScreenStreamUserIdSet: Set<String> = Set(hasScreenStreamUserIdArray)
        operation?.dispatch(action: UserActions.updateHasScreenStreamUsers(payload: hasScreenStreamUserIdSet))
    }
    
    private func updateDisableMessageUsers() {
        let disableMessageUsers = store.attendeeList.filter({ $0.disableSendingMessage })
        let disableMessageUserIdArray: [String] = disableMessageUsers.map { $0.userId }
        let disableMessageUserIdSet: Set<String> = Set(disableMessageUserIdArray)
        operation?.dispatch(action: UserActions.updateDisableMessageUsers(payload: disableMessageUserIdSet))
    }
    
    private func getSeatList(onSuccess: @escaping TUISuccessBlock, onError: @escaping TUIErrorBlock) {
        roomEngine.getSeatList { [weak self] seatList in
            guard let self = self else { return }
            self.store.initialSeatList(seatList: seatList)
            self.store.initialOffSeatList()
            onSuccess()
        } onError: { code, message in
            onError(code, message)
            debugPrint("getSeatList:code:\(code),message:\(message)")
        }
    }
    
    private func addEngineObserver() {
        roomEngine.addObserver(eventDispatcher)
        trtcCloudShared.addDelegate(observer)
        conferenceListManager?.addObserver(conferenceListObserver)
    }
    
    private func removeEngineObserver() {
        roomEngine.removeObserver(eventDispatcher)
        trtcCloudShared.removeDelegate(observer)
        conferenceListManager?.removeObserver(conferenceListObserver)
    }
    
    private func subLogoutNotification() {
        NotificationCenter.default.addObserver(self, selector: #selector(handleLogout),
                                                       name: NSNotification.Name.TUILogoutSuccess, object: nil)
    }
    
    private func unsubLogoutNotification() {
        NotificationCenter.default.removeObserver(self, name: NSNotification.Name.TUILogoutSuccess, object: nil)
    }
    
    @objc private func handleLogout() {
        destroyEngineManager()
    }
    
    private func handleDestroyRoomResult() {
        let param: [String : Any] = [
            "roomInfo" : store.roomInfo,
            "reason" : ConferenceFinishedReason.finishedByOwner
        ]
        destroyEngineManager()
        EngineEventCenter.shared.notifyEngineEvent(event: .onDestroyedRoom, param: param)
    }
    
    private func handleExitRoomResult() {
        let param: [String : Any] = [
            "roomInfo" : store.roomInfo,
            "reason" : ConferenceExitedReason.exitedBySelf
        ]
        destroyEngineManager()
        EngineEventCenter.shared.notifyEngineEvent(event: .onExitedRoom, param: param)
    }
    
}
// MARK: - TUIExtensionProtocol

extension EngineManager: TUIExtensionProtocol {
    func onGetExtensionInfo(_ key: String, param: [AnyHashable: Any]?) -> [AnyHashable: Any]? {
        guard let param = param else {
            return [:]
        }
        
        guard param["roomId"] as? String != nil else {
            return [:]
        }
        
        if key == gRoomEngineKey {
            return [key: roomEngine]
        } else if key == gRoomInfoKey {
            return [key: store.roomInfo]
        } else if key == gLocalUserInfoKey {
            return [key: store.currentUser]
        } else {
            return [:]
        }
    }
}


// MARK: - setFramework
extension EngineManager {
    fileprivate static let TUIRoomKitFrameworkValue = 1
    fileprivate static let TUIRoomKitComponentValue = 18
    fileprivate static let IMComponentValue = 19
    fileprivate static let TUIRoomKitLanguageValue = 3
    private func setFramework() {
        let componentValue = store.isImAccess ? EngineManager.IMComponentValue : EngineManager.TUIRoomKitComponentValue
        let jsonStr = """
            {
                "api":"setFramework",
                "params":{
                    "framework":\(EngineManager.TUIRoomKitFrameworkValue),
                    "component":\(componentValue),
                    "language":\(EngineManager.TUIRoomKitLanguageValue)
                }
            }
        """
        TUIRoomEngine.callExperimentalAPI(jsonStr: jsonStr)
    }
}

private extension String {
    static var inAnotherRoomText: String {
        localized("You are already in another conference")
    }
    static var quickConferenceText: String {
        localized("xx's quick conference")
    }
}
