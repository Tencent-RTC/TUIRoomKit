//
//  TRTCMeetingMoreControllerUI.swift
//  TRTCScenesDemo
//
//  Created by J J on 2020/5/14.
//  Copyright © 2020 xcoderliu. All rights reserved.
//

import UIKit

final class TRTCMeetingMoreControllerUI: TRTCMeetingMoreViewController {
    
    var volumePromptCallback: ((Bool) -> Void)? = nil
    
    let screenHeight = UIScreen.main.bounds.size.height
    let screenWidth = UIScreen.main.bounds.size.width
    
    //当前选中分页的视图下标
    var selectIndex = 0
    
    lazy var segView:CenterSegmentView = {
        let nameArray : [String] = [.videoText, .audioText, .shareText]
        let vcVideo = TRTCMeetingMoreViewVideoVC()
        let vcAudio = TRTCMeetingMoreViewAudioVC()
        vcAudio.volumePromptCallback = { [weak self] isOn in
            guard let `self` = self else { return }
            if let volumePromptCallback = self.volumePromptCallback {
                volumePromptCallback(isOn)
            }
        }
        
        let vcShare = TRTCMeetingMoreViewShareScreenVC()
        
        let controllers = [vcVideo, vcAudio, vcShare]
        
        let view = CenterSegmentView(frame: CGRect(x: 0, y: 16, width: self.view.bounds.size.width, height: self.view.bounds.size.height), controllers: controllers, titleArray: nameArray, selectIndex: self.selectIndex, lineHeight: 4)
        
        view.lineSelectedColor = UIColor(hex: "006EFF") ?? .blue
        view.titleSelectColor = UIColor(hex: "006EFF") ?? .blue
        view.lineHeight = 4
        
        return view
    }()
    
    override var controllerHeight: CGFloat{
        return screenHeight / 2.0 - 50
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        view.layer.masksToBounds = true
        view.layer.cornerRadius = 10
        view.backgroundColor = .white
        view.addSubview(self.segView)
    }
}

/// MARK: - internationalization string
fileprivate extension String {
    static let videoText = MeetingLocalize("Demo.TRTC.Meeting.video")
    static let audioText = MeetingLocalize("Demo.TRTC.Meeting.audio")
    static let shareText = MeetingLocalize("Demo.TRTC.Meeting.share")
    static let settingText = MeetingLocalize("Demo.TRTC.Meeting.setting")
}
