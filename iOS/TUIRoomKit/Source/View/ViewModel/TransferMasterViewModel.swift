//
//  TransferMasterViewModel.swift
//  TUIRoomKit
//
//  Created by 唐佳宁 on 2023/2/20.
//

import Foundation

class TransferMasterViewModel {
    var attendeeList: [UserModel]
    var userId: String
    
    init() {
        attendeeList = EngineManager.shared.store.attendeeList.filter({ userModel in
            userModel.userId != EngineManager.shared.store.currentUser.userId
        })
        userId = ""
    }
    
    func appointMasterAction(sender: UIButton) {
        guard userId != "" else { return }
        EngineManager.shared.roomEngine.changeUserRole(userId: userId, role: .roomOwner) {
            EngineManager.shared.exitRoom()
        } onError: { code, message in
            EngineManager.shared.destroyRoom()
            debugPrint("changeUserRole:code:\(code),message:\(message)")
        }
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}
