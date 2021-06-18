//
//  TRTCMeetingMoreViewShareScreenVC.swift
//  TXLiteAVDemo
//
//  Created by gg on 2021/5/17.
//  Copyright © 2021 Tencent. All rights reserved.
//

import Foundation

class TRTCMeetingMoreViewShareScreenVC: UIViewController {
    lazy var imageView: UIImageView = {
        let imageView = UIImageView(image: UIImage.init(named: "share_screen", in: MeetingBundle(), compatibleWith: nil))
        return imageView
    }()
    
    lazy var startBtn: UIButton = {
        let btn = UIButton(type: .custom)
        btn.setTitle(.shareText, for: .normal)
        btn.setTitleColor(.white, for: .normal)
        btn.titleLabel?.font = UIFont(name: "PingFangSC-Medium", size: 18)
        btn.backgroundColor = UIColor(hex: "006EFF")
        btn.titleLabel?.adjustsFontSizeToFitWidth = true
        btn.titleLabel?.minimumScaleFactor = 0.5
        btn.addTarget(self, action: #selector(startBtnClick), for: .touchUpInside)
        btn.layer.cornerRadius = 20
        btn.clipsToBounds = true
        return btn
    }()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        view.addSubview(imageView)
        imageView.snp.makeConstraints { (make) in
            make.centerX.equalToSuperview()
            make.top.equalToSuperview().offset(40)
            make.size.equalTo(CGSize(width: 84, height: 90))
        }
        
        view.addSubview(startBtn)
        startBtn.snp.makeConstraints { (make) in
            make.centerX.equalToSuperview()
            make.size.equalTo(CGSize(width: 120, height: 40))
            make.top.equalTo(imageView.snp.bottom).offset(24)
        }
    }
    
    var isOpenCamera: Bool = false
    var isScreenPushing: Bool = false
    
    @objc func startBtnClick() {
        let noti = Notification(name: Notification.Name("kScreenShareBtnClick"))
        NotificationCenter.default.post(noti)
    }
}

/// MARK: - internationalization string
fileprivate extension String {
    static let shareText = MeetingLocalize("Demo.TRTC.Meeting.share")
}
