//
//  Menu.swift
//  Menu
//
//  Created by WesleyLei on 2022/9/13.
//

import TUICore
import UIKit

@objc class Menu: NSObject {
    static let shared = Menu()
    override private init() {}
}

// MARK: - TUIExtensionProtocol

extension Menu: TUIExtensionProtocol {
    func getExtensionInfo(_ key: String, param: [AnyHashable: Any]?) -> [AnyHashable: Any] {
        guard let param = param else {
            return [:]
        }

        guard let roomId: String = param["roomId"] as? String else {
            return [:]
        }

        guard let roomPresent: RoomPresenter = param["roomPresent"] as? RoomPresenter else {
            return [:]
        }

        if key == gTopViewKey {
            let view = TopView(frame: CGRect.zero, roomId: roomId, roomPresenter: roomPresent)
            return [key: view]
        } else if key == gBottomViewKey {
            let view = BottomView(frame: CGRect.zero, roomId: roomId, roomPresenter: roomPresent)
            return [key: view]
        } else {
            return [:]
        }
    }
}
