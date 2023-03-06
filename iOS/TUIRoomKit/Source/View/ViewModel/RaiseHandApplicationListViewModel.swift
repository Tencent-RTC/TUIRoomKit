//
//  RaiseHandApplicationListViewModel.swift
//  TUIRoomKit
//
//  Created by 唐佳宁 on 2023/1/13.
//  Copyright © 2023 Tencent. All rights reserved.
//

import Foundation

class RaiseHandApplicationListViewModel {
    var attendeeList: [UserModel]
    
    init() {
        attendeeList = EngineManager.shared.store.inviteSeatList
    }
    
    func backAction(sender: UIButton) {
        RoomRouter.shared.currentViewController()?.navigationController?.popViewController(animated: true)
    }
    
    func allAgreeStageAction(sender: UIButton, view: RaiseHandApplicationListView) {
        for userInfo in EngineManager.shared.store.inviteSeatList {
            guard let requestId = EngineManager.shared.store.inviteSeatMap[userInfo.userId] else { continue }
            EngineManager.shared.roomEngine.responseRemoteRequest(requestId, agree: true) {
                EngineManager.shared.store.inviteSeatList = EngineManager.shared.store.inviteSeatList.filter { userModel in
                    userModel.userId != userInfo.userId
                }
                EngineManager.shared.store.inviteSeatMap.removeValue(forKey: userInfo.userId)
                EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_RenewSeatList, param: [:])
            } onError: { _, _ in
                debugPrint("")
            }
        }
    }
    
    func inviteMemberAction(sender: UIButton, view: RaiseHandApplicationListView) {
        RoomRouter.shared.pushUserListViewController()
    }
    
    func agreeStageAction(sender: UIButton, isAgree: Bool, userId: String) {
        guard let requestId = EngineManager.shared.store.inviteSeatMap[userId] else { return }
        EngineManager.shared.roomEngine.responseRemoteRequest(requestId, agree: isAgree) {
            EngineManager.shared.store.inviteSeatList = EngineManager.shared.store.inviteSeatList.filter { userModel in
                return userModel.userId != userId
            }
            EngineManager.shared.store.inviteSeatMap.removeValue(forKey: userId)
            EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_RenewSeatList, param: [:])
        } onError: { _, _ in
            debugPrint("")
        }
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}
