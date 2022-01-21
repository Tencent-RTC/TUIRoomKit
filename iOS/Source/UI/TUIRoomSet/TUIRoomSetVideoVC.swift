//
//  TUIRoomSetVideoVC.swift
//  TUIRoom
//
//  Created by WesleyLei on 2021/12/16.
//  Copyright © 2021 Tencent. All rights reserved.
//

import TXAppBasic
import UIKit

class TUIRoomSetVideoModel {
    var frameText: String = "15"
    var frameIndex: Int = 0
    var bitrate: TUIRoomBitrateTable = TUIRoomBitrateTable(resolutionName: "540 * 960",
                                                           resolution: TRTCVideoResolution._960_540.rawValue,
                                                           defaultBitrate: 900,
                                                           minBitrate: 400,
                                                           maxBitrate: 1600,
                                                           stepBitrate: 50)
    var bitrateIndex: Int = 0
    var isMirror: Bool = true
}

class TUIRoomSetVideoVC: UIViewController,
                         UIPickerViewDelegate,
                         UIPickerViewDataSource {
    let TAG_RESOLUTION = 100
    let TAG_FPS = 200
    weak var resolutionAlert: TUIRoomResolutionAlert?
    var resolutionTextField = UITextField()
    var fpsTextField = UITextField()
    var videoModel: TUIRoomSetVideoModel = TUIRoomSetVideoModel()

    lazy var resolutionLabel: UILabel = {
        let label = UILabel(frame: CGRect(x: 20, y: 30, width: 100, height: 25))
        label.textAlignment = NSTextAlignment.left
        label.text = .resolutionText
        label.font = UIFont.systemFont(ofSize: 18)
        label.textColor = .black
        return label
    }()

    lazy var resolutionImageView: UIImageView = {
        let imageView = UIImageView(image:
                                        UIImage(named: "meeting_back",
                                                in: tuiRoomBundle(),
                                                compatibleWith: nil))
        imageView.transform = CGAffineTransform(rotationAngle: CGFloat(Double.pi))
        imageView.frame = CGRect(x: ScreenWidth - 20 - 16,
                                 y: 30 + (25 - 16) / 2,
                                 width: 16,
                                 height: 16)
        return imageView
    }()

    lazy var frameLabel: UILabel = {
        let label = UILabel(frame: CGRect(x: 20, y: 80, width: 100, height: 25))
        label.textAlignment = NSTextAlignment.left
        label.text = .framerateText
        label.font = UIFont.systemFont(ofSize: 18)
        label.textColor = .black
        return label
    }()

    lazy var frameImageView: UIImageView = {
        let imageView = UIImageView(image:
                                        UIImage(named: "meeting_back",
                                                in: tuiRoomBundle(),
                                                compatibleWith: nil))
        imageView.transform = CGAffineTransform(rotationAngle: CGFloat(Double.pi))
        imageView.frame = CGRect(x: ScreenWidth - 20 - 16, y: 80 + (25 - 16) / 2, width: 16, height: 16)
        return imageView
    }()

    lazy var bitrateLabel: UILabel = {
        let label = UILabel(frame: CGRect(x: 20, y: 130, width: 100, height: 25))
        label.textAlignment = NSTextAlignment.left
        label.text = .bitrateText
        label.font = UIFont.systemFont(ofSize: 18)
        label.textColor = .black
        return label
    }()

    lazy var mirrorLabel: UILabel = {
        let label = UILabel(frame: CGRect(x: 20, y: 180, width: 100, height: 25))
        label.textAlignment = NSTextAlignment.left
        label.text = .localmirrorText
        label.font = UIFont.systemFont(ofSize: 18)
        label.textColor = .black
        return label
    }()

    lazy var mirrorSwich: UISwitch = {
        let swich = UISwitch(frame: CGRect(x:
                                            UIScreen.main.bounds.size.width / 7.0 * 5.5,
                                           y: 177,
                                           width: 50,
                                           height: 23))
        swich.onTintColor = .blue
        swich.isOn = videoModel.isMirror // 默认是开启镜像的
        swich.addTarget(self, action: #selector(mirrorSwitchChanged), for: .valueChanged)
        return swich
    }()

    // 帧率
    let frameArray = ["15", "20"]

    // 创建码表, resolution 的值详见：TRTCVideoResolution
    let bitrateTable = [TUIRoomBitrateTable](
        arrayLiteral:
        TUIRoomBitrateTable(resolutionName: "180 * 320",
                            resolution: TRTCVideoResolution._320_180.rawValue,
                            defaultBitrate: 350,
                            minBitrate: 80,
                            maxBitrate: 350,
                            stepBitrate: 10),
        TUIRoomBitrateTable(resolutionName: "270 * 480",
                            resolution: TRTCVideoResolution._480_270.rawValue,
                            defaultBitrate: 500,
                            minBitrate: 200,
                            maxBitrate: 1000,
                            stepBitrate: 10),
        TUIRoomBitrateTable(resolutionName: "360 * 640",
                            resolution: TRTCVideoResolution._640_360.rawValue,
                            defaultBitrate: 600,
                            minBitrate: 200,
                            maxBitrate: 1000,
                            stepBitrate: 10),
        TUIRoomBitrateTable(resolutionName: "540 * 960",
                            resolution: TRTCVideoResolution._960_540.rawValue,
                            defaultBitrate: 900,
                            minBitrate: 400,
                            maxBitrate: 1600,
                            stepBitrate: 50),
        TUIRoomBitrateTable(resolutionName: "720 * 1280",
                            resolution: TRTCVideoResolution._1280_720.rawValue,
                            defaultBitrate: 1250,
                            minBitrate: 500,
                            maxBitrate: 2000,
                            stepBitrate: 50)
    )
    // 码率SliderView
    lazy var bitrateSlider: UISlider = {
        let slider = UISlider(frame:
                                CGRect(x: UIScreen.main.bounds.size.width / 7.0 * 2.5 - 8,
                                       y: 136,
                                       width: UIScreen.main.bounds.size.width / 2.0 * 0.8,
                                       height: 10))
        let item = videoModel.bitrate
        slider.minimumValue = item.minBitrate / item.stepBitrate
        slider.maximumValue = item.maxBitrate / item.stepBitrate
        slider.value = item.defaultBitrate / item.stepBitrate
        slider.addTarget(self, action: #selector(bitrateSliderChanged), for: .valueChanged)

        return slider
    }()

    // 码率显示label
    lazy var bitrateShowLabel: UILabel = {
        let label = UILabel(frame:
                                CGRect(x: UIScreen.main.bounds.size.width / 7.0 * 5.5,
                                       y: 130,
                                       width: 100,
                                       height: 20))
        label.textAlignment = NSTextAlignment.left
        label.textColor = .black
        label.font = UIFont.systemFont(ofSize: 18)
        label.text = String(Int(videoModel.bitrate.defaultBitrate)) + "kbps"
        return label
    }()

    // 本地镜像开关切换函数
    @objc func mirrorSwitchChanged(_ sw: UISwitch) {
        if sw.isOn {
            TUIRoomCore.shareInstance().setVideoMirror(.enable)
        } else {
            TUIRoomCore.shareInstance().setVideoMirror(.disable)
        }
        videoModel.isMirror = sw.isOn
    }

    // 滑动条拖动函数
    @objc func bitrateSliderChanged(_ slider: UISlider) {
        updateBitrate(bitrate: Int(slider.value * videoModel.bitrate.stepBitrate))
    }

    @objc func resolutionDidClick() {
        guard let window = ((view.window != nil) ?
                            view.window :
                                UIApplication.shared.windows.first) else {
            return
        }
        let alert = TUIRoomResolutionAlert()
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
            self.updateResolution(index: index)
            alert.dismiss()
        }
        resolutionAlert = alert
    }

    @objc func frameDidClick() {
        guard let window = ((view.window != nil) ?
                            view.window :
                                UIApplication.shared.windows.first) else {
            return
        }

        let dataSource = [
            TUIRoomBitrateTable(resolutionName: "15",
                                resolution: TRTCVideoResolution._320_180.rawValue,
                                defaultBitrate: 350,
                                minBitrate: 80,
                                maxBitrate: 350,
                                stepBitrate: 10),
            TUIRoomBitrateTable(resolutionName: "20",
                                resolution: TRTCVideoResolution._480_270.rawValue,
                                defaultBitrate: 500,
                                minBitrate: 200,
                                maxBitrate: 1000,
                                stepBitrate: 10),
        ]

        let alert = TUIRoomResolutionAlert()
        alert.dataSource = dataSource
        alert.selectIndex = videoModel.frameIndex
        window.addSubview(alert)
        alert.snp.makeConstraints { make in
            make.edges.equalToSuperview()
        }
        window.layoutIfNeeded()
        alert.show()
        alert.didSelectItem = { [weak self, weak alert] index in
            guard let `self` = self, let alert = alert else { return }
            self.updateFps(index: index)
            alert.dismiss()
        }
    }

    // 创建分辨率和帧率pickView以及textField
    @objc func setPickViewAndTextField() {
        // 分辨率：

        // 创建UITextField
        resolutionTextField = UITextField(frame:
                                            CGRect(x: UIScreen.main.bounds.size.width / 3.0,
                                                   y: 30,
                                                   width: UIScreen.main.bounds.size.width / 3.0,
                                                   height: 25))

        resolutionTextField.tintColor = .clear
        // 设置UITextField的tag值
        resolutionTextField.tag = TAG_RESOLUTION

        resolutionTextField.addGestureRecognizer(UITapGestureRecognizer(target:
                                                                            self,
                                                                        action: #selector(resolutionDidClick)))

        // 设置textField预设内容
        resolutionTextField.text = videoModel.bitrate.resolutionName

        resolutionTextField.backgroundColor = .clear
        resolutionTextField.textAlignment = .left

        resolutionTextField.textColor = .black

        view.addSubview(resolutionTextField)

        // 增加触控事件
        let tap = UITapGestureRecognizer(target: self,
                                         action: #selector(hideKeyboard(tapG:)))
        tap.cancelsTouchesInView = false
        view.addGestureRecognizer(tap)

        // 帧率：

        // 创建UITextField
        fpsTextField = UITextField(frame:
                                    CGRect(x: UIScreen.main.bounds.size.width / 3.0,
                                           y: 80,
                                           width: UIScreen.main.bounds.size.width / 3.0,
                                           height: 25))

        fpsTextField.tintColor = .clear
        // 设置UITextField的tag值
        fpsTextField.tag = TAG_FPS

        // 将textField视图转换成pickerView
        fpsTextField.addGestureRecognizer(UITapGestureRecognizer(target: self,
                                                                 action: #selector(frameDidClick)))

        // 设置textField预设内容
        fpsTextField.text = videoModel.frameText

        fpsTextField.backgroundColor = .clear
        fpsTextField.textAlignment = .left

        fpsTextField.textColor = .black

        view.addSubview(fpsTextField)
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        view.addSubview(bitrateShowLabel)
        view.addSubview(resolutionLabel)
        view.addSubview(frameLabel)
        view.addSubview(bitrateLabel)
        view.addSubview(mirrorLabel)
        view.addSubview(mirrorSwich)
        view.addSubview(bitrateSlider)

        view.addSubview(resolutionImageView)
        view.addSubview(frameImageView)

        setPickViewAndTextField()
    }

    func numberOfComponents(in pickerView: UIPickerView) -> Int {
        return 1
    }

    func pickerView(_ pickerView: UIPickerView,
                    numberOfRowsInComponent component: Int) -> Int {
        if pickerView.tag == TAG_RESOLUTION {
            return bitrateTable.count
        } else if pickerView.tag == TAG_FPS {
            return frameArray.count
        }
        return 1
    }

    func pickerView(_ pickerView: UIPickerView,
                    titleForRow row: Int,
                    forComponent component: Int) -> String? {
        if pickerView.tag == TAG_RESOLUTION {
            return bitrateTable[row].resolutionName
        } else if pickerView.tag == TAG_FPS {
            return frameArray[row]
        }
        return ""
    }

    func pickerView(_ pickerView: UIPickerView,
                    didSelectRow row: Int,
                    inComponent component: Int) {
        if pickerView.tag == TAG_RESOLUTION {
            print(String.resolutionSelectedText)
            updateResolution(index: row)

        } else if pickerView.tag == TAG_FPS {
            print(String.framerateSelectedText)
            updateFps(index: row)
        }
    }

    func updateResolution(index: Int) {
        videoModel.bitrateIndex = index
        videoModel.bitrate = bitrateTable[index]
        let item = videoModel.bitrate
        // 更新分辨率
        resolutionTextField.text = item.resolutionName
        guard let resolution = TRTCVideoResolution(rawValue: item.resolution) else {
            return
        }
        TUIRoomCore.shareInstance().setVideoResolution(resolution)

        // 设置码率进度条 && 更新码率
        bitrateSlider.minimumValue = item.minBitrate / item.stepBitrate
        bitrateSlider.maximumValue = item.maxBitrate / item.stepBitrate
        bitrateSlider.value = item.defaultBitrate / item.stepBitrate
        updateBitrate(bitrate: Int(item.defaultBitrate))
    }

    func updateFps(index: Int) {
        videoModel.frameIndex = index
        videoModel.frameText = frameArray[index]
        fpsTextField.text = videoModel.frameText
        guard let fps = Int32(frameArray[index]) else {
            return
        }
        TUIRoomCore.shareInstance().setVideoFps(fps)
    }

    func updateBitrate(bitrate: Int) {
        bitrateShowLabel.text = String(bitrate) + "kbps"
        TUIRoomCore.shareInstance().setVideoBitrate(Int32(bitrate))
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
    }

    // 点击空白处隐藏编辑状态
    @objc func hideKeyboard(tapG: UITapGestureRecognizer) {
        view.endEditing(true)
    }

    deinit {
        resolutionAlert?.dismiss()
    }
}

// MARK: - internationalization string

fileprivate extension String {
    static let resolutionText = tuiRoomLocalize("TUIRoom.resolution")
    static let framerateText = tuiRoomLocalize("TUIRoom.framerate")
    static let bitrateText = tuiRoomLocalize("TUIRoom.bitrate")
    static let localmirrorText = tuiRoomLocalize("TUIRoom.localmirror")
    static let resolutionSelectedText = tuiRoomLocalize("TUIRoom.resolutionselected")
    static let framerateSelectedText = tuiRoomLocalize("TUIRoom.framerateselected")
}
