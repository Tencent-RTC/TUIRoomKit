//
//  VolumeView.swift
//  Pods
//
//  Created by janejntang on 2024/12/24.
//

struct VolumeViewScale {
    let topWidthScale = 6.0 / 14.0
    let topHightScale = 10.0 / 14.0
    let bottomWidthScale = 11.2 / 14.0
    let bottomHightScale = 7.5 / 14.0
}

class VolumeView: UIView {
    private let maxVolume = 100.0
    private let minVolume = 0.0
    private let volumeViewScale = VolumeViewScale()
    
    let muteImageLayer: CALayer = {
        let image = UIImage(named: "room_mute_audio_red", in: tuiRoomKitBundle(), compatibleWith: nil)
        let imageLayer = CALayer()
        imageLayer.contents = image?.cgImage
        imageLayer.masksToBounds = true
        imageLayer.cornerRadius = 3
        return imageLayer
    }()
    
    let unmuteImageLayer: CALayer = {
        return CALayer()
    }()
    
    let micTopImageLayer: CALayer = {
        let imageLayer = CALayer()
        imageLayer.backgroundColor = UIColor(0x99A0AE).cgColor
        imageLayer.masksToBounds = true
        imageLayer.cornerRadius = 3
        return imageLayer
    }()
    
    let micBottomImageLayer: CALayer = {
        let image = UIImage(named: "mic_bottom", in: tuiRoomKitBundle(), compatibleWith: nil)
        let imageLayer = CALayer()
        imageLayer.contents = image?.cgImage
        return imageLayer
    }()
    
    let colorLayer: CALayer = {
        let colorLayer = CALayer()
        colorLayer.backgroundColor = UIColor(0x14D89D).cgColor
        return colorLayer
    }()
    
    private var isViewReady: Bool = false
    
    override func layoutSubviews() {
        super.layoutSubviews()
        guard !isViewReady else { return }
        isViewReady = true
        setupSublayer()
        handleSublayerLayout()
    }
    
    private func setupSublayer() {
        layer.addSublayer(muteImageLayer)
        layer.addSublayer(unmuteImageLayer)
        unmuteImageLayer.addSublayer(micBottomImageLayer)
        unmuteImageLayer.addSublayer(micTopImageLayer)
    }
    
    private func handleSublayerLayout() {
        muteImageLayer.frame = bounds
        unmuteImageLayer.frame = bounds
        let width = unmuteImageLayer.frame.width
        let height = unmuteImageLayer.frame.height
        let micTopWidth = width * volumeViewScale.topWidthScale
        let micTopHight = height * volumeViewScale.topHightScale
        let micTopX = (width - micTopWidth) / 2.0
        let micTopY = 0.0
        micTopImageLayer.frame = CGRect(x: micTopX, y: micTopY, width: micTopWidth, height: micTopHight)
        micTopImageLayer.anchorPoint = CGPoint(x: 0, y: 1)
        micTopImageLayer.transform = CATransform3DMakeScale(1, -1, 1)
        micTopImageLayer.position = CGPoint(x: micTopX, y: micTopY)
        
        colorLayer.position = CGPoint(x: 0, y: 0)
        colorLayer.frame.size.width = micTopImageLayer.bounds.width
        micTopImageLayer.addSublayer(colorLayer)
        
        let micBottomWidth = width * volumeViewScale.bottomWidthScale
        let micBottomHight = height * volumeViewScale.bottomHightScale
        let micBottomX = (width - micBottomWidth) / 2.0
        let micBottomY = height - micBottomHight
        micBottomImageLayer.frame = CGRect(x: micBottomX, y: micBottomY, width: micBottomWidth, height: micBottomHight)
    }
    
    func updateVolume(_ volume: CGFloat) {
        var volume = min(volume, maxVolume)
        volume = max(volume,minVolume)
        self.colorLayer.frame.size.height = micTopImageLayer.frame.height * (volume / maxVolume)
    }
    
    func updateAudio(_ hasAudio: Bool) {
        muteImageLayer.isHidden = hasAudio
        unmuteImageLayer.isHidden = !hasAudio
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
    
}
