//
//  ConferenceVideoView.swift
//  TUIRoomKit
//
//  Created by CY zhao on 2024/11/19.
//

import Foundation
import UIKit
import Factory
import Combine
import SnapKit

enum ConferenceViewType {
    case unknown
    case largeSmallWindowType
    case screenType
    case speechType
    case equallyDividedType
}

class ConferenceStreamContainer: UIView {
    @Injected(\.videoStore) var videoStore: VideoStore
    private var cancellables = Set<AnyCancellable>()
    private var showType: ConferenceViewType = .unknown
    private var speechItem: UserInfo?
    private var speakerItem: UserInfo?
    
    lazy var multiStreamView: MultiStreamView = {
        let multiView = MultiStreamView(maxRows: 3, maxColumns: 2)
        multiView.delegate = self
        return multiView
    }()
    
    lazy var miniView: SingleStreamView = {
        let miniView = SingleStreamView(isDraggable: true)
        miniView.isHidden = true
        miniView.delegate = self
        return miniView
    }()
    
    lazy var screenCaptureMaskView: ScreenCaptureMaskView = {
        let view = ScreenCaptureMaskView(frameType: .fullScreen)
        view.isHidden = true
        return view
    }()
    
    private var isViewReady: Bool = false
    override func didMoveToWindow() {
        super.didMoveToWindow()
        guard !isViewReady else { return }
        constructViewHierarchy()
        activateConstraints()
        bindInteraction()
        isViewReady = true
    }
    
    func constructViewHierarchy() {
        backgroundColor = .clear
        addSubview(multiStreamView)
        addSubview(miniView)
        addSubview(screenCaptureMaskView)
    }
    
    func activateConstraints() {
        multiStreamView.snp.makeConstraints { make in
            make.top.leading.bottom.trailing.equalToSuperview()
        }
        screenCaptureMaskView.snp.makeConstraints { make in
            make.edges.equalToSuperview()
        }
    }
    
    private var isLayoutReady: Bool = false
    override func layoutSubviews() {
        super.layoutSubviews()
        guard !isLayoutReady else { return }
        miniView.setupFrame(getMiniscreenFrame(item: nil))
        isLayoutReady = true
    }
    
    func bindInteraction() {
        addGesture()
        let shareItemChanges = videoStore.subscribe(Selector(keyPath: \VideoSeatState.shareItem))
            .removeDuplicates()
            .receive(on: RunLoop.main)
        let videoStatesChanges = videoStore.subscribe(Selector(keyPath: \VideoSeatState.videoSeatItems))
            .removeDuplicates()
            .receive(on: RunLoop.main)
            .share()
        let speakerItemChanges = videoStore.speakerChangedSubject
        
        Publishers.CombineLatest(shareItemChanges, videoStatesChanges)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] share, count in
                guard let self = self else { return }
                self.handleStreamsUpdate()
            }
            .store(in: &cancellables)
        
        speakerItemChanges
            .sink { [weak self] speakerItem in
                guard let self = self else { return }
                if self.showType == .screenType || self.showType == .speechType {
                    if speakerItem?.userId != speechItem?.userId ||
                        (speakerItem?.userId == speechItem?.userId && speakerItem?.videoStreamType != speechItem?.videoStreamType) {
                        handleSpeakerItemUpdate(speakerItem: speakerItem)
                    }
                }
            }
        .store(in: &cancellables)
        
        videoStore.subscribe(Selector(keyPath: \VideoSeatState.isSelfScreenSharing))
            .removeDuplicates()
            .receive(on: RunLoop.main)
            .sink { [weak self] isSelfScreenSharing in
                guard let self = self else { return }
                self.showScreenCaptureMaskView(isSelfScreenSharing)
            }
            .store(in: &cancellables)
    }
    
    private func addGesture() {
        let tap = UITapGestureRecognizer(target: self, action: #selector(clickVideoSeat))
        addGestureRecognizer(tap)
    }
    
    @objc private func clickVideoSeat() {
        EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_ChangeToolBarHiddenState, param: [:])
        guard RoomRouter.shared.hasChatWindow() else { return }
        EngineEventCenter.shared.notifyUIEvent(key: .TUIRoomKitService_HiddenChatWindow, param: [:])
    }
    
    private func showScreenCaptureMaskView(_ isShow: Bool) {
        screenCaptureMaskView.isHidden = !isShow
        if isShow {
            bringSubviewToFront(screenCaptureMaskView)
        }
    }
}

// MARK: Bussiness
extension ConferenceStreamContainer {
    private func handleStreamsUpdate() {
        guard !videoStore.videoState.videoSeatItems.isEmpty else {
            return
        }
        let videoState = videoStore.videoState
        let videoStreamItems = videoState.videoSeatItems.filter { $0.hasVideoStream }
        if let shareItem = videoStore.videoState.shareItem {
            if showType != .screenType {
                RoomKitLog.info("\(#file)","\(#line)","Enter screenShare")
                showType = .screenType
                reset()
                multiStreamView.setSpeechItem(item: shareItem)
                self.speechItem = shareItem
            }
        } else if videoState.videoSeatItems.count == 2 && videoStreamItems.count > 0 {
            if showType != .largeSmallWindowType {
                RoomKitLog.info("\(#file)","\(#line)","Enter largeSmallWindowType")
                showType = .largeSmallWindowType
                reset()
                let excludeItem = videoState.videoSeatItems.first(where: { $0.userRole != .roomOwner })
                if let excludeItem = excludeItem {
                    multiStreamView.setExcludeVideoItems(items: [excludeItem])
                    self.speakerItem = excludeItem
                    miniView.updateVideoItem(item: excludeItem)
                }
            }
        } else if videoState.videoSeatItems.count > 2 && videoStreamItems.count == 1 {
            if showType != .speechType {
                RoomKitLog.info("\(#file)","\(#line)","Enter speechType")
                showType = .speechType
                reset()
                multiStreamView.setExcludeVideoItems(items: [])
                let speechItem = videoStreamItems[0]
                self.speechItem = speechItem
                multiStreamView.setSpeechItem(item: speechItem)
            }
        } else {
            if showType != .equallyDividedType {
                RoomKitLog.info("\(#file)","\(#line)","Enter equallyDividedType")
                showType = .equallyDividedType
                reset()
                miniView.isHidden = true
            }
        }
        
        if showType == .largeSmallWindowType {
            if let speaker = videoState.videoSeatItems.first(where: { $0.userId == speakerItem?.userId }) {
                updateMiniSize(item: speaker)
            }
        } else {
            updateMiniSize(item: nil)
        }
    }
    
    private func reset() {
        multiStreamView.reset()
        miniView.reset()
        self.speechItem = nil
        handleSpeakerItemUpdate(speakerItem: nil)
    }
    
    private func handleSpeakerItemUpdate(speakerItem: UserInfo?) {
        self.speakerItem = speakerItem
        guard let speakerItem = speakerItem else {
            miniView.updateVideoItem(item: nil)
            miniView.isHidden = true
            return
        }
        if multiStreamView.gridContentOffset.x > 0 {
            return
        }

        miniView.updateVideoItem(item: speakerItem)
        miniView.isHidden = false
    }
    
    private func updateMiniSize(item: UserInfo?) {
        let miniSize = getMiniscreenFrame(item: item)
        miniView.updateSize(size: miniSize.size)
    }
    
    func getMiniscreenFrame(item: UserInfo?) -> CGRect {
        let isPortrait = UIScreen.main.bounds.height > UIScreen.main.bounds.width
        var height = isPortrait ? 180.0 : 100.0
        var width = isPortrait ? 100.0 : 180.0
        if let item = item, !item.hasVideoStream {
            height = 100.0
            width = 100.0
        }
        return CGRect(x: self.bounds.size.width - width - 5, y: 5, width: width, height: height)
    }
}

extension ConferenceStreamContainer: MultiStreamViewDelegate {
    func multiStreamViewDidScroll(_ scrollView: UIScrollView) {
        let offsetX = scrollView.contentOffset.x
        let threshold = scrollView.bounds.width
        
        if offsetX < threshold {
            miniView.frame.origin.x = miniView.originalX - offsetX
        } else {
            miniView.isHidden = true
        }
    }
     
    func multiStreamViewDidSwitchToSpeechLayout(_ collectionView: UICollectionView) {
        guard showType == .screenType || showType == .speechType || showType == .largeSmallWindowType else {
            return
        }
        guard let videoItem = miniView.videoItem else { return }
        miniView.isHidden = false
        if videoItem.hasVideoStream {
            miniView.startPlayVideoStream()
        }
    }
    
    func multiStreamViewDidSwitchToGridLayout(_ collectionView: UICollectionView) {
    }
}

extension ConferenceStreamContainer: SingleStreamViewDelegate {
    func singleViewDidClick(_ view: SingleStreamView, videoItem: UserInfo?) {
        guard showType == .largeSmallWindowType else { return }
        guard let item = videoItem else { return }
        guard let excludeItem = videoStore.videoState.videoSeatItems.first(where: { $0.userId != item.userId}) else { return }
        
        multiStreamView.setExcludeVideoItems(items: [excludeItem])
        handleSpeakerItemUpdate(speakerItem: excludeItem)
        updateMiniSize(item: excludeItem)
    }
}
