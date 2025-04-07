//
//  LocalAudioView.swift
//  TUIRoomKit
//
//  Created by janejntang on 2024/1/5.
//

import Foundation
import Factory
import Combine

class LocalAudioView: UIView {
    @Injected(\.localAudioStore) var localAudioStore: LocalAudioStore
    private var cancellables = Set<AnyCancellable>()
    let muteAudioButton : UIButton = {
        let button = UIButton()
        button.backgroundColor = UIColor(0x2A2D38)
        button.layer.cornerRadius = 12
        return button
    }()
    
    let volumeView : VolumeView = {
        let volumeView = VolumeView()
        volumeView.micTopImageLayer.borderWidth = 1.7
        volumeView.micTopImageLayer.borderColor = UIColor(0xD5E0F2).cgColor
        volumeView.micTopImageLayer.backgroundColor = UIColor.clear.cgColor
        volumeView.micTopImageLayer.cornerRadius = 5
        volumeView.muteImageLayer.contents = UIImage(named: "room_mute_audio1", in: tuiRoomKitBundle(), compatibleWith: nil)?.cgImage
        volumeView.isUserInteractionEnabled = false
        return volumeView
    }()
    
    init() {
        super.init(frame: .zero)
        self.transform = CGAffineTransform(translationX: 0, y: kScreenHeight)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    // MARK: - view layout
    private var isViewReady: Bool = false
    override func didMoveToWindow() {
        super.didMoveToWindow()
        guard !isViewReady else { return }
        constructViewHierarchy()
        activateConstraints()
        bindInteraction()
        isViewReady = true
    }
    
    private func constructViewHierarchy() {
        addSubview(muteAudioButton)
        muteAudioButton.addSubview(volumeView)
    }
    
    private func activateConstraints() {
        muteAudioButton.snp.makeConstraints { make in
            make.edges.equalToSuperview()
        }
        volumeView.snp.makeConstraints { make in
            make.center.equalToSuperview()
            make.width.height.equalTo(24)
        }
    }
    
    private func bindInteraction() {
        muteAudioButton.addTarget(self, action: #selector(muteAudioAction(sender:)), for: .touchUpInside)
        subscribeSubject()
    }
    
    private func subscribeSubject() {
        localAudioStore.subscribe(Selector(keyPath: \LocalAudioState.volume))
            .removeDuplicates()
            .receive(on: RunLoop.main)
            .sink { [weak self] volume in
                guard let self = self else { return }
                self.volumeView.updateVolume(CGFloat(volume))
            }
            .store(in: &cancellables)
        localAudioStore.subscribe(Selector(keyPath: \LocalAudioState.hasAudio))
            .removeDuplicates()
            .receive(on: RunLoop.main)
            .sink { [weak self] hasAudio in
                guard let self = self else { return }
                self.muteAudioButton.isSelected = !hasAudio
                self.volumeView.updateAudio(hasAudio)
            }
            .store(in: &cancellables)
        localAudioStore.subscribe(Selector(keyPath: \LocalAudioState.isHidden))
            .removeDuplicates()
            .receive(on: RunLoop.main)
            .sink { [weak self] isHidden in
                guard let self = self else { return }
                self.isHidden = isHidden
            }
            .store(in: &cancellables)
    }
    
    @objc func muteAudioAction(sender: UIButton) {
        if localAudioStore.localAudioState.hasAudio {
            localAudioStore.muteLocalAudio()
        } else {
            localAudioStore.unmuteLocalAudio()
        }
    }
    
    func show() {
        UIView.animate(withDuration: 0.3) { [weak self] () in
            guard let self = self else { return }
            self.transform = .identity
        } completion: { _ in
        }
    }
    
    func hide() {
        self.transform = CGAffineTransform(translationX: 0, y: kScreenHeight)
    }
    
    deinit {
        debugPrint("deinit:\(self)")
    }
}
