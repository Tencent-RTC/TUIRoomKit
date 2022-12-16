//
//  RoomInfo.swift
//  TUIRoomKit
//
//  Created by WesleyLei on 2022/9/27.
//

import Foundation
import TUIRoomEngine

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

    public var owner: String {
        return roomInfo.owner
    }

    private var roomInfo: TUIRoomInfo
    public init() {
        isOpenMicrophone = false
        isOpenCamera = false
        roomInfo = TUIRoomInfo()
    }

    public func update(engineRoomInfo: TUIRoomInfo) {
        roomInfo = engineRoomInfo
    }

    public func getEngineRoomInfo() -> TUIRoomInfo {
        return roomInfo
    }
}
