//
//  BellFeature.swift
//  Pods
//
//  Created by janejntang on 2024/11/20.
//

import AVFAudio

class BellFeature: NSObject, AVAudioPlayerDelegate {
    private var audioPlayer: AVAudioPlayer?
    private let placeholderBellName = "phone_ringing"
    private let placeholderBellType = "mp3"
    private lazy var customBellPath: String? = {
        return ConferenceSession.sharedInstance.implementation.bellPath
    }()
    private lazy var enableMuteMode: Bool = {
        return ConferenceSession.sharedInstance.implementation.enableMuteMode
    }()
    private var needPlayRingtone = false
    
    override init() {
        super.init()
        registerNotifications()
    }
    
    private func registerNotifications() {
        NotificationCenter.default.addObserver(self, selector: #selector(handleInterruption(_:)), name: AVAudioSession.interruptionNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(handleAppWillResignActive), name: UIApplication.willResignActiveNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(handleAppDidBecomeActive), name: UIApplication.didBecomeActiveNotification, object: nil)
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
    
    @objc func handleInterruption(_ notification: Notification) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            guard let userInfo = notification.userInfo else { return }
            guard let typeValue = userInfo[AVAudioSessionInterruptionTypeKey] as? UInt else { return }
            guard let type = AVAudioSession.InterruptionType(rawValue: typeValue) else { return }
            switch type {
            case .began:
                self.audioPlayer?.pause()
            case .ended:
                let optinsValue = userInfo[AVAudioSessionInterruptionOptionKey] as? UInt ?? 0
                let options = AVAudioSession.InterruptionOptions(rawValue: optinsValue)
                if options.contains(.shouldResume), !self.enableMuteMode,  let audioPlayer = self.audioPlayer  {
                    audioPlayer.play()
                }
            default: break
            }
        }
    }
    
    @objc func handleAppWillResignActive() {
        audioPlayer?.pause()
    }
    
    @objc func handleAppDidBecomeActive() {
        if needPlayRingtone {
            playBell()
            needPlayRingtone = false
        } else if let audioPlayer = audioPlayer, !audioPlayer.isPlaying, !self.enableMuteMode {
            audioPlayer.play()
        }
    }
    
    func playBell() {
        guard !enableMuteMode else { return }
        guard let bellURL = findBellPath() else { return }
        if UIApplication.shared.applicationState != .background {
            playAudio(bellURL)
        } else {
            needPlayRingtone = true
        }
    }
    
    func stopBell() {
        audioPlayer?.stop()
        audioPlayer = nil
        needPlayRingtone = false
    }
    
    private func findBellPath() -> URL? {
        let customBellPath = customBellPath?.replacingOccurrences(of: "file://", with: "")
        if let bellPath = customBellPath, checkResourceExisted(path: bellPath) {
            return URL(fileURLWithPath: bellPath)
        } else {
            return tuiRoomKitBundle().url(forResource: placeholderBellName, withExtension: placeholderBellType)
        }
    }
    
    private func checkResourceExisted(path: String) -> Bool {
        return FileManager.default.fileExists(atPath: path)
    }
    
    private func playAudio(_ audioURL: URL) {
        do {
            try AVAudioSession.sharedInstance().overrideOutputAudioPort(.speaker)
        } catch let error {
            debugPrint("AVAudioSession set outputAudioPort error:\(error.localizedDescription)")
        }
        do {
            try audioPlayer = AVAudioPlayer(contentsOf: audioURL)
            audioPlayer?.numberOfLoops = -1
            audioPlayer?.delegate = self
            audioPlayer?.prepareToPlay()
        } catch let error {
            debugPrint("audioPlayer error: \(error.localizedDescription)")
        }
        audioPlayer?.play()
    }
}
