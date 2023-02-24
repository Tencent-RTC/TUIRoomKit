//
//  EngineEventCenter.swift
//  TUIVideoSeat
//
//  Created by 唐佳宁 on 2023/2/22.
//

import Foundation
import TUIRoomEngine
import TUICore

protocol RoomKitUIEventResponder: NSObject {
    func onNotifyUIEvent(key: UIEventCenter.TUIVideoSeatUIEvent, Object: Any?, info: [AnyHashable: Any]?)
}

class TUINotificationAdapter:NSObject ,TUINotificationProtocol {
    
    weak var responder: RoomKitUIEventResponder?
    
    init(responder: RoomKitUIEventResponder? = nil) {
        self.responder = responder
    }
    
    func onNotifyEvent(_ key: String, subKey: String, object anObject: Any?, param: [AnyHashable : Any]?) {
        guard let eventKey = UIEventCenter.TUIVideoSeatUIEvent(rawValue: subKey) else { return }
        responder?.onNotifyUIEvent(key: eventKey, Object: anObject, info: param)
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}

/// 负责RoomEngine回调事件分发与通知
class UIEventCenter: NSObject {
    
    static let shared = UIEventCenter()
    private var uiEventObserverMap: [TUIVideoSeatUIEvent: [TUINotificationAdapter]] = [:]
    
    private override init() {
        super.init()
    }
    
    enum TUIVideoSeatUIEvent: String {
        case TUIVideoSeatService
        case UserVoiceVolumeChanged
        case UserVideoStateChanged
    }
    
    /// 注册UI响应相关监听事件
    /// - Parameter key: UI响应对应Key
    func subscribeUIEvent(key: TUIVideoSeatUIEvent, responder: RoomKitUIEventResponder) {
        let observer = TUINotificationAdapter(responder: responder)
        if var observerArray = uiEventObserverMap[key] {
            observerArray.append(observer)
            uiEventObserverMap[key] = observerArray
        } else {
            uiEventObserverMap[key] = [observer]
        }
        TUICore.registerEvent(TUIVideoSeatUIEvent.TUIVideoSeatService.rawValue, subKey: key.rawValue, object: observer)
    }
    
    
    /// 移除UI响应相关事件监听
    /// - Parameter key: UI响应对应Key
    func unsubscribeUIEvent(key: TUIVideoSeatUIEvent, responder: RoomKitUIEventResponder?) {
        guard var observerArray = uiEventObserverMap[key] else { return }
        guard let responder = responder else {
            observerArray.forEach { observer in
                TUICore.unRegisterEvent(TUIVideoSeatUIEvent.TUIVideoSeatService.rawValue, subKey: key.rawValue, object: observer)
            }
            uiEventObserverMap.removeValue(forKey: key)
            return
        }
        observerArray = observerArray.filter({ observer in
            guard let responderValue = observer.responder else { return false }
            if responderValue == responder {
                TUICore.unRegisterEvent(TUIVideoSeatUIEvent.TUIVideoSeatService.rawValue, subKey: key.rawValue, object: observer)
            }
            return responderValue == responder
        })
        uiEventObserverMap[key] = observerArray
        if observerArray.count == 0 {
            uiEventObserverMap.removeValue(forKey: key)
        }
    }
    
    func notifyUIEvent(key: TUIVideoSeatUIEvent, param: [AnyHashable : Any]) {
        TUICore.notifyEvent(TUIVideoSeatUIEvent.TUIVideoSeatService.rawValue, subKey: key.rawValue, object: nil, param: param)
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}
