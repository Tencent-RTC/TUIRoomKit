//
//  ExtensionBroadcastLauncher.swift
//  TUIRoom
//
//  Created by WesleyLei on 2021/12/16.
//  Copyright © 2021 Tencent. All rights reserved.
//

import ReplayKit
import UIKit

@available(iOS 12.0, *)
class ExtensionBroadcastLauncher: NSObject {
    var systemBroacastExtensionPicker = RPSystemBroadcastPickerView()
    var prevLaunchEventTime: CFTimeInterval = 0

    static let sharedInstance = ExtensionBroadcastLauncher()

    override private init() {
        super.init()
        let picker = RPSystemBroadcastPickerView(frame: CGRect(x: 0, y: 0, width: 44, height: 44))
        picker.showsMicrophoneButton = false
        picker.autoresizingMask = [.flexibleTopMargin, .flexibleRightMargin]
        systemBroacastExtensionPicker = picker

        if let pluginPath = Bundle.main.builtInPlugInsPath,
           let contents = try? FileManager.default.contentsOfDirectory(atPath: pluginPath) {
            for content in contents where content.hasSuffix(".appex") {
                guard let bundle = Bundle(path: URL(fileURLWithPath: pluginPath).appendingPathComponent(content).path),
                      let identifier: String = (bundle.infoDictionary?["NSExtension"] as? [String: Any])? ["NSExtensionPointIdentifier"] as? String
                else {
                    continue
                }
                if identifier == "com.apple.broadcast-services-upload" {
                    picker.preferredExtension = bundle.bundleIdentifier
                    break
                }
            }
        }
    }

    static func launch() {
        ExtensionBroadcastLauncher.sharedInstance.launch()
    }

    func launch() {
        let now = CFAbsoluteTimeGetCurrent()
        if now - prevLaunchEventTime < 1.0 {
            return
        }
        prevLaunchEventTime = now

        for view in systemBroacastExtensionPicker.subviews {
            if let button = view as? UIButton {
                button.sendActions(for: .allTouchEvents)
                break
            }
        }
    }
}
