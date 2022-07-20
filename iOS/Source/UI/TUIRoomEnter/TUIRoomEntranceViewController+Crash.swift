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

func SignalExceptionHandler(signal: Int32) {
    TUIRoomEntranceViewController.tuiRoomExit()
}

extension TUIRoomEntranceViewController {

    func registerSignalHandler() {
        signal(SIGABRT, SignalExceptionHandler)
        signal(SIGSEGV, SignalExceptionHandler)
        signal(SIGBUS, SignalExceptionHandler)
        signal(SIGTRAP, SignalExceptionHandler)
        signal(SIGILL, SignalExceptionHandler)
        signal(SIGHUP, SignalExceptionHandler)
        signal(SIGINT, SignalExceptionHandler)
        signal(SIGQUIT, SignalExceptionHandler)
        signal(SIGFPE, SignalExceptionHandler)
        signal(SIGPIPE, SignalExceptionHandler)
    }

    func unregisterSignalHandler() {
        signal(SIGABRT, SIG_DFL)
        signal(SIGSEGV, SIG_DFL)
        signal(SIGBUS, SIG_DFL)
        signal(SIGTRAP, SIG_DFL)
        signal(SIGILL, SIG_DFL)
        signal(SIGHUP, SIG_DFL)
        signal(SIGINT, SIG_DFL)
        signal(SIGQUIT, SIG_DFL)
        signal(SIGFPE, SIG_DFL)
        signal(SIGPIPE, SIG_DFL)
    }

    public static func tuiRoomExit() {
        guard let roomInfo = TUIRoomCore.shareInstance().getRoomInfo() else {
            return
        }
        let roomId = roomInfo.getTRTCRoomId()
        if roomId > 0 {
            UserDefaults.standard.set(roomId, forKey: "TUIRoomLastRoomId")
            UserDefaults.standard.synchronize()
        }
    }

    func tuiRestore() {
        guard let roomId = UserDefaults.standard.object(forKey: "TUIRoomLastRoomId") as? Int32 else {
            return
        }
        let alertVC = UIAlertController(title: tuiRoomLocalizeReplaceXX(.errorLogoutRoomNumText, "\(roomId)"), message: nil, preferredStyle: .alert)
        let cancelAction = UIAlertAction(title: .noLoginText, style: .cancel) { _ in
            UserDefaults.standard.set(nil, forKey: "TUIRoomLastRoomId")
        }
        let sureAction = UIAlertAction(title: .enterAgainText, style: .default) { [weak self] _ in
            guard let self = self else { return }
            UserDefaults.standard.set(nil, forKey: "TUIRoomLastRoomId")
            self.enterRoom(roomId)
        }
        sureAction.setTextColor(UIColor.red)
        alertVC.addAction(cancelAction)
        alertVC.addAction(sureAction)
        present(alertVC, animated: true, completion: nil)
    }

    func enterRoom(_ roomId: Int32) {
        TUIRoom.sharedInstance.enterRoom(roomId: Int(roomId), isOpenCamera: true, isOpenMicrophone: true)
    }
}

private extension String {
    static let errorLogoutRoomNumText = tuiRoomLocalize("TUIRoom.error.logout.room.num")
    static let noLoginText = tuiRoomLocalize("TUIRoom.no.login")
    static let enterAgainText = tuiRoomLocalize("TUIRoom.enter.again")
}
