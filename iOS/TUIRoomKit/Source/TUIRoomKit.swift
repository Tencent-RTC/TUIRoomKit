//
//  TUIRoomKit.swift
//  TUIRoomKit
//
//  Created by WesleyLei on 2022/9/13.
//  Copyright © 2022 Tencent. All rights reserved.
//

import Foundation
import TUIRoomEngine

public enum RoomScene {
    case meeting
    case live
}

public protocol TUIRoomKitListener {
    func onEnterRoom(code: Int, message: String) -> Void
    func onExitRoom(code: Int, message: String) -> Void
    func onLogin(code: Int, message: String) -> Void
}

public class TUIRoomKit {
    var listener: TUIRoomKitListener?
    public static let sharedInstance = TUIRoomKit()
    
    private init() {}
    
    public func login(sdkAppId: Int, userId: String, userSig: String) {
        EngineManager.shared.login(sdkAppId: sdkAppId, userId: userId, userSig: userSig)
        EngineManager.shared.addListener(listener: self)
    }
    
    public func setSelfInfo(userName: String, avatarURL: String) {
        EngineManager.shared.setSelfInfo(userName: userName, avatarURL: avatarURL)
    }
    
    public func logout() {
        EngineManager.shared.logout()
    }
    
    public func enterPrepareView(enablePreview: Bool) {
        RoomRouter.shared.pushPrePareViewController(enablePrePareView: enablePreview)
    }
    
    public func createRoom(roomInfo: RoomInfo, type: RoomScene) {
        EngineManager.shared.store.update(roomInfo: roomInfo)
        EngineManager.shared.store.roomScene = type
        EngineManager.shared.store.addEngineObserver()
        EngineManager.shared.addListener(listener: self)
        EngineManager.shared.createRoom()
    }
    
    public func enterRoom(roomInfo: RoomInfo, type: RoomScene) {
        EngineManager.shared.store.update(roomInfo: roomInfo)
        EngineManager.shared.store.roomScene = type
        EngineManager.shared.store.addEngineObserver()
        EngineManager.shared.addListener(listener: self)
        EngineManager.shared.enterRoom()
    }
    
    public func addListener(listener: TUIRoomKitListener) {
        self.listener = listener
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}

extension TUIRoomKit: EngineManagerListener {
    public func onLogin(code: Int, message: String) {
        self.listener?.onLogin(code: code, message: message)
    }
    
    public func onEnterEngineRoom(code: Int, message: String, roomInfo: RoomInfo?) {
        self.listener?.onEnterRoom(code: code, message: message)
        if code == 0 {
            guard let roomId = roomInfo?.roomId else { return }
            let vc = RoomRouter.shared.makeMainViewController(roomId: roomId)
            RoomRouter.shared.presentRoomController(vc: vc)
        }
    }
    
    public func onExitEngineRoom(code: Int, message: String) {
        self.listener?.onExitRoom(code: code, message: message)
    }
}
