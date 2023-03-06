//
//  RoomModel.swift
//  TUIVideoSeat
//
//  Created by jack on 2023/3/4.
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

    deinit {
        debugPrint("deinit \(self)")
    }
}
