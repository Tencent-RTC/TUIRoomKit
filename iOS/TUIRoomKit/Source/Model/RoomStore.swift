//
//  RoomStore.swift
//  TUIRoomKit
//
//  Created by aby on 2022/12/28.
//  Copyright © 2022 Tencent. All rights reserved.
//

import Foundation
import TUICore
import RTCRoomEngine

let roomHashNumber: Int = 0x3B9AC9FF

class RoomStore: NSObject {
    var currentUser: UserEntity = UserEntity()
    var roomInfo: TUIRoomInfo = TUIRoomInfo()
    var videoSetting: VideoModel = VideoModel()
    var audioSetting: AudioModel = AudioModel()
    var attendeeList: [UserEntity] = []        // User list
    var seatList: [UserEntity] = []            // List of users who have taken the stage
    var inviteSeatList: [RequestEntity] = []   // List of users who apply to be on stage
    var isEnteredRoom: Bool = false
    var timeStampOnEnterRoom: Int = 0          // Timestamp of entering the meeting
    var isImAccess: Bool = false               // Whether TUIRoomKit is entered by IM
    var selfTakeSeatRequestId: String?         // Self ID for applying on stage
    private let openCameraKey = "isOpenCamera"
    private let openMicrophoneKey = "isOpenMicrophone"
    private let shownRaiseHandNoticeKey = "isShownRaiseHandNotice"
    weak var conferenceObserver: ConferenceObserver?
    
    var isOpenMicrophone: Bool {
        didSet {
            UserDefaults.standard.set(isOpenMicrophone, forKey: openMicrophoneKey)
            UserDefaults.standard.synchronize()
        }
    }
    var isOpenCamera: Bool {
        didSet {
            UserDefaults.standard.set(isOpenCamera, forKey: openCameraKey)
            UserDefaults.standard.synchronize()
        }
    }
    var isShownRaiseHandNotice: Bool {
        didSet {
            UserDefaults.standard.set(isShownRaiseHandNotice, forKey: shownRaiseHandNoticeKey)
            UserDefaults.standard.synchronize()
        }
    }
    
    override init() {
        if let isOpenMicrophoneValue = UserDefaults.standard.object(forKey: openMicrophoneKey) as? Bool {
            isOpenMicrophone = isOpenMicrophoneValue
        } else {
            isOpenMicrophone = true
        }
        if let isOpenCameraValue = UserDefaults.standard.object(forKey: openCameraKey) as? Bool {
            isOpenCamera = isOpenCameraValue
        } else {
            isOpenCamera = true
        }
        if let isShownRaiseHandNoticeValue = UserDefaults.standard.object(forKey: shownRaiseHandNoticeKey) as? Bool {
            isShownRaiseHandNotice = isShownRaiseHandNoticeValue
        } else {
            isShownRaiseHandNotice = true
        }
    }
    
    func initalEnterRoomMessage() {
        isEnteredRoom = true
        timeStampOnEnterRoom = Int(Date().timeIntervalSince1970)
    }
    
    func initialRoomCurrentUser() {
        currentUser.userId = TUILogin.getUserID() ?? ""
        currentUser.userName = TUILogin.getNickName() ?? ""
        EngineManager.createInstance().getUserInfo(currentUser.userId) { [weak self] userInfo in
            guard let self = self else { return }
            guard let userInfo = userInfo else { return }
            self.currentUser.update(userInfo: userInfo)
        } onError: { code, message in
            debugPrint("getUserInfo,code:\(code),message:\(message)")
        }
    }
    
    func initialSeatList(seatList: [TUISeatInfo]) {
        var localSeatList = [UserEntity]()
        for seatInfo in seatList {
            guard let userId = seatInfo.userId, userId != "" else { continue }
            guard let userModel = getUserItem(userId) else { continue }
            userModel.isOnSeat = true
            localSeatList.append(userModel)
        }
        self.seatList = localSeatList
        if getSeatItem(currentUser.userId) != nil {
            updateSelfOnSeatState(isOnSeat: true)
        }
        EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_RenewSeatList, param: [:])
        EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_RenewVideoSeatView, param: [:])
    }
    
    func updateSelfOnSeatState(isOnSeat: Bool) {
        currentUser.isOnSeat = isOnSeat
        EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_UserOnSeatChanged, param: ["isOnSeat": isOnSeat])
    }
    
    func updateUserDisableSendingMessage(userId: String, isDisable: Bool) {
        if userId == currentUser.userId {
            currentUser.disableSendingMessage = isDisable
        }
        guard let userItem = getUserItem(userId) else { return }
        userItem.disableSendingMessage = isDisable
    }
    
    func deleteTakeSeatRequest(requestId: String) {
        inviteSeatList = inviteSeatList.filter { requestItem in
            requestItem.requestId != requestId
        }
        EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_RenewSeatList, param: [:])
    }
    
    func deleteInviteSeatUser(_ userId: String) {
        inviteSeatList = inviteSeatList.filter { requestItem in
            requestItem.userId != userId
        }
        EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_RenewSeatList, param: [:])
    }
    
    func addInviteSeatUser(request: TUIRequest) {
        guard !inviteSeatList.contains(where: { $0.userId == request.userId }) else { return }
        let requestEntity = RequestEntity(requestId: request.requestId, userId: request.userId)
        inviteSeatList.append(requestEntity)
        EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_RenewSeatList, param: [:])
    }
    
    private func getUserItem(_ userId: String) -> UserEntity? {
        return attendeeList.first(where: {$0.userId == userId})
    }
    
    private func getSeatItem(_ userId: String) -> UserEntity? {
        return seatList.first(where: { $0.userId == userId })
    }
    
    func setCameraOpened(_ isCameraOpened: Bool) {
        videoSetting.isCameraOpened = isCameraOpened
    }
    
    func setSoundOnSpeaker(_ isSoundOnSpeaker: Bool) {
        audioSetting.isSoundOnSpeaker = isSoundOnSpeaker
    }
    
    func setConferenceObserver(_ observer: ConferenceObserver?) {
        conferenceObserver = observer
    }
    
    func setInviteSeatList(list: [TUIRequest]) {
        inviteSeatList = []
        for request in list {
            let requestEntity = RequestEntity(requestId: request.requestId, userId: request.userId)
            inviteSeatList.append(requestEntity)
        }
        EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_RenewSeatList, param: [:])
    }
    
    deinit {
        debugPrint("self:\(self),deinit")
    }
}
