//
//  FloatChatService.swift
//  TUIRoomKit
//
//  Created by CY zhao on 2024/5/14.
//

import Foundation
import RTCRoomEngine
import Combine
import ImSDK_Plus

class FloatChatService: NSObject {
    @WeakLazyInjected private var store: FloatChatStoreProvider?
    private let imManager = {
        V2TIMManager.sharedInstance()
    }()
    private var roomId: String? {
        self.store?.selectCurrent(FloatChatSelectors.getRoomId)
    }
    
    override init() {
        super.init()
        imManager?.addSimpleMsgListener(listener: self)
    }
    
    func sendGroupMessage(_ message: String) -> AnyPublisher<String, Never> {
        return Future<String, Never> { [weak self] promise in
            guard let self = self else { return }
            self.imManager?.sendGroupTextMessage(message, to: self.roomId, priority: .PRIORITY_NORMAL, succ: {
                promise(.success((message)))
            }, fail: { code, message in
                debugPrint("FloatChat send custom message failed, code: \(code), message: \(message ?? "")")
            })
        }
        .eraseToAnyPublisher()
    }
}

extension FloatChatService: V2TIMSimpleMsgListener {
    func onRecvGroupTextMessage(_ msgID: String!, groupID: String!, sender info: V2TIMGroupMemberInfo!, text: String!) {
        guard groupID == roomId else {
            return
        }
        let user = FloatChatUser(memberInfo: info)
        let floatMessage = FloatChatMessage(user: user, content: text)
        store?.dispatch(action: FloatChatActions.onMessageReceived(payload: floatMessage))
    }
}
