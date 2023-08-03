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
#if TXLiteAVSDK_TRTC
import TXLiteAVSDK_TRTC
#elseif TXLiteAVSDK_Professional
import TXLiteAVSDK_Professional
#endif

class EngineManager: NSObject {
    static let shared = EngineManager()
    private weak var listener: EngineManagerListener?
    private(set) lazy var store: RoomStore = {
        let store = RoomStore()
        return store
    }()
    private(set) lazy var roomEngine: TUIRoomEngine = {
        let roomEngine = TUIRoomEngine()
        roomEngine.addObserver(EngineEventCenter.shared)
        return roomEngine
    }()
    let timeOutNumber: Double = 30
    let rootRouter: RoomRouter = RoomRouter.shared
    
    override private init() {}
    
    func refreshRoomEngine() {
        roomEngine.removeObserver(EngineEventCenter.shared)
        roomEngine = TUIRoomEngine()
        roomEngine.addObserver(EngineEventCenter.shared)
    }
    
    func login(sdkAppId: Int, userId: String, userSig: String) {
        V2TIMManager.sharedInstance().initSDK(Int32(sdkAppId), config: V2TIMSDKConfig())
        TUIRoomEngine.login(sdkAppId: sdkAppId, userId: userId, userSig: userSig) { [weak self] in
            guard let self = self else { return }
            self.store.currentLoginUser.userId = userId
            self.listener?.onLogin?(code: 0, message: "success")
        } onError: { [weak self] code, message in
            guard let self = self else { return }
            self.listener?.onLogin?(code: code.rawValue, message: message)
        }
    }
    
    func setSelfInfo(userName: String, avatarURL: String) {
        store.currentLoginUser.userName = userName
        store.currentLoginUser.avatarUrl = avatarURL
        TUIRoomEngine.setSelfInfo(userName: userName, avatarUrl: avatarURL) {
        } onError: { code, message in
            debugPrint("---setSelfInfo,code:\(code),message:\(message)")
        }
    }
    
    func logout() {
        if store.isEnteredRoom {
            if store.currentUser.userRole == .roomOwner {
                destroyRoom()
            } else {
                exitRoom()
            }
        } else {
            store = RoomStore()
        }
        TUIRoomEngine.logout {
        } onError: { code, message in
            debugPrint("---logout,code:\(code),message:\(message)")
        }
    }
    
    func createRoom() {
        let roomInfo = store.roomInfo
        if store.roomScene == .meeting {
            roomInfo.roomType = .conference
        } else {
            roomInfo.roomType = .livingRoom
        }
        roomEngine.createRoom(roomInfo.getEngineRoomInfo()) { [weak self] in
            guard let self = self else { return }
            self.listener?.onCreateEngineRoom?(code: 0, message: "success")
            self.enterEngineRoom(roomId: roomInfo.roomId) { [weak self] in
                guard let self = self else { return }
                self.store.currentUser.userRole = .roomOwner
                self.listener?.onEnterEngineRoom?(code: 0, message: "success")
                if self.store.isShowRoomMainViewAutomatically {
                    self.showRoomViewController(roomId: roomInfo.roomId)
                }
            } onError: { [weak self] code, message in
                guard let self = self else { return }
                self.listener?.onEnterEngineRoom?(code: code.rawValue, message: message)
            }
        } onError: { [weak self] code, message in
            guard let self = self else { return }
            self.listener?.onCreateEngineRoom?(code: code.rawValue, message: message)
        }
    }
    
    func enterRoom(roomId: String) {
        enterEngineRoom(roomId: roomId) { [weak self] in
            guard let self = self else { return }
            self.store.currentUser.userRole = .generalUser
            self.listener?.onEnterEngineRoom?(code: 0, message: "success")
            if self.store.isShowRoomMainViewAutomatically {
                self.showRoomViewController(roomId: roomId)
            }
        } onError: { [weak self] code, message in
            guard let self = self else { return }
            self.listener?.onEnterEngineRoom?(code: code.rawValue, message: message)
        }
    }
    
    func exitRoom() {
        roomEngine.getTRTCCloud().stopAllRemoteView()
        RoomFloatView.dismiss()
        roomEngine.exitRoom(syncWaiting: false) { [weak self] in
            guard let self = self else { return }
            self.cleanRoomData()
        } onError: { [weak self] code, message in
            guard let self = self else { return }
            self.cleanRoomData()
        }
        TRTCCloud.destroySharedIntance()
    }
    
    func destroyRoom() {
        roomEngine.getTRTCCloud().stopAllRemoteView()
        RoomFloatView.dismiss()
        roomEngine.destroyRoom { [weak self] in
            guard let self = self else { return }
            self.cleanRoomData()
        } onError: { [weak self] code, message in
            guard let self = self else { return }
            self.cleanRoomData()
        }
        TRTCCloud.destroySharedIntance()
    }
    
    func cleanRoomData() {
        refreshRoomEngine()
        if store.currentUser.userRole == .roomOwner {
            listener?.onDestroyEngineRoom?()
        } else {
            listener?.onExitEngineRoom?()
        }
        store.refreshStore()
    }
    
    //关闭本地麦克风
    func closeLocalMicrophone() {
        store.roomInfo.isOpenMicrophone = false
        roomEngine.closeLocalMicrophone()
    }
    
    //打开本地麦克风
    func openLocalMicrophone() {
        let actionBlock = { [weak self] in
            guard let self = self else { return }
            self.store.roomInfo.isOpenMicrophone = true
            self.roomEngine.openLocalMicrophone(self.store.audioSetting.audioQuality) {
            } onError: { code, message in
                debugPrint("openLocalMicrophone,code:\(code), message:\(message)")
            }
        }
        if RoomCommon.checkAuthorMicStatusIsDenied() {
            actionBlock()
        } else {
            RoomCommon.micStateActionWithPopCompletion {
                if RoomCommon.checkAuthorMicStatusIsDenied() {
                    actionBlock()
                }
            }
        }
    }
    
    //关闭本地摄像头
    func closeLocalCamera() {
        store.roomInfo.isOpenCamera = false
        roomEngine.closeLocalCamera()
    }
    
    //打开本地摄像头
    func openLocalCamera() {
        let actionBlock = { [weak self] in
            guard let self = self else { return }
            self.store.roomInfo.isOpenCamera = true
            self.roomEngine.openLocalCamera(isFront: self.store.videoSetting.isFrontCamera, quality:
                                                            self.store.videoSetting.videoQuality) {
            } onError: { code, message in
                debugPrint("openLocalCamera,code:\(code),message:\(message)")
            }
        }
        if RoomCommon.checkAuthorCamaraStatusIsDenied() {
           actionBlock()
        } else {
            RoomCommon.cameraStateActionWithPopCompletion {
                if RoomCommon.checkAuthorCamaraStatusIsDenied() {
                    actionBlock()
                }
            }
        }
    }
    
    //申请打开本地设备（当roomType是applyToSpeak时使用）
    func applyToAdminToOpenLocalDevice(device: TUIMediaDevice, timeout: Double) {
        roomEngine.applyToAdminToOpenLocalDevice(device: device, timeout: timeout) {  [weak self] _, _ in
            guard let self = self else { return }
            switch device {
            case .camera:
                self.openLocalCamera()
            case .microphone:
                self.openLocalMicrophone()
            default:
                break
            }
        } onRejected: { _, _, _ in
            //todo
        } onCancelled: { _, _ in
            //todo
        } onTimeout: { _, _ in
            //todo
        }
    }
    
    func setListener(listener: EngineManagerListener) {
        self.listener = listener
    }
    
    func dismissListener() {
        listener = nil
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}

// MARK: - Private
extension EngineManager {
    private func enterEngineRoom(roomId:String, onSuccess: @escaping TUISuccessBlock, onError: @escaping TUIErrorBlock) {
        setFramework()
        roomEngine.enterRoom(roomId) { [weak self] roomInfo in
            guard let self = self else { return }
            guard let roomInfo = roomInfo else { return }
            self.store.roomInfo.update(engineRoomInfo: roomInfo)
            self.store.initialRoomCurrentUser()
            self.store.isEnteredRoom = true
            self.store.timeStampOnEnterRoom = Int(Date().timeIntervalSince1970)
            //判断用户是否需要上麦进行申请
            switch self.store.roomInfo.speechMode {
            case .freeToSpeak:
                if self.store.roomInfo.isOpenMicrophone && (!self.store.roomInfo.isMicrophoneDisableForAllUser
                                                            || self.store.currentUser.userId == self.store.roomInfo.ownerId) {
                    self.openMicrophone()
                }
                onSuccess()
            case .applyToSpeak:
                if self.store.currentUser.userId == self.store.roomInfo.ownerId, self.store.roomInfo.isOpenMicrophone {
                    self.openMicrophone()
                }
                onSuccess()
            case .applySpeakAfterTakingSeat:
                //如果用户是房主，直接上麦
                if self.store.currentUser.userId == self.store.roomInfo.ownerId {
                    self.takeSeat {
                        if self.store.roomInfo.isOpenMicrophone {
                            self.openMicrophone()
                        }
                        onSuccess()
                    } onError: { [weak self] code, message in
                        guard let self = self else { return }
                        self.destroyRoom()
                        self.rootRouter.dismissAllRoomPopupViewController()
                        self.rootRouter.popToRoomEntranceViewController()
                        onError(code, message)
                    }
                } else { //如果是观众，进入举手发言房间不上麦
                    onSuccess()
                }
            default:
                if self.store.currentUser.userId == self.store.roomInfo.ownerId {
                    self.destroyRoom()
                } else {
                    self.exitRoom()
                }
                self.rootRouter.dismissAllRoomPopupViewController()
                self.rootRouter.popToRoomEntranceViewController()
                onError(.failed, "speechMode is wrong")
            }
        } onError: { code, message in
            onError(code, message)
        }
    }
    
    private func showRoomViewController(roomId: String) {
        self.rootRouter.pushMainViewController(roomId: roomId)
    }
    
    private func openMicrophone() {
        let openLocalMicrophoneBlock = { [weak self] in
            guard let self = self else { return }
            self.roomEngine.openLocalMicrophone(self.store.audioSetting.audioQuality) {
            } onError: { code, message in
                debugPrint("openLocalMicrophone:code:\(code),message:\(message)")
            }
        }
        if RoomCommon.checkAuthorMicStatusIsDenied() {
            openLocalMicrophoneBlock()
        } else {
            RoomCommon.micStateActionWithPopCompletion {
                if RoomCommon.checkAuthorMicStatusIsDenied() {
                    openLocalMicrophoneBlock()
                }
            }
        }
        
    }
    
    private func takeSeat(onSuccess: @escaping TUISuccessBlock, onError: @escaping TUIErrorBlock) {
        self.roomEngine.takeSeat(-1, timeout: self.timeOutNumber) { [weak self] _, _ in
            guard let self = self else { return }
            self.store.currentUser.isOnSeat = true
            onSuccess()
        } onRejected: { _, _, _ in
            onError(.failed, "rejected")
        } onCancelled: { _, _ in
            onError(.failed, "onCancelled")
        } onTimeout: { _, _ in
            onError(.failed, "timeout")
        } onError: { _, _, code, message in
            onError(code, message)
        }
    }
}

@objc public protocol EngineManagerListener {
    @objc optional func onLogin(code: Int, message: String) -> Void
    @objc optional func onCreateEngineRoom(code: Int, message: String) -> Void
    @objc optional func onDestroyEngineRoom() -> Void
    @objc optional func onEnterEngineRoom(code: Int, message: String) -> Void
    @objc optional func onExitEngineRoom() -> Void
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


// MARK: - setFramework
extension EngineManager {
    fileprivate static let TUIRoomKitFrameworkValue = 1
    fileprivate static let TUIRoomKitComponentValue = 18
    fileprivate static let TUIRoomKitLanguageValue = 3
    private func setFramework() {
        let jsonStr = """
            {
                "api":"setFramework",
                "params":{
                    "framework":\(EngineManager.TUIRoomKitFrameworkValue),
                    "component":\(EngineManager.TUIRoomKitComponentValue),
                    "language":\(EngineManager.TUIRoomKitLanguageValue)
                }
            }
        """
        roomEngine.callExperimentalAPI(jsonStr: jsonStr)
    }
}
