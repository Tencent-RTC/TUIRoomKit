//
//  FloatChatEffect.swift
//  TUIRoomKit
//
//  Created by CY zhao on 2024/5/14.
//

import Foundation

class FloatChatEffect: Effects {
    typealias Environment = FloatChatService
    
    let sendMessage = Effect<Environment>.dispatchingOne { actions, environment in
        actions.wasCreated(from: FloatChatActions.sendMessage)
            .flatMap { action in
                environment.sendGroupMessage(action.payload)
                    .map { FloatChatActions.onMessageSended(payload: $0) }
            }
            .eraseToAnyPublisher()
    }
    
    let reportData = Effect<Environment>.nonDispatching { actions, environment in
        actions
            .wasCreated(from: FloatChatActions.reportData)
            .sink { action in
                RoomKitReport.reportData(action.payload)
            }
    }
}
