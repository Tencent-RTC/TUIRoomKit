//
//  TUIVideoSeat.swift
//  TUIVideoSeat
//
//  Created by WesleyLei on 2022/9/13.
//

import UIKit
import TUIRoomEngine
import TUICore


public let gVideoSeatViewKey = NSObject.getVideoSeatViewKey()

@objc class TUIVideoSeat:NSObject {
    static let shared = TUIVideoSeat()
    private override init() {}
}

// MARK: - TUIExtensionProtocol

extension TUIVideoSeat: TUIExtensionProtocol {
    
    func getExtensionInfo(_ key: String, param: [AnyHashable : Any]?) -> [AnyHashable : Any] {
        
        guard let param = param else {
            return [:]
        }
        
        guard let roomEngine:TUIRoomEngine = param["roomEngine"] as? TUIRoomEngine else {
            return [:]
        }
        
        guard let roomId:String = param["roomId"] as? String else {
            return [:]
        }
        
        if key == gVideoSeatViewKey {
            let view = TUIVideoSeatView(frame: UIScreen.main.bounds, roomEngine: roomEngine, roomId: roomId)
            return [key:view]
        } else {
            return [:]
        }
    }
}
