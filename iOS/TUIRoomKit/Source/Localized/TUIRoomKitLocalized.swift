//
//  RoomKitLocalized.swift
//  TUIRoomKit
//
//  Created by WesleyLei on 2022/9/13.
//

import UIKit

func tuiRoomKitLocalize(_ key: String) -> String {
    return TUIRoomKitLocalized.sharedBundle.localizedString(forKey: key, value: "", table: "TUIRoomKitLocalized")
}

func tuiRoomKitLocalizeReplace(_ origin: String, replace: String) -> String {
    return origin.replacingOccurrences(of: "xxx", with: replace)
}

func tuiRoomKitBundle() -> Bundle {
    return TUIRoomKitLocalized.sharedBundle
}

private class TUIRoomKitLocalized {
    class var sharedBundle: Bundle {
        struct Static {
            static let bundel: Bundle? = tuiRoomKitBundle()
        }
        guard let bunddel = Static.bundel else {
            return Bundle()
        }
        return bunddel
    }
}

private func tuiRoomKitBundle() -> Bundle? {
    var url: NSURL? = Bundle.main.url(forResource: "TUIRoomKitBundle", withExtension: "bundle") as NSURL?
    if let associateBundleURL = url {
        return Bundle(url: associateBundleURL as URL)
    }
    url = Bundle.main.url(forResource: "Frameworks", withExtension: nil) as NSURL?
    url = url?.appendingPathComponent("TUIRoomKit") as NSURL?
    url = url?.appendingPathComponent("framework") as NSURL?
    if let associateBundleURL = url {
        let bundle = Bundle(url: associateBundleURL as URL)
        url = bundle?.url(forResource: "TUIRoomKitBundle", withExtension: "bundle") as NSURL?
        if let associateBundleURL = url {
            return Bundle(url: associateBundleURL as URL)
        }
    }
    return nil
}
