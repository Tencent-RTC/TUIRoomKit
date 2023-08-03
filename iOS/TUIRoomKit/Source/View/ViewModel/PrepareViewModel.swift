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

protocol PrePareViewEventProtocol: AnyObject {
    func updateButtonState()
    func changeLanguage()
}

class PrePareViewModel {
    weak var viewResponder: PrePareViewEventProtocol?
    var enablePrePareView: Bool = true
    var engineManager: EngineManager {
        EngineManager.shared
    }
    var currentUser: UserModel {
        engineManager.store.currentLoginUser
    }
    var roomInfo: RoomInfo {
        engineManager.store.roomInfo
    }
    var languageID: String {
        TUIGlobalization.tk_localizableLanguageKey()
    }
    
    func initialState(view: UIView) {
        let params = TRTCRenderParams()
        if self.engineManager.store.videoSetting.isMirror {
            params.mirrorType = .enable
        } else {
            params.mirrorType = .disable
        }
        let roomEngine = engineManager.roomEngine
        roomEngine.getTRTCCloud().setLocalRenderParams(params)
        roomEngine.getTRTCCloud().setGSensorMode(.uiFixLayout)
        roomEngine.setLocalVideoView(streamType: .cameraStream, view: view)
        if roomInfo.isOpenCamera {
            engineManager.openLocalCamera()
        } else {
            engineManager.closeLocalCamera()
        }
        if roomInfo.isOpenMicrophone {
            openLocalMicrophone()
        } else {
            roomEngine.closeLocalMicrophone()
        }
        viewResponder?.updateButtonState()
    }
    
    func closeLocalCamera() {
        engineManager.roomEngine.closeLocalCamera()
    }
    
    func closeLocalMicrophone() {
        engineManager.roomEngine.closeLocalMicrophone()
    }
    
    func backAction() {
        RoomRouter.shared.pop()
    }
    
    func joinRoom() {
        RoomRouter.shared.pushJoinRoomViewController()
    }
    
    func createRoom() {
        RoomRouter.shared.pushCreateRoomViewController()
    }
    
    func switchLanguageAction() {
        if languageID == "zh-Hans" {
            TUIGlobalization.setPreferredLanguage("en")
        } else if languageID == "en" {
            TUIGlobalization.setPreferredLanguage("zh-Hans")
        }
        viewResponder?.changeLanguage()
    }
    
    func openCameraAction(sender: UIButton, placeholderImage: UIView) {
        sender.isSelected = !sender.isSelected
        if sender.isSelected {
            engineManager.closeLocalCamera()
            placeholderImage.isHidden = false
        } else {
            placeholderImage.isHidden = true
            engineManager.openLocalCamera()
        }
    }
    
    func openMicrophoneAction(sender: UIButton) {
        sender.isSelected = !sender.isSelected
        let roomEngine = engineManager.roomEngine
        if sender.isSelected {
            roomInfo.isOpenMicrophone = false
            roomEngine.closeLocalMicrophone()
        } else {
            roomInfo.isOpenMicrophone = true
            openLocalMicrophone()
        }
    }
    
    private func openLocalMicrophone() {
        let actionBlock = { [weak self] in
            guard let self = self else { return }
            self.engineManager.roomEngine.openLocalMicrophone(self.engineManager.store.audioSetting.audioQuality) {
            } onError: { code, message in
                debugPrint("---openLocalMicrophone,code:\(code), message:\(message)")
            }
        }
        if RoomCommon.checkAuthorMicStatusIsDenied() {
            actionBlock()
        } else {
            RoomCommon.micStateActionWithPopCompletion {
                if RoomCommon.checkAuthorMicStatusIsDenied() {
                    actionBlock()
                }
            }
        }
    }
    
    func switchCameraAction(sender: UIButton) {
        engineManager.store.videoSetting.isFrontCamera = !engineManager.store.videoSetting.isFrontCamera
        engineManager.roomEngine.getDeviceManager().switchCamera(engineManager.store.videoSetting.isFrontCamera)
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
        TRTCCloud.destroySharedIntance()
        debugPrint("deinit \(self)")
    }
}
