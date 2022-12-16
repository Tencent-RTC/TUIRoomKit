//
//  TUIRoomViewController.swift
//  TUIRoom
//
//  Created by WesleyLei on 2021/12/16.
//  Copyright © 2021 Tencent. All rights reserved.
//
import SnapKit
import TUIRoomEngine
import TXAppBasic
import UIKit

extension UserListViewController {
    var kickOffBlock: TUIRoomKickOffBlock {
        let block: TUIRoomKickOffBlock = { [weak self] userInfo, success, error in
            guard let `self` = self else { return }
            let alertVC = UIAlertController(title: tuiRoomKitLocalizeReplace(.kickOffTitleText, replace: userInfo.userName),
                                            message: nil,
                                            preferredStyle: .alert)
            let cancelAction = UIAlertAction(title: .kickOffCancelText, style: .cancel, handler: nil)
            let sureAction = UIAlertAction(title: .kickOffOkText, style: .default) { [weak self] _ in
                guard let self = self else { return }
                self.kickOffUser(userInfo, onSuccess: success, onError: error)
            }
            alertVC.addAction(cancelAction)
            alertVC.addAction(sureAction)
            self.present(alertVC, animated: true, completion: nil)
        }
        return block
    }

    func kickOffUser(_ userInfo: TUIUserInfo, onSuccess: @escaping TUISuccessBlock, onError: @escaping TUIErrorBlock) {
        roomPresenter.kickOutRemoteUser(userId: userInfo.userId) { [weak self] in
            guard let self = self else { return }
            self.attendeeList = self.attendeeList.filter { model -> Bool in
                model.userId != userInfo.userId
            }
            self.attendeeMap.removeValue(forKey: userInfo.userId)
            self.userListRefresh()
            onSuccess()
        } onError: { code, message in
            self.view.makeToast(tuiRoomKitLocalizeReplace(.kickOffErrorToastText, replace: userInfo.userName))
            onError(code, message)
        }
    }

    var muteAudioBlock: TUIRoomMuteBlock {
        let block: TUIRoomMuteBlock = { [weak self] userInfo, mute, success, error in
            guard let self = self else { return }
            if mute {
                self.roomPresenter.closeRemoteMicrophone(userId: userInfo.userId) {  [weak self] in
                    guard let self = self else { return }
                    success()
                    self.reloadData()
                    if !mute {
                        self.view.makeToast(.muteAudioSuccessToastText)
                    }
                } onError: { [weak self] code, message in
                    guard let self = self else { return }
                    error(code, message)
                    self.view.makeToast(tuiRoomKitLocalizeReplace(.muteAudioErrorToastText, replace: userInfo.userName))
                }

            } else {
                self.roomPresenter.requestToOpenRemoteMicrophone(userId: userInfo.userId, timeout: 30) { [weak self] _, _ in
                    guard let self = self else { return }
                    success()
                    if !mute {
                        self.view.makeToast(.muteAudioSuccessToastText)
                    }
                } onRejected: { [weak self] _, _, message in
                    guard let self = self else { return }
                    error(.failed, message)
                    self.view.makeToast(tuiRoomKitLocalizeReplace(.muteAudioErrorToastText, replace: userInfo.userName))
                } onCancelled: { [weak self] requestId, userId in
                    guard let self = self else { return }
                    error(.failed, "onCancelled")
                    self.view.makeToast(tuiRoomKitLocalizeReplace(.muteAudioErrorToastText, replace: userInfo.userName))
                } onTimeout: { [weak self] _, _ in
                    guard let self = self else { return }
                    error(.failed, "timeout")
                    self.view.makeToast(tuiRoomKitLocalizeReplace(.muteAudioErrorToastText, replace: userInfo.userName))
                } onError: { [weak self] _, _, code, message in
                    guard let self = self else { return }
                    error(code, message)
                    self.view.makeToast(tuiRoomKitLocalizeReplace(.muteAudioErrorToastText, replace: userInfo.userName))
                }
            }
        }
        return block
    }

    var muteVideoBlock: TUIRoomMuteBlock {
        let block: TUIRoomMuteBlock = { [weak self] userInfo, mute, success, error in
            guard let self = self else { return }
            if mute {
                self.roomPresenter.closeRemoteCamera(userId: userInfo.userId) { [weak self] in
                    guard let self = self else { return }
                    success()
                    self.reloadData()
                    if !mute {
                        self.view.makeToast(.muteVideoSuccessToastText)
                    }
                } onError: { [weak self] code, message in
                    guard let self = self else { return }
                    error(code, message)
                    self.view.makeToast(tuiRoomKitLocalizeReplace(.muteAudioErrorToastText, replace: userInfo.userName))
                }

            } else {
                self.roomPresenter.requestToOpenRemoteCamera(userId: userInfo.userId, timeout: 30) { [weak self] _, _ in
                    guard let self = self else { return }
                    success()
                    self.reloadData()
                    if !mute {
                        self.view.makeToast(.muteVideoSuccessToastText)
                    }
                } onRejected: { [weak self] _, _, _ in
                    guard let self = self else { return }
                    self.view.makeToast(tuiRoomKitLocalizeReplace(.muteVideoErrorToastText, replace: userInfo.userName))
                } onCancelled: { [weak self] _, _ in
                    guard let self = self else { return }
                    self.view.makeToast(tuiRoomKitLocalizeReplace(.muteVideoErrorToastText, replace: userInfo.userName))
                } onTimeout: { [weak self] _, _ in
                    guard let self = self else { return }
                    self.view.makeToast(tuiRoomKitLocalizeReplace(.muteVideoErrorToastText, replace: userInfo.userName))
                } onError: { [weak self] _, _, code, message in
                    guard let self = self else { return }
                    error(code, message)
                    self.view.makeToast(tuiRoomKitLocalizeReplace(.muteVideoErrorToastText, replace: userInfo.userName))
                }
            }
        }
        return block
    }

    @objc func userListRefresh() {
        reloadData()
    }
}

private extension String {
    static let logoutButtonText = tuiRoomKitLocalize("TUIRoom.logout.room")
    static let kickOffErrorToastText = tuiRoomKitLocalize("TUIRoom.kick.off.error.toast")
    static let kickOffTitleText = tuiRoomKitLocalize("TUIRoom.suer.kick.off.xxx")
    static let kickOffOkText = tuiRoomKitLocalize("TUIRoom.ok")
    static let kickOffCancelText = tuiRoomKitLocalize("TUIRoom.cancel")
    static let muteAudioErrorToastText = tuiRoomKitLocalize("TUIRoom.mute.audio.error.toast")
    static let muteVideoErrorToastText = tuiRoomKitLocalize("TUIRoom.mute.video.error.toast")
    static let muteAudioSuccessToastText = tuiRoomKitLocalize("TUIRoom.mute.audio.success.toast")
    static let muteVideoSuccessToastText = tuiRoomKitLocalize("TUIRoom.mute.video.success.toast")
}
