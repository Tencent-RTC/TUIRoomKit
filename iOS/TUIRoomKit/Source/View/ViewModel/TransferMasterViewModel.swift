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
    
    func backAction(sender: UIButton) {
        RoomRouter.shared.currentViewController()?.navigationController?.popViewController(animated: true)
    }
    
    func appointMasterAction(sender: UIButton) {
        guard userId != "" else { return }
        EngineManager.shared.roomEngine.changeUserRole(userId: userId, role: .roomOwner) {
            EngineManager.shared.exitRoom {
                RoomRouter.shared.popToEntranceViewController()
            } onError: { code, message in
                debugPrint("exitRoom:code:\(code),message:\(message)")
            }
        } onError: { code, message in
            EngineManager.shared.destroyRoom {
                RoomRouter.shared.popToEntranceViewController()
            }
            debugPrint("changeUserRole:code:\(code),message:\(message)")
        }
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}
