//
//  FloatChatState.swift
//  TUIRoomKit
//
//  Created by CY zhao on 2024/5/10.
//  Copyright © 2024 Tencent. All rights reserved.
//

import Foundation
import RTCRoomEngine
import Combine

protocol FloatChatStoreProvider {
    func dispatch(action: Action)
    
    func select<Value: Equatable>(_ selector: Selector<FloatChatState, Value>) -> AnyPublisher<Value, Never>
    
    func selectCurrent<Value>(_ selector: Selector<FloatChatState, Value>) -> Value
}
