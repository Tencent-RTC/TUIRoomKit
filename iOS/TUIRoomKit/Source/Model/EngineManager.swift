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
    private var listener: EngineManagerListener?
    private(set) var store: RoomStore = RoomStore()
    private(set) lazy var roomEngine: TUIRoomEngine = {
        return TUIRoomEngine()
    }()
    
    override private init() {}
    
    func refreshRoomEngine() {
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
        let currentUserInfo = store.currentUser
        let roomInfo = store.roomInfo
        currentUserInfo.isAllowAudioTurnedOn = roomInfo.isOpenMicrophone
        currentUserInfo.isAllowVideoTurnedOn = roomInfo.isOpenCamera
        if store.roomScene == .meeting {
            roomInfo.roomType = .group
        } else {
            roomInfo.roomType = .open
        }
        roomEngine.createRoom(roomInfo.getEngineRoomInfo()) { [weak self] in
            guard let self = self else { return }
            self.enterEngineRoom { [weak self] in
                guard let self = self else { return }
                currentUserInfo.userRole = .roomOwner
                self.listener?.onEnterEngineRoom(code: 0, message: "success", roomInfo: roomInfo)
            } onError: { [weak self] code, message in
                guard let self = self else { return }
                self.listener?.onEnterEngineRoom(code: code.rawValue, message: message, roomInfo: nil)
            }
        } onError: { [weak self] code, message in
            guard let self = self else { return }
            self.listener?.onEnterEngineRoom(code: code.rawValue, message: message, roomInfo: nil)
        }
    }
    
    func enterRoom() {
        store.currentUser.isAllowAudioTurnedOn = store.roomInfo.isOpenMicrophone
        store.currentUser.isAllowVideoTurnedOn = store.roomInfo.isOpenCamera
        enterEngineRoom { [weak self] in
            guard let self = self else { return }
            self.store.currentUser.userRole = .generalUser
            self.listener?.onEnterEngineRoom(code: 0, message: "success", roomInfo: self.store.roomInfo)
        } onError: { [weak self] code, message in
            guard let self = self else { return }
            self.listener?.onEnterEngineRoom(code: code.rawValue, message: message, roomInfo: nil)
        }
    }
    
    func enterEngineRoom(onSuccess: @escaping TUISuccessBlock, onError: @escaping TUIErrorBlock) {
        roomEngine.enterRoom(store.roomInfo.roomId) { [weak self] roomInfo in
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
                self.roomEngine.takeSeat(-1, timeout: 30) { _, _ in
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
            self.listener?.onExitEngineRoom(code: 0, message: "success")
            self.store.refreshStore()
        } onError: { [weak self] code, message in
            guard let self = self else { return }
            onError(code, message)
            self.refreshRoomEngine()
            self.listener?.onExitEngineRoom(code: code.rawValue, message: message)
            self.store.refreshStore()
        }
    }
    
    func destroyRoom(onComplete: (() -> Void)?) {
        roomEngine.destroyRoom { [weak self] in
            guard let self = self else { return }
            self.refreshRoomEngine()
            self.listener?.onExitEngineRoom(code: 0, message: "success")
            self.store.refreshStore()
            onComplete?()
        } onError: { [weak self] code, message in
            guard let self = self else { return }
            self.refreshRoomEngine()
            self.listener?.onExitEngineRoom(code: code.rawValue, message: message)
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

public protocol EngineManagerListener {
    func onEnterEngineRoom(code: Int, message: String, roomInfo: RoomInfo?) -> Void
    func onExitEngineRoom(code: Int, message: String) -> Void
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
