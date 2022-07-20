//
//  TUIRoomMainViewController+UI.swift
//  TUIRoom
//
//  Created by WesleyLei on 2021/12/16.
//  Copyright © 2021 Tencent. All rights reserved.
//

import Foundation
import ImSDK_Plus
import SnapKit
import Toast_Swift
import TXAppBasic
import UIKit
import TUICore

extension TUIRoomMainViewController {
    @objc func switchAudioButtonClick() {
        switchAudioRouteButton.isSelected = !switchAudioRouteButton.isSelected
        TUIRoomCore.shareInstance().setSpeaker(!switchAudioRouteButton.isSelected)
    }

    @objc func switchCameraButtonClick() {
        switchCameraButton.isSelected = !switchCameraButton.isSelected
        TUIRoomCore.shareInstance().switchCamera(!switchCameraButton.isSelected)
    }

    @objc func showLogView(gesture: UILongPressGestureRecognizer) {
        if gesture.state != UIGestureRecognizer.State.began {
            return
        }
        if roomIdLabel.tag == 0 {
            TRTCCloud.sharedInstance().setDebugViewMargin(currentUser.userId(), margin: TXEdgeInsets(top: 70, left: 10, bottom: 30, right: 10))
            TRTCCloud.sharedInstance().showDebugView(2)
            roomIdLabel.tag = 1
        } else {
            TRTCCloud.sharedInstance().showDebugView(0)
            roomIdLabel.tag = 0
        }
    }

    @objc func copyButtonClick() {
        let pas = UIPasteboard.general
        pas.string = roomIdLabel.text
        view.makeToast(.copySuccessText)
    }

    @objc func exitButtonClick() {
        guard let roomInfo = TUIRoomCore.shareInstance().getRoomInfo() else {
            return
        }
        let alertVC = UIAlertController(title: roomInfo.isHomeowner() ? .homeownersLogoutTitle : .audienceLogoutTitle,
                                        message: nil,
                                        preferredStyle: .alert)
        let cancelAction = UIAlertAction(title: .destroyRoomCancelTitle, style: .cancel, handler: nil)
        let sureAction = UIAlertAction(title: roomInfo.isHomeowner() ?.destroyRoomOkTitle : .logoutOkText, style: .default) { [weak self] _ in
            guard let self = self else { return }
            self.exitRoomLogic(roomInfo.isHomeowner())
        }
        sureAction.setTextColor(UIColor.red)
        alertVC.addAction(cancelAction)
        alertVC.addAction(sureAction)
        present(alertVC, animated: true, completion: nil)
    }

    @objc func muteAudioButtonClick() {
        muteAudioButton.isSelected = !muteAudioButton.isSelected
        guard let localPreviewView = getRenderViewByUserid(userId: TUIRoomUserManage.currentUserId()) else {
            return
        }
        let isAudioAvailable = !muteAudioButton.isSelected
        localPreviewView.refreshAudio(isAudioAvailable: isAudioAvailable)
        if muteAudioButton.isSelected {
            currentUser.userInfo.isAudioAvailable = false
            TUIRoomCore.shareInstance().stopLocalAudio()
        } else {
            currentUser.userInfo.isAudioAvailable = true
            TUIRoomCore.shareInstance().startLocalAudio(.speech)
        }
    }

    @objc func muteVideoButtonClick() {
        guard let localPreviewView = getRenderViewByUserid(userId: TUIRoomUserManage.currentUserId()) else {
            return
        }
        muteVideoButton.isSelected = !muteVideoButton.isSelected
        if muteVideoButton.isSelected {
            TUIRoomCore.shareInstance().stopCameraPreview()
            currentUser.userInfo.isVideoAvailable = false
        } else {
            currentUser.userInfo.isVideoAvailable = true
            if #available(iOS 11.0, *) {
                TUIRoomCore.shareInstance().stopScreenCapture()
            }
            TUIRoomCore.shareInstance().startCameraPreview(!switchCameraButton.isSelected, view: localPreviewView)
        }
        localPreviewView.refreshVideo(isVideoAvailable: !muteVideoButton.isSelected)
    }

    @objc func beautyButtonClick() {
        if let view = beautyView, view.superview == nil {
            self.view.addSubview(view)
        }
        beautyView?.isHidden = false
    }

    @objc func membersButtonClick() {
        let vc = TUIRoomMemberListViewController()
        vc.delegate = self
        navigationController?.pushViewController(vc, animated: true)
    }

    @objc func moreSettingButtonClick() {
        let vc = TUIRoomSetViewController()
        vc.isSomeoneSharing = shareAttendeeList.count >= 1
        vc.audioModel = audioModel
        vc.videoModel = videoModel
        vc.modalPresentationStyle = .custom
        vc.transitioningDelegate = self
        present(vc, animated: true, completion: nil)
        setViewController = vc
    }

    func exitRoomLogic(_ isHomeowner: Bool) {
        TUIRoomCore.shareInstance().stopScreenCapture()
        TRTCCloud.sharedInstance().setLocalVideoProcessDelegete(nil, pixelFormat: ._Texture_2D, bufferType: .texture)
        if isHomeowner {
            TUIRoomCore.shareInstance().destroyRoom { [weak self] _, _ in
                guard let self = self else { return }
                if self.navigationController?.viewControllers.first == self {
                    self.dismiss(animated: true)
                } else {
                    self.navigationController?.popViewController(animated: true)
                }
            }
        } else {
            TUIRoomCore.shareInstance().leaveRoom { [weak self] _, _ in
                guard let self = self else { return }
                if self.navigationController?.viewControllers.first == self {
                    self.dismiss(animated: true)
                } else {
                    self.navigationController?.popViewController(animated: true)
                }
            }
        }
        TUIRoom.sharedInstance.isEnterRoom = false
    }
    
    @objc
    func reportClick() {
        let selector = NSSelectorFromString("showReportAlertWithRoomId:ownerId:")
        if self.responds(to: selector) {
            self.perform(selector, with: roomInfo.roomId, with: roomInfo.ownerId)
        }
    }
}

// MARK: - TUILoginListener
extension TUIRoomMainViewController: TUILoginListener {
    func onConnecting() {
        
    }
    
    func onConnectSuccess() {
        
    }
    
    func onConnectFailed(_ code: Int32, err: String!) {
        
    }
    
    func onKickedOffline() {
        exitRoomLogic(roomInfo.isHomeowner())
    }
    
    func onUserSigExpired() {
        
    }
}

/// MARK: - internationalization string
private extension String {
    static let homeownersLogoutTitle = tuiRoomLocalize("TUIRoom.sure.destroy.room")
    static let destroyRoomOkTitle = tuiRoomLocalize("TUIRoom.destroy.room.ok")
    static let destroyRoomCancelTitle = tuiRoomLocalize("TUIRoom.destroy.room.cancel")
    static let audienceLogoutTitle = tuiRoomLocalize("TUIRoom.sure.leave.room")
    static let logoutOkText = tuiRoomLocalize("TUIRoom.ok")
    static let logoutCancelText = tuiRoomLocalize("TUIRoom.cancel")
    static let copySuccessText = tuiRoomLocalize("TUIRoom.copy.success")
}

/// MARK: - Color
extension UIAlertAction {
    static var propertyNames: [String] {
        var outCount: UInt32 = 0
        guard let ivars = class_copyIvarList(self, &outCount) else {
            return []
        }
        var result = [String]()
        let count = Int(outCount)
        for i in 0 ..< count {
            let pro: Ivar = ivars[i]
            guard let ivarName = ivar_getName(pro) else {
                continue
            }
            guard let name = String(utf8String: ivarName) else {
                continue
            }
            result.append(name)
        }
        return result
    }

    func isPropertyExisted(_ propertyName: String) -> Bool {
        for name in UIAlertAction.propertyNames where name == propertyName {
            return true
        }
        return false
    }

    func setTextColor(_ color: UIColor) {
        let key = "_titleTextColor"
        guard isPropertyExisted(key) else {
            return
        }
        setValue(color, forKey: key)
    }
}
