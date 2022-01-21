//
//  TUIRoomSetShareScreenVC.swift
//  TUIRoom
//
//  Created by WesleyLei on 2021/12/16.
//  Copyright © 2021 Tencent. All rights reserved.
//

import Foundation

class TUIRoomSetShareScreenVC: UIViewController {
    var isSomeoneSharing: Bool = false
    lazy var imageView: UIImageView = {
        let imageView = UIImageView(image: UIImage(named: "tuiroom_share_screen", in: tuiRoomBundle(), compatibleWith: nil))
        return imageView
    }()

    lazy var startBtn: UIButton = {
        let btn = UIButton(type: .custom)
        btn.setTitle(.shareText, for: .normal)
        btn.setTitleColor(.white, for: .normal)
        btn.titleLabel?.font = UIFont(name: "PingFangSC-Medium", size: 18)
        btn.setBackgroundImage(UIColor(hex: "006EFF")?.trans2Image(), for: .normal)
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
        imageView.snp.makeConstraints { make in
            make.centerX.equalToSuperview()
            make.top.equalToSuperview().offset(40)
            make.size.equalTo(CGSize(width: 84, height: 90))
        }

        view.addSubview(startBtn)
        startBtn.snp.makeConstraints { make in
            make.centerX.equalToSuperview()
            make.size.equalTo(CGSize(width: 120, height: 40))
            make.top.equalTo(imageView.snp.bottom).offset(24)
        }
        startBtn.isEnabled = !isSomeoneSharing

        NotificationCenter.default.addObserver(self,
                                               selector: #selector(otherShareScreen),
                                               name: NSNotification.Name("otherShareScreen"),
                                               object: nil)
    }

    var isOpenCamera: Bool = false
    var isScreenPushing: Bool = false

    @objc func startBtnClick() {
        if #available(iOS 12.0, *) {
            // 屏幕分享
            let params = TRTCVideoEncParam()
            params.videoResolution = TRTCVideoResolution._1280_720
            params.resMode = TRTCVideoResolutionMode.portrait
            params.videoFps = 10
            params.enableAdjustRes = false
            params.videoBitrate = 1500
            TUIRoomCore.shareInstance().startScreenCapture(params)
            TUIRoomBroadcastExtensionLauncher.launch()
        } else {
            view.window?.makeToast(.versionLowToastText)
        }
    }

    // 有人分享
    @objc func otherShareScreen() {
        startBtn.isEnabled = false
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
        debugPrint("deinit \(self)")
    }
}

// MARK: - internationalization string

fileprivate extension String {
    static let shareText = tuiRoomLocalize("TUIRoom.share")
    static let versionLowToastText = tuiRoomLocalize("TUIRoom.version.too.low")
}
