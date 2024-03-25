//
//  ConferenceSession.swift
//  TUIRoomKit
//
//  Created by 唐佳宁 on 2024/3/6.
//

import TUIRoomEngine

class ConferenceSession {
    let conferenceId: String
    var conferenceParams: ConferenceParams = ConferenceParams()
    
    init(conferenceId: String) {
        self.conferenceId = conferenceId
    }
    
    func quickStart(onSuccess: @escaping TUISuccessBlock, onError: @escaping TUIErrorBlock) {
        let roomInfo = createRoomInfo(conferenceParams: conferenceParams)
        quickStartConference(roomInfo: roomInfo, enableAudio: !conferenceParams.isMuteMicrophone, enableVideo:
                                conferenceParams.isOpenCamera, isSoundOnSpeaker: conferenceParams.isSoundOnSpeaker, onSuccess: onSuccess, onError: onError)
    }
    
    private func quickStartConference(roomInfo: TUIRoomInfo, enableAudio: Bool, enableVideo: Bool, isSoundOnSpeaker: Bool, onSuccess: @escaping TUISuccessBlock, onError: @escaping TUIErrorBlock) {
        EngineManager.createInstance().createRoom(roomInfo: roomInfo) {
            EngineManager.createInstance().enterRoom(roomId: roomInfo.roomId, enableAudio: enableAudio, enableVideo: enableVideo,
                                                     isSoundOnSpeaker: isSoundOnSpeaker) {
                onSuccess()
            } onError: { code, message in
                onError(code, message)
            }
        } onError: { code, message in
            onError(code, message)
        }
        
    }
    
    func join(onSuccess: @escaping TUISuccessBlock, onError: @escaping TUIErrorBlock) {
        EngineManager.createInstance().enterRoom(roomId: conferenceId, enableAudio: !conferenceParams.isMuteMicrophone, enableVideo: conferenceParams.isOpenCamera, isSoundOnSpeaker: conferenceParams.isSoundOnSpeaker) {
            onSuccess()
        } onError: { code, message in
            onError(code, message)
        }
    }
    
    private func createRoomInfo(conferenceParams: ConferenceParams) -> TUIRoomInfo {
        let roomInfo = TUIRoomInfo()
        roomInfo.roomId = conferenceId
        roomInfo.isMicrophoneDisableForAllUser = !conferenceParams.enableMicrophoneForAllUser
        roomInfo.isCameraDisableForAllUser = !conferenceParams.enableCameraForAllUser
        roomInfo.isMessageDisableForAllUser = !conferenceParams.enableMessageForAllUser
        roomInfo.isSeatEnabled = conferenceParams.enableSeatControl
        roomInfo.name = conferenceParams.name ?? conferenceId
        roomInfo.seatMode = .applyToTake
        return roomInfo
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}
