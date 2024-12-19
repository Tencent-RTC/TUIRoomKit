//
//  FloatChatService.swift
//  TUIRoomKit
//
//  Created by CY zhao on 2024/5/14.
//

import Foundation
import RTCRoomEngine
import ImSDK_Plus
import TUICore
#if USE_OPENCOMBINE
import OpenCombine
#else
import Combine
#endif
import Factory

class FloatChatService: NSObject {
    @WeakLazyInjected(\.floatChatService) private var store: FloatChatStoreProvider?
    private let imManager = {
        V2TIMManager.sharedInstance()
    }()
    private var roomId: String? {
        self.store?.selectCurrent(FloatChatSelectors.getRoomId)
    }
    
    override init() {
        super.init()
        imManager?.addAdvancedMsgListener(listener: self)
    }
    
    func sendGroupMessage(_ message: String) -> AnyPublisher<String, Never> {
        return Future<String, Never> { [weak self] promise in
            guard let self = self else { return }
            self.imManager?.sendGroupTextMessage(message, to: self.roomId, priority: .PRIORITY_NORMAL, succ: {
                promise(.success((message)))
            }, fail: { code, message in
                let errorMsg = TUITool.convertIMError(Int(code), msg: message)
                //TODO: show toast from store.dispatch
                RoomRouter.makeToastInWindow(toast:errorMsg ?? "send message fail", duration: 2)
            })
        }
        .eraseToAnyPublisher()
    }
}

extension FloatChatService: V2TIMAdvancedMsgListener {
    func onRecvNewMessage(_ msg: V2TIMMessage!) {
        guard msg.groupID == roomId, let msg = msg else { return }
        let floatMessage = FloatChatMessage(msg: msg)
        store?.dispatch(action: FloatChatActions.onMessageReceived(payload: floatMessage))
    }
}
