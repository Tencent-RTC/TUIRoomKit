//
//  TUIRoomMainViewController+CollectionView.swift
//  TUIRoom
//
//  Created by WesleyLei on 2021/12/16.
//  Copyright © 2021 Tencent. All rights reserved.
//
import Foundation
import Kingfisher

let max_show_cell_count = 6
extension TUIRoomMainViewController: UICollectionViewDelegate, UICollectionViewDataSource, UICollectionViewDelegateFlowLayout {
    func reloadData(animate: Bool = false) {
        if !isViewDidLoad {
            return
        }
        if shareAttendeeList.count > 0 {
            pageControl.numberOfPages = shareAttendeeList.count
        } else {
            if attendeeList.count % max_show_cell_count == 0 {
                pageControl.numberOfPages = attendeeList.count / max_show_cell_count
            } else {
                pageControl.numberOfPages = attendeeList.count / max_show_cell_count + 1
            }
        }
        updatePageControl()
        if pageControl.currentPage >= pageControl.numberOfPages {
            pageControl.currentPage = (pageControl.numberOfPages > 1 ? pageControl.numberOfPages - 1 : 0)
        }
        UIView.performWithoutAnimation {
            let indexPath = IndexPath(item: pageControl.currentPage, section: 0)
            self.attendeeCollectionView.reloadItems(at: [indexPath])
        }
    }

    func updatePageControl() {
        let offsetYu = Int(attendeeCollectionView.contentOffset.x) % Int(attendeeCollectionView.mm_w)
        let offsetMuti = CGFloat(offsetYu) / attendeeCollectionView.mm_w
        pageControl.currentPage = (offsetMuti > 0.5 ? 1 : 0) + (Int(attendeeCollectionView.contentOffset.x) / Int(attendeeCollectionView.mm_w))
    }

    // MARK: - UICollectionViewDataSource

    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        return pageControl.numberOfPages
    }

    func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        if shareAttendeeList.count > 0 {
            let cell = collectionView.dequeueReusableCell(
                withReuseIdentifier: "TUIRoomMainScreenShareViewCell",
                for: indexPath) as! TUIRoomMainScreenShareViewCell
            cell.delegate = self
            if indexPath.row < shareAttendeeList.count {
                cell.updateByModels(shareAttendeeList[indexPath.row], attendeeModel: currentUser)
            }
            return cell
        }
        let cell = collectionView.dequeueReusableCell(
            withReuseIdentifier: "TUIRoomMainViewCell",
            for: indexPath) as! TUIRoomMainViewCell

        if indexPath.row < pageControl.numberOfPages {
            let startIndex = indexPath.row * max_show_cell_count
            let endIndex = (startIndex + max_show_cell_count < attendeeList.count ? startIndex + max_show_cell_count : attendeeList.count)

            var attendeeModels = [TUIRoomAttendeeModel]()
            for index in startIndex ..< endIndex where index < attendeeList.count {
                attendeeModels.append(attendeeList[index])
            }
            cell.delegate = self
            cell.isFirstPage = (indexPath.row == 0)
            if attendeeList.count > max_show_cell_count {
                cell.updateByModels(modes: attendeeModels, styleType: .more)
            } else {
                if attendeeList.count == 2 {
                    var firstUser = attendeeModels[0]
                    if currentUser.userId() == firstUser.userId() {
                        firstUser = attendeeModels[1]
                    }
                    cell.updateByModels(modes: [firstUser, currentUser], styleType: TUIRoomMainViewCellType(rawValue: attendeeModels.count) ?? .one)
                } else {
                    cell.updateByModels(modes: attendeeModels, styleType: TUIRoomMainViewCellType(rawValue: attendeeModels.count) ?? .one)
                }
            }

        } else {
            cell.updateByModels(modes: [TUIRoomAttendeeModel()], styleType: .one)
        }

        return cell
    }

    // MARK: - UICollectionViewDelegateFlowLayout

    func collectionView(_ collectionView: UICollectionView,
                        layout collectionViewLayout: UICollectionViewLayout,
                        sizeForItemAt indexPath: IndexPath) -> CGSize {
        return collectionView.frame.size
    }

    func collectionView(_ collectionView: UICollectionView,
                        layout collectionViewLayout: UICollectionViewLayout,
                        minimumLineSpacingForSectionAt section: Int) -> CGFloat {
        return 0
    }

    func scrollViewDidEndDecelerating(_ scrollView: UIScrollView) {
        let scrollToScrollStop = !scrollView.isTracking && !scrollView.isDragging && !scrollView.isDecelerating
        if scrollToScrollStop {
            updatePageControl()
        }
    }

    func scrollViewDidEndDragging(_ scrollView: UIScrollView) {
        let scrollToScrollStop = !scrollView.isTracking && !scrollView.isDragging && !scrollView.isDecelerating
        if scrollToScrollStop {
            updatePageControl()
        }
    }
}
