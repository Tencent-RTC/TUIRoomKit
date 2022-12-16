//
//  UserList.swift
//  TUIRoomKit
//
//  Created by 唐佳宁 on 2022/9/22.
//

import TUICore
import TUIRoomEngine
import UIKit

class UserList: NSObject {
    static let shared = UserList()
    override private init() {}
}

// MARK: - TUIExtensionProtocol

extension UserList: TUIExtensionProtocol {
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

        if key == gUserListControllerKey {
            let viewController = UserListViewController(roomId: roomId, roomPresent: roomPresent)
            return [key: viewController]
        } else {
            return [:]
        }
    }
}
