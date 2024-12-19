//
//  vibrationFeature.swift
//  Pods
//
//  Created by janejntang on 2024/11/20.
//

import AVFAudio

class VibrationFeature {
    private var vibrationTimer: Timer?
    private let vibrationInterval = 0.1
    private let maxVibrationTime = 60.0
    private lazy var enableVibrationMode: Bool = {
        return ConferenceSession.sharedInstance.implementation.enableVibrationMode
    }()
    
    
    func playVibrate() {
        guard enableVibrationMode else { return }
        var vibrationCount = 0
        let vibrationTotalCount = Int(maxVibrationTime / vibrationInterval)
        vibrationTimer = Timer.scheduledTimer(withTimeInterval: vibrationInterval, repeats: true) { [weak self] timer in
            guard let self = self else { return }
            guard UIApplication.shared.applicationState == .active else { return }
            AudioServicesPlaySystemSound(kSystemSoundID_Vibrate)
            vibrationCount = vibrationCount + 1
            if vibrationCount >= vibrationTotalCount {
                self.stopVibrate()
            }
        }
    }
    
    func stopVibrate() {
        vibrationTimer?.invalidate()
        vibrationTimer = nil
    }
    
    deinit {
        debugPrint("deinit:\(self)")
    }
}
