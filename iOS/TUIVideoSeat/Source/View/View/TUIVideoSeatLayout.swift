//
//  TUIVideoSeatLayout.swift
//  TUIVideoSeat
//
//  Created by 唐佳宁 on 2023/3/16.
//

import Foundation

protocol TUIVideoSeatLayoutDelegate: AnyObject {
    func updateNumberOfPages(numberOfPages: NSInteger)
}

class TUIVideoSeatLayout: UICollectionViewFlowLayout {
    private var prePageCount: NSInteger = 1

    private var collectionViewHeight: CGFloat {
        return collectionView?.bounds.height ?? UIScreen.main.bounds.height
    }

    private var collectionViewWidth: CGFloat {
        return collectionView?.bounds.width ?? UIScreen.main.bounds.width
    }

    // 一行最多展示cell数
    private var kVideoSeatCellNumberOfOneRow: Int {
        return (viewModel.videoSeatViewType == .pureAudioType) ? 3 : 2
    }

    // 一页最多展示cell数
    private var kMaxShowCellCount: Int {
        return (viewModel.videoSeatViewType == .pureAudioType) ? 9 : 6
    }

    // 左右间距
    let leftRightSpace: CGFloat = 5.0
    // 上下间距
    private var topBottomSpace: CGFloat {
        return (viewModel.videoSeatViewType == .pureAudioType) ? 20.0 : 5.0
    }

    private let viewModel: TUIVideoSeatViewModel
    // 保存所有item
    fileprivate var layoutAttributeArray: [UICollectionViewLayoutAttributes] = []

    init(viewModel: TUIVideoSeatViewModel) {
        self.viewModel = viewModel
        super.init()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func prepare() {
        super.prepare()
        calculateEachCellFrame()
    }

    override func layoutAttributesForElements(in rect: CGRect) -> [UICollectionViewLayoutAttributes]? {
        return layoutAttributeArray
    }

    override var collectionViewContentSize: CGSize {
        return CGSize(width: CGFloat(prePageCount) * collectionViewWidth, height: collectionViewHeight)
    }

    weak var delegate: TUIVideoSeatLayoutDelegate?

    // Miniscreen布局信息
    func getMiniscreenFrame(item: VideoSeatItem?) -> CGRect {
        var height = 180.0
        let width = 100.0
        if let item = item, !item.hasVideoStream {
            height = width
        }
        return CGRect(x: collectionViewWidth - width - leftRightSpace, y: leftRightSpace, width: width, height: height)
    }

    // 计算cell的位置和大小，并进行存储
    private func calculateEachCellFrame() {
        guard let collectionViewWidth: CGFloat = collectionView?.bounds.width else { return }
        guard viewModel.listSeatItem.count > 0 else { return }
        layoutAttributeArray = []
        let section: Int = 0
        prePageCount = 1
        if viewModel.videoSeatViewType == .singleType {
            let indexPath = IndexPath(item: 0, section: 0)
            let cell = getFullScreenAttributes(indexPath: indexPath)
            layoutAttributeArray.append(cell)
        } else if viewModel.videoSeatViewType == .largeSmallWindowType {
            let indexPath = IndexPath(item: 0, section: section)
            let cell = getFullScreenAttributes(indexPath: indexPath)
            layoutAttributeArray.append(cell)
        } else if viewModel.videoSeatViewType == .pureAudioType || viewModel.videoSeatViewType == .equallyDividedType {
            guard let itemCount = collectionView?.numberOfItems(inSection: section) else { return }
            let isMultipage = itemCount >= kMaxShowCellCount
            for i in 0 ... itemCount - 1 {
                let indexPath = IndexPath(item: i, section: section)
                var cell: UICollectionViewLayoutAttributes
                if isMultipage {
                    cell = getMultipageEquallyDividedAttributes(indexPath: indexPath, item: i, itemCount: itemCount, leftDiff: 0.0)
                } else {
                    cell = getEquallyDividedAttributes(indexPath: indexPath, item: i, itemCount: itemCount, leftDiff: 0.0)
                }
                layoutAttributeArray.append(cell)
            }
            prePageCount = Int(ceil(CGFloat(itemCount) / CGFloat(kMaxShowCellCount)))
        } else if viewModel.videoSeatViewType == .speechType {
            guard let itemCount = collectionView?.numberOfItems(inSection: section) else { return }
            let isMultipage = (itemCount - 1) >= kMaxShowCellCount
            // 其它页：2,3,4.... 均分
            for i in 0 ... itemCount {
                let indexPath = IndexPath(item: i, section: section)
                var cell: UICollectionViewLayoutAttributes
                if i == 0 {
                    // 演讲者大窗
                    cell = getFullScreenAttributes(indexPath: indexPath)
                } else if isMultipage {
                    cell = getMultipageEquallyDividedAttributes(indexPath: indexPath, item: i - 1,
                                                                itemCount: itemCount - 1,
                                                                leftDiff: collectionViewWidth)
                } else {
                    cell = getEquallyDividedAttributes(indexPath: indexPath, item: i - 1,
                                                       itemCount: itemCount - 1,
                                                       leftDiff: collectionViewWidth)
                }
                layoutAttributeArray.append(cell)
            }
            prePageCount = Int(ceil(CGFloat(itemCount - 1) / CGFloat(kMaxShowCellCount))) + 1
        }
        delegate?.updateNumberOfPages(numberOfPages: prePageCount)
    }

    // 全屏cell布局信息
    private func getFullScreenAttributes(indexPath: IndexPath) ->
        UICollectionViewLayoutAttributes {
        let cell = UICollectionViewLayoutAttributes(forCellWith: indexPath)
        cell.frame = CGRect(x: 0, y: 0, width: collectionViewWidth, height: collectionViewHeight)
        return cell
    }

    // 获取等分居中布局
    private func getEquallyDividedAttributes(indexPath: IndexPath, item: Int, itemCount: Int, leftDiff: CGFloat) ->
        UICollectionViewLayoutAttributes {
        // 为何不直接用indexPath.item,因为演讲者模式，第一页只有2个数据填充页面
        // page:1,2,3 row:1,2,3, item:1,2,3
        // column:0,1,2,3

        /*-----------------item&page&currentPageItemCount&cell-----------------**/
        let item = item + 1
        let page = Int(ceil(CGFloat(item) / CGFloat(kMaxShowCellCount))) // cell在第几页上
        let currentPageItemCount = min(itemCount, page * kMaxShowCellCount) - (page - 1) * kMaxShowCellCount // 当前页item个数
        let cell = UICollectionViewLayoutAttributes(forCellWith: indexPath)

        /*-----------------itemWidth&currentPageAllRow&beginCellTop&beginCellLeft-----------------**/
        let contentWidth = collectionViewWidth - CGFloat(kVideoSeatCellNumberOfOneRow + 1) * leftRightSpace
        let itemWidth = contentWidth / CGFloat(kVideoSeatCellNumberOfOneRow) // 计算cell的宽
        let currentPageAllRow = Int(ceil(CGFloat(currentPageItemCount) / CGFloat(kVideoSeatCellNumberOfOneRow))) // 计算本页总行数
        let itemAllHeight = itemWidth * CGFloat(currentPageAllRow) + CGFloat(currentPageAllRow - 1) * topBottomSpace
        let beginCellTop = (collectionViewHeight - itemAllHeight) * 0.5 // 计算beginCellTop
        let beginCellLeft = CGFloat(page - 1) * collectionViewWidth // 计算beginCellLeft

        /*-----------------itemIndex&columnIndex&rowIndex-----------------**/
        let itemIndex = item - (page - 1) * kMaxShowCellCount // 本页的第几个
        let column = (itemIndex - 1) % kVideoSeatCellNumberOfOneRow // cell当前页上的第几列 从0开始
        let row = Int(ceil(CGFloat(itemIndex) / CGFloat(kVideoSeatCellNumberOfOneRow))) // cell当前页上的第几行
        let itemY = beginCellTop + (itemWidth + topBottomSpace) * CGFloat(row - 1)
        var itemX = 0.0
        if currentPageAllRow == row {
            // 最后一行居中调整
            let lastRowItemCount = currentPageItemCount - (row - 1) * kVideoSeatCellNumberOfOneRow
            let lastRowBeginCellLeft = (collectionViewWidth - CGFloat(lastRowItemCount - 1) * leftRightSpace -
                itemWidth * CGFloat(lastRowItemCount)) * 0.5 - leftRightSpace
            itemX = lastRowBeginCellLeft + beginCellLeft + (itemWidth + leftRightSpace) * CGFloat(column) + leftRightSpace
        } else {
            itemX = beginCellLeft + (itemWidth + leftRightSpace) * CGFloat(column) + leftRightSpace
        }
        cell.frame = CGRect(x: leftDiff + itemX, y: itemY, width: itemWidth, height: itemWidth)
        return cell
    }

    // 获取等分固定布局
    private func getMultipageEquallyDividedAttributes(indexPath: IndexPath, item: Int, itemCount: Int, leftDiff: CGFloat) ->
        UICollectionViewLayoutAttributes {
        // 为何不直接用indexPath.item,因为演讲者模式，第一页只有2个数据填充页面
        // page:1,2,3 row:1,2,3, item:1,2,3
        // column:0,1,2,3

        /*-----------------page&item&cell-----------------**/
        let item = item + 1
        let page = Int(ceil(CGFloat(item) / CGFloat(kMaxShowCellCount))) // cell在第几页上
        let cell = UICollectionViewLayoutAttributes(forCellWith: indexPath)

        /*-----------------itemWidth&currentPageAllRow&beginCellTop&beginCellLeft-----------------**/
        let contentWidth = collectionViewWidth - CGFloat(kVideoSeatCellNumberOfOneRow + 1) * leftRightSpace
        let itemWidth = contentWidth / CGFloat(kVideoSeatCellNumberOfOneRow) // 计算cell的宽
        let currentPageAllRow = kMaxShowCellCount / kVideoSeatCellNumberOfOneRow // 计算本页总行数
        let itemAllHeight = itemWidth * CGFloat(currentPageAllRow) + CGFloat(currentPageAllRow - 1) * topBottomSpace
        let beginCellTop = (collectionViewHeight - itemAllHeight) * 0.5 // 计算beginCellTop
        let beginCellLeft = CGFloat(page - 1) * collectionViewWidth // 计算beginCellLeft

        /*-----------------itemIndex&columnIndex&rowIndex-----------------**/
        let itemIndex = item - (page - 1) * kMaxShowCellCount // 本页的第几个
        let column = (itemIndex - 1) % kVideoSeatCellNumberOfOneRow // cell当前页上的第几列 从0开始
        let row = Int(ceil(CGFloat(itemIndex) / CGFloat(kVideoSeatCellNumberOfOneRow))) // cell当前页上的第几行
        let itemY = beginCellTop + (itemWidth + topBottomSpace) * CGFloat(row - 1)
        let itemX = beginCellLeft + (itemWidth + leftRightSpace) * CGFloat(column) + leftRightSpace
        cell.frame = CGRect(x: leftDiff + itemX, y: itemY, width: itemWidth, height: itemWidth)
        return cell
    }
}
