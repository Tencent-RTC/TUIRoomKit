//
//  MultiStreamView.swift
//  TUIRoomKit
//
//  Created by CY zhao on 2024/10/22.
//

import Foundation
import RTCRoomEngine
import UIKit
import Factory
import Combine
#if canImport(TXLiteAVSDK_TRTC)
    import TXLiteAVSDK_TRTC
#elseif canImport(TXLiteAVSDK_Professional)
    import TXLiteAVSDK_Professional
#endif

struct DataChanges {
    let deletions: [IndexPath]
    let insertions: [IndexPath]
    let moves: [(from: IndexPath, to: IndexPath)]
    
    var hasChanges: Bool {
        return !deletions.isEmpty || !insertions.isEmpty || !moves.isEmpty
    }
}

protocol MultiStreamViewDelegate: AnyObject {
    func multiStreamViewDidScroll(_ scrollView: UIScrollView)
    func multiStreamViewDidSwitchToSpeechLayout(_ collectionView: UICollectionView)
    func multiStreamViewDidSwitchToGridLayout(_ collectionView: UICollectionView)
}

class MultiStreamView: UIView {
    @Injected(\.videoStore) var videoStore: VideoStore
    private var currentLayoutConfig: VideoLayoutConfig
    private var defaultLayoutConfig: VideoLayoutConfig
    private let CellID_Normal = "MultiStreamCell_Normal"
    private var isViewReady: Bool = false
    private var cancellables = Set<AnyCancellable>()
    @Published private(set) var dataSource: [UserInfo] = []
    @Published private var excludeVideoItems: [UserInfo] = []
    @Published private var speechItem: UserInfo?
    weak var delegate: MultiStreamViewDelegate?
    
    var engineManager: EngineManager {
        EngineManager.shared
    }
    
    // TODO: remove roomstore
    var roomStore: RoomStore {
        EngineManager.shared.store
    }
    var currentUserId: String {
        roomStore.currentUser.userId
    }
    
    private var itemStreamType: TUIVideoStreamType {
        if videoStore.videoState.videoSeatItems.filter({ $0.hasVideoStream }).count > 5 {
            return .cameraStreamLow
        } else {
            return .cameraStream
        }
    }
        
    init(maxRows: Int, maxColumns: Int) {
        let config = VideoLayoutConfig(maxRows: maxRows, maxColumns: maxColumns, spacing: 5.0, aspectRatio: 0)
        self.currentLayoutConfig = config
        self.defaultLayoutConfig = config
        super.init(frame: .zero)
        setupBindings()
    }
    
    convenience init() {
        self.init(maxRows: 2, maxColumns: 3)
    }
    
    var gridContentOffset: CGPoint {
        return attendeeCollectionView.contentOffset
    }
    
    var streamSorter: MultiStreamsSorter {
        return MultiStreamsSorter(currentUserId: roomStore.currentUser.userId)
    }
    
    func setExcludeVideoItems(items: [UserInfo]) {
        self.excludeVideoItems = items
    }
    
    func setSpeechItem(item: UserInfo?) {
        self.speechItem = item
    }
    
    func reset() {
        self.setSpeechItem(item: nil)
        self.excludeVideoItems = []
    }
    
    private func setupBindings() {
        let speechItemChanges = $speechItem
        
        speechItemChanges
            .debounce(for: .milliseconds(300), scheduler: DispatchQueue.main)
            .sink { [weak self] speechItem in
                guard let self = self else { return }
                if let layout = attendeeCollectionView.collectionViewLayout as? MultiStreamViewLayout {
                    layout.isSpeechMode = speechItem != nil
                }
                self.attendeeCollectionView.collectionViewLayout.invalidateLayout()
            }
            .store(in: &cancellables)
        
        Publishers.CombineLatest3(
            videoStore.subscribe(Selector(keyPath: \VideoSeatState.videoSeatItems)).removeDuplicates(),
            $excludeVideoItems,
            speechItemChanges
        )
        .map { [weak self] videoItems, excludeInfos, speechItem -> [UserInfo] in
            guard let self = self else { return videoItems }
            let sortedItems = streamSorter.sortStreams(videoItems)
            var items = sortedItems.filter { item in
                let excluded = excludeInfos.contains(where: { $0.userId == item.userId })
                let notSpeechItem = speechItem.map { speech in
                   !(item.userId == speech.userId &&
                     item.videoStreamType == speech.videoStreamType)
               } ?? true
                return !excluded && notSpeechItem
            }
            if let speechItem = speechItem {
                items.insert(speechItem, at: 0)
            }
            return items
        }
        .removeDuplicates()
        .receive(on: RunLoop.main)
        .debounce(for: .milliseconds(300), scheduler: DispatchQueue.main)
        .sink { [weak self] videoItems in
            guard let self = self else { return }
            self.handleDataChanged(videoItems)
        }
        .store(in: &cancellables)
    }
    
    private func handleDataChanged(_ newItems: [UserInfo]) {
        let changes = calculateChanges(old: dataSource, new: newItems)
    
        guard changes.hasChanges else {return}
        
        freshCollectionView { [ weak self] in
            guard let self = self else { return }
            self.attendeeCollectionView.performBatchUpdates {
                self.dataSource = newItems
                self.attendeeCollectionView.deleteItems(at: changes.deletions)
                self.attendeeCollectionView.insertItems(at: changes.insertions)
                changes.moves.forEach { move in
                    self.attendeeCollectionView.moveItem(at: move.from, to: move.to)
                }
            }
        }
    }
    
    private var pageControl: UIPageControl = {
        let control = UIPageControl()
        control.currentPage = 0
        control.numberOfPages = 1
        control.hidesForSinglePage = true
        control.isUserInteractionEnabled = false
        return control
    }()
    
    override func didMoveToWindow() {
        super.didMoveToWindow()
        guard !isViewReady else { return }
        constructViewHierarchy()
        activateConstraints()
        bindInteraction()
        isViewReady = true
    }
    
    override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
        super.traitCollectionDidChange(previousTraitCollection)
        
        if traitCollection.verticalSizeClass != previousTraitCollection?.verticalSizeClass ||
           traitCollection.horizontalSizeClass != previousTraitCollection?.horizontalSizeClass {
            let offsetYu = Int(attendeeCollectionView.contentOffset.x) % Int(attendeeCollectionView.mm_w)
            let offsetMuti = CGFloat(offsetYu) / attendeeCollectionView.mm_w
            let currentPage = (offsetMuti > 0.5 ? 1 : 0) + (Int(attendeeCollectionView.contentOffset.x) / Int(attendeeCollectionView.mm_w))
            attendeeCollectionView.setContentOffset(
                CGPoint(x: CGFloat(pageControl.currentPage) * attendeeCollectionView.frame.size.width,
                        y: attendeeCollectionView.contentOffset.y), animated: false)
        }
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    lazy var attendeeCollectionView: UICollectionView = {
        let layout = MultiStreamViewLayout(config: currentLayoutConfig)
        layout.delegate = self
        let collection = AttendeeListView(frame: CGRect(x: 0, y: 0, width: frame.size.width, height: frame.size.height), collectionViewLayout: layout)
        collection.register(MultiStreamCell.self, forCellWithReuseIdentifier: CellID_Normal)
        collection.isPagingEnabled = true
        collection.showsVerticalScrollIndicator = false
        collection.showsHorizontalScrollIndicator = false
        collection.isUserInteractionEnabled = true
        collection.contentMode = .scaleToFill
        collection.backgroundColor = UIColor(0x0F1014)
        if #available(iOS 11.0, *) {
            collection.contentInsetAdjustmentBehavior = .never
        } else {
            // Fallback on earlier versions
        }
        if #available(iOS 10.0, *) {
            collection.isPrefetchingEnabled = true
        } else {
            // Fallback on earlier versions
        }
        collection.dataSource = self
        collection.delegate = self
        collection.layoutDelegate = self
        return collection
    }()
    
    let placeholderView: UIView = {
        let view = UIView(frame: .zero)
        view.isHidden = true
        return view
    }()
        
    func constructViewHierarchy() {
        backgroundColor = .clear
        addSubview(placeholderView)
        addSubview(attendeeCollectionView)
        addSubview(pageControl)
    }
    
    func activateConstraints() {
        placeholderView.snp.makeConstraints { make in
            make.edges.equalToSuperview()
        }
        attendeeCollectionView.snp.makeConstraints { make in
            make.edges.equalToSuperview()
        }
        pageControl.snp.makeConstraints { make in
            make.height.equalTo(24)
            make.centerX.equalToSuperview()
            make.bottom.equalToSuperview().offset(-5)
        }
    }
    
    func bindInteraction() {
        addGesture()
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
    
    func updatePageControl() {
        let offsetYu = Int(attendeeCollectionView.contentOffset.x) % Int(attendeeCollectionView.mm_w)
        let offsetMuti = CGFloat(offsetYu) / attendeeCollectionView.mm_w
        pageControl.currentPage = (offsetMuti > 0.5 ? 1 : 0) + (Int(attendeeCollectionView.contentOffset.x) / Int(attendeeCollectionView.mm_w))
        
        let cellArray = attendeeCollectionView.visibleCells
        for cell in cellArray {
            if let seatCell = cell as? MultiStreamCell, let seatItem = seatCell.videoItem {
                if pageControl.currentPage != 0 && seatItem.hasVideoStream {
                    self.startPlayVideoStream(item: seatItem, renderView: seatCell.renderView)
                }
            }
        }
    }
    
    func updateLayout(_ config: VideoLayoutConfig, animated: Bool = true) {
        let layout = MultiStreamViewLayout(config: config)
        currentLayoutConfig = config
        if animated {
            UIView.animate(withDuration: 0.3) {
                self.attendeeCollectionView.setCollectionViewLayout(layout, animated: true)
                self.updateCollectionViewBehavior()
                self.updatePageControlState()
            }
        } else {
            attendeeCollectionView.setCollectionViewLayout(layout, animated: false)
            updateCollectionViewBehavior()
            updatePageControlState()
        }
    }
    
    private func updateCollectionViewBehavior() {
        attendeeCollectionView.isPagingEnabled = currentLayoutConfig.isPagingEnable
        attendeeCollectionView.alwaysBounceHorizontal = currentLayoutConfig.isHorizontalScroll
        attendeeCollectionView.alwaysBounceVertical = currentLayoutConfig.isVerticalScroll
    }
    
    private func updatePageControlState() {
        if currentLayoutConfig.isPagingEnable {
            let itemsPerPage = currentLayoutConfig.maxRows * currentLayoutConfig.maxColumns
            let numberOfPages = Int(ceil(Double(dataSource.count) / Double(itemsPerPage)))
            pageControl.isHidden = numberOfPages <= 1
            pageControl.numberOfPages = numberOfPages
        } else {
            pageControl.isHidden = true
        }
    }
        
    deinit {
        debugPrint("deinit \(self)")
    }
}

// MARK: - TUIVideoSeatViewModelResponder

extension MultiStreamView {
    private func calculateChanges(old: [UserInfo], new: [UserInfo]) -> DataChanges {
        var deletions: [IndexPath] = []
        var insertions: [IndexPath] = []
        var moves: [(from: IndexPath, to: IndexPath)] = []
        
        let oldKeys = old.map { "\($0.userId)_\($0.videoStreamType.rawValue)" }
        let newKeys = new.map { "\($0.userId)_\($0.videoStreamType.rawValue)" }
        
        let oldKeyToIndex = Dictionary(uniqueKeysWithValues: oldKeys.enumerated().map { ($1, $0) })
        let newKeyToIndex = Dictionary(uniqueKeysWithValues: newKeys.enumerated().map { ($1, $0) })
        
        let deletedKeys = Set(oldKeys).subtracting(newKeys)
        let insertedKeys = Set(newKeys).subtracting(oldKeys)
        let retainedKeys = Set(oldKeys).intersection(newKeys)
        
        deletions = deletedKeys.compactMap { oldKeyToIndex[$0] }.map { IndexPath(item: $0, section: 0) }.sorted { $0.item > $1.item }
        insertions = insertedKeys.compactMap { newKeyToIndex[$0] }.map { IndexPath(item: $0, section: 0) }.sorted { $0.item < $1.item }
   
        var processedIndices = Set<String>()
        for key in retainedKeys {
            guard let oldIndex = oldKeyToIndex[key],
                  let newIndex = newKeyToIndex[key],
                  oldIndex != newIndex,
                  !processedIndices.contains(key) else {
                continue
            }
            let fromPath = IndexPath(item: oldIndex, section: 0)
            let toPath = IndexPath(item: newIndex, section: 0)
            if !deletions.contains(fromPath) && !insertions.contains(toPath) {
                moves.append((from: fromPath, to: toPath))
                processedIndices.insert(key)
            }
        }
        moves.sort { $0.from.item < $1.from.item }
        
        return DataChanges(
            deletions: deletions,
            insertions: insertions,
            moves: moves
        )
    }
    
    private func freshCollectionView(block: () -> Void) {
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        block()
        CATransaction.commit()
    }
    
    func reloadData() {
        freshCollectionView { [weak self] in
            guard let self = self else { return }
            self.attendeeCollectionView.reloadData()
        }
    }
    
    func getVideoVisibleCell(_ item: VideoSeatItem) -> VideoSeatCell? {
        let cellArray = attendeeCollectionView.visibleCells
        guard let cell = cellArray.first(where: { cell in
            if let seatCell = cell as? VideoSeatCell, seatCell.seatItem == item {
                return true
            } else {
                return false
            }
        }) as? VideoSeatCell else { return nil }
        return cell
    }
}

// MARK: - UICollectionViewDelegateFlowLayout

extension MultiStreamView: UICollectionViewDelegateFlowLayout {
    func collectionView(_ collectionView: UICollectionView, willDisplay cell: UICollectionViewCell, forItemAt indexPath: IndexPath) {
        guard let seatCell = cell as? MultiStreamCell else { return }
        guard let dataItem = dataSource[safe: indexPath.item] else { return }
        guard let seatItem = seatCell.videoItem else { return }
        if dataItem.userId != seatItem.userId {
            seatCell.reset()
            seatCell.updateUI(item: dataItem)
            bindVideoState(cell: seatCell, with: dataItem)
        } else {
            if seatItem.hasVideoStream || seatItem.videoStreamType == .screenStream {
                self.startPlayVideoStream(item: seatItem, renderView: seatCell.renderView)
            } else {
                self.stopPlayVideoStream(item: seatItem)
            }
        }
    }
    
    func collectionView(_ collectionView: UICollectionView, didEndDisplaying cell: UICollectionViewCell, forItemAt indexPath: IndexPath) {
        guard let seatCell = cell as? MultiStreamCell else { return }
        if let seatItem = seatCell.videoItem {
            self.stopPlayVideoStream(item: seatItem)
        }
    }
}

extension MultiStreamView: UIScrollViewDelegate {
    func scrollViewDidScroll(_ scrollView: UIScrollView) {
        delegate?.multiStreamViewDidScroll(scrollView)
    }
    
    func scrollViewDidEndDecelerating(_ scrollView: UIScrollView) {
        updatePageControl()
    }
}

// MARK: - UICollectionViewDataSource

extension MultiStreamView: UICollectionViewDataSource {
    func numberOfSections(in collectionView: UICollectionView) -> Int {
        return 1
    }
    
    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        return dataSource.count
    }
    
    
    func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        guard let cell = collectionView.dequeueReusableCell(withReuseIdentifier:CellID_Normal, for: indexPath)
                as? MultiStreamCell else {
            return UICollectionViewCell()
        }
        if let item = dataSource[safe: indexPath.item] {
            cell.updateUI(item: item)
            bindVideoState(cell:cell, with: item)
        }
        return cell
    }
    
    private func bindVideoState(cell: MultiStreamCell, with item: UserInfo) {
        let userId = item.userId
        let videoItemPublisher = createVideoItemPublisher(for: userId, item: item)
        
        videoItemPublisher
            .receive(on: RunLoop.main)
            .dropFirst()
            .removeDuplicates { oldItem, newItem in
                oldItem.hasAudioStream == newItem.hasAudioStream &&
                oldItem.userVoiceVolume == newItem.userVoiceVolume
            }
            .sink { [weak cell] item in
                guard let cell = cell else { return }
                cell.updateUIVolume(item: item)
            }
            .store(in: &cell.cancellableSet)
        
        videoItemPublisher
            .receive(on: RunLoop.main)
            .removeDuplicates { oldItem, newItem in
                oldItem.hasVideoStream == newItem.hasVideoStream &&
                oldItem.videoStreamType == newItem.videoStreamType
        }
        .sink { [weak cell, weak self] item in
            guard let cell = cell else { return }
            guard let self = self else { return }
            if isCellVisible(cell) {
                if item.hasVideoStream || item.videoStreamType == .screenStream {
                    self.startPlayVideoStream(item: item, renderView: cell.renderView)
                } else {
                    self.stopPlayVideoStream(item: item)
                }
            }
   
            cell.updateUI(item: item)
        }
        .store(in: &cell.cancellableSet)
        
        videoItemPublisher
            .receive(on: RunLoop.main)
            .removeDuplicates { oldItem, newItem in
                oldItem.userName == newItem.userName &&
                oldItem.userRole == newItem.userRole
        }
        .sink { [weak cell] item in
            guard let cell = cell else { return }
            cell.updateUI(item: item)
        }
        .store(in: &cell.cancellableSet)
    }
    
    func createVideoItemPublisher(for userId: String, item: UserInfo) -> AnyPublisher<UserInfo, Never> {
            let seatItemsPublisher = videoStore.subscribe(Selector(keyPath: \VideoSeatState.videoSeatItems))
                .map { items -> UserInfo? in
                    items.first { $0.userId == userId}
                }
                .eraseToAnyPublisher()
        
            let shareItemPublisher = videoStore.subscribe(Selector(keyPath: \VideoSeatState.shareItem))
                .map { shareItem -> UserInfo? in
                    if let shareItem = shareItem, shareItem.userId == userId {
                        return shareItem
                    }
                    return nil
                }
                .eraseToAnyPublisher()
            
        return (item.videoStreamType == .screenStream ? shareItemPublisher : seatItemsPublisher)
            .compactMap { $0 }
            .receive(on: RunLoop.main)
            .share()
            .eraseToAnyPublisher()
        }
    
    private func isCellVisible(_ cell: UICollectionViewCell) -> Bool {
        let visibleCells = attendeeCollectionView.visibleCells
        return visibleCells.contains(cell)
    }
}

// MARK: - UICollectionViewDataSource
extension MultiStreamView {
    func startPlayVideoStream(item: UserInfo, renderView: UIView?) {
        guard let renderView = renderView else { return }
        var item = item
        if item.userId != currentUserId {
            item.videoStreamType = item.videoStreamType == .screenStream ? .screenStream : itemStreamType
            engineManager.setRemoteVideoView(userId: item.userId, streamType: item.videoStreamType, view: renderView)
            engineManager.startPlayRemoteVideo(userId: item.userId, streamType: item.videoStreamType)
        } else if item.hasVideoStream {
            engineManager.setLocalVideoView(renderView)
        }
    }
    
    func stopPlayVideoStream(item: UserInfo) {
        if item.userId == currentUserId {
            engineManager.setLocalVideoView(nil)
        } else {
            engineManager.setRemoteVideoView(userId: item.userId, streamType: item.videoStreamType, view: nil)
            if item.videoStreamType == .screenStream {
                engineManager.stopPlayRemoteVideo(userId: item.userId, streamType: .screenStream)
            } else {
                engineManager.stopPlayRemoteVideo(userId: item.userId, streamType: .cameraStream)
                engineManager.stopPlayRemoteVideo(userId: item.userId, streamType: .cameraStreamLow)
            }
        }
    }
}

extension MultiStreamView: MultiStreamLayoutDelegate {
    func updateNumberOfPages(numberOfPages: NSInteger) {
        pageControl.numberOfPages = numberOfPages
    }
}

extension MultiStreamView: AttendeeListViewDelegate {
    func attendListDidSwitchToFullScreenLayout(_ attendeeList: UICollectionView) {
        delegate?.multiStreamViewDidSwitchToSpeechLayout(attendeeList)
    }
    
    func attendListDidSwitchToGridLayout(_ attendeeList: UICollectionView) {
        delegate?.multiStreamViewDidSwitchToGridLayout(attendeeList)
    }
}

fileprivate protocol AttendeeListViewDelegate: AnyObject {
    func attendListDidSwitchToFullScreenLayout(_ attendeeList: UICollectionView)
    func attendListDidSwitchToGridLayout(_ attendeeList: UICollectionView)
}

fileprivate class AttendeeListView: UICollectionView {
    weak var layoutDelegate: AttendeeListViewDelegate?

    override func layoutSubviews() {
        super.layoutSubviews()

        if isSwitchToFullScreenLayout() {
            handleFullScreenLayout()
        } else {
            handleGridLayout()
        }
    }

    private func isSwitchToFullScreenLayout() -> Bool {
        if let indexPath = indexPathForItem(at: CGPoint(x: contentOffset.x, y: contentOffset.y)),
           indexPath.section == 0, indexPath.item == 0 {
            return true
        }
        return false
    }

    private func handleFullScreenLayout() {
        self.layoutDelegate?.attendListDidSwitchToFullScreenLayout(self)
    }

    private func handleGridLayout() {
        self.layoutDelegate?.attendListDidSwitchToGridLayout(self)
    }
}
