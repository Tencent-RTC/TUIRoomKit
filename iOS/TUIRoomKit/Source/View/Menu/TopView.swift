//
//  TopView.swift
//  Menu
//
//  Created by WesleyLei on 2022/9/13.
//

import SnapKit
import Toast_Swift
import TUIRoomEngine
import UIKit
#if TXLiteAVSDK_TRTC
import TXLiteAVSDK_TRTC
#elseif TXLiteAVSDK_Professional
import TXLiteAVSDK_Professional
#endif

class TopView: UIView {
    var roomId: String
    var roomPresenter: RoomPresenter
    var currentUser: TUIUserInfo? {
        return roomPresenter.currentUser.userInfo
    }

    init(frame: CGRect, roomId: String, roomPresenter: RoomPresenter) {
        self.roomId = roomId
        self.roomPresenter = roomPresenter
        super.init(frame: frame)
        setupUI()
        activateConstraints()
        bindInteraction()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // 顶部空间
    lazy var switchAudioRouteButton: UIButton = { // 扬声器切换
        let button = UIButton(type: .custom)
        button.setImage(UIImage(named: "tuiroom_speaker", in: tuiRoomKitBundle(), compatibleWith: nil), for: .normal)
        button.setImage(UIImage(named: "tuiroom_earphone", in: tuiRoomKitBundle(), compatibleWith: nil), for: .selected)
        button.sizeToFit()
        return button
    }()

    lazy var switchCameraButton: UIButton = { // 摄像头切换
        let button = UIButton(type: .custom)
        button.setImage(UIImage(named: "tuiroom_switch_camera", in: tuiRoomKitBundle(), compatibleWith: nil), for: .normal)
        button.setImage(UIImage(named: "tuiroom_switch_camera", in: tuiRoomKitBundle(), compatibleWith: nil), for: .selected)
        button.sizeToFit()
        return button
    }()

    lazy var roomIdLabel: UILabel = { // 房间号label
        let label = UILabel()
        label.textAlignment = .center
        label.text = roomId.addIntervalSpace(intervalStr: " ", interval: 3)
        label.font = UIFont(name: "PingFangSC-Medium", size: 16)
        label.textColor = .white
        label.isUserInteractionEnabled = true
        label.sizeToFit()
        label.tag = 0
        return label
    }()

    lazy var copyButton: UIButton = {
        let button = UIButton(type: .custom)
        button.setImage(UIImage(named: "tuiroom_copy_white_icon", in: tuiRoomKitBundle(), compatibleWith: nil), for: .normal)
        return button
    }()

    lazy var exitButton: UIButton = { // 退出
        let button = UIButton(type: .custom)
        button.setTitle(.logoutButtonText, for: .normal)
        button.titleLabel?.font = UIFont.systemFont(ofSize: 14)
        button.backgroundColor = UIColor(red: 232 / 255.0, green: 75 / 255.0, blue: 64 / 255.0, alpha: 1.0)
        button.layer.cornerRadius = 16
        button.sizeToFit()
        return button
    }()

    func setupUI() { // 控件添加
        backgroundColor = .clear
        addSubview(switchAudioRouteButton)
        addSubview(switchCameraButton)
        addSubview(exitButton)
        addSubview(roomIdLabel)
        addSubview(copyButton)
    }

    func activateConstraints() {
        switchAudioRouteButton.snp.remakeConstraints { make in
            make.leading.equalTo(12)
            make.centerY.equalToSuperview()
            make.width.height.equalTo(32)
        }

        switchCameraButton.snp.remakeConstraints { make in
            make.leading.equalTo(switchAudioRouteButton.snp.trailing).offset(12)
            make.centerY.equalTo(switchAudioRouteButton)
            make.width.height.equalTo(32)
        }

        roomIdLabel.snp.remakeConstraints { make in
            make.centerY.equalTo(switchAudioRouteButton)
            make.centerX.equalToSuperview()
        }
        copyButton.snp.remakeConstraints { make in
            make.centerY.equalTo(roomIdLabel)
            make.left.equalTo(roomIdLabel.snp.right).offset(3)
            make.width.height.equalTo(32)
        }

        exitButton.snp.remakeConstraints { make in
            let width = exitButton.frame.size.width + 12 * 2
            make.trailing.equalTo(-12)
            make.centerY.equalTo(roomIdLabel)
            make.width.equalTo(width)
            make.height.equalTo(32)
        }
    }

    func bindInteraction() { // 点击事件添加
        exitButton.addTarget(self, action: #selector(exitButtonClick), for: .touchUpInside)
        switchAudioRouteButton.addTarget(self, action: #selector(switchAudioButtonClick), for: .touchUpInside)
        switchCameraButton.addTarget(self, action: #selector(switchCameraButtonClick), for: .touchUpInside)
        let longGesture = UILongPressGestureRecognizer(target: self, action: #selector(showLogView(gesture:)))
        longGesture.minimumPressDuration = 3
        roomIdLabel.addGestureRecognizer(longGesture)
        copyButton.addTarget(self, action: #selector(copyButtonClick), for: .touchUpInside)
    }

    @objc func switchAudioButtonClick() { // 扬声器切换
        switchAudioRouteButton.isSelected = !switchAudioRouteButton.isSelected
        roomPresenter.setAudioRoute(isSpeaker: !switchAudioRouteButton.isSelected)
    }

    @objc func switchCameraButtonClick() { // 摄像头切换
        switchCameraButton.isSelected = !switchCameraButton.isSelected
        roomPresenter.switchCamera(isFront: !switchCameraButton.isSelected)
    }

    @objc func showLogView(gesture: UILongPressGestureRecognizer) { // 房间号label，log打印展示
        if gesture.state != UIGestureRecognizer.State.began {
            return
        }
        roomPresenter.showDebug(isOpen: roomIdLabel.tag == 0)
        roomIdLabel.tag = (roomIdLabel.tag == 0) ? 1 : 0
    }

    @objc func copyButtonClick() { // copy房间号
        let pas = UIPasteboard.general
        pas.string = roomIdLabel.text
        superview?.makeToast(.copySuccessText)
    }

    @objc func exitButtonClick() { // 退出
        let noti = Notification(name: Notification.Name("kExitRoomController"))
        NotificationCenter.default.post(noti)
    }

    deinit {
        debugPrint("deinit \(self)")
    }
}

private extension String {
    static let logoutButtonText = tuiRoomKitLocalize("TUIRoom.logout.room")
    static let copySuccessText = tuiRoomKitLocalize("TUIRoom.copy.success")

    func addIntervalSpace(intervalStr: String, interval: Int) -> String {
        var output = ""
        enumerated().forEach { index, c in
            if (index % interval == 0) && index > 0 {
                output += intervalStr
            }
            output.append(c)
        }
        return output
    }
}
