//
//  PrePareViewModel.swift
//  TUIRoomKit
//
//  Created by aby on 2022/12/26.
//  Copyright © 2022 Tencent. All rights reserved.
//

import Foundation
import TUICore
#if TXLiteAVSDK_TRTC
import TXLiteAVSDK_TRTC
#elseif TXLiteAVSDK_Professional
import TXLiteAVSDK_Professional
#endif

class PrePareViewModel {
    weak var rootView: PrePareView?
    var enablePrePareView: Bool = true
    
    func initialState(view: UIView) {
        let roomEngine = EngineManager.shared.roomEngine
        if let rootView = self.rootView {
            roomEngine.setLocalVideoView(streamType: .cameraStream, view: rootView.prePareView)
        } else {
            roomEngine.setLocalVideoView(streamType: .cameraStream, view: view)
        }
        
        if EngineManager.shared.store.roomInfo.isOpenCamera {
            roomEngine.openLocalCamera(isFront: true) {
                debugPrint("")
            } onError: { code, message in
                debugPrint("---openLocalCamera,code:\(code),message:\(message)")
            }
        } else {
            roomEngine.closeLocalCamera()
        }
        if EngineManager.shared.store.roomInfo.isOpenMicrophone {
            roomEngine.openLocalMicrophone {
                debugPrint("")
            } onError: { code, message in
                debugPrint("---openLocalMicrophone,code:\(code), message:\(message)")
            }
        } else {
            roomEngine.closeLocalMicrophone()
        }
        rootView?.updateButtonState()
    }
    
    func closeLocalCamera() {
        EngineManager.shared.roomEngine.closeLocalCamera()
    }
    
    func closeLocalMicrophone() {
        EngineManager.shared.roomEngine.closeLocalCamera()
    }
    
    func backAction() {
        EngineManager.shared.logout()
        RoomRouter.shared.currentViewController()?.dismiss(animated: true)
    }
    
    func joinRoom() {
        RoomRouter.shared.pushJoinRoomViewController()
    }
    
    func createRoom() {
        RoomRouter.shared.pushCreateRoomViewController()
    }
    
    func switchLanguageAction() {
        
    }
    
    func openCameraAction(sender: UIButton, placeholderImage: UIView) {
        sender.isSelected = !sender.isSelected
        let roomEngine = EngineManager.shared.roomEngine
        if sender.isSelected {
            EngineManager.shared.store.roomInfo.isOpenCamera = false
            roomEngine.closeLocalCamera()
            roomEngine.stopPushLocalVideo()
            placeholderImage.isHidden = false
        } else {
            EngineManager.shared.store.roomInfo.isOpenCamera = true
            placeholderImage.isHidden = true
            roomEngine.openLocalCamera(isFront: true) {
                roomEngine.startPushLocalVideo()
            } onError: { code, message in
                debugPrint("openLocalCamera,code:\(code),message:\(message)")
            }
        }
    }
    
    func openMicrophoneAction(sender: UIButton) {
        sender.isSelected = !sender.isSelected
        let roomEngine = EngineManager.shared.roomEngine
        if sender.isSelected {
            EngineManager.shared.store.roomInfo.isOpenMicrophone = false
            roomEngine.closeLocalMicrophone()
            roomEngine.stopPushLocalAudio()
        } else {
            EngineManager.shared.store.roomInfo.isOpenMicrophone = true
            roomEngine.openLocalMicrophone {
                roomEngine.startPushLocalAudio()
            } onError: { code, message in
                debugPrint("openLocalMicrophone,code:\(code), message:\(message)")
            }
        }
    }
    
    func switchCameraAction(sender: UIButton) {
        sender.isSelected = !sender.isSelected
        let roomEngine = EngineManager.shared.roomEngine
        roomEngine.getTRTCCloud().getDeviceManager().switchCamera(!sender.isSelected)
    }
    
    func switchMirrorAction(sender: UIButton) {
        sender.isSelected = !sender.isSelected
        let params = TRTCRenderParams()
        params.fillMode = .fill
        params.rotation = ._0
        if !sender.isSelected {
            params.mirrorType = .enable
        } else {
            params.mirrorType = .disable
        }
        EngineManager.shared.roomEngine.getTRTCCloud().setLocalRenderParams(params)
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}

private extension String {
    static let exitLoginText = localized("TUIRoom.exit.login")
    static let cancelText = localized("TUIRoom.cancel")
}
