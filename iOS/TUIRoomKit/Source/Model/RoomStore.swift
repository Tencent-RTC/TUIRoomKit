//
//  RoomStore.swift
//  TUIRoomKit
//
//  Created by aby on 2022/12/28.
//  Copyright © 2022 Tencent. All rights reserved.
//

import Foundation
import TUICore
import TUIRoomEngine

class RoomStore: NSObject {
    var currentLoginUser: UserModel = UserModel()
    var currentUser: UserModel = UserModel()
    private(set) var roomInfo: RoomInfo = RoomInfo()
    var videoSetting: VideoModel = VideoModel()
    var audioSetting: AudioModel = AudioModel()
    var roomScene: RoomScene = .meeting
    var attendeeList: [UserModel] = []//用户列表
    var attendeeMap: [String: UserModel] = [:]
    var inviteSeatList: [UserModel] = []//申请上麦的用户列表（针对举手发言房间）
    var inviteSeatMap: [String:Int] = [:]
    
    func update(roomInfo: RoomInfo) {
        self.roomInfo = roomInfo
    }
    
    func initialLoginCurrentUser() {
        let userInfo = TUIRoomEngine.getSelfInfo()
        currentLoginUser.update(userInfo: userInfo)
    }
    
    func initialRoomCurrentUser() {
        let userInfo = TUIRoomEngine.getSelfInfo()
        currentUser.update(userInfo: userInfo)
    }
    
    func refreshStore() {
        videoSetting = VideoModel()
        audioSetting = AudioModel()
        roomScene = .meeting
        attendeeList = []
        attendeeMap = [:]
        inviteSeatList = []
        inviteSeatMap = [:]
        currentUser = UserModel()
    }
    
    func addEngineObserver() {
        EngineEventCenter.shared.subscribeEngine(event: .onRemoteUserEnterRoom, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onRemoteUserLeaveRoom, observer: self)
        EngineEventCenter.shared.subscribeEngine(event: .onSeatListChanged, observer: self)
    }
    
    func removeEngineObserver() {
        EngineEventCenter.shared.unsubscribeEngine(event: .onRemoteUserEnterRoom, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onRemoteUserLeaveRoom, observer: self)
        EngineEventCenter.shared.unsubscribeEngine(event: .onSeatListChanged, observer: self)
    }
}

extension RoomStore: RoomEngineEventResponder {
    func onEngineEvent(name: EngineEventCenter.RoomEngineEvent, param: [String : Any]?) {
        if name == .onRemoteUserEnterRoom {
            guard let roomId = param?["roomId"] as? String else { return }
            guard let userInfo = param?["userInfo"] as? TUIUserInfo else { return }
            if roomId == EngineManager.shared.store.roomInfo.roomId {
                let userModel = UserModel()
                userModel.update(userInfo: userInfo)
                addUserList(userModel: userModel)
            }
        }
        if name == .onRemoteUserLeaveRoom {
            guard let roomId = param?["roomId"] as? String else { return }
            guard let userInfo = param?["userInfo"] as? TUIUserInfo else { return }
            if roomId == EngineManager.shared.store.roomInfo.roomId {
                removeUserList(userId: userInfo.userId)
                removeSeatList(userId: userInfo.userId)
            }
        }
        if name == .onSeatListChanged {
            guard let left: [TUISeatInfo] = param?["left"] as? [TUISeatInfo] else { return }
            guard let seatList: [TUISeatInfo] = param?["seatList"] as? [TUISeatInfo] else { return }
            guard let seated: [TUISeatInfo] = param?["seated"] as? [TUISeatInfo] else { return }
            if left.count > 0 {
                for seatInfo: TUISeatInfo in left {
                    guard let userId = seatInfo.userId else {
                        continue
                    }
                    if EngineManager.shared.store.roomInfo.enableSeatControl {
                        guard let userInfo = attendeeList.first(where: { $0.userId == userId }) else { return }
                        userInfo.isOnSeat = false
                        if EngineManager.shared.store.currentUser.userId == userId {
                            EngineManager.shared.store.currentUser.isOnSeat = false
                            EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_UserDownSeat,
                                                                   param: [:])
                        }
                        removeSeatList(userId: userId)
                    } else {
                        removeUserList(userId: userId)
                    }
                }
            }
            if attendeeList.count <= 1 {
                if EngineManager.shared.store.roomInfo.enableSeatControl {
                    for seatInfo: TUISeatInfo in seatList {
                        guard let userId = seatInfo.userId else { continue }
                        guard let userInfo = attendeeList.first(where: { $0.userId == userId }) else { continue }
                        userInfo.isOnSeat = true
                        if EngineManager.shared.store.currentUser.userId == userId {
                            EngineManager.shared.store.currentUser.isOnSeat = true
                            EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_UserOnSeat,
                                                                   param: [:])
                        }
                        removeSeatList(userId: userId)
                    }
                }
            } else {
                if EngineManager.shared.store.roomInfo.enableSeatControl {
                    for seatInfo: TUISeatInfo in seated {
                        guard let userId = seatInfo.userId else { continue }
                        guard let userInfo = attendeeList.first(where: { $0.userId == userId }) else { continue }
                        userInfo.isOnSeat = true
                        if EngineManager.shared.store.currentUser.userId == userId {
                            EngineManager.shared.store.currentUser.isOnSeat = true
                            EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_UserOnSeat,
                                                                   param: [:])
                        }
                        removeSeatList(userId: userId)
                    }
                }
            }
            EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_RenewUserList, param: [:])
        }
    }
    
    private func removeUserList(userId: String, type: TUIVideoStreamType = .cameraStream) {
        if type == .cameraStream {
            attendeeList = attendeeList.filter { model -> Bool in
                model.userId != userId
            }
            attendeeMap.removeValue(forKey: userId)
            EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_RenewUserList, param: [:])
        }
    }
    
    private func removeSeatList(userId: String) {
        inviteSeatList = inviteSeatList.filter { model -> Bool in
            model.userId != userId
        }
        inviteSeatMap.removeValue(forKey: userId)
        EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_RenewSeatList, param: [:])
    }
    
    private func addUserList(userModel: UserModel) {
        if attendeeMap[userModel.userId] != nil {
            return
        }
        attendeeMap[userModel.userId] = userModel
        attendeeList.append(userModel)
        if userModel.userName.isEmpty {
            userModel.userName = userModel.userId
        }
        EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_RenewUserList, param: [:])
    }
}

public class RoomInfo {
    public var roomId: String {
        set {
            roomInfo.roomId = newValue
        }
        get {
            return roomInfo.roomId
        }
    }
    
    public var name: String {
        set {
            roomInfo.name = newValue
        }
        get {
            return roomInfo.name
        }
    }
    
    public var isOpenMicrophone: Bool
    public var isOpenCamera: Bool
    public var isUseSpeaker: Bool
    
    public var enableSeatControl: Bool {
        set {
            roomInfo.enableSeatControl = newValue
        }
        get {
            return roomInfo.enableSeatControl
        }
    }
    
    public var enableVideo: Bool {
        set {
            roomInfo.enableVideo = newValue
        }
        get {
            return roomInfo.enableVideo
        }
    }
    
    public var enableAudio: Bool {
        set {
            roomInfo.enableAudio = newValue
        }
        get {
            return roomInfo.enableAudio
        }
    }
    
    public var enableMessage: Bool {
        set {
            roomInfo.enableMessage = newValue
        }
        get {
            return roomInfo.enableMessage
        }
    }
    
    var roomType: TUIRoomType {
        set {
            roomInfo.roomType = newValue
        }
        get {
            return roomInfo.roomType
        }
    }
    
    public var owner: String = ""
    
    private var roomInfo: TUIRoomInfo
    public init() {
        isOpenMicrophone = true
        isOpenCamera = true
        isUseSpeaker = false
        roomInfo = TUIRoomInfo()
    }
    
    convenience init(roomInfo: TUIRoomInfo) {
        self.init()
        self.roomInfo = roomInfo
        self.owner = roomInfo.owner
    }
    
    public func update(engineRoomInfo: TUIRoomInfo) {
        roomInfo = engineRoomInfo
        owner = engineRoomInfo.owner
    }
    
    public func getEngineRoomInfo() -> TUIRoomInfo {
        return roomInfo
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}
