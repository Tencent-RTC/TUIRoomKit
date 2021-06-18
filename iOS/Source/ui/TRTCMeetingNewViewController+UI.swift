//
//  TRTCMeetingNewViewController+UI.swift
//  TRTCScenesDemo
//
//  Created by xcoderliu on 4/22/20.
//  Copyright © 2020 xcoderliu. All rights reserved.
//

import Foundation
import SnapKit
import Toast_Swift
import TXAppBasic
import ImSDK_Plus

extension TRTCMeetingNewViewController {
    
    @objc func backBtnClick() {
        if let popCallback = navigationToPopCallback {
            popCallback()
        } else {
            navigationController?.popViewController(animated: true)
        }
    }
    
    func setupUI() {
        // 获取屏幕的高度
        let screenHeight = UIScreen.main.bounds.size.height
        
        ToastManager.shared.position = .center
        title = .titleText
        
        let backBtn = UIButton(type: .custom)
        backBtn.setImage(UIImage(named: "meeting_back", in: MeetingBundle(), compatibleWith: nil), for: .normal)
        backBtn.addTarget(self, action: #selector(backBtnClick), for: .touchUpInside)
        backBtn.sizeToFit()
        let item = UIBarButtonItem(customView: backBtn)
        item.tintColor = .black
        navigationItem.leftBarButtonItem = item
        
        // input Panel
        let inputPanel = UIView()
        inputPanel.backgroundColor = UIColor(hex: "F4F5F9")
        inputPanel.layer.cornerRadius = 10
        inputPanel.clipsToBounds = true
        view.addSubview(inputPanel)
        inputPanel.snp.makeConstraints { (make) in
            make.top.equalTo(view.snp.topMargin).offset(15)
            make.height.equalTo(screenHeight * 137.0*0.5/812)
            make.leading.equalTo(20)
            make.trailing.equalTo(-20)
        }
        
        let roomTip = UILabel()
        roomTip.backgroundColor = .clear
        roomTip.textColor = UIColor(hex: "333333")
        roomTip.font = UIFont(name: "PingFangSC-Medium", size: 16)
        roomTip.text = .meetingNumberText
        roomTip.adjustsFontSizeToFitWidth = true
        roomTip.minimumScaleFactor = 0.5
        inputPanel.addSubview(roomTip)
        roomTip.snp.makeConstraints { (make) in
            make.leading.equalTo(20)
            make.width.lessThanOrEqualTo(80)
            make.height.equalTo(24)
            make.centerY.equalTo(inputPanel)
        }
        
        roomInput.backgroundColor = .clear
        roomInput.textColor = UIColor(hex: "333333")
        roomInput.font = UIFont.systemFont(ofSize: 16)
        roomInput.attributedPlaceholder = NSAttributedString(string: .enterMeetingNumText,
                                                             attributes: [NSAttributedString.Key.foregroundColor: UIColor(hex: "BBBBBB") ?? UIColor.lightGray])
        roomInput.keyboardType = .numberPad
        inputPanel.addSubview(roomInput)
        roomInput.snp.makeConstraints { (make) in
            make.leading.equalTo(roomTip.snp.trailing).offset(30)
            make.trailing.equalTo(-20)
            make.centerY.height.equalTo(roomTip)
        }
        
        let openCameraTip = UILabel()
        view.addSubview(openCameraTip)
        openCameraTip.backgroundColor = .clear
        openCameraTip.textColor = UIColor(hex: "666666")
        openCameraTip.font = UIFont(name: "PingFangSC-Medium", size: 16)
        openCameraTip.text = .openCameraText
        openCameraTip.snp.makeConstraints { (make) in
            make.top.equalTo(inputPanel.snp.bottom).offset(42)
            make.leading.equalTo(inputPanel.snp.leading)
            make.width.equalTo(100)
        }
        
        view.addSubview(openCameraSwitch)
        openCameraSwitch.isOn = true
        openCameraSwitch.onTintColor = .blue
        openCameraSwitch.snp.makeConstraints { (make) in
            make.centerY.equalTo(openCameraTip)
            make.trailing.equalTo(inputPanel.snp.trailing).offset(-20)
        }
        
        let openMicTip = UILabel()
        view.addSubview(openMicTip)
        openMicTip.backgroundColor = .clear
        openMicTip.textColor = UIColor(hex: "666666")
        openMicTip.font = UIFont(name: "PingFangSC-Medium", size: 16)
        openMicTip.text = .openMicText
        openMicTip.snp.makeConstraints { (make) in
            make.top.equalTo(openCameraTip.snp.bottom).offset(24)
            make.leading.equalTo(openCameraTip.snp.leading)
            make.width.equalTo(100)
        }
        
        view.addSubview(openMicSwitch)
        openMicSwitch.isOn = true
        openMicSwitch.onTintColor = .blue
        openMicSwitch.snp.makeConstraints { (make) in
            make.top.equalTo(openMicTip)
            make.trailing.equalTo(inputPanel.snp.trailing).offset(-20)
        }

        let enterBtn = UIButton()
        enterBtn.setTitle(.enterMeetingText, for: .normal)
        enterBtn.setBackgroundImage(UIColor.buttonBackColor.trans2Image(), for: .normal)
        enterBtn.layer.cornerRadius = 25
        enterBtn.clipsToBounds = true
        enterBtn.titleLabel?.font = UIFont.boldSystemFont(ofSize: 19)
        enterBtn.setTitleColor(.white, for: .normal)
        view.addSubview(enterBtn)
        enterBtn.snp.makeConstraints { (make) in
            make.bottom.equalToSuperview().offset(-50-kDeviceSafeBottomHeight)
            make.centerX.equalToSuperview()
            make.width.equalToSuperview().multipliedBy(0.4)
            make.height.equalTo(52)
        }
        enterBtn.addTarget(self, action: #selector(enterBtnClick), for: .touchUpInside)
        
        // tap to resign
        let tap = UITapGestureRecognizer(target: self, action: #selector(viewDidTap))
        view.addGestureRecognizer(tap)
        
        // fill with record
        if let roomID = UserDefaults.standard.object(forKey: TRTCMeetingRoomIDKey) as? UInt32 {
            roomInput.text = String(roomID)
        }
        
        if let isOpenCamera = UserDefaults.standard.object(forKey: TRTCMeetingOpenCameraKey) as? Bool {
            openCameraSwitch.isOn = isOpenCamera
        }
        
        if let isOpenMic = UserDefaults.standard.object(forKey: TRTCMeetingOpenMicKey) as? Bool {
            openMicSwitch.isOn = isOpenMic
        }
        
        if let audioQuality = UserDefaults.standard.object(forKey: TRTCMeetingAudioQualityKey) as? Int {
            setAudioQuality(audioQuality: audioQuality)
        }
        
        if let videoQuality = UserDefaults.standard.object(forKey: TRTCMeetingVideoQualityKey) as? Int {
            // 初始化设置视频质量参数
            setVideoQuality(videoQuality: videoQuality)
        }
    }
    
    @objc func enterBtnClick() {
        enterRoom()
    }
    
    @objc func viewDidTap() {
        resignInput()
    }
    
    func configSelectorBtn(_ btn: UIButton, title: String) {
        btn.setTitle(title, for: .normal)
        btn.setTitleColor(UIColor(hex: "333333"), for: .normal)
        btn.setBackgroundImage(UIColor(hex: "F4F5F9")?.trans2Image(), for: .normal)
        
        btn.setTitle(title, for: .selected)
        btn.setTitleColor(.white, for: .selected)
        btn.setBackgroundImage(UIColor(hex: "29CC85")?.trans2Image(), for: .selected)
        
        btn.titleLabel?.font = UIFont(name: "PingFangSC-Medium", size: 14)
        btn.contentEdgeInsets = UIEdgeInsets(top: 0, left: 8, bottom: 0, right: 8)
        btn.titleLabel?.adjustsFontSizeToFitWidth = true
        btn.titleLabel?.minimumScaleFactor = 0.5
        
        btn.layer.cornerRadius = btnSize.height * 0.5
        btn.clipsToBounds = true
    }
    
    @objc func selectAudioQuality(btn: UIButton) {
        if btn == speechQualityButton {
            self.audioQuality = 1
            
            speechQualityButton.tag = 1
            speechQualityButton.isSelected = true
            
            defaultQualityButton.tag = 0
            defaultQualityButton.isSelected = false
            
            musicQualityButton.tag = 0
            musicQualityButton.isSelected = false
            
        } else if btn == defaultQualityButton {
            self.audioQuality = 2
            
            speechQualityButton.tag = 0
            speechQualityButton.isSelected = false
            
            defaultQualityButton.tag = 1
            defaultQualityButton.isSelected = true
            
            musicQualityButton.tag = 0
            musicQualityButton.isSelected = false
            
        } else if btn == musicQualityButton {
            self.audioQuality = 3
            
            speechQualityButton.tag = 0
            speechQualityButton.isSelected = false
            
            defaultQualityButton.tag = 0
            defaultQualityButton.isSelected = false
            
            musicQualityButton.tag = 1
            musicQualityButton.isSelected = true
        }
    }
    
    func setAudioQuality(audioQuality: Int) {
        switch audioQuality {
        case 1:
            selectAudioQuality(btn: speechQualityButton)
            break
        case 2:
            selectAudioQuality(btn: defaultQualityButton)
            break
        case 3:
            selectAudioQuality(btn: musicQualityButton)
            break
        default:
            selectAudioQuality(btn: speechQualityButton)
        }
    }
    
    // 初始化设置
    func setVideoQuality(videoQuality: Int) {
        self.videoQuality = videoQuality
        fluencyVideoButton.isSelected = videoQuality == 1 // 流畅
        distinctVideoButton.isSelected = videoQuality != 1 // 清晰
    }
    
    @objc
    func selectVideoQuality(button: UIButton) {
        if button.isSelected {
            return
        }
        button.isSelected = true
        if button == distinctVideoButton {
            fluencyVideoButton.isSelected = false
            videoQuality = 2 // 设置为清晰
        } else if button == fluencyVideoButton {
            distinctVideoButton.isSelected = false
            videoQuality = 1 // 设置为流畅
        }
    }
    
    func autoCheck() -> (Bool, UInt32) {
        if (roomInput.text?.count ?? 0) <= 0 {
            view.makeToast(.enterMeetingNumText)
            return (false, 0)
        }
        guard let roomID = UInt32(roomInput.text ?? "") else {
            view.makeToast(.enterLegitMeetingNumText)
            return (false, 0)
        }
        
        if roomID <= 0 {
            view.makeToast(.enterLegitMeetingNumText)
            return (false, 0)
        }
        
        resignInput()
        return (true, roomID)
    }
    
    func enterRoom() {
        let params = autoCheck()
        
        if !params.0 {
            return;
        }
        
        // 设置用户昵称和头像等信息
        guard TRTCMeetingIMManager.shared.isLoaded else {
            return
        }
        let userName = TRTCMeetingIMManager.shared.curUserName
        let avatar = TRTCMeetingIMManager.shared.curUserAvatar
        TRTCMeeting.sharedInstance().setSelfProfile(userName, avatarURL: avatar) { (code, msg) in
            
        }
        
        // 保存当前的配置
        UserDefaults.standard.set(params.1, forKey: TRTCMeetingRoomIDKey)
        UserDefaults.standard.set(self.openCameraSwitch.isOn, forKey: TRTCMeetingOpenCameraKey)
        UserDefaults.standard.set(self.openMicSwitch.isOn, forKey: TRTCMeetingOpenMicKey)
        UserDefaults.standard.set(self.audioQuality, forKey: TRTCMeetingAudioQualityKey)
        UserDefaults.standard.set(self.videoQuality, forKey: TRTCMeetingVideoQualityKey)
        // 进入房间主界面
        var config = TRTCMeetingStartConfig()
        config.roomId = UInt32(roomInput.text ?? "0") ?? 0
        config.isVideoOn = self.openCameraSwitch.isOn
        config.isAudioOn = self.openMicSwitch.isOn
        config.audioQuality = audioQuality
        config.videoQuality = videoQuality
        
        let vc = TRTCMeetingMainViewController(config: config)
        self.navigationController?.pushViewController(vc, animated: true)
    }
    
    func resignInput() {
        if roomInput.isFirstResponder {
            roomInput.resignFirstResponder()
        }
    }
}

/// MARK: - internationalization string
fileprivate extension String {
    static let titleText = MeetingLocalize("Demo.TRTC.Meeting.multivideoconference")
    static let meetingNumberText = MeetingLocalize("Demo.TRTC.Meeting.meetingnum")
    static let userIdText = MeetingLocalize("Demo.TRTC.Salon.userid")
    static let enterMeetingNumText = MeetingLocalize("Demo.TRTC.Meeting.entermeetingnum")
    static let enterUserNameText = MeetingLocalize("Demo.TRTC.Meeting.enterusername")
    static let openCameraText = MeetingLocalize("Demo.TRTC.Meeting.opencamera")
    static let openMicText = MeetingLocalize("Demo.TRTC.Meeting.openmic")
    static let soundQualitySelectText = MeetingLocalize("Demo.TRTC.VoiceRoom.soundqualityselect")
    static let voiceText = MeetingLocalize("Demo.TRTC.VoiceRoom.voice")
    static let standardText = MeetingLocalize("Demo.TRTC.LiveRoom.standard")
    static let musicText = MeetingLocalize("Demo.TRTC.LiveRoom.music")
    static let picQualitySelectText = MeetingLocalize("Demo.TRTC.Meeting.picqualityselect")
    static let smoothText = MeetingLocalize("Demo.TRTC.Meeting.smooth")
    static let clearText = MeetingLocalize("Demo.TRTC.Meeting.clear")
    static let enterMeetingText = MeetingLocalize("Demo.TRTC.Meeting.entermeeting")
    static let enterLegitMeetingNumText = MeetingLocalize("Demo.TRTC.Meeting.enterlegitmeetingnum")
    static let shareText = MeetingLocalize("Demo.TRTC.Meeting.share")
}
