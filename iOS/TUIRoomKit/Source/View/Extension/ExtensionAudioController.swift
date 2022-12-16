//
//  ExtensionAudioController.swift
//  TUIRoom
//
//  Created by WesleyLei on 2021/12/16.
//  Copyright © 2021 Tencent. All rights reserved.
//

import TUIRoomEngine
import TXAppBasic
import UIKit
#if TXLiteAVSDK_TRTC
import TXLiteAVSDK_TRTC
#elseif TXLiteAVSDK_Professional
import TXLiteAVSDK_Professional
#endif

class ExtensionAudioController: UIViewController {
    var audioModel: AudioModel
    var volumePromptCallback: ((Bool) -> Void)?
    var roomPresenter: RoomPresenter
    lazy var captureVolumeLabel: UILabel = {
        let label = UILabel(frame: CGRect(x: 20, y: 30, width: 100, height: 25))
        label.textAlignment = NSTextAlignment.left
        label.text = .captureVolumeText
        label.font = UIFont.systemFont(ofSize: 18)
        label.textColor = .black
        label.adjustsFontSizeToFitWidth = true
        label.minimumScaleFactor = 0.5
        return label
    }()

    lazy var captureVolumeDescLabel: UILabel = {
        let label = UILabel(frame: CGRect(x: ScreenWidth - 20 - 30, y: 30, width: 30, height: 25))
        label.font = UIFont(name: "PingFangSC-Medium", size: 16)
        label.textColor = .black
        label.text = "\(audioModel.captureVolume)"
        return label
    }()

    lazy var playVolumeLabel: UILabel = {
        let label = UILabel(frame: CGRect(x: 20, y: 70, width: 100, height: 25))
        label.textAlignment = NSTextAlignment.left
        label.text = .playingVolumeText
        label.font = UIFont.systemFont(ofSize: 18)
        label.textColor = .black
        label.adjustsFontSizeToFitWidth = true
        label.minimumScaleFactor = 0.5
        return label
    }()

    lazy var playVolumeDescLabel: UILabel = {
        let label = UILabel(frame: CGRect(x: ScreenWidth - 20 - 30, y: 70, width: 30, height: 25))
        label.font = UIFont(name: "PingFangSC-Medium", size: 16)
        label.textColor = .black
        label.text = "\(audioModel.playVolume)"
        return label
    }()

    lazy var volumePromptLabel: UILabel = {
        let label = UILabel(frame: CGRect(x: 20, y: 110, width: 100, height: 25))
        label.textAlignment = NSTextAlignment.left
        label.text = .volumePromptText
        label.font = UIFont.systemFont(ofSize: 18)
        label.textColor = .black
        label.adjustsFontSizeToFitWidth = true
        label.minimumScaleFactor = 0.5
        return label
    }()

    lazy var audioRecordLabel: UILabel = {
        let label = UILabel(frame: CGRect(x: 20, y: 155, width: 100, height: 25))
        label.textAlignment = NSTextAlignment.left
        label.text = .audioRecordingText
        label.font = UIFont.systemFont(ofSize: 18)
        label.textColor = .black
        label.adjustsFontSizeToFitWidth = true
        label.minimumScaleFactor = 0.5
        return label
    }()

    lazy var captureVolumeSlider: UISlider = {
        let slider = UISlider(frame: CGRect(x: UIScreen.main.bounds.size.width / 3.0 * 1.2,
                                            y: 37,
                                            width: UIScreen.main.bounds.size.width / 2.0 - 30,
                                            height: 10))
        slider.minimumValue = 0
        slider.maximumValue = 100
        slider.value = 100
        slider.addTarget(self, action: #selector(captureVolumeSliderChanged), for: .valueChanged)
        return slider
    }()

    init(roomPresenter: RoomPresenter, audioModel: AudioModel) {
        self.roomPresenter = roomPresenter
        self.audioModel = audioModel
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    @objc func captureVolumeSliderChanged(slider: UISlider) {
        print(String.captureVolumeText, Int(slider.value))
        roomPresenter.getTRTCCloud().setAudioCaptureVolume(Int(slider.value))
        captureVolumeDescLabel.text = String(Int(slider.value))
        audioModel.captureVolume = Int(slider.value)
    }

    lazy var playVolumeSlider: UISlider = {
        let slider = UISlider(frame: CGRect(x: UIScreen.main.bounds.size.width / 3.0 * 1.2,
                                            y: 77,
                                            width: UIScreen.main.bounds.size.width / 2.0 - 30,
                                            height: 10))
        slider.minimumValue = 0
        slider.maximumValue = 100
        slider.value = 100
        slider.addTarget(self, action: #selector(playVolumeSliderChanged), for: .valueChanged)
        return slider
    }()

    @objc func playVolumeSliderChanged(slider: UISlider) {
        print(String.playingVolumeText, Int(slider.value))
        roomPresenter.getTRTCCloud().setAudioPlayoutVolume(Int(slider.value))
        playVolumeDescLabel.text = String(Int(slider.value))
        audioModel.playVolume = Int(slider.value)
    }

    lazy var volumePromptSwitch: UISwitch = {
        let sw = UISwitch(frame: CGRect(x: UIScreen.main.bounds.size.width / 7.0 * 5.4, y: 108, width: 80, height: 50))
        sw.onTintColor = .blue
        sw.isOn = true
        sw.addTarget(self, action: #selector(volumePromptChanged), for: .valueChanged)
        return sw
    }()

    @objc func volumePromptChanged(sw: UISwitch) {
        debugPrint(String.volumePromptSwitchText, sw.isOn)
        if let volumePromptCallback = volumePromptCallback {
            volumePromptCallback(sw.isOn)
        }
        if sw.isOn {
            roomPresenter.getTRTCCloud().enableAudioVolumeEvaluation(300)
        } else {
            roomPresenter.getTRTCCloud().enableAudioVolumeEvaluation(0)
        }
        audioModel.volumePrompt = sw.isOn
    }

    lazy var recordSwitch: UISwitch = {
        let sw = UISwitch(frame: CGRect(x: UIScreen.main.bounds.size.width / 7.0 * 5.4, y: 150, width: 80, height: 50))
        sw.onTintColor = .blue
        sw.isOn = false
        sw.addTarget(self, action: #selector(audioRecordingValueChanged), for: .valueChanged)
        return sw
    }()

    @objc func audioRecordingValueChanged(sw: UISwitch) {
        guard let file_path = NSSearchPathForDirectoriesInDomains(FileManager.SearchPathDirectory.documentDirectory,
                                                                  FileManager.SearchPathDomainMask.userDomainMask,
                                                                  true).last?.appending("/test-record.aac") else {
            return
        }

        if sw.isOn {
            let params = TRTCAudioRecordingParams()
            params.filePath = file_path
            roomPresenter.startPushLocalAudio()
        } else {
            roomPresenter.stopPushLocalAudio()
            let message = String.recordingSavePathText + file_path
            let alertVC = UIAlertController(title: .promptText, message: message, preferredStyle: UIAlertController.Style.alert)
            let okView = UIAlertAction(title: .confirmText,
                                       style: UIAlertAction.Style.default,
                                       handler: { (_: UIAlertAction) in
                                       })
            alertVC.addAction(okView)
            present(alertVC, animated: true, completion: nil)
        }
        audioModel.isRecord = sw.isOn
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        view.addSubview(playVolumeLabel)
        view.addSubview(captureVolumeLabel)
        view.addSubview(volumePromptLabel)
        view.addSubview(audioRecordLabel)

        view.addSubview(captureVolumeSlider)
        view.addSubview(playVolumeSlider)
        view.addSubview(volumePromptSwitch)
        view.addSubview(recordSwitch)

        view.addSubview(captureVolumeDescLabel)
        view.addSubview(playVolumeDescLabel)
        captureVolumeSlider.value = Float(audioModel.captureVolume)
        playVolumeSlider.value = Float(audioModel.playVolume)
        volumePromptSwitch.isOn = audioModel.volumePrompt
        recordSwitch.isOn = audioModel.isRecord
    }

    deinit {
        debugPrint("deinit \(self)")
    }
}

// MARK: - internationalization string

fileprivate extension String {
    static let captureVolumeText = tuiRoomKitLocalize("TUIRoom.capture.volume")
    static let playingVolumeText = tuiRoomKitLocalize("TUIRoom.play.volume")
    static let volumePromptText = tuiRoomKitLocalize("TUIRoom.volume.prompt")
    static let audioRecordingText = tuiRoomKitLocalize("TUIRoom.audio.recording")
    static let volumePromptSwitchText = tuiRoomKitLocalize("TUIRoom.volume.prompt.switch")
    static let startRecordingText = tuiRoomKitLocalize("TUIRoom.start.recording")
    static let endRecordingText = tuiRoomKitLocalize("TUIRoom.end.recording")
    static let recordingSavePathText = tuiRoomKitLocalize("TUIRoom.recording.save.path")
    static let promptText = tuiRoomKitLocalize("TUIRoom.prompt")
    static let confirmText = tuiRoomKitLocalize("TUIRoom.ok")
}
