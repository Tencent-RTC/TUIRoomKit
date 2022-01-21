//
//  TUIRoomBeautyAlert.swift
//  TUIRoom
//
//  Created by WesleyLei on 2021/12/16.
//  Copyright © 2021 Tencent. All rights reserved.
//

import Foundation
import TCBeautyKit
import TXAppBasic

class TUIRoomBitrateTable: NSObject {
    var resolutionName: String = ""
    var resolution: Int = 0
    var defaultBitrate: Float = 0
    var minBitrate: Float = 0
    var maxBitrate: Float = 0
    var stepBitrate: Float = 0

    init(resolutionName: String,
         resolution: Int,
         defaultBitrate: Float,
         minBitrate: Float,
         maxBitrate: Float,
         stepBitrate: Float) {
        super.init()
        self.resolutionName = resolutionName
        self.resolution = resolution
        self.defaultBitrate = defaultBitrate
        self.minBitrate = minBitrate
        self.maxBitrate = maxBitrate
        self.stepBitrate = stepBitrate
    }
}

// MARK: Beauty

class TUIRoomIntensityView: UIView {
    var onSliderValueChanged: ((_ value: Float) -> Void)?

    lazy var titleLabel: UILabel = {
        let label = UILabel(frame: .zero)
        label.font = UIFont(name: "PingFangSC-Medium", size: 16)
        label.textColor = UIColor(hex: "666666")
        label.adjustsFontSizeToFitWidth = true
        label.minimumScaleFactor = 0.5
        label.text = .strengthText
        return label
    }()

    lazy var slider: UISlider = {
        let slider = UISlider(frame: .zero)
        return slider
    }()

    lazy var detailLabel: UILabel = {
        let label = UILabel(frame: .zero)
        label.font = UIFont(name: "PingFangSC-Medium", size: 16)
        label.textColor = UIColor(hex: "333333")
        label.adjustsFontSizeToFitWidth = true
        label.minimumScaleFactor = 0.5
        return label
    }()

    override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = .clear
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    private var isViewReady = false
    override func didMoveToWindow() {
        super.didMoveToWindow()
        guard !isViewReady else {
            return
        }
        isViewReady = true
        constructViewHierarchy()
        activateConstraints()
        bindInteraction()
    }

    func constructViewHierarchy() {
        addSubview(titleLabel)
        addSubview(slider)
        addSubview(detailLabel)
    }

    func activateConstraints() {
        titleLabel.snp.makeConstraints { make in
            make.centerY.equalToSuperview()
            make.leading.equalToSuperview().offset(20)
            make.width.equalTo(50)
        }
        detailLabel.snp.makeConstraints { make in
            make.trailing.equalToSuperview().offset(-20)
            make.centerY.equalToSuperview()
            make.width.equalTo(30)
        }
        slider.snp.makeConstraints { make in
            make.centerY.equalToSuperview()
            make.leading.equalTo(titleLabel.snp.trailing).offset(10)
            make.trailing.equalTo(detailLabel.snp.leading).offset(-10)
        }
    }

    func bindInteraction() {
        slider.addTarget(self, action: #selector(sliderValueChange), for: .valueChanged)
    }

    @objc func sliderValueChange() {
        let value = slider.value
        setSlider(value: value)
        if let action = onSliderValueChanged {
            action(value)
        }
    }

    func setSlider(minValue: Float, maxValue: Float) {
        slider.minimumValue = minValue
        slider.maximumValue = maxValue
    }

    func setSlider(value: Float) {
        var value = value
        if value > slider.maximumValue {
            value = slider.maximumValue
        } else if value < slider.minimumValue {
            value = slider.minimumValue
        }
        slider.value = value
        detailLabel.text = String(Int(roundf(value)))
    }
}

class TUIRoomBeautyAlert: TUIRoomAlertContentView {
    let viewModel: TCBeautyViewModel

    init(frame: CGRect = .zero, viewModel: TCBeautyViewModel) {
        self.viewModel = viewModel
        super.init(frame: frame)
        titleLabel.text = .titleText
        bgView.alpha = 0
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    lazy var intensityView: TUIRoomIntensityView = {
        let view = TUIRoomIntensityView(frame: .zero)
        return view
    }()

    lazy var beautyCollectionView: UICollectionView = {
        let layout = UICollectionViewFlowLayout()
        layout.itemSize = CGSize(width: 52, height: 75)
        layout.minimumLineSpacing = 10
        layout.minimumInteritemSpacing = 10
        layout.scrollDirection = .horizontal
        let collectionView = UICollectionView(frame: .zero, collectionViewLayout: layout)
        collectionView.backgroundColor = .clear
        collectionView.contentInset = UIEdgeInsets(top: 0, left: 20, bottom: 0, right: 20)
        collectionView.showsHorizontalScrollIndicator = false
        collectionView.showsVerticalScrollIndicator = false
        collectionView.delegate = self
        collectionView.dataSource = self
        return collectionView
    }()

    lazy var beautyTypeCollectionView: UICollectionView = {
        let layout = UICollectionViewFlowLayout()
        layout.itemSize = CGSize(width: 32, height: 28)
        layout.minimumLineSpacing = 20
        layout.minimumInteritemSpacing = 20
        layout.scrollDirection = .horizontal
        let collectionView = UICollectionView(frame: .zero, collectionViewLayout: layout)
        collectionView.backgroundColor = .clear
        collectionView.contentInset = UIEdgeInsets(top: 0, left: 20, bottom: 0, right: 20)
        collectionView.showsHorizontalScrollIndicator = false
        collectionView.showsVerticalScrollIndicator = false
        collectionView.delegate = self
        collectionView.dataSource = self
        return collectionView
    }()

    override func constructViewHierarchy() {
        super.constructViewHierarchy()
        contentView.addSubview(intensityView)
        contentView.addSubview(beautyCollectionView)
        contentView.addSubview(beautyTypeCollectionView)
    }

    override func activateConstraints() {
        super.activateConstraints()

        intensityView.snp.makeConstraints { make in
            make.top.equalTo(titleLabel.snp.bottom).offset(20)
            make.leading.trailing.equalToSuperview()
            make.height.equalTo(52)
        }

        beautyCollectionView.snp.makeConstraints { make in
            make.top.equalTo(intensityView.snp.bottom).offset(10)
            make.leading.trailing.equalToSuperview()
            make.height.equalTo(75)
        }

        beautyTypeCollectionView.snp.makeConstraints { make in
            make.top.equalTo(beautyCollectionView.snp.bottom).offset(20)
            make.leading.trailing.equalToSuperview()
            make.bottom.equalToSuperview().offset(-20 - kDeviceSafeBottomHeight)
            make.height.equalTo(28)
        }
    }

    override func bindInteraction() {
        super.bindInteraction()
        beautyCollectionView.register(TUIRoomBeautyCell.self, forCellWithReuseIdentifier: "TUIRoomBeautyCell")
        beautyTypeCollectionView.register(TUIRoomBeautyTypeCell.self, forCellWithReuseIdentifier: "TUIRoomBeautyTypeCell")

        intensityView.onSliderValueChanged = { [weak self] value in
            guard let `self` = self else { return }
            let item = self.viewModel.currentSelectItem
            switch item?.type {
            case .beauty:
                let item = item as! TCBeautyBeautyItem
                self.setBeautySlider(value: value, item: item)
            case .filter:
                let item = item as! TCBeautyFilterItem
                self.setFilterSlider(value: value, item: item)
            default:
                break
            }
        }
    }

    override func show() {
        UIView.animate(withDuration: 0.3) {
            self.alpha = 1
            self.contentView.transform = .identity
        } completion: { _ in
            self.beautyTypeCollectionView.selectItem(at: IndexPath(item: self.viewModel.currentShowIndexPath.section,
                                                                   section: 0),
                                                     animated: true,
                                                     scrollPosition: .centeredHorizontally)
            self.beautyCollectionView.selectItem(at: IndexPath(item: self.viewModel.currentShowIndexPath.item,
                                                               section: 0),
                                                 animated: true,
                                                 scrollPosition: .centeredHorizontally)
            if let item = self.viewModel.currentSelectItem {
                self.intensityView.isHidden = !(!item.isClear && (item.package?.enableSlider ?? false))
                if !self.intensityView.isHidden {
                    self.intensityView.setSlider(minValue: item.minValue, maxValue: item.maxValue)
                    self.intensityView.setSlider(value: item.currentValue)
                }
            }
        }
    }
}

extension TUIRoomBeautyAlert {
    public func setFilterSlider(value: Float, item: TCBeautyFilterItem) {
        item.setSlider(value: value)
    }

    public func setBeautySlider(value: Float, item: TCBeautyBeautyItem) {
        if item.index > 4 {
            item.sendAction([value])
        } else if item.index < 3 {
            viewModel.beautyStyle = item.index
            viewModel.beautyLevel = value
            item.sendAction([value, viewModel.beautyStyle, viewModel.beautyLevel, viewModel.whiteLevel, viewModel.ruddyLevel])
        } else {
            viewModel.beautyStyle = 2
            if item.index == 3 {
                viewModel.whiteLevel = value
            } else if item.index == 4 {
                viewModel.ruddyLevel = value
            }
            item.sendAction([value, viewModel.beautyStyle, viewModel.beautyLevel, viewModel.whiteLevel, viewModel.ruddyLevel])
        }
    }
}

extension TUIRoomBeautyAlert: UICollectionViewDataSource {
    func collectionView(_ collectionView: UICollectionView,
                        numberOfItemsInSection section: Int) -> Int {
        if collectionView == beautyCollectionView {
            return viewModel.dataSource[viewModel.currentShowIndexPath.section].items.count
        } else {
            return viewModel.dataSource.count
        }
    }

    func collectionView(_ collectionView: UICollectionView,
                        cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        if collectionView == beautyCollectionView {
            let cell = collectionView.dequeueReusableCell(
                withReuseIdentifier: "TUIRoomBeautyCell",
                for: indexPath)
            if let scell = cell as? TUIRoomBeautyCell {
                let item = viewModel.dataSource[viewModel.currentShowIndexPath.section].items[indexPath.item]
                scell.model = item
                if item == viewModel.currentSelectItem {
                    intensityView.isHidden = !(!item.isClear && (item.package?.enableSlider ?? false))
                    if !intensityView.isHidden {
                        intensityView.setSlider(minValue: item.minValue, maxValue: item.maxValue)
                        intensityView.setSlider(value: item.currentValue)
                    }
                }
            }
            return cell
        } else {
            let cell = collectionView.dequeueReusableCell(
                withReuseIdentifier: "TUIRoomBeautyTypeCell",
                for: indexPath)
            if let scell = cell as? TUIRoomBeautyTypeCell {
                let pkg = viewModel.dataSource[indexPath.item]
                scell.titleLabel.text = pkg.title
            }
            return cell
        }
    }
}

extension TUIRoomBeautyAlert: UICollectionViewDelegate, UICollectionViewDelegateFlowLayout {
    func collectionView(_ collectionView: UICollectionView,
                        layout collectionViewLayout: UICollectionViewLayout,
                        sizeForItemAt indexPath: IndexPath) -> CGSize {
        if collectionView == beautyCollectionView {
            return CGSize(width: 52, height: 75)
        } else {
            let pkg = viewModel.dataSource[indexPath.item]
            var width = pkg.title.width(fromFont: TUIRoomBeautyTypeCell.titleLabelFont)
            if width < 32 {
                width = 32
            } else if width > 120 {
                width = 120
            }
            return CGSize(width: width, height: 28)
        }
    }

    func collectionView(_ collectionView: UICollectionView,
                        didSelectItemAt indexPath: IndexPath) {
        if collectionView == beautyCollectionView {
            if let select = viewModel.currentSelectItem {
                select.isSelected = false
            }

            viewModel.currentShowIndexPath.item = indexPath.item
            let item = viewModel.dataSource[viewModel.currentShowIndexPath.section].items[viewModel.currentShowIndexPath.item]
            viewModel.currentSelectItem = item
            item.isSelected = true
            switch item.type {
            case .beauty:
                let item = item as! TCBeautyBeautyItem
                intensityView.isHidden = false
                intensityView.setSlider(minValue: item.minValue, maxValue: item.maxValue)
                intensityView.setSlider(value: item.currentValue)
                if item.index > 4 {
                    item.sendAction([item.currentValue])
                } else {
                    viewModel.beautyStyle = item.index < 3 ? item.index : 2
                    item.sendAction([item.currentValue,
                                     viewModel.beautyStyle,
                                     viewModel.beautyLevel,
                                     viewModel.whiteLevel,
                                     viewModel.ruddyLevel,])
                }
            case .filter:
                if item.isClear {
                    intensityView.isHidden = true
                    item.sendAction([])
                    return
                } else {
                    let item = item as! TCBeautyFilterItem
                    item.setFilter()
                    item.setSlider(value: item.currentValue)
                    intensityView.isHidden = false
                    intensityView.setSlider(minValue: item.minValue, maxValue: item.maxValue)
                    intensityView.setSlider(value: item.currentValue)
                }
            case .motion, .koubei, .cosmetic, .gesture, .green:
                intensityView.isHidden = true
                item.sendAction([])
            default:
                break
            }
        } else {
            viewModel.currentShowIndexPath.section = indexPath.item
            viewModel.currentShowIndexPath.item = 0
            beautyCollectionView.reloadData()
            beautyCollectionView.layoutIfNeeded()
            beautyCollectionView.scrollToItem(at: IndexPath(item: 0, section: 0),
                                              at: .centeredHorizontally, animated: false)

            let pkg = viewModel.dataSource[indexPath.item]
            if let selItem = viewModel.currentSelectItem, selItem.package == pkg {
                intensityView.isHidden = !pkg.enableSlider
                if !intensityView.isHidden, let item = pkg.items.first {
                    intensityView.setSlider(minValue: item.minValue, maxValue: item.maxValue)
                    intensityView.setSlider(value: item.currentValue)
                }
                var index = pkg.items.firstIndex(of: selItem) ?? 0 + (pkg.enableClearBtn ? 1 : 0)
                if index < 0, index > pkg.items.count + (pkg.enableClearBtn ? 1 : 0) {
                    index = 0
                }
                beautyCollectionView.selectItem(at: IndexPath(item: index,
                                                              section: 0),
                                                animated: true,
                                                scrollPosition: .left)
            }
        }
    }
}

class TUIRoomBeautyCell: UICollectionViewCell {
    var model: TCBeautyBaseItem? {
        didSet {
            guard let model = model else {
                return
            }
            headImageView.image = model.normalIcon
            titleLabel.text = model.title
        }
    }

    override var isSelected: Bool {
        didSet {
            titleLabel.textColor = isSelected ? UIColor(hex: "006EFF") : UIColor(hex: "666666")
            if let model = model, model.selectIcon != nil {
                headImageView.image = isSelected ? model.selectIcon : model.normalIcon
            } else {
                headImageView.tintColor = isSelected ? UIColor(hex: "006EFF") : UIColor(hex: "666666")
            }
        }
    }

    lazy var titleLabel: UILabel = {
        let label = UILabel(frame: .zero)
        label.font = UIFont(name: "PingFangSC-Regular", size: 12)
        label.textColor = UIColor(hex: "666666")
        label.adjustsFontSizeToFitWidth = true
        label.minimumScaleFactor = 0.5
        return label
    }()

    lazy var headImageView: UIImageView = {
        let imageView = UIImageView(frame: .zero)
        imageView.contentMode = .scaleAspectFit
        return imageView
    }()

    override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = .clear

        contentView.addSubview(headImageView)
        headImageView.snp.makeConstraints { make in
            make.top.centerX.equalToSuperview()
            make.size.equalTo(CGSize(width: 52, height: 52))
        }

        contentView.addSubview(titleLabel)
        titleLabel.snp.makeConstraints { make in
            make.bottom.centerX.equalToSuperview()
            make.leading.greaterThanOrEqualToSuperview()
            make.trailing.lessThanOrEqualToSuperview()
        }
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
}

class TUIRoomBeautyTypeCell: UICollectionViewCell {
    override var isSelected: Bool {
        didSet {
            titleLabel.textColor = isSelected ? UIColor(hex: "006EFF") : UIColor(hex: "999999")
        }
    }

    static var titleLabelFont: UIFont {
        return UIFont(name: "PingFangSC-Regular", size: 16) ?? UIFont.systemFont(ofSize: 16)
    }

    lazy var titleLabel: UILabel = {
        let label = UILabel(frame: .zero)
        label.font = UIFont(name: "PingFangSC-Regular", size: 16)
        label.textColor = UIColor(hex: "999999")
        label.adjustsFontSizeToFitWidth = true
        label.minimumScaleFactor = 0.5
        return label
    }()

    override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = .clear

        contentView.addSubview(titleLabel)
        titleLabel.snp.makeConstraints { make in
            make.centerX.centerY.equalToSuperview()
            make.leading.greaterThanOrEqualToSuperview()
            make.trailing.lessThanOrEqualToSuperview()
        }
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
}

// MARK: Resolution

class TUIRoomResolutionAlert: TUIRoomAlertContentView {
    var dataSource: [TUIRoomBitrateTable] = []
    var selectIndex = 3

    var didSelectItem: ((_ index: Int) -> Void)?

    lazy var tableView: UITableView = {
        let tableView = UITableView(frame: .zero, style: .plain)
        tableView.separatorStyle = .none
        tableView.backgroundColor = .clear
        return tableView
    }()

    override init(frame: CGRect = .zero) {
        super.init(frame: frame)
        titleLabel.text = .resolutionTitleText
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func constructViewHierarchy() {
        super.constructViewHierarchy()
        contentView.addSubview(tableView)
    }

    override func activateConstraints() {
        super.activateConstraints()
        tableView.snp.makeConstraints { make in
            make.top.equalTo(titleLabel.snp.bottom).offset(20)
            make.leading.trailing.bottom.equalToSuperview()
            make.height.equalTo(248)
        }
    }

    override func bindInteraction() {
        super.bindInteraction()
        tableView.dataSource = self
        tableView.delegate = self
        tableView.register(TUIRoomResolutionTableViewCell.self,
                           forCellReuseIdentifier: "TUIRoomResolutionTableViewCell")
    }
}

extension TUIRoomResolutionAlert: UITableViewDataSource {
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return dataSource.count
    }

    func tableView(_ tableView: UITableView,
                   cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "TUIRoomResolutionTableViewCell", for: indexPath)
        if let scell = cell as? TUIRoomResolutionTableViewCell {
            let model = dataSource[indexPath.row]
            scell.titleLabel.text = model.resolutionName
            scell.isSelected = indexPath.row == selectIndex
        }
        return cell
    }
}

extension TUIRoomResolutionAlert: UITableViewDelegate {
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        selectIndex = indexPath.row
        tableView.reloadSections(IndexSet(integer: 0), with: .none)
        if let action = didSelectItem {
            action(selectIndex)
        }
    }
}

class TUIRoomResolutionTableViewCell: UITableViewCell {
    lazy var titleLabel: UILabel = {
        let label = UILabel(frame: .zero)
        label.font = UIFont(name: "PingFangSC-Medium", size: 16)
        label.textColor = UIColor(hex: "666666")
        return label
    }()

    lazy var checkboxImageView: UIImageView = {
        let imageView = UIImageView(image: norImage)
        return imageView
    }()

    let selImage = UIImage(named: "tuiroom_checkbox_sel", in: tuiRoomBundle(), compatibleWith: nil)
    let norImage = UIImage(named: "tuiroom_checkbox_nor", in: tuiRoomBundle(), compatibleWith: nil)

    override var isSelected: Bool {
        didSet {
            checkboxImageView.image = isSelected ? selImage : norImage
        }
    }

    override init(style: UITableViewCell.CellStyle, reuseIdentifier: String?) {
        super.init(style: style, reuseIdentifier: reuseIdentifier)

        backgroundColor = .clear
        selectionStyle = .none

        contentView.addSubview(titleLabel)
        titleLabel.snp.makeConstraints { make in
            make.centerY.equalToSuperview()
            make.leading.equalToSuperview().offset(20)
        }

        contentView.addSubview(checkboxImageView)
        checkboxImageView.snp.makeConstraints { make in
            make.centerY.equalToSuperview()
            make.trailing.equalToSuperview().offset(-20)
            make.size.equalTo(CGSize(width: 24, height: 24))
        }
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
}

// MARK: Base

class TUIRoomAlertContentView: UIView {
    lazy var bgView: UIView = {
        let view = UIView(frame: .zero)
        view.backgroundColor = .black
        view.alpha = 0.6
        return view
    }()

    lazy var contentView: UIView = {
        let view = UIView(frame: .zero)
        view.backgroundColor = .white
        return view
    }()

    lazy var titleLabel: UILabel = {
        let label = UILabel(frame: .zero)
        label.textColor = .black
        label.font = UIFont(name: "PingFangSC-Medium", size: 24)
        return label
    }()

    var willDismiss: (() -> Void)?
    var didDismiss: (() -> Void)?

    override init(frame: CGRect = .zero) {
        super.init(frame: frame)
        contentView.transform = CGAffineTransform(translationX: 0, y: ScreenHeight)
        alpha = 0
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    private var isViewReady = false
    override func didMoveToWindow() {
        super.didMoveToWindow()
        guard !isViewReady else {
            return
        }
        isViewReady = true
        constructViewHierarchy()
        activateConstraints()
        bindInteraction()
    }
    
    func show() {
        UIView.animate(withDuration: 0.3) {
            self.alpha = 1
            self.contentView.transform = .identity
        }
    }

    func dismiss() {
        if let action = willDismiss {
            action()
        }
        UIView.animate(withDuration: 0.3) {
            self.alpha = 0
            self.contentView.transform = CGAffineTransform(translationX: 0, y: ScreenHeight)
        } completion: { _ in
            if let action = self.didDismiss {
                action()
            }
            self.removeFromSuperview()
        }
    }

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let point = touches.first?.location(in: self) else {
            return
        }
        if !contentView.frame.contains(point) {
            dismiss()
        }
    }

    override func draw(_ rect: CGRect) {
        super.draw(rect)
        contentView.roundedRect(rect: contentView.bounds,
                                byRoundingCorners: [.topLeft, .topRight],
                                cornerRadii: CGSize(width: 12, height: 12))
    }

    func constructViewHierarchy() {
        addSubview(bgView)
        addSubview(contentView)
        contentView.addSubview(titleLabel)
    }

    func activateConstraints() {
        bgView.snp.makeConstraints { make in
            make.edges.equalToSuperview()
        }
        contentView.snp.makeConstraints { make in
            make.leading.trailing.bottom.equalToSuperview()
        }
        titleLabel.snp.makeConstraints { make in
            make.leading.equalToSuperview().offset(20)
            make.top.equalToSuperview().offset(32)
        }
    }

    func bindInteraction() {
    }
}

extension String {
    func width(fromFont: UIFont) -> CGFloat {
        if count == 0 {
            return 0
        }
        let str = self as NSString
        return str.boundingRect(with: CGSize(width: 0,height: fromFont.lineHeight),
                                options: [.usesLineFragmentOrigin, .usesFontLeading,.usesDeviceMetrics,],
                                attributes: [NSAttributedString.Key.font: fromFont],
                                context: nil).width
    }
}

// MARK: - internationalization string

fileprivate extension String {
    static let titleText = tuiRoomLocalize("TUIRoom.Beauty.Setup")
    static let strengthText = tuiRoomLocalize("TUIRoom.Beauty.Setup.Strength")
    static let resolutionTitleText = tuiRoomLocalize("TUIRoom.resolution")
}
