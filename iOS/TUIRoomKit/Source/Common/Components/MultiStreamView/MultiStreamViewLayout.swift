//
//  MultiStreamViewLayout.swift
//  TUIRoomKit
//
//  Created by CY zhao on 2024/10/24.
//

import Foundation
import UIKit

protocol MultiStreamLayoutDelegate: AnyObject {
    func updateNumberOfPages(numberOfPages: NSInteger)
}

struct VideoLayoutConfig {
    let maxRows: Int
    let maxColumns: Int
    let spacing: CGFloat
    let aspectRatio: CGFloat
}

// MARK: - Layout presets
extension VideoLayoutConfig {
    static let `grid` = VideoLayoutConfig(maxRows: 2, maxColumns: 3, spacing: 5.0, aspectRatio: 0)
    static let `verticalList` = VideoLayoutConfig(maxRows: 0, maxColumns: 1, spacing: 5.0, aspectRatio: 16/9)
    static let `horizontalList` = VideoLayoutConfig(maxRows: 1, maxColumns: 0, spacing: 5.0, aspectRatio: 16/9)
    
    var isPagingEnable: Bool {
        return maxRows > 0 && maxColumns > 0
    }
    
    var isHorizontalScroll: Bool {
        return isPagingEnable || isHorinzontalFlow
    }
    
    var isVerticalScroll: Bool {
        return isVerticalFlow
    }
    
    var isVerticalFlow: Bool {
        return maxRows == 0 && maxColumns > 0
    }
    
    var isHorinzontalFlow: Bool {
        return maxRows > 0 && maxColumns == 0
    }
}

class MultiStreamViewLayout: UICollectionViewFlowLayout {
    private let config: VideoLayoutConfig
    private var contentSize: CGSize = .zero
    private var layoutAttributeArray: [UICollectionViewLayoutAttributes] = []
    weak var delegate: MultiStreamLayoutDelegate?
    
    init(config: VideoLayoutConfig = .grid) {
        self.config = config
        super.init()
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override var collectionViewContentSize: CGSize {
        return contentSize
    }
    
    private var collectionViewHeight: CGFloat {
        return collectionView?.bounds.height ?? UIScreen.main.bounds.height
    }
    
    private var collectionViewWidth: CGFloat {
        return collectionView?.bounds.width ?? kScreenWidth
    }
    
    private var maxShowCellCount: Int {
        return config.maxRows * config.maxColumns
    }
    
    private var isPaged: Bool {
        return config.isPagingEnable
    }
    
    private var isVerticalFlow: Bool {
        return config.isVerticalFlow
    }
    
    private var isHorinzontalFlow: Bool {
        return config.isHorinzontalFlow
    }
    
    private var isPortrait: Bool {
        return collectionViewHeight > collectionViewWidth
    }
    
    private var maxColumnsPerPage: Int {
        return isPortrait ? min(config.maxRows, config.maxColumns) : max(config.maxRows, config.maxColumns)
    }
    
    private var maxRowsPerPage: Int {
        return isPortrait ? max(config.maxRows, config.maxColumns) : min(config.maxRows, config.maxColumns)
    }
    
    private var itemWidthHeight: CGFloat {
        let minimumDistance = min(collectionViewHeight, collectionViewWidth)
        let availableSpace = minimumDistance - CGFloat(config.maxColumns + 1) * config.spacing
        return availableSpace / CGFloat(config.maxColumns)
    }
    
    var isSpeechMode = false
    
    override func prepare() {
        super.prepare()
        layoutAttributeArray = []
        calculateCellFrame()
    }
    
    override func layoutAttributesForElements(in rect: CGRect) -> [UICollectionViewLayoutAttributes]? {
        return layoutAttributeArray
    }
    
    private func calculateCellFrame() {
        guard let collectionView = collectionView, isValidConfig() else {
            layoutAttributeArray = []
            contentSize = .zero
            return
        }
        
        if isPaged {
            calculateConferenceAttributes(itemCount: collectionView.numberOfItems(inSection: 0))
            return
        }
        if isVerticalFlow {
            calculateVerticalFlowAttributes(itemCount: collectionView.numberOfItems(inSection: 0))
            return
        }
        if isHorinzontalFlow {
            calculateHorizontalFlowAttributes(itemCount: collectionView.numberOfItems(inSection: 0))
            return
        }
    }
    
    private func isValidConfig() -> Bool {
        if config.maxRows == 0 && config.maxColumns == 0 {
            return false
        }
        return true
    }
}

extension MultiStreamViewLayout {
//MARK: conference layout
    private func getFullScreenAttributes(indexPath: IndexPath) ->
        UICollectionViewLayoutAttributes {
        let cell = UICollectionViewLayoutAttributes(forCellWith: indexPath)
        cell.frame = CGRect(x: 0, y: 0, width: collectionViewWidth, height: collectionViewHeight)
        return cell
    }
    
    private var conferenceItemSize: CGFloat {
        let minimumDistance = min(collectionViewHeight, collectionViewWidth)
        let availableSpace = minimumDistance - CGFloat(maxColumnsPerPage + 1) * config.spacing
        if isPortrait {
            return availableSpace / CGFloat(maxColumnsPerPage)
        } else {
            return availableSpace / (CGFloat(maxShowCellCount) / CGFloat(maxColumnsPerPage))
        }
    }
    
    private func calculateConferenceAttributes(itemCount: Int) {
        if isSpeechMode {
            calculateSpeechModeAttributes(itemCount: itemCount)
        } else {
            calculateCommonAttributes(itemCount: itemCount)
        }
    }
    
    private func calculateSpeechModeAttributes(itemCount: Int) {
        guard itemCount > 0 else { return }
        
        let fullScreenCell = UICollectionViewLayoutAttributes(forCellWith: IndexPath(item: 0, section: 0))
        fullScreenCell.frame = CGRect(x: 0, y: 0, width: collectionViewWidth, height: collectionViewHeight)
        layoutAttributeArray.append(fullScreenCell)

        if itemCount == 1 {
            contentSize = CGSize(width: collectionViewWidth, height: collectionViewHeight)
            return
        }
        
        let itemSize = CGSize(width: conferenceItemSize, height: conferenceItemSize)
        for i in 1..<itemCount {
            let indexPath = IndexPath(item: i, section: 0)
            var cell: UICollectionViewLayoutAttributes
            if i <= maxShowCellCount - 1 {
                cell = getEquallyDividedAttributes(
                    maxRows: maxRowsPerPage,
                    maxColumns: maxColumnsPerPage,
                    indexPath: indexPath,
                    item: i,
                    itemCount: itemCount - 1,
                    cellSize: itemSize,
                    veriticalCenter: true,
                    lastRowCenter: false
                )
            } else {
                cell = getEquallyDividedAttributes(
                    maxRows: maxRowsPerPage,
                    maxColumns: maxColumnsPerPage,
                    indexPath: indexPath,
                    item: i,
                    itemCount: itemCount - 1,
                    cellSize: itemSize
                )
            }
            cell.frame = cell.frame.offsetBy(dx: collectionViewWidth, dy: 0)
            layoutAttributeArray.append(cell)
        }
        
        let pageCount = Int(ceil(CGFloat(itemCount - 1) / CGFloat(maxShowCellCount))) + 1
        contentSize = CGSize(width: CGFloat(pageCount) * collectionViewWidth, height: collectionViewHeight)
        delegate?.updateNumberOfPages(numberOfPages: pageCount)
    }

    private func calculateCommonAttributes(itemCount: Int) {
        guard itemCount > 0 else { return }
        let itemSize = CGSize(width: conferenceItemSize, height: conferenceItemSize)

        if itemCount == 1 {
            let fullScreenCell = getFullScreenAttributes(indexPath: IndexPath(item: 0, section: 0))
            layoutAttributeArray.append(fullScreenCell)
        } else {
            for i in 0 ... itemCount - 1 {
                let indexPath = IndexPath(item: i, section: 0)
                var cell: UICollectionViewLayoutAttributes
                if i >= maxShowCellCount  {
                    cell = getEquallyDividedAttributes(maxRows: maxRowsPerPage, maxColumns: maxColumnsPerPage, indexPath: indexPath, item: i + 1, itemCount: itemCount, cellSize: itemSize)
                } else {
                    cell = getEquallyDividedAttributes(maxRows: maxRowsPerPage, maxColumns: maxColumnsPerPage, indexPath: indexPath, item: i + 1, itemCount: itemCount, cellSize: itemSize, veriticalCenter: true, lastRowCenter: false)
                }
                layoutAttributeArray.append(cell)
            }
        }
        let pageCount = Int(ceil(CGFloat(itemCount) / CGFloat(maxShowCellCount)))
        contentSize = CGSize(width: CGFloat(pageCount) * collectionViewWidth, height: collectionViewHeight)
        delegate?.updateNumberOfPages(numberOfPages: pageCount)
    }
    
//MARK: classroom layout
    private func calculatePageDividedAttributes(itemCount: Int) {
        let section: Int = 0
        let isMultipage = itemCount >= maxShowCellCount
        for i in 0 ... itemCount - 1 {
            let indexPath = IndexPath(item: i, section: section)
            var cell: UICollectionViewLayoutAttributes
            if isMultipage {
                cell = getEquallyDividedAttributes(maxRows: maxRowsPerPage, maxColumns: maxColumnsPerPage, indexPath: indexPath, item: i + 1, itemCount: itemCount)
            } else {
                cell = getSinglePagedDividedAttribute(indexPath: indexPath, item: i + 1, itemCount: itemCount)
            }
            layoutAttributeArray.append(cell)
        }
        let pageCount = Int(ceil(CGFloat(itemCount) / CGFloat(maxShowCellCount)))
        contentSize = CGSize(width: CGFloat(pageCount) * collectionViewWidth, height: collectionViewHeight)
    }
    
    private func getSinglePagedDividedAttribute(indexPath: IndexPath, item: Int, itemCount: Int) -> UICollectionViewLayoutAttributes {
        let page = Int(ceil(CGFloat(item) / CGFloat(maxShowCellCount)))
        let itemsBeforePage = (page - 1) * maxShowCellCount
        let currentPageItemCount = min(itemCount, page * maxShowCellCount) - itemsBeforePage
        
        if currentPageItemCount == 1 {
            let cell = UICollectionViewLayoutAttributes(forCellWith: indexPath)
            cell.frame = CGRect(x: 0, y: 0, width: collectionViewWidth, height: collectionViewHeight)
            return cell
        } else if currentPageItemCount == 2 {
            return getEquallyDividedAttributes(maxRows: 1,maxColumns: 2, indexPath: indexPath, item: item, itemCount: itemCount)
        } else if currentPageItemCount == 3 {
            return getEquallyDividedAttributes(maxRows: 1, maxColumns: 3, indexPath: indexPath, item: item, itemCount: itemCount)
        } else if currentPageItemCount == 4 {
            return getEquallyDividedAttributes(maxRows: 2, maxColumns: 2, indexPath: indexPath, item: item, itemCount: itemCount)
        } else {
            return getEquallyDividedAttributes(maxRows: 2, maxColumns: 3, indexPath: indexPath, item: item, itemCount: itemCount, lastRowCenter: true)
        }
    }
    
//MARK: size calculator
    private func getEquallyDividedAttributes(maxRows: Int,
                                             maxColumns: Int,
                                             indexPath: IndexPath,
                                             item: Int,
                                             itemCount: Int,
                                             cellSize: CGSize? = nil,
                                             veriticalCenter: Bool = false,
                                             lastRowCenter: Bool = false) -> UICollectionViewLayoutAttributes {
        let page = Int(ceil(CGFloat(item) / CGFloat(maxShowCellCount)))
        let cell = UICollectionViewLayoutAttributes(forCellWith: indexPath)
        
        let currentPageItemCount = min(itemCount - (page - 1) * maxShowCellCount, maxShowCellCount)
        let cellWidth: CGFloat
        let cellHeight: CGFloat
        if let size = cellSize {
            cellWidth = size.width
            cellHeight = size.height
        } else {
            cellWidth = (collectionViewWidth - config.spacing * CGFloat(maxColumns - 1)) / CGFloat(maxColumns)
            cellHeight = (collectionViewHeight - config.spacing * CGFloat(maxRows - 1)) / CGFloat(maxRows)
        }

        let contentWidth = cellWidth * CGFloat(maxColumns) + config.spacing * CGFloat(maxColumns - 1)
        let totalRows = Int(ceil(CGFloat(currentPageItemCount) / CGFloat(maxColumns)))
        let contentHeight = cellHeight * CGFloat(totalRows) + config.spacing * CGFloat(totalRows - 1)
        let pageHeight = cellHeight * CGFloat(maxRows) + config.spacing * CGFloat(maxRows - 1)
        
        let startX = (collectionViewWidth - contentWidth) / 2
        let startY = veriticalCenter ? (collectionViewHeight - contentHeight) / 2 : (collectionViewHeight - pageHeight) / 2
        
        let beginCellLeft = CGFloat(page - 1) * collectionViewWidth
        let itemIndex = item - (page - 1) * maxShowCellCount
        let column = (itemIndex - 1) % maxColumns
        let row = Int(ceil(CGFloat(itemIndex) / CGFloat(maxColumns))) - 1
        
        let itemY = startY + (cellHeight + config.spacing) * CGFloat(row)
        let itemX: CGFloat
        
        let currentRow = Int(ceil(CGFloat(itemIndex) / CGFloat(maxColumns)))
        let isLastRow = currentRow == Int(ceil(CGFloat(currentPageItemCount) / CGFloat(maxColumns)))
        
        if isLastRow && lastRowCenter {
            let lastRowItemCount = currentPageItemCount - (currentRow - 1) * maxColumns
            let lastRowWidth = cellWidth * CGFloat(lastRowItemCount) + config.spacing * CGFloat(lastRowItemCount - 1)
            let lastRowBeginX = (collectionViewWidth - lastRowWidth) / 2
            itemX = beginCellLeft + lastRowBeginX + (cellWidth + config.spacing) * CGFloat(column)
        } else {
            itemX = beginCellLeft + startX + (cellWidth + config.spacing) * CGFloat(column)
        }
        
        cell.frame = CGRect(x: itemX, y: itemY, width: cellWidth, height: cellHeight)
        return cell
    }
}

//MARK: one direction flow Layout calculate
extension MultiStreamViewLayout {
    private func calculateVerticalFlowAttributes(itemCount: Int) {
        guard itemCount > 0 else { return }
        let section: Int = 0
        let maxColumns = config.maxColumns
        let spacing = config.spacing
        let totalRows = Int(ceil(CGFloat(itemCount) / CGFloat(maxColumns)))
        let cellWidth = (collectionViewWidth - spacing * CGFloat(maxColumns - 1)) / CGFloat(maxColumns)
        let cellHeight = cellWidth / config.aspectRatio
        let totalHeight = cellHeight  * CGFloat(totalRows) + spacing * CGFloat(totalRows - 1)
        for i in 0 ... itemCount - 1 {
            let indexPath = IndexPath(item: i, section: section)
            let cell = UICollectionViewLayoutAttributes(forCellWith: indexPath)
            let column = i % maxColumns
            let row = i / maxColumns
            let itemX = (cellWidth + config.spacing) * CGFloat(column)
            var itemY  = (cellHeight + config.spacing) * CGFloat(row)
             
            if totalHeight <= collectionViewHeight {
                let startY = (collectionViewHeight - totalHeight) / 2
                itemY += startY
            }
            cell.frame = CGRect(x: itemX, y: itemY, width: cellWidth, height: cellHeight)
            layoutAttributeArray.append(cell)
        }
        let contentHeight = cellHeight * CGFloat(totalRows) + spacing * CGFloat(totalRows - 1)
        contentSize = CGSize(width: collectionViewWidth, height: contentHeight)
    }
    
    private func calculateHorizontalFlowAttributes(itemCount: Int) {
        guard itemCount > 0 else { return }
        let section: Int = 0
        let maxRows = config.maxRows
        let spacing = config.spacing
        let totalColumns = Int(ceil(CGFloat(itemCount) / CGFloat(maxRows)))
        let cellHeight = (collectionViewHeight - config.spacing * CGFloat(maxRows - 1)) / CGFloat(maxRows)
        let cellWidth = cellHeight * config.aspectRatio
        let totalWidth = cellWidth  * CGFloat(totalColumns) + spacing * CGFloat(totalColumns - 1)
        for i in 0 ... itemCount - 1 {
            let indexPath = IndexPath(item: i, section: section)
            let cell = UICollectionViewLayoutAttributes(forCellWith: indexPath)
            let row = i % maxRows
            let column = i / maxRows
            var itemX = (cellWidth + config.spacing) * CGFloat(column)
            let itemY  = (cellHeight + config.spacing) * CGFloat(row)
             
            if totalWidth <= collectionViewWidth {
                let startX = (collectionViewWidth - totalWidth) / 2
                itemX += startX
            }
            cell.frame = CGRect(x: itemX, y: itemY, width: cellWidth, height: cellHeight)
            layoutAttributeArray.append(cell)
        }
        let contentWidth = cellWidth * CGFloat(totalColumns) + config.spacing * CGFloat(totalColumns - 1)
        contentSize = CGSize(width: contentWidth, height: collectionViewHeight)
    }
}
