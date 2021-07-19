//
//  TRTCMeetingMainViewController+UI.swift
//  TRTCScenesDemo
//
//  Created by xcoderliu on 4/23/20.
//  Copyright © 2020 xcoderliu. All rights reserved.
//

import UIKit
import Toast_Swift

extension TRTCMeetingMainViewController {
    func setupUI() {
        ToastManager.shared.position = .bottom
        view.backgroundColor = .white
        self.navigationController?.isNavigationBarHidden = true
        
        attendeeCollectionView.frame = CGRect(x: 0, y: 0, width: UIScreen.main.bounds.size.width, height: UIScreen.main.bounds.size.height)
        view.addSubview(attendeeCollectionView)
        
        view.addSubview(pageControl)
        pageControl.currentPage = 0
        pageControl.snp.makeConstraints { (make) in
            make.width.equalTo(120)
            make.height.equalTo(30)
            make.centerX.equalTo(view)
            make.bottomMargin.equalTo(view).offset(-40)
        }
        
        setupTabs()
        setupControls()
        
        reloadData()
        moreSettingVC.volumePromptCallback = { [weak self] isOn in
            guard let `self` = self else { return }
            self.renderViews.forEach { renderView in
                renderView.volumeImageView.isHidden = !isOn
            }
        }
    }
    
    func setupTabs() {
        // 背景
        let backView = UIView()
        view.addSubview(backView)
        backView.snp.makeConstraints { (make) in
            make.top.leading.trailing.equalTo(view)
            make.height.equalTo(topPadding + 45)
        }
        backView.backgroundColor = .clear
        
        
        // 房间号label
        roomIdLabel.frame = CGRect(x: UIScreen.main.bounds.size.width / 3.0, y: topPadding + 10, width: UIScreen.main.bounds.size.width / 3.0, height: 25)
        roomIdLabel.textAlignment = .center
        roomIdLabel.text = String(startConfig.roomId)
        roomIdLabel.font = UIFont.systemFont(ofSize: 18)
        roomIdLabel.textColor = .white
        roomIdLabel.isUserInteractionEnabled = true
        
        
        roomIdLabel.addGestureRecognizer(longGesture)
        backView.addSubview(roomIdLabel)
        
        // 扬声器切换
        switchAudioRouteButton.setImage(UIImage.init(named: "meeting_speaker", in: MeetingBundle(), compatibleWith: nil), for: .normal)
        backView.addSubview(switchAudioRouteButton)
        switchAudioRouteButton.snp.remakeConstraints { (make) in
            make.leading.equalTo(20)
            make.top.equalTo(topPadding + 5)
            make.width.height.equalTo(32)
        }
        switchAudioRouteButton.addTarget(self, action: #selector(switchAudioBtnClick), for: .touchUpInside)
        
        
        // 摄像头切换
        switchCameraButton.setImage(UIImage.init(named: "meeting_switch_camera", in: MeetingBundle(), compatibleWith: nil), for: .normal)
        backView.addSubview(switchCameraButton)
        switchCameraButton.snp.remakeConstraints { (make) in
            make.leading.equalTo(switchAudioRouteButton.snp.trailing).offset(10)
            make.top.equalTo(switchAudioRouteButton)
            make.width.height.equalTo(32)
        }
        switchCameraButton.addTarget(self, action: #selector(switchCameraBtnClick), for: .touchUpInside)
        
        // 退出
        exitButton.setTitle(.exitMeetingText, for: .normal)
        exitButton.titleLabel?.font = UIFont.systemFont(ofSize: 14)
        exitButton.backgroundColor = UIColor(red: 232 / 255.0, green: 75 / 255.0, blue: 64 / 255.0, alpha: 1.0)
        exitButton.layer.cornerRadius = 19
        backView.addSubview(exitButton)
        exitButton.snp.remakeConstraints { (make) in
            make.trailing.equalTo(-25)
            make.top.equalTo(topPadding + 9)
            make.width.equalTo(80)
            make.height.equalTo(38)
        }
        exitButton.addTarget(self, action: #selector(exitBtnClick), for: .touchUpInside)
    }
    
    @objc func switchAudioBtnClick() {
        self.isUseSpeaker = !self.isUseSpeaker
        TRTCMeeting.sharedInstance().setSpeaker(self.isUseSpeaker)
        self.switchAudioRouteButton.setImage(UIImage.init(named: self.isUseSpeaker ? "meeting_speaker" : "meeting_earphone", in: MeetingBundle(), compatibleWith: nil), for: .normal)
    }
    
    @objc func switchCameraBtnClick() {
        self.isFrontCamera = !self.isFrontCamera
        TRTCMeeting.sharedInstance().switchCamera(self.isFrontCamera)
    }
    
    @objc func exitBtnClick() {
        let alertVC = UIAlertController(title: .promptText, message: .sureExitText, preferredStyle: UIAlertController.Style.alert)
        
        let okView = UIAlertAction(title: .confirmText, style: UIAlertAction.Style.default, handler: {
            (action: UIAlertAction!) -> Void in
            print("exit success\n")
            TRTCMeeting.sharedInstance().leave { (code, msg) in
                debugPrint("log: exitMeeting: code \(code), msg: \(String(describing: msg))")
            }
            self.navigationController?.popViewController(animated: true)
        })
        
        let cancelView = UIAlertAction(title: .cancelText, style: UIAlertAction.Style.cancel, handler: {
            (action: UIAlertAction!) -> Void in
            print("cancel btn click\n")
        })
        
        alertVC.addAction(okView)
        alertVC.addAction(cancelView)
        self.present(alertVC, animated: true, completion: nil)
    }
    
    func setupControls() {
        // 背景
        let backView = UIView()
        view.addSubview(backView)
        backView.snp.makeConstraints { (make) in
            make.bottom.leading.trailing.equalTo(view)
            make.height.equalTo(55)
        }
        backView.backgroundColor = .clear
        
        
        // 开关麦克风
        muteAudioButton.setImage(UIImage.init(named: startConfig.isAudioOn ? "meeting_mic_open" : "meeting_mic_close", in: MeetingBundle(), compatibleWith: nil), for: .normal)
        backView.addSubview(muteAudioButton)
        muteAudioButton.snp.remakeConstraints { (make) in
            make.centerX.equalTo(view).offset(-140)
            make.bottom.equalTo(view).offset(-10)
            make.width.height.equalTo(50)
        }
        
        muteAudioButton.addTarget(self, action: #selector(muteAudioBtnClick), for: .touchUpInside)
        
        
        // 开关摄像头
        muteVideoButton.setImage(UIImage.init(named: startConfig.isVideoOn ? "meeting_camera_open" : "meeting_camera_close", in: MeetingBundle(), compatibleWith: nil), for: .normal)
        backView.addSubview(muteVideoButton)
        muteVideoButton.snp.remakeConstraints { (make) in
            make.centerX.equalTo(view).offset(-70)
            make.bottom.equalTo(view).offset(-10)
            make.width.height.equalTo(50)
        }
        
        muteVideoButton.addTarget(self, action: #selector(muteVideoBtnClick), for: .touchUpInside)
        
        beautyButton.setImage(UIImage.init(named: "meeting_beauty", in: MeetingBundle(), compatibleWith: nil), for: .normal)
        backView.addSubview(beautyButton)
        beautyButton.snp.remakeConstraints { (make) in
            make.centerX.equalTo(view)
            make.bottom.equalTo(view).offset(-10)
            make.width.height.equalTo(50)
        }
        
        beautyButton.addTarget(self, action: #selector(beautyBtnClick), for: .touchUpInside)
        
        
        // 成员列表
        membersButton.setImage(UIImage.init(named: "metting_member", in: MeetingBundle(), compatibleWith: nil), for: .normal)
        backView.addSubview(membersButton)
        membersButton.snp.remakeConstraints { (make) in
            make.centerX.equalTo(view).offset(70)
            make.bottom.equalTo(view).offset(-10)
            make.width.height.equalTo(50)
        }
        
        membersButton.addTarget(self, action: #selector(membersBtnClick), for: .touchUpInside)
        
        
        // 屏幕分享按钮
        NotificationCenter.default.addObserver(self, selector: #selector(screenShareBtnClick), name: NSNotification.Name("kScreenShareBtnClick"), object: nil)
        
        // 更多设置按钮
        moreSettingButton.setImage(UIImage.init(named: "meeting_more", in: MeetingBundle(), compatibleWith: nil), for: .normal)
        backView.addSubview(moreSettingButton)
        moreSettingButton.snp.remakeConstraints { (make) in
            make.centerX.equalTo(view).offset(140)
            make.bottom.equalTo(view).offset(-10)
            make.width.height.equalTo(50)
        }
        
        moreSettingButton.addTarget(self, action: #selector(moreSettingBtnClick), for: .touchUpInside)
        
    }
    
    public func applyDefaultBeautySetting() {
        viewModel.applyDefaultSetting()
    }
    
    @objc func muteAudioBtnClick() {
        let render = self.getRenderView(userId: self.selfUserId)!
        let isAudioAvailable = !render.isAudioAvailable()
        
        render.refreshAudio(isAudioAvailable: isAudioAvailable)
        self.muteAudioButton.setImage(UIImage.init(named: isAudioAvailable ? "meeting_mic_open" : "meeting_mic_close", in: MeetingBundle(), compatibleWith: nil), for: .normal)
        TRTCMeeting.sharedInstance().muteLocalAudio(!isAudioAvailable)
    }
    
    @objc func muteVideoBtnClick() {
        let render = self.getRenderView(userId: self.selfUserId)!
        let isVideoAvailable = !render.isVideoAvailable()
        self.setLocalVideo(isVideoAvailable: isVideoAvailable)
    }
    
    @objc func beautyBtnClick() {
        let alert = TRTCMeetingBeautyAlert(viewModel: self.viewModel)
        self.view.addSubview(alert)
        alert.snp.makeConstraints { (make) in
            make.edges.equalToSuperview()
        }
        alert.show()
    }
    
    @objc func membersBtnClick() {
        let vc = TRTCMeetingMemberViewController(attendeeList: self.attendeeList, viewModel: memberViewModel)
        vc.delegate = self
        self.navigationController?.pushViewController(vc, animated: true)
    }
    
    @objc func moreSettingBtnClick() {
        presentBottom(self.moreSettingVC)
    }
    
    @objc func screenShareBtnClick() {
        // 防止重复设置
        if !self.isScreenPushing {
            self.isOpenCamera = self.getRenderView(userId: self.selfUserId)!.isVideoAvailable()
            // 录屏前必须先关闭摄像头采集
            self.setLocalVideo(isVideoAvailable: false)
        }
        
        self.isScreenPushing = true
        
        if #available(iOS 12.0, *) {
            // 屏幕分享
            let params = TRTCVideoEncParam()
            params.videoResolution = TRTCVideoResolution._1280_720
            params.resMode = TRTCVideoResolutionMode.portrait
            params.videoFps = 10
            params.enableAdjustRes = false
            params.videoBitrate = 1500
            TRTCMeeting.sharedInstance().startScreenCapture(params)
            TRTCBroadcastExtensionLauncher.launch()
        } else {
            self.view.makeToast(.versionLowText)
        }
    }
    
    func setLocalVideo(isVideoAvailable: Bool) {
        if let render = self.getRenderView(userId: self.selfUserId) {
            render.refreshVideo(isVideoAvailable: isVideoAvailable)
        }
        self.muteVideoButton.setImage(UIImage.init(named: isVideoAvailable ? "meeting_camera_open" : "meeting_camera_close", in: MeetingBundle(), compatibleWith: nil), for: .normal)
        
        // 先关闭录屏
        var needDelay = false
        if self.isScreenPushing {
            if #available(iOS 11.0, *) {
                TRTCMeeting.sharedInstance().stopScreenCapture()
            }
            self.isScreenPushing = false
            needDelay = true
        }
        
        if isVideoAvailable {
            alertUserTips(self)
            
            // 开启摄像头预览
            // TODO 关闭录屏后，要延迟一会才能打开摄像头，SDK bug ?
            if needDelay {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                    let localPreviewView = self.getRenderView(userId: self.selfUserId)!
                    TRTCMeeting.sharedInstance().startCameraPreview(self.isFrontCamera, view: localPreviewView)
                }
            } else {
                let localPreviewView = self.getRenderView(userId: self.selfUserId)!
                TRTCMeeting.sharedInstance().startCameraPreview(self.isFrontCamera, view: localPreviewView)
            }
            
        } else {
            TRTCMeeting.sharedInstance().stopCameraPreview()
        }
    }
    
    @objc func showlogView(gesture: UILongPressGestureRecognizer) {
        if gesture.state != UIGestureRecognizer.State.began {
            return
        }
        if !self.isLogViewShow {
            TRTCCloud.sharedInstance()?.setDebugViewMargin(selfUserId, margin: TXEdgeInsets.init(top: 70, left: 10, bottom: 30, right: 10))
            TRTCCloud.sharedInstance()?.showDebugView(2) // 显示全量版的Log视图
            self.isLogViewShow = true
        } else {
            TRTCCloud.sharedInstance()?.showDebugView(0) // 显示全量版的Log视图
            self.isLogViewShow = false
        }
    }
}

/// MARK: - internationalization string
fileprivate extension String {
    static let exitMeetingText = MeetingLocalize("Demo.TRTC.Meeting.exitmeeting")
    static let promptText = MeetingLocalize("Demo.TRTC.LiveRoom.prompt")
    static let sureExitText = MeetingLocalize("Demo.TRTC.Meeting.suretoexitmeeting")
    static let confirmText = MeetingLocalize("Demo.TRTC.LiveRoom.confirm")
    static let cancelText = MeetingLocalize("Demo.TRTC.LiveRoom.cancel")
    static let versionLowText = MeetingLocalize("Demo.TRTC.Meeting.versiontoolow")
}
