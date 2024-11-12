//
//  RoomState.swift
//  TUIRoomKit
//
//  Created by janejntang on 2024/7/9.
//

import Foundation
import RTCRoomEngine

struct RoomInfo {
    var roomId = ""
    var name = ""
    var ownerId = ""
    var ownerName = ""
    var ownerAvatarUrl = ""
    var isSeatEnabled = false
    var password = ""
    var isMicrophoneDisableForAllUser = false
    var isCameraDisableForAllUser = false
    var isScreenShareDisableForAllUser = false
    var createTime: UInt = 0
    var isPasswordEnabled: Bool = false
    var isEnteredRoom = false
    var memberCount = 0
    
    init() {}
    init(with roomInfo: TUIRoomInfo) {
        self.roomId = roomInfo.roomId
        self.name = roomInfo.name
        self.ownerId = roomInfo.ownerId
        self.ownerName = roomInfo.ownerName
        self.ownerAvatarUrl = roomInfo.ownerAvatarUrl
        self.isSeatEnabled = roomInfo.isSeatEnabled
        self.password = roomInfo.password
        self.isMicrophoneDisableForAllUser = roomInfo.isMicrophoneDisableForAllUser
        self.isCameraDisableForAllUser = roomInfo.isCameraDisableForAllUser
        self.createTime = roomInfo.createTime
        self.isPasswordEnabled = roomInfo.password.count > 0
        self.memberCount = roomInfo.memberCount
        self.isScreenShareDisableForAllUser = roomInfo.isScreenShareDisableForAllUser
    }
}

extension TUIRoomInfo {
    convenience init(roomInfo: RoomInfo) {
        self.init()
        self.roomId = roomInfo.roomId
        self.name = roomInfo.name
        self.isSeatEnabled = roomInfo.isSeatEnabled
        self.password = roomInfo.password
        self.isMicrophoneDisableForAllUser = roomInfo.isMicrophoneDisableForAllUser
        self.isCameraDisableForAllUser = roomInfo.isCameraDisableForAllUser
        self.seatMode = .applyToTake
        self.isScreenShareDisableForAllUser = roomInfo.isScreenShareDisableForAllUser
    }
}
