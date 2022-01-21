//
//  TUIRoomSetAudioVC.swift
//  TUIRoom
//
//  Created by WesleyLei on 2021/12/16.
//  Copyright © 2021 Tencent. All rights reserved.
//

import TXAppBasic
import UIKit

class TUIRoomSetAudioModel {
    var captureVolume: Int = 100
    var playVolume: Int = 100
    var volumePrompt: Bool = true
    var isRecord: Bool = false
}

class TUIRoomSetAudioVC: UIViewController {
    var audioModel: TUIRoomSetAudioModel = TUIRoomSetAudioModel()
    var volumePromptCallback: ((Bool) -> Void)?

    // 采集音量
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

    // 播放音量
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

    // 音量提示
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

    // 音频录制
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

    // 采集音量Slider
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

    // 采集音量函数
    @objc func captureVolumeSliderChanged(slider: UISlider) {
        print(String.captureVolumeText, Int(slider.value))
        TUIRoomCore.shareInstance().setAudioCaptureVolume(Int(slider.value))
        captureVolumeDescLabel.text = String(Int(slider.value))
        audioModel.captureVolume = Int(slider.value)
    }

    // 播放音量Slider
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

    // 播放音量函数
    @objc func playVolumeSliderChanged(slider: UISlider) {
        print(String.playingVolumeText, Int(slider.value))
        TUIRoomCore.shareInstance().setAudioPlayVolume(Int(slider.value))
        playVolumeDescLabel.text = String(Int(slider.value))
        audioModel.playVolume = Int(slider.value)
    }

    // 音量提示switch
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
        TUIRoomCore.shareInstance().enableAudioEvaluation(sw.isOn)
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
            TUIRoomCore.shareInstance().startFileDumping(params)
        } else {
            TUIRoomCore.shareInstance().stopFileDumping()

            // 提示录制的文件路径
            let message = String.recordingSavePathText + file_path
            let alertVC = UIAlertController(title: .promptText, message: message, preferredStyle: UIAlertController.Style.alert)
            let okView = UIAlertAction(title: .confirmText,
                                       style: UIAlertAction.Style.default,
                                       handler: { (_: UIAlertAction) -> Void in
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
    static let captureVolumeText = tuiRoomLocalize("TUIRoom.capture.volume")
    static let playingVolumeText = tuiRoomLocalize("TUIRoom.play.volume")
    static let volumePromptText = tuiRoomLocalize("TUIRoom.volume.prompt")
    static let audioRecordingText = tuiRoomLocalize("TUIRoom.audio.recording")
    static let volumePromptSwitchText = tuiRoomLocalize("TUIRoom.volume.prompt.switch")
    static let startRecordingText = tuiRoomLocalize("TUIRoom.start.recording")
    static let endRecordingText = tuiRoomLocalize("TUIRoom.end.recording")
    static let recordingSavePathText = tuiRoomLocalize("TUIRoom.recording.save.path")
    static let promptText = tuiRoomLocalize("TUIRoom.prompt")
    static let confirmText = tuiRoomLocalize("TUIRoom.ok")
}
