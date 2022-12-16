//
//  TUIRoomKit.swift
//  TUIRoomKit
//
//  Created by WesleyLei on 2022/9/13.
//

import Foundation
import TUIRoomEngine

public enum RoomScene {
    case meeting
    case live
}

public class TUIRoomKit {
    var listenerArray: [TUIRoomKitListener] = []
    public static var sharedInstance: TUIRoomKit {
        struct Static {
            static let shared: TUIRoomKit = TUIRoomKit()
        }
        EngineManager.shared.setListener(listener: Static.shared)
        return Static.shared
    }

    private init() {}

    public class func setup(sdkAppId: Int, userId: String, userSig: String) {
        EngineManager.setup(sdkAppId: sdkAppId, userId: userId, userSig: userSig)
    }

    public func createRoom(roomInfo: RoomInfo, type: RoomScene) {
        EngineManager.shared.createRoom(roomInfo: roomInfo, type: type)
    }

    public func enterRoom(roomInfo: RoomInfo, type: RoomScene) {
        EngineManager.shared.enterRoom(roomInfo: roomInfo, type: type)
    }

    public func addListener(listener: TUIRoomKitListener) {
        listenerArray.append(listener)
    }
}

extension TUIRoomKit: EngineManagerListener {
    public func onEnterEngineRoom(code: TUIError, message: String, roomInfo: RoomInfo?) {
        listenerArray.forEach { listener in
            listener.onEnterRoom(code: code, message: message)
        }
        if code == .success {
            guard let roomId = roomInfo?.roomId else { return }
            guard let vc = Router.shared.roomIdBindController(roomId: roomId) else { return }
            Router.shared.roomIdRemoveBindController(roomId: roomId)
            Router.shared.presentRoomController(vc: vc)
        }
    }

    public func onExitEngineRoom(code: TUIError, message: String) {
        listenerArray.forEach { listener in
            listener.onExitRoom(code: code, message: message)
        }
    }
}

public protocol TUIRoomKitListener {
    func onEnterRoom(code: TUIError, message: String) -> Void
    func onExitRoom(code: TUIError, message: String) -> Void
}
