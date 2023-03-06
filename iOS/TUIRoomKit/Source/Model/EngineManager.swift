//
//  EngineManager.swift
//  TUIRoomKit
//
//  Created by WesleyLei on 2022/9/22.
//  Copyright © 2022 Tencent. All rights reserved.
//

import Foundation
import TUICore
import TUIRoomEngine

class EngineManager: NSObject {
    static let shared = EngineManager()
    private weak var listener: EngineManagerListener?
    private(set) lazy var store: RoomStore = {
        let store = RoomStore()
        store.addEngineObserver()
        return store
    }()
    private(set) lazy var roomEngine: TUIRoomEngine = {
        let roomEngine = TUIRoomEngine()
        roomEngine.addObserver(EngineEventCenter.shared)
        return roomEngine
    }()
    let timeOutNumber: Double = 30
    
    override private init() {}
    
    func refreshRoomEngine() {
        roomEngine.removeObserver(EngineEventCenter.shared)
        roomEngine = TUIRoomEngine()
        roomEngine.addObserver(EngineEventCenter.shared)
    }
    
    func login(sdkAppId: Int, userId: String, userSig: String) {
        TUIRoomEngine.login(sdkAppId: sdkAppId, userId: userId, userSig: userSig) { [weak self] in
            guard let self = self else { return }
            self.listener?.onLogin(code: 0, message: "success")
        } onError: { [weak self] code, message in
            guard let self = self else { return }
            self.listener?.onLogin(code: code.rawValue, message: message)
        }
    }
    
    func setSelfInfo(userName: String, avatarURL: String) {
        EngineManager.shared.store.currentUser.userName = userName
        EngineManager.shared.store.currentUser.avatarUrl = avatarURL
        TUIRoomEngine.setSelfInfo(userName: userName, avatarUrl: avatarURL) {
            EngineManager.shared.store.initialCurrentUser()
        } onError: { code, message in
            debugPrint("---setSelfInfo,code:\(code),message:\(message)")
        }
    }
    
    func logout() {
        TUIRoomEngine.logout {
        } onError: { code, message in
            debugPrint("---logout,code:\(code),message:\(message)")
        }
    }
    
    func createRoom() {
        let roomInfo = store.roomInfo
        store.initialCurrentUser()
        let currentUserInfo = store.currentUser
        currentUserInfo.isAllowAudioTurnedOn = roomInfo.isOpenMicrophone
        currentUserInfo.isAllowVideoTurnedOn = roomInfo.isOpenCamera
        if store.roomScene == .meeting {
            roomInfo.roomType = .group
        } else {
            roomInfo.roomType = .open
        }
        roomEngine.createRoom(roomInfo.getEngineRoomInfo()) { [weak self] in
            guard let self = self else { return }
            self.enterEngineRoom(roomId: roomInfo.roomId) { [weak self] in
                guard let self = self else { return }
                currentUserInfo.userRole = .roomOwner
                self.showRoomViewController(roomId: roomInfo.roomId)
                self.listener?.onEnterEngineRoom(code: 0, message: "success")
            } onError: { [weak self] code, message in
                guard let self = self else { return }
                self.listener?.onEnterEngineRoom(code: code.rawValue, message: message)
            }
        } onError: { [weak self] code, message in
            guard let self = self else { return }
            self.listener?.onEnterEngineRoom(code: code.rawValue, message: message)
        }
    }
    
    func enterRoom(roomId: String) {
        store.initialCurrentUser()
        store.currentUser.isAllowAudioTurnedOn = store.roomInfo.isOpenMicrophone
        store.currentUser.isAllowVideoTurnedOn = store.roomInfo.isOpenCamera
        enterEngineRoom(roomId: roomId) { [weak self] in
            guard let self = self else { return }
            self.store.currentUser.userRole = .generalUser
            self.showRoomViewController(roomId: roomId)
            self.listener?.onEnterEngineRoom(code: 0, message: "success")
        } onError: { [weak self] code, message in
            guard let self = self else { return }
            self.listener?.onEnterEngineRoom(code: code.rawValue, message: message)
        }
    }
    
    func enterEngineRoom(roomId:String, onSuccess: @escaping TUISuccessBlock, onError: @escaping TUIErrorBlock) {
        roomEngine.enterRoom(roomId) { [weak self] roomInfo in
            guard let self = self else { return }
            guard let roomInfo = roomInfo else {return }
            self.store.roomInfo.update(engineRoomInfo: roomInfo)
            self.store.getUserList()
            let exitRoomBlock = { [weak self] in
                guard let self = self else { return }
                let currentUserInfo = self.store.currentUser
                if currentUserInfo.userRole == .roomOwner {
                    self.destroyRoom(onComplete: nil)
                } else {
                    self.exitRoom() {
                    } onError: { code, message in
                        debugPrint("上麦失败后退出房间失败，code:\(code),message:\(message)")
                    }
                }
            }
            
            //举手发言模式中用户根据自己是否需要上麦进行申请
            if self.store.roomInfo.enableSeatControl && self.store.currentUser.userId != self.store.roomInfo.owner {
                onSuccess()
            } else {//自由发言模式中直接申请上麦
                self.roomEngine.takeSeat(-1, timeout: self.timeOutNumber) { [weak self] _, _ in
                    guard let self = self else { return }
                    self.store.currentUser.isOnSeat = true
                    onSuccess()
                } onRejected: { _, _, _ in
                    onError(.failed, "rejected")
                    exitRoomBlock()
                } onCancelled: { _, _ in
                    onError(.failed, "onCancelled")
                    exitRoomBlock()
                } onTimeout: { _, _ in
                    onError(.failed, "timeout")
                    exitRoomBlock()
                } onError: { _, _, code, message in
                    onError(code, message)
                    exitRoomBlock()
                }
            }
        } onError: { code, message in
            onError(code, message)
        }
    }
    
    func exitRoom(onSuccess: @escaping TUISuccessBlock, onError: @escaping TUIErrorBlock) {
        roomEngine.exitRoom(syncWaiting: false) { [weak self] in
            guard let self = self else { return }
            onSuccess()
            self.refreshRoomEngine()
            self.listener?.onExitEngineRoom()
            self.store.refreshStore()
        } onError: { [weak self] code, message in
            guard let self = self else { return }
            onError(code, message)
            self.refreshRoomEngine()
            self.listener?.onExitEngineRoom()
            self.store.refreshStore()
        }
    }
    
    func destroyRoom(onComplete: (() -> Void)?) {
        roomEngine.destroyRoom { [weak self] in
            guard let self = self else { return }
            self.refreshRoomEngine()
            self.listener?.onExitEngineRoom()
            self.store.refreshStore()
            onComplete?()
        } onError: { [weak self] code, message in
            guard let self = self else { return }
            self.refreshRoomEngine()
            self.listener?.onExitEngineRoom()
            self.store.refreshStore()
            onComplete?()
        }
    }
    
    func addListener(listener: EngineManagerListener?) {
        guard let listener = listener else { return }
        self.listener = listener
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}

// MARK: - Private
extension EngineManager {
    
    private func showRoomViewController(roomId: String) {
        let vc = RoomRouter.shared.makeMainViewController(roomId: roomId)
        RoomRouter.shared.presentRoomController(vc: vc)
    }
}

public protocol EngineManagerListener: NSObject {
    func onEnterEngineRoom(code: Int, message: String) -> Void
    func onExitEngineRoom() -> Void
    func onLogin(code: Int, message: String) -> Void
}

// MARK: - TUIExtensionProtocol

extension EngineManager: TUIExtensionProtocol {
    func getExtensionInfo(_ key: String, param: [AnyHashable: Any]?) -> [AnyHashable: Any] {
        guard let param = param else {
            return [:]
        }
        
        guard let roomId: String = param["roomId"] as? String else {
            return [:]
        }
        
        if key == gRoomEngineKey {
            return [key: roomEngine]
        } else if key == gRoomInfoKey {
            return [key: store.roomInfo]
        } else if key == gLocalUserInfoKey {
            return [key: store.currentUser]
        } else {
            return [:]
        }
    }
}
