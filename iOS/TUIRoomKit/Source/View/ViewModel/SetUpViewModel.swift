//
//  SetUpViewModel.swift
//  TUIRoomKit
//
//  Created by 唐佳宁 on 2023/1/16.
//  Copyright © 2023 Tencent. All rights reserved.
//

import Foundation
import TUIRoomEngine
#if TXLiteAVSDK_TRTC
import TXLiteAVSDK_TRTC
#elseif TXLiteAVSDK_Professional
import TXLiteAVSDK_Professional
#endif

class SetUpViewModel {
    enum SetUpItemType {
        case videoType
        case audioType
        case shareType
    }
    private(set) var topItems: [ButtonItemData] = []
    private(set) var videoItems: [ListCellItemData] = []
    private(set) var audioItems: [ListCellItemData] = []
    private(set) var videoModel: VideoModel
    private(set) var audioModel: AudioModel
    private(set) var videoResolution: TRTCVideoResolution = ._960_540
    private(set) var videoFPS: Int32 = 15
    private(set) var videoBitrate: Int32 = 900
    
    let frameArray = ["15", "20"]
    
    let bitrateTable = [BitrateTableData](
        arrayLiteral:
            BitrateTableData(resolutionName: "180 * 320",
                             resolution: TRTCVideoResolution._320_180.rawValue,
                             defaultBitrate: 350,
                             minBitrate: 80,
                             maxBitrate: 350,
                             stepBitrate: 10),
        BitrateTableData(resolutionName: "270 * 480",
                         resolution: TRTCVideoResolution._480_270.rawValue,
                         defaultBitrate: 500,
                         minBitrate: 200,
                         maxBitrate: 1_000,
                         stepBitrate: 10),
        BitrateTableData(resolutionName: "360 * 640",
                         resolution: TRTCVideoResolution._640_360.rawValue,
                         defaultBitrate: 600,
                         minBitrate: 200,
                         maxBitrate: 1_000,
                         stepBitrate: 10),
        BitrateTableData(resolutionName: "540 * 960",
                         resolution: TRTCVideoResolution._960_540.rawValue,
                         defaultBitrate: 900,
                         minBitrate: 400,
                         maxBitrate: 1_600,
                         stepBitrate: 50),
        BitrateTableData(resolutionName: "720 * 1280",
                         resolution: TRTCVideoResolution._1280_720.rawValue,
                         defaultBitrate: 1_250,
                         minBitrate: 500,
                         maxBitrate: 2_000,
                         stepBitrate: 50)
    )
    
    let frameRateTable = [BitrateTableData](
        arrayLiteral:
            BitrateTableData(resolutionName: "15",
                             resolution: TRTCVideoResolution._320_180.rawValue,
                             defaultBitrate: 350,
                             minBitrate: 80,
                             maxBitrate: 350,
                             stepBitrate: 10),
        BitrateTableData(resolutionName: "20",
                         resolution: TRTCVideoResolution._480_270.rawValue,
                         defaultBitrate: 500,
                         minBitrate: 200,
                         maxBitrate: 1_000,
                         stepBitrate: 10)
    )
    
    init(videoModel: VideoModel, audioModel: AudioModel) {
        self.videoModel = videoModel
        self.audioModel = audioModel
        createTopItem()
        createVideoItem()
        createAudioItem()
    }
    
    func createTopItem() {
        let videoSetItem = ButtonItemData()
        videoSetItem.normalTitle = .videoText
        videoSetItem.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.videoSetAction(sender: button)
        }
        topItems.append(videoSetItem)
        
        let audioSetItem = ButtonItemData()
        audioSetItem.normalTitle = .audioText
        audioSetItem.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.audioSetAction(sender: button)
        }
        topItems.append(audioSetItem)
        
        let shareItem = ButtonItemData()
        shareItem.normalTitle = .shareText
        shareItem.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.shareAction(sender: button)
        }
        topItems.append(shareItem)
    }
    
    func updateSetUpItemView(item: ListCellItemData, listIndex: Int, pageIndex: Int) {
        if let view = RoomRouter.shared.currentViewController()?.view as? PopUpView, let rootView = view.rootView as? SetUpView? {
            if let view = rootView?.segmentScrollView.subviews[pageIndex] as? SetUpItemView {
                view.updateStackView(item: item, index: listIndex)
            }
        }
    }
    
    func videoSetAction(sender: UIButton) {
        if let view = RoomRouter.shared.currentViewController()?.view as? PopUpView, let rootView = view.rootView as? SetUpView? {
            rootView?.updateSegmentScrollView(selectedIndex: 0)
        }
    }
    
    func audioSetAction(sender: UIButton) {
        if let view = RoomRouter.shared.currentViewController()?.view as? PopUpView, let rootView = view.rootView as? SetUpView? {
            rootView?.updateSegmentScrollView(selectedIndex: 1)
        }
    }
    
    func shareAction(sender: UIButton) {
        if let view = RoomRouter.shared.currentViewController()?.view as? PopUpView, let rootView = view.rootView as? SetUpView? {
            rootView?.updateSegmentScrollView(selectedIndex: 2)
        }
    }
    
    func createVideoItem() {
        let resolutionItem = ListCellItemData()
        resolutionItem.titleText = .resolutionText
        resolutionItem.messageText = EngineManager.shared.store.videoSetting.bitrate.resolutionName
        resolutionItem.hasOverAllAction = true
        resolutionItem.action = { [weak self] sender in
            guard let self = self, let view = sender as? UIView else { return }
            self.resolutionAction(sender: view)
        }
        videoItems.append(resolutionItem)
        
        let frameRateItem = ListCellItemData()
        frameRateItem.titleText = .frameRateText
        frameRateItem.messageText = EngineManager.shared.store.videoSetting.frameText
        frameRateItem.hasOverAllAction = true
        frameRateItem.action = { [weak self] sender in
            guard let self = self, let view = sender as? UIView else { return }
            self.frameRateAction(sender: view)
        }
        videoItems.append(frameRateItem)
        
        let bitrateItem = ListCellItemData()
        bitrateItem.titleText = .bitrateText
        bitrateItem.hasSlider = true
        bitrateItem.hasSliderLabel = true
        bitrateItem.minimumValue = EngineManager.shared.store.videoSetting.bitrate.minBitrate
        bitrateItem.maximumValue = EngineManager.shared.store.videoSetting.bitrate.maxBitrate
        bitrateItem.sliderUnit = "kbps"
        bitrateItem.sliderStep = EngineManager.shared.store.videoSetting.bitrate.stepBitrate
        bitrateItem.sliderDefault = EngineManager.shared.store.videoSetting.bitrate.defaultBitrate
        bitrateItem.action = { [weak self] sender in
            guard let self = self, let view = sender as? UISlider else { return }
            self.bitrateAction(sender: view)
        }
        videoItems.append(bitrateItem)
        
        let localMirrorItem = ListCellItemData()
        localMirrorItem.titleText = .localMirrorText
        localMirrorItem.hasSwitch = true
        localMirrorItem.action = { [weak self] sender in
            guard let self = self, let view = sender as? UISwitch else { return }
            self.localMirrorAction(sender: view)
        }
        videoItems.append(localMirrorItem)
    }
    
    func resolutionAction(sender: UIView) {
        guard let window = RoomRouter.shared.currentViewController()?.view.window else { return }
        let alert = ResolutionAlert()
        alert.dataSource = bitrateTable
        alert.selectIndex = videoModel.bitrateIndex
        window.addSubview(alert)
        alert.snp.makeConstraints { make in
            make.edges.equalToSuperview()
        }
        window.layoutIfNeeded()
        alert.show()
        alert.didSelectItem = { [weak self, weak alert] index in
            guard let `self` = self, let alert = alert else { return }
            self.videoItems[0].messageText = self.bitrateTable[index].resolutionName
            self.updateSetUpItemView(item: self.videoItems[0], listIndex: 0, pageIndex: 1)
            self.updateResolution(index: index)
            alert.dismiss()
        }
    }
    
    func updateResolution(index: Int) {
        videoModel.bitrateIndex = index
        videoModel.bitrate = bitrateTable[index]
        EngineManager.shared.store.videoSetting = videoModel
        let item = videoModel.bitrate
        guard let resolution = TRTCVideoResolution(rawValue: item.resolution) else {
            return
        }
        videoResolution = resolution
        updateVideoEncoderParam()
        videoItems[2].minimumValue = item.minBitrate / item.stepBitrate
        videoItems[2].maximumValue = item.maxBitrate / item.stepBitrate
        videoItems[2].sliderDefault = item.defaultBitrate / item.stepBitrate
        videoItems[2].sliderStep = item.stepBitrate
        self.updateSetUpItemView(item: self.videoItems[2], listIndex: 2, pageIndex: 1)
    }
    
    func updateVideoEncoderParam() {
        let param = TRTCVideoEncParam()
        param.videoResolution = videoResolution
        param.videoBitrate = videoBitrate
        param.videoFps = videoFPS
        param.resMode = .portrait
        param.enableAdjustRes = true
        EngineManager.shared.roomEngine.getTRTCCloud().setVideoEncoderParam(param)
    }
    
    func frameRateAction(sender: UIView) {
        guard let window = RoomRouter.shared.currentViewController()?.view.window else { return }
        let alert = ResolutionAlert()
        alert.backgroundColor = UIColor(0x1B1E26)
        alert.dataSource = frameRateTable
        alert.selectIndex = videoModel.frameIndex
        window.addSubview(alert)
        alert.snp.makeConstraints { make in
            make.edges.equalToSuperview()
        }
        window.layoutIfNeeded()
        alert.show()
        alert.didSelectItem = { [weak self, weak alert] index in
            guard let `self` = self, let alert = alert else { return }
            self.videoItems[1].messageText = self.frameRateTable[index].resolutionName
            self.updateSetUpItemView(item: self.videoItems[1], listIndex: 1, pageIndex: 1)
            self.updateFps(index: index)
            alert.dismiss()
        }
    }
    
    func updateFps(index: Int) {
        videoModel.frameIndex = index
        videoModel.frameText = frameArray[index]
        EngineManager.shared.store.videoSetting = videoModel
        guard let fps = Int32(frameArray[index]) else {
            return
        }
        videoFPS = fps
        updateVideoEncoderParam()
    }
    
    func bitrateAction(sender: UISlider) {
        let bitrate = Int(sender.value * videoModel.bitrate.stepBitrate)
        videoBitrate = Int32(bitrate)
        updateVideoEncoderParam()
    }
    
    func localMirrorAction(sender: UISwitch) {
        EngineManager.shared.store.videoSetting.isMirror = sender.isOn
        let params = TRTCRenderParams()
        params.fillMode = .fill
        params.rotation = ._0
        if EngineManager.shared.store.videoSetting.isMirror {
            params.mirrorType = .enable
        } else {
            params.mirrorType = .disable
        }
        EngineManager.shared.roomEngine.getTRTCCloud().setLocalRenderParams(params)
        videoModel.isMirror = sender.isOn
        EngineManager.shared.store.videoSetting = videoModel
    }
    
    func createAudioItem() {
        let captureVolumeItem = ListCellItemData()
        captureVolumeItem.titleText = .captureVolumeText
        captureVolumeItem.hasSlider = true
        captureVolumeItem.hasSliderLabel = true
        captureVolumeItem.minimumValue = 0
        captureVolumeItem.maximumValue = 100
        captureVolumeItem.sliderStep = 1
        captureVolumeItem.sliderDefault = 100
        captureVolumeItem.action = { [weak self] sender in
            guard let self = self, let view = sender as? UISlider else { return }
            self.captureVolumeAction(sender: view)
        }
        audioItems.append(captureVolumeItem)
        
        let playingVolumeItem = ListCellItemData()
        playingVolumeItem.titleText = .captureVolumeText
        playingVolumeItem.hasSlider = true
        playingVolumeItem.hasSliderLabel = true
        playingVolumeItem.minimumValue = 0
        playingVolumeItem.maximumValue = 100
        playingVolumeItem.sliderStep = 1
        playingVolumeItem.sliderDefault = 100
        playingVolumeItem.action = { [weak self] sender in
            guard let self = self, let view = sender as? UISlider else { return }
            self.playingVolumeAction(sender: view)
        }
        audioItems.append(playingVolumeItem)
        
        let volumePromptItem = ListCellItemData()
        volumePromptItem.titleText = .volumePromptText
        volumePromptItem.hasSwitch = true
        volumePromptItem.action = { [weak self] sender in
            guard let self = self, let view = sender as? UISwitch else { return }
            self.volumePromptAction(sender: view)
        }
        audioItems.append(volumePromptItem)
        
        let audioRecordingItem = ListCellItemData()
        audioRecordingItem.titleText = .audioRecordingText
        audioRecordingItem.hasSwitch = true
        audioRecordingItem.action = { [weak self] sender in
            guard let self = self, let view = sender as? UISwitch else { return }
            self.audioRecordingAction(sender: view)
        }
        audioItems.append(audioRecordingItem)
        
    }
    
    func captureVolumeAction(sender: UISlider) {
        EngineManager.shared.roomEngine.getTRTCCloud().setAudioCaptureVolume(Int(sender.value))
        audioModel.captureVolume = Int(sender.value)
        EngineManager.shared.store.audioSetting = audioModel
    }
    
    func playingVolumeAction(sender: UISlider) {
        EngineManager.shared.roomEngine.getTRTCCloud().setAudioPlayoutVolume(Int(sender.value))
        audioModel.playVolume = Int(sender.value)
        EngineManager.shared.store.audioSetting = audioModel
    }
    
    func volumePromptAction(sender: UISwitch) {
        if sender.isOn {
            EngineManager.shared.roomEngine.getTRTCCloud().enableAudioVolumeEvaluation(300)
        } else {
            EngineManager.shared.roomEngine.getTRTCCloud().enableAudioVolumeEvaluation(0)
        }
        audioModel.volumePrompt = sender.isOn
        EngineManager.shared.store.audioSetting = audioModel
    }
    
    func audioRecordingAction(sender: UISwitch) {
        guard let file_path = NSSearchPathForDirectoriesInDomains(FileManager.SearchPathDirectory.documentDirectory,
                                                                  FileManager.SearchPathDomainMask.userDomainMask,
                                                                  true).last?.appending("/test-record.aac") else {
            return
        }
        
        if sender.isOn {
            let params = TRTCAudioRecordingParams()
            params.filePath = file_path
            EngineManager.shared.roomEngine.startPushLocalAudio()
        } else {
            EngineManager.shared.roomEngine.stopPushLocalAudio()
            let message = .recordingSavePathText + file_path
            let alertVC = UIAlertController(title: .promptText, message: message, preferredStyle: UIAlertController.Style.alert)
            let okView = UIAlertAction(title: .confirmText,
                                       style: UIAlertAction.Style.default,
                                       handler: { (_: UIAlertAction) in
            })
            alertVC.addAction(okView)
            RoomRouter.shared.currentViewController()?.present(alertVC, animated: true, completion: nil)
        }
        audioModel.isRecord = sender.isOn
        EngineManager.shared.store.audioSetting = audioModel
    }
    
    func shareStartAction(sender: UIButton) {
        if #available(iOS 12.0, *) {
            let roomEngine = EngineManager.shared.roomEngine
            roomEngine.startScreenCapture(appGroup: "com.tencent.TUIRoomTXReplayKit-Screen")
            BroadcastLauncher.launch()
            roomEngine.closeLocalCamera()
        } else {
            RoomRouter.shared.currentViewController()?.view.window?.makeToast(.versionLowToastText)
        }
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}

private extension String {
    static let videoText = localized("TUIRoom.video")
    static let audioText = localized("TUIRoom.audio")
    static let shareText = localized("TUIRoom.share")
    static let versionLowToastText = localized("TUIRoom.version.too.low")
    static let resolutionText = localized("TUIRoom.resolution")
    static let frameRateText = localized("TUIRoom.frame.rate")
    static let bitrateText = localized("TUIRoom.bitrate")
    static let localMirrorText = localized("TUIRoom.local.mirror")
    static let captureVolumeText = localized("TUIRoom.capture.volume")
    static let volumePromptText = localized("TUIRoom.volume.prompt")
    static let audioRecordingText = localized("TUIRoom.audio.recording")
    static let recordingSavePathText = localized("TUIRoom.recording.save.path")
    static let promptText = localized("TUIRoom.prompt")
    static let confirmText = localized("TUIRoom.ok")
}
