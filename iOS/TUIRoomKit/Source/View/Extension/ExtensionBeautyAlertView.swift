//
//  ExtensionBeautyAlertView..swift
//  TUIRoomKit
//
//  Created by 唐佳宁 on 2022/11/3.
//

import Foundation
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

    let selImage = UIImage(named: "tuiroom_checkbox_sel")
    let norImage = UIImage(named: "tuiroom_checkbox_nor")

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
        return str.boundingRect(with: CGSize(width: 0, height: fromFont.lineHeight),
                                options: [.usesLineFragmentOrigin, .usesFontLeading, .usesDeviceMetrics],
                                attributes: [NSAttributedString.Key.font: fromFont],
                                context: nil).width
    }
}

// MARK: - internationalization string

fileprivate extension String {
    static let titleText = tuiRoomKitLocalize("TUIRoom.Beauty.Setup")
    static let strengthText = tuiRoomKitLocalize("TUIRoom.Beauty.Setup.Strength")
    static let resolutionTitleText = tuiRoomKitLocalize("TUIRoom.resolution")
}
