//
//  ExtensionShareScreenController.swift
//  TUIRoom
//
//  Created by WesleyLei on 2021/12/16.
//  Copyright © 2021 Tencent. All rights reserved.
//

import Foundation
import SnapKit
import TUIRoomEngine

class ExtensionShareScreenController: UIViewController {
    var isSomeoneSharing: Bool = false
    var roomPresenter: RoomPresenter
    var roomEngineInfo: RoomInfo
    lazy var imageView: UIImageView = {
        let imageView = UIImageView(image: UIImage(named: "tuiroom_share_screen", in: tuiRoomKitBundle(), compatibleWith: nil))
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
    }

    init(roomPresenter: RoomPresenter) {
        self.roomPresenter = roomPresenter
        roomEngineInfo = EngineManager.shared.getRoomInfo(roomId: roomPresenter.roomInfo.roomId)
        super.init(nibName: nil, bundle: nil)
        roomPresenter.addListener(listener: self)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    var isOpenCamera: Bool = false
    var isScreenPushing: Bool = false

    @objc func startBtnClick() {
        if #available(iOS 12.0, *) {
            roomPresenter.startScreenCaptureByReplaykit(appGroup: "com.tencent.TUIRoomTXReplayKit-Screen")
            ExtensionBroadcastLauncher.launch()
            roomPresenter.localCamera(isOpen: false, isFront: true) {
            } onError: { code, message in
                debugPrint("localCamera,code:\(code),message:\(message)")
            }
        } else {
            view.window?.makeToast(.versionLowToastText)
        }
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
        debugPrint("deinit \(self)")
    }
}

extension ExtensionShareScreenController: TUIRoomPresenterListener {
    func onPresenterUserVideoStateChanged(userId: String, streamType: TUIVideoStreamType, hasVideo: Bool, reason: TUIChangeReason) {
        if streamType == .screenStream{
            isSomeoneSharing = hasVideo
            startBtn.isEnabled = !hasVideo
        }
    }
}

// MARK: - internationalization string

fileprivate extension String {
    static let shareText = tuiRoomKitLocalize("TUIRoom.share")
    static let versionLowToastText = tuiRoomKitLocalize("TUIRoom.version.too.low")
}
