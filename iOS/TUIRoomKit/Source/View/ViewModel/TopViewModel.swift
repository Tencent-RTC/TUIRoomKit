//
//  TopViewModel.swift
//  TUIRoomKit
//
//  Created by 唐佳宁 on 2022/12/30.
//  Copyright © 2022 Tencent. All rights reserved.
//

import Foundation
#if TXLiteAVSDK_TRTC
import TXLiteAVSDK_TRTC
#elseif TXLiteAVSDK_Professional
import TXLiteAVSDK_Professional
#endif

class TopViewModel {
    init() {
        createBottomData()
        initialStatus()
    }
    
    private(set) var viewItems: [ButtonItemData] = []
    
    func createBottomData() {
        let micItem = ButtonItemData()
        micItem.normalIcon = "room_earpiece"
        micItem.selectedIcon = "room_speakerphone"
        micItem.backgroundColor = UIColor(0xA3AEC7)
        micItem.resourceBundle = tuiRoomKitBundle()
        micItem.isSelect = EngineManager.shared.store.roomInfo.isUseSpeaker
        micItem.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.micItemAction(sender: button)
        }
        viewItems.append(micItem)
        
        let cameraItem = ButtonItemData()
        cameraItem.normalIcon = "room_switch_camera"//todo
        cameraItem.backgroundColor = UIColor(0xA3AEC7)
        cameraItem.resourceBundle = tuiRoomKitBundle()
        cameraItem.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.cameraItemAction(sender: button)
        }
        viewItems.append(cameraItem)
        
        let mirrorItem = ButtonItemData()
        mirrorItem.normalIcon = "room_mirror"//todo
        mirrorItem.backgroundColor = UIColor(0xA3AEC7)
        mirrorItem.resourceBundle = tuiRoomKitBundle()
        mirrorItem.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.mirrorItemAction(sender: button)
        }
        viewItems.append(mirrorItem)
    }
    
    func initialStatus() {
        if EngineManager.shared.store.roomInfo.isUseSpeaker {
            EngineManager.shared.roomEngine.getTRTCCloud().setAudioRoute(.modeSpeakerphone)
        } else {
            EngineManager.shared.roomEngine.getTRTCCloud().setAudioRoute(.modeEarpiece)
        }
    }
    
    func micItemAction(sender: UIButton) {
        sender.isSelected = !sender.isSelected
        if sender.isSelected {
            EngineManager.shared.roomEngine.getTRTCCloud().setAudioRoute(.modeSpeakerphone)
        } else {
            EngineManager.shared.roomEngine.getTRTCCloud().setAudioRoute(.modeEarpiece)
        }
    }
    
    func cameraItemAction(sender: UIButton) {
        EngineManager.shared.store.videoSetting.isFrontCamera = !EngineManager.shared.store.videoSetting.isFrontCamera
        let roomEngine = EngineManager.shared.roomEngine
        roomEngine.getDeviceManager().switchCamera(EngineManager.shared.store.videoSetting.isFrontCamera)
    }
    
    func mirrorItemAction(sender: UIButton) {
        EngineManager.shared.store.videoSetting.isMirror = !EngineManager.shared.store.videoSetting.isMirror
        let params = TRTCRenderParams()
        params.fillMode = .fill
        params.rotation = ._0
        if EngineManager.shared.store.videoSetting.isMirror {
            params.mirrorType = .enable
        } else {
            params.mirrorType = .disable
        }
        EngineManager.shared.roomEngine.getTRTCCloud().setLocalRenderParams(params)
    }
    
    func dropDownAction(sender: UIView) {
        RoomRouter.shared.presentPopUpViewController(viewType: .roomInfoViewType, height: 350)
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}
