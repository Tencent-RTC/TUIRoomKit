//
//  TUIRoomKit.swift
//  TUIRoomKit
//
//  Created by WesleyLei on 2022/9/13.
//  Copyright © 2022 Tencent. All rights reserved.
//

import Foundation
import TUIRoomEngine

@objc public enum RoomScene: Int {
    case meeting = 1
    case live = 2
}

@objc public protocol TUIRoomKitListener: NSObjectProtocol {
    @objc optional func onLogin(code: Int, message: String) -> Void
    @objc optional func onRoomCreate(code: Int, message: String) -> Void
    @objc optional func onDestroyRoom() -> Void
    @objc optional func onRoomEnter(code: Int, message: String) -> Void
    @objc optional func onExitRoom() -> Void
}

@objcMembers public class TUIRoomKit: NSObject {
    typealias Weak<T> = () -> T?
    private var listenerArray: [Weak<TUIRoomKitListener>] = []
    @objc public static let sharedInstance = TUIRoomKit()
    
    private override init() {
        super.init()
    }
    
    public func login(sdkAppId: Int, userId: String, userSig: String) {
        EngineManager.shared.login(sdkAppId: sdkAppId, userId: userId, userSig: userSig)
        EngineManager.shared.setListener(listener: self)
    }
    
    public func logout() {
        EngineManager.shared.dismissListener()
        EngineManager.shared.logout()
    }
    
    public func setSelfInfo(userName: String, avatarURL: String) {
        EngineManager.shared.setSelfInfo(userName: userName, avatarURL: avatarURL)
    }
    
    public func enterPrepareView(enablePreview: Bool) {
        RoomRouter.shared.pushPrePareViewController(enablePrePareView: enablePreview)
    }
    
    public func createRoom(roomInfo: RoomInfo, type: RoomScene) {
        EngineManager.shared.store.update(roomInfo: roomInfo)
        EngineManager.shared.store.roomScene = type
        EngineManager.shared.createRoom()
    }
    
    public func enterRoom(roomInfo: RoomInfo) {
        EngineManager.shared.store.update(roomInfo: roomInfo)
        EngineManager.shared.enterRoom(roomId: roomInfo.roomId)
    }
    
    public func addListener(listener: TUIRoomKitListener) {
        let listenerObject = listenerArray.first { weakObject in
            guard let object = weakObject() else { return false }
            return object.isEqual(listener)
        }
        guard listenerObject == nil else { return }
        let weakObserver = { [weak listener] in return listener }
        self.listenerArray.append(weakObserver)
    }
    
    public func removeListener(listener: TUIRoomKitListener) {
        listenerArray.removeAll { weakObject in
            guard let object = weakObject() else { return true }
            return object.isEqual(listener)
        }
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}

extension TUIRoomKit: EngineManagerListener {
    public func onLogin(code: Int, message: String) {
        for weakObserver in listenerArray {
            if let listener = weakObserver() {
                listener.onLogin?(code: code, message: message)
            }
        }
    }
    
    public func onCreateEngineRoom(code: Int, message: String) {
        for weakObserver in listenerArray {
            if let listener = weakObserver() {
                listener.onRoomCreate?(code: code, message: message)
            }
        }
    }
    
    public func onDestroyEngineRoom() {
        for weakObserver in listenerArray {
            if let listener = weakObserver() {
                listener.onDestroyRoom?()
            }
        }
    }
    
    public func onEnterEngineRoom(code: Int, message: String) {
        for weakObserver in listenerArray {
            if let listener = weakObserver() {
                listener.onRoomEnter?(code: code, message: message)
            }
        }
    }
    
    public func onExitEngineRoom() {
        for weakObserver in listenerArray {
            if let listener = weakObserver() {
                listener.onExitRoom?()
            }
        }
    }
}
