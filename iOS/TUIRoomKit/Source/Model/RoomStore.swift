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
    var inviteSeatList: [UserModel] = []//申请上麦的用户列表（针对举手发言房间）
    var inviteSeatMap: [String:String] = [:]
    var isSomeoneSharing: Bool = false
    var roomSpeechMode: TUISpeechMode
    var engineManager: EngineManager {
        EngineManager.shared
    }
    override init() {
        roomSpeechMode = roomInfo.speechMode
    }
    func update(roomInfo: RoomInfo) {
        self.roomInfo = roomInfo
    }
    
    func initialLoginCurrentUser() {
        let userInfo = TUIRoomEngine.getSelfInfo()
        currentLoginUser.updateLoginUserInfo(userInfo: userInfo)
    }
    
    func initialRoomCurrentUser() {
        currentUser.userId = currentLoginUser.userId
        engineManager.roomEngine.getUserInfo(currentLoginUser.userId) { [weak self] userInfo in
            guard let self = self else { return }
            guard let userInfo = userInfo else { return }
            self.currentUser.update(userInfo: userInfo)
        } onError: { code, message in
            debugPrint("getUserInfo,code:\(code),message:\(message)")
        }
    }
    
    func refreshStore() {
        videoSetting = VideoModel()
        audioSetting = AudioModel()
        roomScene = .meeting
        attendeeList = []
        inviteSeatList = []
        isSomeoneSharing = false
        currentUser = UserModel()
        roomInfo = RoomInfo()
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
    
    public var speechMode: TUISpeechMode {
        set {
            roomInfo.speechMode = newValue
        }
        get {
            return roomInfo.speechMode
        }
    }
    
    public var isCameraDisableForAllUser: Bool {
        set {
            roomInfo.isCameraDisableForAllUser = newValue
        }
        get {
            return roomInfo.isCameraDisableForAllUser
        }
    }
    
    public var isMicrophoneDisableForAllUser: Bool {
        set {
            roomInfo.isMicrophoneDisableForAllUser = newValue
        }
        get {
            return roomInfo.isMicrophoneDisableForAllUser
        }
    }
    
    public var isMessageDisableForAllUser: Bool {
        set {
            roomInfo.isMessageDisableForAllUser = newValue
        }
        get {
            return roomInfo.isMessageDisableForAllUser
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
    
    public var ownerId: String = ""
    
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
        self.ownerId = roomInfo.ownerId
    }
    
    public func update(engineRoomInfo: TUIRoomInfo) {
        roomInfo = engineRoomInfo
        ownerId = engineRoomInfo.ownerId
    }
    
    public func getEngineRoomInfo() -> TUIRoomInfo {
        return roomInfo
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}
