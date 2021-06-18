//
//  TRTCMeetingMemberController+UI.swift
//  TRTCScenesDemo
//
//  Created by lijie on 2020/5/7.
//  Copyright © 2020 xcoderliu. All rights reserved.
//

import UIKit
import Toast_Swift
import TXAppBasic

extension TRTCMeetingMemberViewController {
    
    @objc func backBtnClick() {
        navigationController?.popViewController(animated: true)
    }
    
    func setupUI() {
        title = .memberListText
        navigationController?.navigationBar.titleTextAttributes =
            [NSAttributedString.Key.foregroundColor : UIColor.black,
             NSAttributedString.Key.font : UIFont(name: "PingFangSC-Semibold", size: 18) ?? UIFont.systemFont(ofSize: 18)
            ]
        navigationController?.navigationBar.barTintColor = UIColor(hex: "F4F5F9")
        navigationController?.navigationBar.isTranslucent = false
        
        let backBtn = UIButton(type: .custom)
        backBtn.setImage(UIImage.init(named: "meeting_back", in: MeetingBundle(), compatibleWith: nil), for: .normal)
        backBtn.addTarget(self, action: #selector(backBtnClick), for: .touchUpInside)
        backBtn.sizeToFit()
        let item = UIBarButtonItem(customView: backBtn)
        item.tintColor = .black
        navigationItem.leftBarButtonItem = item
        
        view.backgroundColor = UIColor(hex: "F4F5F9")
        
        view.addSubview(memberCollectionView)
        memberCollectionView.snp.makeConstraints { (make) in
            make.leading.trailing.equalTo(view)
            make.bottom.equalTo(view)
            make.top.equalTo(10)
            make.height.equalTo(view).offset(0)
        }
        
        setupControls()
        reloadData()
        
        muteAllAudioButton.isSelected = viewModel.allAudioMute
        muteAllVideoButton.isSelected = viewModel.allVideoMute
        NotificationCenter.default.addObserver(self, selector: #selector(refreshUserListNoti(notification:)), name: refreshUserListNotification, object: nil)
    }
    
    @objc func refreshUserListNoti(notification: Notification) {
        if notification.object != nil {
            self.attendeeList = notification.object as! [MeetingAttendeeModel]
        }
        self.reloadData()
    }
    
    func setupControls() {
        
        let green = UIColor(hex: "29CC85")
        let blue = UIColor(hex: "006EFF")
        
        // 全体静音按钮
        muteAllAudioButton.setTitle(.mutedAllText, for: .normal)
        muteAllAudioButton.setTitleColor(green, for: .normal)
        muteAllAudioButton.setBackgroundImage(UIColor.white.trans2Image(), for: .normal)
        
        muteAllAudioButton.setTitle(.unmutedAllText, for: .selected)
        muteAllAudioButton.setTitleColor(.white, for: .selected)
        muteAllAudioButton.setBackgroundImage(green?.trans2Image(), for: .selected)
        
        muteAllAudioButton.layer.borderWidth = 1
        muteAllAudioButton.layer.borderColor = green?.cgColor
        muteAllAudioButton.layer.cornerRadius = 26
        muteAllAudioButton.clipsToBounds = true
        muteAllAudioButton.titleEdgeInsets = UIEdgeInsets(top: 0, left: 10, bottom: 0, right: 10)
        muteAllAudioButton.titleLabel?.adjustsFontSizeToFitWidth = true
        muteAllAudioButton.titleLabel?.minimumScaleFactor = 0.5
        view.addSubview(muteAllAudioButton)
        muteAllAudioButton.snp.makeConstraints { (make) in
            make.trailing.equalTo(view.snp.centerX).offset(-10)
            make.bottom.equalTo(view).offset(-20-kDeviceSafeBottomHeight)
            make.height.equalTo(52)
            make.leading.equalToSuperview().offset(30)
        }
        muteAllAudioButton.addTarget(self, action: #selector(muteAllAudioBtnClick), for: .touchUpInside)
        
        
        // 全体禁画按钮
        muteAllVideoButton.setTitle(.stopAllPicText, for: .normal)
        muteAllVideoButton.setTitleColor(blue, for: .normal)
        muteAllVideoButton.setBackgroundImage(UIColor.white.trans2Image(), for: .normal)
        
        muteAllVideoButton.setTitle(.enableAllPicText, for: .selected)
        muteAllVideoButton.setTitleColor(.white, for: .selected)
        muteAllVideoButton.setBackgroundImage(blue?.trans2Image(), for: .selected)
        
        muteAllVideoButton.layer.cornerRadius = 26
        muteAllVideoButton.clipsToBounds = true
        muteAllVideoButton.layer.borderColor = blue?.cgColor
        muteAllVideoButton.layer.borderWidth = 1
        muteAllVideoButton.titleLabel?.adjustsFontSizeToFitWidth = true
        muteAllVideoButton.titleLabel?.minimumScaleFactor = 0.5
        muteAllVideoButton.titleEdgeInsets = UIEdgeInsets(top: 0, left: 10, bottom: 0, right: 10)
        view.addSubview(muteAllVideoButton)
        muteAllVideoButton.snp.remakeConstraints { (make) in
            make.leading.equalTo(view.snp.centerX).offset(10)
            make.bottom.equalTo(muteAllAudioButton)
            make.height.equalTo(52)
            make.trailing.equalToSuperview().offset(-30)
        }
        muteAllVideoButton.addTarget(self, action: #selector(muteAllVideoBtnClick), for: .touchUpInside)
        
    }
    
    @objc func muteAllAudioBtnClick() {
        self.muteAllAudioButton.isSelected = !self.muteAllAudioButton.isSelected
	self.viewModel.allAudioMute = self.muteAllAudioButton.isSelected
        self.delegate?.onMuteAllAudio(mute: self.muteAllAudioButton.isSelected)
        self.view.hideToast()
        self.view.makeToast(self.muteAllAudioButton.isSelected ? .mutedAllText : .unmutedAllText)
    }
    
    @objc func muteAllVideoBtnClick() {
        self.muteAllVideoButton.isSelected = !self.muteAllVideoButton.isSelected
    	self.viewModel.allVideoMute = self.muteAllVideoButton.isSelected
        self.delegate?.onMuteAllVideo(mute: self.muteAllVideoButton.isSelected)
        self.view.hideToast()
        self.view.makeToast(self.muteAllVideoButton.isSelected ? .stopAllPicText : .enableAllPicText)
    }
}

/// MARK: - internationalization string
fileprivate extension String {
    static let memberListText = MeetingLocalize("Demo.TRTC.Meeting.memberlist")
    static let mutedAllText = MeetingLocalize("Demo.TRTC.Meeting.mutedall")
    static let unmutedAllText = MeetingLocalize("Demo.TRTC.Meeting.unmutedall")
    static let stopAllPicText = MeetingLocalize("Demo.TRTC.Meeting.stoppic")
    static let enableAllPicText = MeetingLocalize("Demo.TRTC.Meeting.enablepic")
}
