//
//  TUIVideoSeat.swift
//  TUIVideoSeat
//
//  Created by WesleyLei on 2022/9/13.
//

import TUICore
import TUIRoomEngine
import UIKit

@objc class Extension: NSObject {
    static let shared = Extension()
    override private init() {}
}

// MARK: - TUIExtensionProtocol

extension Extension: TUIExtensionProtocol {
    func getExtensionInfo(_ key: String, param: [AnyHashable: Any]?) -> [AnyHashable: Any] {
        guard let param = param else {
            return [:]
        }

        guard let roomPresenter: RoomPresenter = param["roomEngine"] as? RoomPresenter else {
            return [:]
        }

        if key == gExtensionControllerKey {
            let viewController = ExtensionViewController(roomPresenter: roomPresenter)
            return [key: viewController]
        } else {
            return [:]
        }
    }
}
