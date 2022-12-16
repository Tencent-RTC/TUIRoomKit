//
//  RoomMainViewController+UI.swift
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
        guard let roomId = UserDefaults.standard.object(forKey: "TUIRoomLastRoomId") as? Int32 else {
            return
        }
        if roomId > 0 {
            UserDefaults.standard.set(roomId, forKey: "TUIRoomLastRoomId")
            UserDefaults.standard.synchronize()
        }
    }

    func tuiRestore() {
        guard let roomId = UserDefaults.standard.object(forKey: "TUIRoomLastRoomId") as? Int32 else {
            return
        }
        let alertVC = UIAlertController(title:
                                            localizeReplaceOneCharacter(origin: .errorLogoutRoomNumText,
                                                                        xxx_replace: "\(roomId)"),
                                        message: nil,
                                        preferredStyle: .alert)
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
    }
}

private extension String {
    static let errorLogoutRoomNumText = TRTCDemoLocalize("TUIRoom.error.logout.room.num")
    static let noLoginText = TRTCDemoLocalize("TUIRoom.no.login")
    static let enterAgainText = TRTCDemoLocalize("TUIRoom.enter.again")
}

/// MARK: - Color
private extension UIAlertAction {
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
