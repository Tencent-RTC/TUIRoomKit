//
//  EngineEventCenter.swift
//  TUIRoomKit
//
//  Created by aby on 2023/1/8.
//  Copyright © 2023 Tencent. All rights reserved.
//

import Foundation
import TUIRoomEngine
import TUICore

protocol RoomKitUIEventResponder: NSObject {
    func onNotifyUIEvent(key: EngineEventCenter.RoomUIEvent, Object: Any?, info: [AnyHashable: Any]?)
}

protocol RoomEngineEventResponder: NSObject {
    func onEngineEvent(name: EngineEventCenter.RoomEngineEvent, param: [String: Any]?)
}

class TUINotificationAdapter:NSObject ,TUINotificationProtocol {
    
    weak var responder: RoomKitUIEventResponder?
    
    init(responder: RoomKitUIEventResponder? = nil) {
        self.responder = responder
    }
    
    func onNotifyEvent(_ key: String, subKey: String, object anObject: Any?, param: [AnyHashable : Any]?) {
        guard let eventKey = EngineEventCenter.RoomUIEvent(rawValue: subKey) else { return }
        responder?.onNotifyUIEvent(key: eventKey, Object: anObject, info: param)
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}

/// 负责RoomEngine回调事件分发与通知
class EngineEventCenter: NSObject {
    
    // Weak Ref
    typealias WeakArray<T> = [() -> T?]
    
    static let shared = EngineEventCenter()
    private var engineObserverMap: [RoomEngineEvent: WeakArray<RoomEngineEventResponder>] = [:]
    private var uiEventObserverMap: [RoomUIEvent: [TUINotificationAdapter]] = [:]
    var engineManager: EngineManager {
        EngineManager.shared
    }
    var roomInfo: RoomInfo {
        engineManager.store.roomInfo
    }
    var currentUser: UserModel {
        engineManager.store.currentUser
    }
    
    private override init() {
        super.init()
    }
    
    enum RoomEngineEvent: String {
        case onError
        case onKickedOffLine
        case onUserSigExpired
        case onRoomInfoChanged
        case onRoomDismissed
        case onKickedOutOfRoom
        case onRemoteUserEnterRoom
        case onRemoteUserLeaveRoom
        case onUserRoleChanged
        case onUserVideoStateChanged
        case onUserAudioStateChanged
        case onUserVoiceVolumeChanged
        case onUserNetworkQualityChanged
        case onUserScreenCaptureStopped
        case onSeatControlEnabled
        case onSeatListChanged
        case onRequestReceived
        case onRequestCancelled
        case onReceiveTextMessage
        case onReceiveCustomMessage
        case onUserMuteStateChanged
    }
    
    enum RoomUIEvent: String {
        case TUIRoomKitService
        case TUIRoomKitService_RenewUserList
        case TUIRoomKitService_SomeoneSharing
        case TUIRoomKitService_RenewSeatList
        case TUIRoomKitService_UserOnSeat
        case TUIRoomKitService_UserDownSeat
        case TUIRoomKitService_ResignFirstResponder
        
    }
    
    /// 注册UI响应相关监听事件
    /// - Parameter key: UI响应对应Key
    func subscribeUIEvent(key: RoomUIEvent, responder: RoomKitUIEventResponder) {
        let observer = TUINotificationAdapter(responder: responder)
        if var observerArray = uiEventObserverMap[key] {
            observerArray.append(observer)
            uiEventObserverMap[key] = observerArray
        } else {
            uiEventObserverMap[key] = [observer]
        }
        TUICore.registerEvent(RoomUIEvent.TUIRoomKitService.rawValue, subKey: key.rawValue, object: observer)
    }
    
    
    /// 移除UI响应相关事件监听
    /// - Parameter key: UI响应对应Key
    func unsubscribeUIEvent(key: RoomUIEvent, responder: RoomKitUIEventResponder?) {
        guard var observerArray = uiEventObserverMap[key] else { return }
        if let responder = responder {
            observerArray = observerArray.filter({ observer in
                guard let responderValue = observer.responder else { return false }
                if responderValue == responder {
                    TUICore.unRegisterEvent(RoomUIEvent.TUIRoomKitService.rawValue, subKey: key.rawValue, object: observer)
                }
                return responderValue == responder
            })
            uiEventObserverMap[key] = observerArray
            if observerArray.count == 0 {
                uiEventObserverMap.removeValue(forKey: key)
            }
        } else {
            observerArray.forEach { observer in
                TUICore.unRegisterEvent(RoomUIEvent.TUIRoomKitService.rawValue, subKey: key.rawValue, object: observer)
            }
            uiEventObserverMap.removeValue(forKey: key)
        }
    }
    
    func notifyUIEvent(key: RoomUIEvent, param: [AnyHashable : Any]) {
        TUICore.notifyEvent(RoomUIEvent.TUIRoomKitService.rawValue, subKey: key.rawValue, object: nil, param: param)
    }
    
    func subscribeEngine(event: RoomEngineEvent, observer: RoomEngineEventResponder) {
        let weakObserver = { [weak observer] in return observer }
        if var observerArray = engineObserverMap[event] {
            observerArray.append(weakObserver)
            engineObserverMap[event] = observerArray
        } else {
            engineObserverMap[event] = [weakObserver]
        }
    }
    
    func unsubscribeEngine(event: RoomEngineEvent, observer: RoomEngineEventResponder) {
        guard var observerArray = engineObserverMap[event] else { return }
        observerArray.removeAll(where: {$0() === observer})
        if observerArray.count == 0 {
            engineObserverMap.removeValue(forKey: event)
        }
    }
    
    func receiveEngineEvent(event: RoomEngineEvent, param: [String: Any]?) {
        guard let observers = engineObserverMap[event] else { return }
        observers.forEach { responder in
            responder()?.onEngineEvent(name: event, param: param)
        }
    }
    
    private func checkRoomChangeInfo(roomInfo: TUIRoomInfo) {
        guard roomInfo.roomId == roomInfo.roomId else {
            return
        }
        if self.roomInfo.enableVideo != roomInfo.enableVideo {
            if roomInfo.owner == currentUser.userId {
                return
            }
            if !roomInfo.enableVideo {
                engineManager.roomEngine.closeLocalCamera()
                engineManager.roomEngine.stopPushLocalVideo()
                RoomRouter.makeToast(toast: .allMuteVideoText)
            } else {
                RoomRouter.makeToast(toast: .allUnMuteVideoText)
            }
        }
        if self.roomInfo.enableAudio != roomInfo.enableAudio {
            if roomInfo.owner == currentUser.userId {
                return
            }
            if !roomInfo.enableAudio {
                engineManager.roomEngine.closeLocalMicrophone()
                engineManager.roomEngine.stopPushLocalAudio()
                RoomRouter.makeToast(toast: .allMuteAudioText)
            } else {
                RoomRouter.makeToast(toast: .allUnMuteAudioText)
            }
        }
        self.roomInfo.update(engineRoomInfo: roomInfo)
    }
    
    deinit {
        EngineManager.shared.roomEngine.removeObserver(self)
        debugPrint("deinit \(self)")
    }
}

extension EngineEventCenter: TUIRoomObserver {
    // MARK: - Engine错误事件回调
    func onError(error errorCode: TUIError, message: String) {
        guard let observers = engineObserverMap[.onError] else { return }
        let param = [
            "errorCode" : errorCode,
            "message" : message,
        ] as [String : Any]
        observers.forEach { responder in
            responder()?.onEngineEvent(name: .onError, param: param)
        }
    }
    
    // MARK: - Engine 登录状态时间回调
    func onKickedOffLine(message: String) {
        guard let observers = engineObserverMap[.onKickedOffLine] else { return }
        let param = [
            "message" : message,
        ] as [String : Any]
        observers.forEach { responder in
            responder()?.onEngineEvent(name: .onKickedOffLine, param: param)
        }
    }
    
    func onUserSigExpired() {
        guard let observers = engineObserverMap[.onUserSigExpired] else { return }
        let param: [String: Any] = [:]
        observers.forEach { responder in
            responder()?.onEngineEvent(name: .onUserSigExpired, param: param)
        }
    }
    
    // MARK: - 房间内事件回调
    func onRoomInfoChanged(roomId: String, roomInfo: TUIRoomInfo) {
        checkRoomChangeInfo(roomInfo: roomInfo)
        guard let observers = engineObserverMap[.onRoomInfoChanged] else { return }
        let param = [
            "roomId" : roomId,
            "roomInfo" : roomInfo,
        ] as [String : Any]
        observers.forEach { [weak self] responder in
            guard let self = self else  { return }
            // FIXME: 修复转让房主原房主收不到回调问题
            let oldRoomOwner = self.engineManager.store.roomInfo.owner
            if oldRoomOwner != roomInfo.owner {
                self.onUserRoleChanged(userId: oldRoomOwner, userRole: .generalUser)
            }
            responder()?.onEngineEvent(name: .onRoomInfoChanged, param: param)
        }
    }
    
    func onRoomDismissed(roomId: String) {
        guard let observers = engineObserverMap[.onRoomDismissed] else { return }
        let param = [
            "roomId" : roomId,
        ] as [String : Any]
        observers.forEach { responder in
            responder()?.onEngineEvent(name: .onRoomDismissed, param: param)
        }
    }
    
    func onKickedOutOfRoom(roomId: String, message: String) {
        guard let observers = engineObserverMap[.onKickedOutOfRoom] else { return }
        let param = [
            "roomId" : roomId,
            "message" : message,
        ] as [String : Any]
        observers.forEach { responder in
            responder()?.onEngineEvent(name: .onKickedOutOfRoom, param: param)
        }
    }
    
    // MARK: - 房间内用户事件回调
    func onRemoteUserEnterRoom(roomId: String, userInfo: TUIUserInfo) {
        guard let observers = engineObserverMap[.onRemoteUserEnterRoom] else { return }
        let param = [
            "roomId": roomId,
            "userInfo": userInfo,
        ] as [String : Any]
        observers.forEach { responder in
            responder()?.onEngineEvent(name: .onRemoteUserEnterRoom, param: param)
        }
    }
    
    func onRemoteUserLeaveRoom(roomId: String, userInfo: TUIUserInfo) {
        guard let observers = engineObserverMap[.onRemoteUserLeaveRoom] else { return }
        let param = [
            "roomId": roomId,
            "userInfo": userInfo,
        ] as [String : Any]
        observers.forEach { responder in
            responder()?.onEngineEvent(name: .onRemoteUserLeaveRoom, param: param)
        }
    }
    
    func onUserRoleChanged(userId: String, userRole: TUIRole) {
        guard let observers = engineObserverMap[.onUserRoleChanged] else { return }
        let param = [
            "userId" : userId,
            "userRole" : userRole,
        ] as [String : Any]
        observers.forEach { responder in
            responder()?.onEngineEvent(name: .onUserRoleChanged, param: param)
        }
    }
    
    func onUserVideoStateChanged(userId: String, streamType: TUIVideoStreamType, hasVideo: Bool, reason: TUIChangeReason) {
        guard let observers = engineObserverMap[.onUserVideoStateChanged] else { return }
        let param = [
            "userId" : userId,
            "streamType" : streamType,
            "hasVideo" : hasVideo,
            "reason" : reason,
        ] as [String : Any]
        observers.forEach { responder in
            responder()?.onEngineEvent(name: .onUserVideoStateChanged, param: param)
        }
    }
    
    func onUserAudioStateChanged(userId: String, hasAudio: Bool, reason: TUIChangeReason) {
        guard let observers = engineObserverMap[.onUserAudioStateChanged] else { return }
        let param = [
            "userId" : userId,
            "hasAudio" : hasAudio,
            "reason" : reason,
        ] as [String : Any]
        observers.forEach { responder in
            responder()?.onEngineEvent(name: .onUserAudioStateChanged, param: param)
        }
    }
    
    func onUserVoiceVolumeChanged(volumeMap: [String : NSNumber]) {
        guard let observers = engineObserverMap[.onUserVoiceVolumeChanged] else { return }
        observers.forEach { responder in
            responder()?.onEngineEvent(name: .onKickedOutOfRoom, param: volumeMap)
        }
    }
    
    func onUserMuteStateChanged(userId: String, muted: Bool) {
        guard let observers = engineObserverMap[.onUserMuteStateChanged] else { return }
        let param = [
            "userId" : userId,
            "muted" : muted,
        ] as [String : Any]
        observers.forEach { responder in
            responder()?.onEngineEvent(name: .onUserMuteStateChanged, param: param)
        }
    }
    
    func onUserNetworkQualityChanged(networkList: [TUINetworkInfo]) {
        guard let observers = engineObserverMap[.onUserNetworkQualityChanged] else { return }
        let param = [
            "networkList" : networkList,
        ] as [String : Any]
        observers.forEach { responder in
            responder()?.onEngineEvent(name: .onUserNetworkQualityChanged, param: param)
        }
    }
    
    func onUserScreenCaptureStopped(reason: Int) {
        guard let observers = engineObserverMap[.onUserScreenCaptureStopped] else { return }
        let param = [
            "reason" : reason,
        ] as [String : Any]
        observers.forEach { responder in
            responder()?.onEngineEvent(name: .onUserScreenCaptureStopped, param: param)
        }
    }
    
    // MARK: - 房间内麦位事件回调
    func onSeatControlEnabled(enable: Bool, maxSeatNumber: Int) {
        guard let observers = engineObserverMap[.onSeatControlEnabled] else { return }
        let param = [
            "enable": enable,
            "maxSeatNumber": maxSeatNumber,
        ] as [String : Any]
        observers.forEach { responder in
            responder()?.onEngineEvent(name: .onSeatControlEnabled, param: param)
        }
    }
    
    func onSeatListChanged(seatList: [TUISeatInfo], seated seatedList: [TUISeatInfo], left leftList: [TUISeatInfo]) {
        guard let observers = engineObserverMap[.onSeatListChanged] else { return }
        let param = [
            "seatList": seatList,
            "seated": seatedList,
            "left": leftList,
        ] as [String : Any]
        observers.forEach { responder in
            responder()?.onEngineEvent(name: .onSeatListChanged, param: param)
        }
    }
    
    // MARK: - 信令请求相关回调
    func onRequestReceived(request: TUIRequest) {
        guard let observers = engineObserverMap[.onRequestReceived] else { return }
        let param = [
            "request": request,
        ] as [String : Any]
        observers.forEach { responder in
            responder()?.onEngineEvent(name: .onRequestReceived, param: param)
        }
    }
    
    func onRequestCancelled(requestId: String, userId: String) {
        guard let observers = engineObserverMap[.onRequestCancelled] else { return }
        let param = [
            "requestId": requestId,
            "userId": userId,
        ] as [String : Any]
        observers.forEach { responder in
            responder()?.onEngineEvent(name: .onRequestCancelled, param: param)
        }
    }
    
    // MARK: - 房间内消息事件回调
    func onReceiveTextMessage(roomId: String, message: TUIMessage) {
        guard let observers = engineObserverMap[.onReceiveTextMessage] else { return }
        let param = [
            "roomId": roomId,
            "message": message,
        ] as [String : Any]
        observers.forEach { responder in
            responder()?.onEngineEvent(name: .onReceiveTextMessage, param: param)
        }
    }
    
    func onReceiveCustomMessage(roomId: String, message: TUIMessage) {
        guard let observers = engineObserverMap[.onReceiveCustomMessage] else { return }
        let param = [
            "roomId": roomId,
            "message": message,
        ] as [String : Any]
        observers.forEach { responder in
            responder()?.onEngineEvent(name: .onReceiveCustomMessage, param: param)
        }
    }
}

private extension String {
    static let allMuteAudioText = localized("TUIRoom.all.mute.audio.prompt")
    static let allMuteVideoText = localized("TUIRoom.all.mute.video.prompt")
    static let allUnMuteAudioText = localized("TUIRoom.all.unmute.audio.prompt")
    static let allUnMuteVideoText = localized("TUIRoom.all.unmute.video.prompt")
}
