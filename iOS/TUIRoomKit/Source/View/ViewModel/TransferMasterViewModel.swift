//
//  TransferMasterViewModel.swift
//  TUIRoomKit
//
//  Created by 唐佳宁 on 2023/2/20.
//

import Foundation

protocol TransferMasterViewResponder: NSObject {
    func reloadTransferMasterTableView()
    func searchControllerChangeActive(isActive: Bool)
}

class TransferMasterViewModel {
    var attendeeList: [UserModel]
    var userId: String
    weak var viewResponder: TransferMasterViewResponder? = nil
    init() {
        attendeeList = EngineManager.shared.store.attendeeList.filter({ userModel in
            userModel.userId != EngineManager.shared.store.currentUser.userId
        })
        userId = ""
    }
    
    func backAction() {
        RoomRouter.shared.dismissPopupViewController(viewType: .transferMasterViewType)
    }
    
    func appointMasterAction(sender: UIButton) {
        guard userId != "" else { return }
        EngineManager.shared.roomEngine.changeUserRole(userId: userId, role: .roomOwner) { [weak self] in
            guard let self = self else { return }
            self.closeLocalDevice()
            EngineManager.shared.exitRoom()
        } onError: { [weak self] code, message in
            guard let self = self else { return }
            self.closeLocalDevice()
            EngineManager.shared.destroyRoom()
            debugPrint("changeUserRole:code:\(code),message:\(message)")
        }
    }
    
    private func closeLocalDevice() {
        let roomEngine = EngineManager.shared.roomEngine
        roomEngine.closeLocalCamera()
        roomEngine.closeLocalMicrophone()
        roomEngine.stopPushLocalAudio()
        roomEngine.stopPushLocalVideo()
        roomEngine.stopScreenCapture()
        roomEngine.getTRTCCloud().setLocalVideoProcessDelegete(nil, pixelFormat: ._Texture_2D, bufferType: .texture)
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}

extension TransferMasterViewModel: PopUpViewResponder {
    func updateViewOrientation(isLandscape: Bool) {
        viewResponder?.searchControllerChangeActive(isActive: false)
        attendeeList = EngineManager.shared.store.attendeeList
        viewResponder?.reloadTransferMasterTableView()
    }
    
    func searchControllerChangeActive(isActive: Bool) {
        viewResponder?.searchControllerChangeActive(isActive: isActive)
    }
}
