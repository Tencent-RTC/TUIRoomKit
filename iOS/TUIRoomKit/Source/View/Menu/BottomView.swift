//
//  BottomView.swift
//  Menu
//
//  Created by WesleyLei on 2022/9/15.
//

import SnapKit
import Toast_Swift
import TUICore
import TUIRoomEngine
import UIKit

class BottomView: UIView {
    var roomPresenter: RoomPresenter
    var roomInfo: RoomInfo

    lazy var muteAudioButton: UIButton = {
        let button = UIButton(type: .custom)
        button.setImage(UIImage(named: "tuiroom_mic_open", in: tuiRoomKitBundle(), compatibleWith: nil), for: .normal)
        button.setImage(UIImage(named: "tuiroom_mic_close", in: tuiRoomKitBundle(), compatibleWith: nil), for: .selected)
        button.setImage(UIImage(named: "tuiroom_mic_disabled", in: tuiRoomKitBundle(), compatibleWith: nil), for: .disabled)
        button.sizeToFit()
        return button
    }()

    lazy var muteVideoButton: UIButton = {
        let button = UIButton(type: .custom)
        button.setImage(UIImage(named: "tuiroom_camera_open", in: tuiRoomKitBundle(), compatibleWith: nil), for: .normal)
        button.setImage(UIImage(named: "tuiroom_camera_close", in: tuiRoomKitBundle(), compatibleWith: nil), for: .selected)
        button.setImage(UIImage(named: "tuiroom_camera_disabled", in: tuiRoomKitBundle(), compatibleWith: nil), for: .disabled)
        button.sizeToFit()
        return button
    }()

    lazy var giftButton: UIButton? = {
        guard let image = UIImage(named: "barrage_enter_icon", in: tuiRoomKitBundle(), compatibleWith: nil) else { return nil }
        let barrageInfo = TUICore.getExtensionInfo(TUICore_TUIBarrageExtension_GetEnterBtn,
                                                   param: ["icon": image,])
        if let button = barrageInfo[TUICore_TUIBarrageExtension_GetEnterBtn] as? UIButton {
            return button
        }
        return nil
    }()

    lazy var beautyButton: UIButton = {
        let button = UIButton(type: .custom)
        button.setImage(UIImage(named: "tuiroom_beauty", in: tuiRoomKitBundle(), compatibleWith: nil), for: .normal)
        button.sizeToFit()
        return button
    }()

    lazy var membersButton: UIButton = {
        let button = UIButton(type: .custom)
        button.setImage(UIImage(named: "tuiroom_member", in: tuiRoomKitBundle(), compatibleWith: nil), for: .normal)
        button.sizeToFit()
        return button
    }()

    lazy var moreSettingButton: UIButton = {
        let button = UIButton(type: .custom)
        button.setImage(UIImage(named: "tuiroom_more", in: tuiRoomKitBundle(), compatibleWith: nil), for: .normal)
        button.sizeToFit()
        return button
    }()

    init(frame: CGRect, roomId: String, roomPresenter: RoomPresenter) {
        self.roomPresenter = roomPresenter
        roomInfo = EngineManager.shared.getRoomInfo(roomId: roomId)
        super.init(frame: frame)
        roomPresenter.addListener(listener: self)
        setupUI()
        activateConstraints()
        bindInteraction()
        mutebuttonStates()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    func setupUI() { // 控件添加
        backgroundColor = .clear
        addSubview(muteAudioButton)
        addSubview(muteVideoButton)
        addSubview(membersButton)
        addSubview(moreSettingButton)
        addSubview(beautyButton)
        if let giftButton = giftButton {
            addSubview(giftButton)
        }
    }

    func activateConstraints() {
        let diff = 1.0 / 6.0

        muteAudioButton.snp.remakeConstraints { make in
            make.centerX.equalTo(self.snp.centerX).multipliedBy(diff)
            make.centerY.equalToSuperview()
            make.width.height.equalTo(52)
        }

        muteVideoButton.snp.remakeConstraints { make in
            make.centerX.equalTo(self.snp.centerX).multipliedBy(diff * 3)
            make.centerY.equalToSuperview()
            make.width.height.equalTo(52)
        }

        beautyButton.snp.remakeConstraints { make in
            make.centerX.equalTo(self.snp.centerX).multipliedBy(diff * 5)
            make.centerY.equalToSuperview()
            make.width.height.equalTo(52)
        }

        membersButton.snp.remakeConstraints { make in
            make.centerX.equalTo(self.snp.centerX).multipliedBy(diff * 7)
            make.centerY.equalToSuperview()
            make.width.height.equalTo(52)
        }

        giftButton?.snp.remakeConstraints { make in
            make.centerX.equalTo(self.snp.centerX).multipliedBy(diff * 9)
            make.centerY.equalToSuperview()
            make.width.height.equalTo(52)
        }

        moreSettingButton.snp.remakeConstraints { make in
            make.centerX.equalTo(self.snp.centerX).multipliedBy(diff * 11)
            make.centerY.equalToSuperview()
            make.width.height.equalTo(52)
        }
    }

    func bindInteraction() { // 点击事件添加
        muteAudioButton.addTarget(self, action: #selector(muteAudioButtonClick), for: .touchUpInside)
        muteVideoButton.addTarget(self, action: #selector(muteVideoButtonClick), for: .touchUpInside)
        membersButton.addTarget(self, action: #selector(membersButtonClick), for: .touchUpInside)
        moreSettingButton.addTarget(self, action: #selector(moreSettingButtonClick), for: .touchUpInside)
        giftButton?.addTarget(self, action: #selector(giftButtonClick), for: .touchUpInside)
        beautyButton.addTarget(self, action: #selector(beautyButtonClick), for: .touchUpInside)
    }

    func mutebuttonStates() {
        muteVideoButton.isSelected = !(roomInfo.isOpenCamera)
        muteAudioButton.isSelected = !(roomInfo.isOpenMicrophone)
        if roomInfo.owner != roomPresenter.currentUser.userInfo.userId {
            //房主不会被全员静音禁画
            muteVideoButton.isEnabled = roomInfo.enableVideo
            muteAudioButton.isEnabled = roomInfo.enableAudio
        }
        if !muteVideoButton.isEnabled || muteVideoButton.isSelected {
            roomPresenter.localCamera(isOpen: false, isFront: true) {
            } onError: { _, _ in
            }
            self.roomPresenter.stopPushLocalVideo()
            
        }
        if !muteAudioButton.isEnabled || muteAudioButton.isSelected {
            roomPresenter.localMicrophone(isOpen: false) {
            } onError: { _, _ in
            }
            self.roomPresenter.stopPushLocalAudio()
        }
    }

    @objc func muteAudioButtonClick() {
        if !roomInfo.enableAudio && !muteAudioButton.isSelected && roomPresenter.currentUser.userInfo.userRole != .roomOwner {
            //如果房间已经全员静音，自己操作关闭麦克风就会使按钮处于无法点击状态，房主不会被全员静音
            muteAudioButton.isEnabled = false
        }
        muteAudioButton.isSelected = !muteAudioButton.isSelected
        roomPresenter.localMicrophone(isOpen: !muteAudioButton.isSelected) { [weak self] in
            guard let self = self else { return }
            if self.muteAudioButton.isSelected {
                self.roomPresenter.stopPushLocalAudio()
            } else {
                self.roomPresenter.startPushLocalAudio()
            }
        } onError: { [weak self] code, message in
            guard let self = self else { return }
            self.window?.makeToast(.noticeMicrophoneOffTitleText)
        }
    }

    @objc func muteVideoButtonClick() {
        if !roomInfo.enableVideo && !muteVideoButton.isSelected && roomPresenter.currentUser.userInfo.userRole != .roomOwner {
            //如果房间已经全员禁画，自己操作关闭摄像头就会使按钮处于无法点击状态，房主不会被全员禁画
            muteVideoButton.isEnabled = false
        }
        muteVideoButton.isSelected = !muteVideoButton.isSelected
        roomPresenter.localCamera(isOpen: !muteVideoButton.isSelected, isFront: true) { [weak self] in
            guard let self = self else { return }
            if self.muteVideoButton.isSelected {
                self.roomPresenter.stopPushLocalVideo()
            } else {
                self.roomPresenter.startPushLocalVideo()
            }
        } onError: { [weak self] code, message in
            guard let self = self else { return }
            self.window?.makeToast(.noticeCameraOffTitleText)
        }
    }

    @objc func membersButtonClick() {
        let noti = Notification(name: Notification.Name("kUserListControllerPush"))
        NotificationCenter.default.post(noti)
    }

    @objc func moreSettingButtonClick() {
        let noti = Notification(name: Notification.Name("kRoomSetControllerShow"))
        NotificationCenter.default.post(noti)
    }

    @objc func giftButtonClick(sender: UIButton) {
        let noti = Notification(name: Notification.Name("kBarrageSendViewShow"))
        NotificationCenter.default.post(noti)
    }

    @objc func beautyButtonClick(sender: UIButton) {
        let noti = Notification(name: Notification.Name("kBeautyViewShow"))
        NotificationCenter.default.post(noti)
    }

    deinit {
        debugPrint("deinit \(self)")
    }
}

extension BottomView: TUIRoomPresenterListener {
    func onPresenterRequestReceived(request: TUIRequest) {
        switch request.requestAction {
        case .invalidAction: break
        case .openRemoteCamera:
            roomPresenter.responseRemoteRequest(requestId: Int(request.requestId), agree: true) { [weak self] in
                guard let self = self else { return }
                self.window?.makeToast(.noticeCameraOnTitleText)
                self.muteVideoButton.isEnabled = true
                self.muteVideoButton.isSelected = true
            } onError: { _, _ in
            }
            break
        case .openRemoteMicrophone:
            roomPresenter.responseRemoteRequest(requestId: Int(request.requestId), agree: true) { [weak self] in
                guard let self = self else { return }
                self.window?.makeToast(.noticeMicrophoneOnTitleText)
                self.muteAudioButton.isEnabled = true
                self.muteAudioButton.isSelected = true
            } onError: { _, _ in
            }
            break
        case .connectOtherRoom:
            roomPresenter.responseRemoteRequest(requestId: Int(request.requestId), agree: true) {
            } onError: { _, _ in
            }
            break
        case .takeSeat:
            roomPresenter.responseRemoteRequest(requestId: Int(request.requestId), agree: true) {
            } onError: { _, _ in
            }
            break
        case .remoteUserOnSeat:
            roomPresenter.responseRemoteRequest(requestId: Int(request.requestId), agree: true) {
            } onError: { _, _ in
            }
            break
        @unknown default: break
        }
    }

    func onPresenterRoomInfoChanged(roomId: String, roomInfo: TUIRoomInfo) {
        if self.roomInfo.roomId == roomId {
            if self.roomInfo.enableVideo != roomInfo.enableVideo {
                if roomInfo.owner == roomPresenter.currentUser.userInfo.userId {
                    return
                }
                if !roomInfo.enableVideo {
                    muteVideoButton.isSelected = false
                    muteVideoButton.isEnabled = false
                    roomPresenter.localCamera(isOpen: false, isFront: true) {
                    } onError: { _, _ in
                    }
                    roomPresenter.stopPushLocalVideo()
                    window?.makeToast(.noticeCameraOffTitleText)
                } else {
                    muteVideoButton.isEnabled = true
                    muteVideoButton.isSelected = true
                    window?.makeToast(.noticeCameraOnTitleText)
                }
            }
            if self.roomInfo.enableAudio != roomInfo.enableAudio {
                if roomInfo.owner == roomPresenter.currentUser.userInfo.userId {
                    return
                }
                if !roomInfo.enableAudio {
                    muteAudioButton.isSelected = false
                    muteAudioButton.isEnabled = false
                    roomPresenter.localMicrophone(isOpen: false) {
                    } onError: { _, _ in
                    }
                    roomPresenter.stopPushLocalAudio()
                    window?.makeToast(.noticeMicrophoneOffTitleText)
                } else {
                    muteAudioButton.isEnabled = true
                    muteAudioButton.isSelected = true
                    window?.makeToast(.noticeMicrophoneOnTitleText)
                }
            }
        }
        self.roomInfo.update(engineRoomInfo: roomInfo)
    }
    
    func onPresenterUserScreenCaptureStopped(reason: Int) {
      roomPresenter.localCamera(isOpen: true, isFront: true) {
      } onError: { code, message in
          debugPrint("code:\(code),message\(message)")
      }
    }
    
    func onPresenterLocalCamera(isOpen: Bool) {
        muteVideoButton.isSelected = !isOpen
    }
    
    func onPresenterUserVideoStateChanged(userId: String, streamType: TUIVideoStreamType, hasVideo: Bool, reason: TUIChangeReason) {
        if userId == roomPresenter.currentUser.userInfo.userId && streamType == .cameraStream && !hasVideo {
            if !roomInfo.enableVideo && roomPresenter.currentUser.userInfo.userRole != .roomOwner {
                muteVideoButton.isEnabled = false
            }
            muteVideoButton.isSelected = true
            if reason == .byAdmin {
                window?.makeToast(.noticeCameraOffTitleText)
            }
        }
    }
    
    func onPresenterUserAudioStateChanged(userId: String, hasAudio: Bool, reason: TUIChangeReason) {
        if userId == roomPresenter.currentUser.userInfo.userId && !hasAudio {
            if !roomInfo.enableAudio && roomPresenter.currentUser.userInfo.userRole != .roomOwner {
                muteAudioButton.isEnabled = false
            }
            muteAudioButton.isSelected = true
            if reason == .byAdmin {
                window?.makeToast(.noticeMicrophoneOffTitleText)
            }
        }
    }
}

private extension String {
    static let noticeCameraOnTitleText = tuiRoomKitLocalize("TUIRoom.homeowners.notice.camera.turned.on")
    static let noticeCameraOffTitleText = tuiRoomKitLocalize("TUIRoom.homeowners.notice.camera.turned.off")
    static let noticeMicrophoneOnTitleText = tuiRoomKitLocalize("TUIRoom.homeowners.notice.microphone.turned.on")
    static let noticeMicrophoneOffTitleText = tuiRoomKitLocalize("TUIRoom.homeowners.notice.microphone.turned.off")
}
