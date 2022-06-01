//
//  TUIRoomViewController.swift
//  TUIRoom
//
//  Created by WesleyLei on 2021/12/16.
//  Copyright © 2021 Tencent. All rights reserved.
//
import SnapKit
import TXAppBasic
import UIKit

extension TUIRoomMemberListViewController {
    var kickOffBlock: TUIRoomKickOffBlock {
        let block: TUIRoomKickOffBlock = { [weak self] userInfo, callBack in
            guard let `self` = self else { return }
            let alertVC = UIAlertController(title: tuiRoomLocalizeReplaceXX(.kickOffTitleText, userInfo.userName),
                                            message: nil,
                                            preferredStyle: .alert)
            let cancelAction = UIAlertAction(title: .kickOffCancelText, style: .cancel, handler: nil)
            let sureAction = UIAlertAction(title: .kickOffOkText, style: .default) { [weak self] _ in
                guard let self = self else { return }
                self.kickOffUser(userInfo, callBack)
            }
            alertVC.addAction(cancelAction)
            alertVC.addAction(sureAction)
            self.present(alertVC, animated: true, completion: nil)
        }
        return block
    }

    func kickOffUser(_ userInfo: TUIRoomUserInfo, _ callBack: @escaping TUIRoomActionCallback) {
        TUIRoomCore.shareInstance().kickOffUser(userInfo.userId) { [weak self] code, message in
            guard let self = self else { return }
            if code == 0 {
                self.delegate?.onKickOffUser(userInfo: userInfo)
                self.memberListRefresh()
            } else {
                self.view.makeToast(tuiRoomLocalizeReplaceXX(.kickOffErrorToastText, userInfo.userName))
            }
            callBack(code, message)
        }
    }

    var muteAudioBlock: TUIRoomMuteBlock {
        let block: TUIRoomMuteBlock = { [weak self] userInfo, mute, callBack in
            TUIRoomCore.shareInstance().muteUserMicrophone(userInfo.userId, mute: mute) { [weak self] code, message in
                guard let `self` = self else { return }
                if code == 0 {
                    callBack(code, message)
                    self.reloadData()
                    if !mute {
                        self.view.makeToast(.muteAudioSuccessToastText)
                    }
                } else {
                    self.view.makeToast(tuiRoomLocalizeReplaceXX(.muteAudioErrorToastText, userInfo.userName))
                }
            }
        }
        return block
    }

    var muteVideoBlock: TUIRoomMuteBlock {
        let block: TUIRoomMuteBlock = { [weak self] userInfo, mute, callBack in
            TUIRoomCore.shareInstance().muteUserCamera(userInfo.userId, mute: mute) { [weak self] code, message in
                guard let `self` = self else { return }
                if code == 0 {
                    callBack(code, message)
                    self.reloadData()
                    if !mute {
                        self.view.makeToast(.muteVideoSuccessToastText)
                    }
                } else {
                    self.view.makeToast(tuiRoomLocalizeReplaceXX(.muteVideoErrorToastText, userInfo.userName))
                }
            }
        }
        return block
    }

    @objc func memberListRefresh() {
        attendeeList = delegate?.getAttendeeList() ?? []
        attendeeList = attendeeList.filter { (model) -> Bool in
            model.userInfo.userId != TUIRoomUserManage.currentUserId()
        }
        reloadData()
    }

    @objc func memberStateRefresh() {
        reloadData()
    }

    @objc func resetView() {
        reloadData()
        updateView()
    }
}

private extension String {
    static let logoutButtonText = tuiRoomLocalize("TUIRoom.logout.room")
    static let kickOffErrorToastText = tuiRoomLocalize("TUIRoom.kick.off.error.toast")
    static let kickOffTitleText = tuiRoomLocalize("TUIRoom.suer.kick.off.xxx")
    static let kickOffOkText = tuiRoomLocalize("TUIRoom.ok")
    static let kickOffCancelText = tuiRoomLocalize("TUIRoom.cancel")
    static let muteAudioErrorToastText = tuiRoomLocalize("TUIRoom.mute.audio.error.toast")
    static let muteVideoErrorToastText = tuiRoomLocalize("TUIRoom.mute.video.error.toast")
    static let muteAudioSuccessToastText = tuiRoomLocalize("TUIRoom.mute.audio.success.toast")
    static let muteVideoSuccessToastText = tuiRoomLocalize("TUIRoom.mute.video.success.toast")
}
