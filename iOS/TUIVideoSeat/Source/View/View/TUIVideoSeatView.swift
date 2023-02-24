//
//  TUIVideoSeat.swift
//  TUIVideoSeat
//
//  Created by WesleyLei on 2022/9/13.
//  Copyright © 2022 Tencent. All rights reserved.
//

import TUIRoomEngine
import UIKit
#if TXLiteAVSDK_TRTC
import TXLiteAVSDK_TRTC
#elseif TXLiteAVSDK_Professional
import TXLiteAVSDK_Professional
#endif

class TUIVideoSeatView: UIView {
    let viewModel: TUIVideoSeatViewModel
    private var isViewReady: Bool = false
    let kCellNumberOfOneRow = 2 //一行中有几个cell
    let kCellMaxNumberOfRow = 3 //最多有多少行
    let kMaxShowCellCount = 6   //一页最多有多少个cell
    let kCellSpacing: CGFloat = 5
    init(frame: CGRect, roomEngine: TUIRoomEngine, roomId: String) {
        viewModel = TUIVideoSeatViewModel(roomEngine: roomEngine, roomId: roomId)
        super.init(frame: frame)
        viewModel.rootView = self
        self.isUserInteractionEnabled = true
    }
    
    override func didMoveToWindow() {
        super.didMoveToWindow()
        guard !isViewReady else { return }
        constructViewHierarchy()
        activateConstraints()
        isViewReady = true
    }
    
    override func layoutSubviews() {
        guard let renderView = viewModel.getRenderViewByUserid(userId: viewModel.currentUser.userId, streamType: .cameraStream) else { return }
        viewModel.setLocalVideoView(streamType: .cameraStream, view: renderView)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    lazy var attendeeCollectionView: UICollectionView = {
        let layout = UICollectionViewFlowLayout()
        layout.minimumLineSpacing = 0
        layout.minimumInteritemSpacing = 0
        layout.scrollDirection = .horizontal
        let collection = UICollectionView(frame: CGRect(x: 0, y: 0, width: frame.size.width, height: frame.size.height), collectionViewLayout: layout)
        collection.register(TUIVideoSeatCell.classForCoder(), forCellWithReuseIdentifier: "TUIVideoSeatCell")
        collection.register(TUIVideoSeatShareCell.classForCoder(), forCellWithReuseIdentifier: "TUIVideoSeatShareCell")
        collection.isPagingEnabled = true
        collection.showsVerticalScrollIndicator = false
        collection.showsHorizontalScrollIndicator = false
        collection.isUserInteractionEnabled = true
        collection.contentMode = .scaleToFill
        collection.backgroundColor = .black
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
        return collection
    }()
    
    func constructViewHierarchy() {
        backgroundColor = .clear
        addSubview(attendeeCollectionView)
    }
    
    func activateConstraints() {
        attendeeCollectionView.snp.makeConstraints { make in
            make.edges.equalToSuperview()
        }
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}

// MARK: - UICollectionViewDataSource&UICollectionViewDelegateFlowLayout

extension TUIVideoSeatView: UICollectionViewDelegateFlowLayout {
    func collectionView(_ collectionView: UICollectionView,
                        layout collectionViewLayout: UICollectionViewLayout,
                        sizeForItemAt indexPath: IndexPath) -> CGSize {
        if viewModel.attendeeList.count == 1 || (viewModel.shareAttendeeModel != nil) {
            return CGSize(width: self.mm_w, height: self.mm_h)
        } else {
            let cellWidth: CGFloat = (attendeeCollectionView.frame.size.width - kCellSpacing * CGFloat(kCellNumberOfOneRow)) /
            CGFloat(kCellNumberOfOneRow)
            let cellHight: CGFloat = cellWidth
            return CGSize(width: cellWidth, height: cellHight)
        }
    }
    
    func collectionView(_ collectionView: UICollectionView, layout collectionViewLayout: UICollectionViewLayout,
                        insetForSectionAt section: Int) -> UIEdgeInsets {
        if viewModel.shareAttendeeModel != nil {
            return UIEdgeInsets(top: kCellSpacing, left: kCellSpacing, bottom: kCellSpacing, right: kCellSpacing)
        } else {
            let cellWidth: CGFloat = (attendeeCollectionView.frame.size.width - kCellSpacing * 3 ) / 2
            let cellHight: CGFloat = cellWidth
            var cellInSectionCount = viewModel.attendeeList.count
            let sectionNumber = section + 1
            if cellInSectionCount/(sectionNumber * kMaxShowCellCount) >= 1 {
                cellInSectionCount = kMaxShowCellCount
            } else {
                if section == 0 {
                    cellInSectionCount = cellInSectionCount % kMaxShowCellCount
                } else {
                    cellInSectionCount = cellInSectionCount % (section * kMaxShowCellCount)
                }
            }
            let cellHorizontalCount = cellInSectionCount / kCellNumberOfOneRow + cellInSectionCount % kCellNumberOfOneRow
            if section == 0 {
                let totalCellHight = CGFloat(cellHorizontalCount) * cellHight + CGFloat(cellHorizontalCount - 1) * kCellSpacing
                let topInset = (attendeeCollectionView.frame.size.height - totalCellHight) / 2
                let bottomInset = topInset
                return UIEdgeInsets(top: topInset, left: kCellSpacing, bottom: bottomInset, right: kCellSpacing)
            } else {
                let totalCellHight = CGFloat(cellHorizontalCount) * cellHight + CGFloat(cellHorizontalCount - 1) * kCellSpacing
                let topCellInset = CGFloat(kCellMaxNumberOfRow) * cellHight + CGFloat(kCellMaxNumberOfRow - 1) * kCellSpacing
                let topInset = (attendeeCollectionView.frame.size.height - topCellInset) / 2
                let bottomInset = (attendeeCollectionView.frame.size.height - totalCellHight - topInset)
                return UIEdgeInsets(top: topInset, left: kCellSpacing, bottom: bottomInset, right: kCellSpacing)
            }
        }
    }
}


extension TUIVideoSeatView: UICollectionViewDataSource {
    func numberOfSections(in collectionView: UICollectionView) -> Int {
        if viewModel.shareAttendeeModel != nil {
            return 1
        } else {
            return viewModel.attendeeList.count/kMaxShowCellCount + 1
        }
    }
    
    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        if viewModel.shareAttendeeModel != nil {
            return 1
        } else {
            let cellCount = viewModel.attendeeList.count
            guard section + 1 > 0 else { return 0 }
            let sectionNumber = section + 1
            if cellCount / (sectionNumber * kMaxShowCellCount) >= 1 {
                return kMaxShowCellCount
            } else {
                if section == 0 {
                    return cellCount % kMaxShowCellCount
                } else {
                    return cellCount % (section * kMaxShowCellCount)
                }
            }
        }
    }
    
    func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        let attendModel = UserModel()
        if let shareAttendeeModel = viewModel.shareAttendeeModel {
            let cell = collectionView.dequeueReusableCell(
                withReuseIdentifier: "TUIVideoSeatShareCell",
                for: indexPath) as! TUIVideoSeatShareCell
            cell.viewModel = viewModel
            let attendModel = viewModel.attendeeList.first(where: { $0.userId == shareAttendeeModel.userId }) ?? attendModel
            cell.attendeeModel = attendModel
            viewModel.shareRenderMapView[attendModel.userId] = cell.shareView
            viewModel.renderMapView[attendModel.userId] = cell.currentView
            cell.updateUIView(item: viewModel.currentUser)
            viewModel.playRemoteVideo(userId: attendModel.userId, streamType: .screenStream)
            viewModel.playRemoteVideo(userId: viewModel.currentUser.userId, streamType: .cameraStream)
            return cell
        } else {
            let cell = collectionView.dequeueReusableCell(
                withReuseIdentifier: "TUIVideoSeatCell",
                for: indexPath) as! TUIVideoSeatCell
            cell.viewModel = viewModel
            let attendModel = viewModel.attendeeList[indexPath.row]
            cell.attendeeModel = attendModel
            viewModel.renderMapView[attendModel.userId] = cell
            cell.updateUIView(item: attendModel)
            viewModel.playRemoteVideo(userId: attendModel.userId, streamType: .cameraStream)
            return cell
        }
    }
}
