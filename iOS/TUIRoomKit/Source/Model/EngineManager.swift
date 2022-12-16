//
//  EngineManager.swift
//  TUIRoomKit
//
//  Created by WesleyLei on 2022/9/22.
//

import Foundation
import TUICore
import TUIRoomEngine

class EngineManager: NSObject {
    private var currentUser: UserModel?
    private var roomInfoMap: [String: RoomInfo] = [:]
    private var roomEngineMap: [String: TUIRoomEngine] = [:]
    private var listener: EngineManagerListener?
    static let shared = EngineManager()

    func createRoomEngine(roomId: String) -> TUIRoomEngine {
        if let roomEngine = EngineManager.shared.roomEngineMap[roomId] {
            return roomEngine
        } else {
            let roomEngine = TUIRoomEngine()
            EngineManager.shared.roomEngineMap[roomId] = roomEngine
            return roomEngine
        }
    }

    override private init() {
        currentUser = UserModel()
    }

    func destoryRoomEngine(roomId: String) {
        roomEngineMap.removeValue(forKey: roomId)
        roomInfoMap.removeValue(forKey: roomId)
        currentUser = nil
    }

    func getRoomEngine(roomId: String) -> TUIRoomEngine {
        guard let roomEngine = EngineManager.shared.roomEngineMap[roomId] else {
            return createRoomEngine(roomId: roomId)
        }
        return roomEngine
    }

    func getRoomInfo(roomId: String) -> RoomInfo {
        guard let roomInfo = roomInfoMap[roomId] else {
            let RoomInfo = RoomInfo()
            RoomInfo.roomId = roomId
            roomInfoMap[roomId] = RoomInfo
            return RoomInfo
        }
        return roomInfo
    }
    
    func getCurrentUserInfo() -> UserModel {
        guard let userInfo = currentUser else {
            let userInfo = UserModel()
            currentUser = userInfo
            return userInfo
        }
        return userInfo
    }

    class func setup(sdkAppId: Int, userId: String, userSig: String) {
        TUIRoomEngine.setup(sdkAppId: sdkAppId, userId: userId, userSig: userSig) {
        } onError: { code, message in
            debugPrint("setup,code:\(code),message:\(message)")
        }
        TUIRoomEngine.setSelfInfo(userName: TUILogin.getNickName() ?? "", avatarUrl: TUILogin.getFaceUrl() ?? "") {
        } onError: { code, message in
            debugPrint("setSelfInfo,code:\(code),message:\(message)")
        }

    }

    func createRoom(roomInfo: RoomInfo, type: RoomScene) {
        let currentUserInfo = getCurrentUserInfo()
        currentUserInfo.userInfo.userId = TUILogin.getUserID()
        currentUserInfo.userInfo.userName = TUILogin.getNickName()
        currentUserInfo.isAllowAudioTurnedOn = roomInfo.isOpenMicrophone
        currentUserInfo.isAllowVideoTurnedOn = roomInfo.isOpenCamera
        if type == .meeting {
            roomInfo.roomType = .group
        } else {
            roomInfo.roomType = .open
        }
        let roomEngine = createRoomEngine(roomId: roomInfo.roomId)
        _ = Router.shared.roomIdBindController(roomId: roomInfo.roomId)
        roomEngine.createRoom(roomInfo.getEngineRoomInfo()) { [weak self] in
            guard let self = self else { return }
            self.enterEngineRoom(roomInfo: roomInfo) { [weak self] in
                guard let self = self else { return }
                currentUserInfo.userInfo.userRole = .roomOwner
                self.listener?.onEnterEngineRoom(code: .success, message: "success", roomInfo: roomInfo)
            } onError: { [weak self] code, message in
                guard let self = self else { return }
                self.listener?.onEnterEngineRoom(code: code, message: message, roomInfo: nil)
                Router.shared.roomIdRemoveBindController(roomId: roomInfo.roomId)
                self.destoryRoomEngine(roomId: roomInfo.roomId)
            }
        } onError: { [weak self] code, message in
            guard let self = self else { return }
            self.listener?.onEnterEngineRoom(code: code, message: message, roomInfo: nil)
            Router.shared.roomIdRemoveBindController(roomId: roomInfo.roomId)
            self.destoryRoomEngine(roomId: roomInfo.roomId)
        }
    }

    func enterRoom(roomInfo: RoomInfo, type: RoomScene) {
        let currentUserInfo = getCurrentUserInfo()
        currentUserInfo.userInfo.userId = TUILogin.getUserID()
        currentUserInfo.userInfo.userName = TUILogin.getNickName()
        currentUserInfo.isAllowAudioTurnedOn = roomInfo.isOpenMicrophone
        currentUserInfo.isAllowVideoTurnedOn = roomInfo.isOpenCamera
        _ = createRoomEngine(roomId: roomInfo.roomId)
        _ = Router.shared.roomIdBindController(roomId: roomInfo.roomId)
        let engineRoomInfo = TUIRoomInfo()
        engineRoomInfo.roomId = roomInfo.roomId
        enterEngineRoom(roomInfo: roomInfo) { [weak self] in
            guard let self = self else { return }
            currentUserInfo.userInfo.userRole = .generalUser
            self.listener?.onEnterEngineRoom(code: .success, message: "success", roomInfo: roomInfo)
        } onError: { [weak self] code, message in
            guard let self = self else { return }
            self.listener?.onEnterEngineRoom(code: code, message: message, roomInfo: nil)
            Router.shared.roomIdRemoveBindController(roomId: roomInfo.roomId)
            self.destoryRoomEngine(roomId: roomInfo.roomId)
        }
    }

    func enterEngineRoom(roomInfo: RoomInfo, onSuccess: @escaping TUISuccessBlock, onError: @escaping TUIErrorBlock) {
        let roomEngine = createRoomEngine(roomId: roomInfo.roomId)
        let roomEngineInfo = roomInfo
        roomEngine.enterRoom(roomInfo.roomId) { [weak self] roomInfo in
            guard let self = self else { return }
            guard let roomInfo = roomInfo else {return }
            roomEngineInfo.update(engineRoomInfo: roomInfo)
            self.roomInfoMap[roomInfo.roomId] = roomEngineInfo
            let exitRoomBlock = { [weak self] in
                guard let self = self else { return }
                let currentUserInfo = self.getCurrentUserInfo()
                if currentUserInfo.userInfo.userRole == .roomOwner {
                    self.destroyRoom(roomId: roomInfo.roomId) {
                    } onError: { code, message in
                        debugPrint("上麦失败后退出房间失败，code:\(code),message:\(message)")
                    }
                } else {
                    self.exitRoom(roomId: roomInfo.roomId) {
                    } onError: { code, message in
                        debugPrint("上麦失败后退出房间失败，code:\(code),message:\(message)")
                    }
                }
            }
            roomEngine.takeSeat(-1, timeout: 30) { _, _ in
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
        } onError: { code, message in
            onError(code, message)
        }
    }

    func exitRoom(roomId: String, onSuccess: @escaping TUISuccessBlock, onError: @escaping TUIErrorBlock) {
        let roomEngine = createRoomEngine(roomId: roomId)
        roomEngine.exitRoom(syncWaiting: false) { [weak self] in
            guard let self = self else { return }
            onSuccess()
            self.listener?.onExitEngineRoom(code: .success, message: "success")
            self.destoryRoomEngine(roomId: roomId)
        } onError: { [weak self] code, message in
            guard let self = self else { return }
            onError(code, message)
            self.destoryRoomEngine(roomId: roomId)
            self.listener?.onExitEngineRoom(code: code, message: message)
        }
    }

    func destroyRoom(roomId: String, onSuccess: @escaping TUISuccessBlock, onError: @escaping TUIErrorBlock) {
        let roomEngine = createRoomEngine(roomId: roomId)
        roomEngine.destroyRoom { [weak self] in
            guard let self = self else { return }
            onSuccess()
            self.listener?.onExitEngineRoom(code: .success, message: "success")
            self.destoryRoomEngine(roomId: roomId)
        } onError: { [weak self] code, message in
            guard let self = self else { return }
            onError(code, message)
            self.destoryRoomEngine(roomId: roomId)
            self.listener?.onExitEngineRoom(code: code, message: message)
        }
    }

    func setListener(listener: EngineManagerListener?) {
        self.listener = listener
    }
}

public protocol EngineManagerListener {
    func onEnterEngineRoom(code: TUIError, message: String, roomInfo: RoomInfo?) -> Void
    func onExitEngineRoom(code: TUIError, message: String) -> Void
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
            let roomEngine = EngineManager.shared.getRoomEngine(roomId: roomId)
            return [key: roomEngine]
        } else if key == gRoomInfoKey {
            let roomInfo = EngineManager.shared.getRoomInfo(roomId: roomId)
            return [key: roomInfo]
        } else if key == gLocalUserInfoKey {
            let currentUserInfo = getCurrentUserInfo()
            return [key: currentUserInfo]
        } else {
            return [:]
        }
    }
}
