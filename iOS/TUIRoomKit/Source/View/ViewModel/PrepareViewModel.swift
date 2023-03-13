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
    lazy var engineManager: EngineManager = {
        return EngineManager.shared
    }()
    lazy var currentUser: UserModel = {
        return engineManager.store.currentLoginUser
    }()
    lazy var roomInfo: RoomInfo = {
        return engineManager.store.roomInfo
    }()
    
    func initialState(view: UIView) {
        let roomEngine = engineManager.roomEngine
        if let rootView = self.rootView {
            roomEngine.setLocalVideoView(streamType: .cameraStream, view: rootView.prePareView)
        } else {
            roomEngine.setLocalVideoView(streamType: .cameraStream, view: view)
        }
        if roomInfo.isOpenCamera {
            roomEngine.openLocalCamera(isFront: engineManager.store.videoSetting.isFrontCamera) {
                debugPrint("")
            } onError: { code, message in
                debugPrint("---openLocalCamera,code:\(code),message:\(message)")
            }
        } else {
            roomEngine.closeLocalCamera()
        }
        if roomInfo.isOpenMicrophone {
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
        engineManager.roomEngine.closeLocalCamera()
    }
    
    func closeLocalMicrophone() {
        engineManager.roomEngine.closeLocalCamera()
    }
    
    func backAction() {
        engineManager.logout()
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
        let roomEngine = engineManager.roomEngine
        if sender.isSelected {
            roomInfo.isOpenCamera = false
            roomEngine.closeLocalCamera()
            roomEngine.stopPushLocalVideo()
            placeholderImage.isHidden = false
        } else {
            roomInfo.isOpenCamera = true
            placeholderImage.isHidden = true
            roomEngine.openLocalCamera(isFront: engineManager.store.videoSetting.isFrontCamera) {
                roomEngine.startPushLocalVideo()
            } onError: { code, message in
                debugPrint("openLocalCamera,code:\(code),message:\(message)")
            }
        }
    }
    
    func openMicrophoneAction(sender: UIButton) {
        sender.isSelected = !sender.isSelected
        let roomEngine = engineManager.roomEngine
        if sender.isSelected {
            roomInfo.isOpenMicrophone = false
            roomEngine.closeLocalMicrophone()
            roomEngine.stopPushLocalAudio()
        } else {
            roomInfo.isOpenMicrophone = true
            roomEngine.openLocalMicrophone {
                roomEngine.startPushLocalAudio()
            } onError: { code, message in
                debugPrint("openLocalMicrophone,code:\(code), message:\(message)")
            }
        }
    }
    
    func switchCameraAction(sender: UIButton) {
        engineManager.store.videoSetting.isFrontCamera = !engineManager.store.videoSetting.isFrontCamera
        engineManager.roomEngine.getTRTCCloud().getDeviceManager().switchCamera(engineManager.store.videoSetting.isFrontCamera)
    }
    
    func switchMirrorAction(sender: UIButton) {
        engineManager.store.videoSetting.isMirror = !engineManager.store.videoSetting.isMirror
        let params = TRTCRenderParams()
        params.fillMode = .fill
        params.rotation = ._0
        if engineManager.store.videoSetting.isMirror {
            params.mirrorType = .enable
        } else {
            params.mirrorType = .disable
        }
        engineManager.roomEngine.getTRTCCloud().setLocalRenderParams(params)
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}

private extension String {
    static let exitLoginText = localized("TUIRoom.exit.login")
    static let cancelText = localized("TUIRoom.cancel")
}
