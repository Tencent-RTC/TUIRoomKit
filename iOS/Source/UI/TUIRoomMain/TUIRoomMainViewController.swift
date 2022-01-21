//
//  TUIRoomMainViewController.swift
//  TUIRoom
//
//  Created by WesleyLei on 2021/12/16.
//  Copyright © 2021 Tencent. All rights reserved.
//

import SnapKit
import TCBeautyKit
import TXAppBasic
import UIKit
public let isOpenTUIRoomTest: Bool = false

class TUIRoomMainViewController: UIViewController {
    weak var setViewController: TUIRoomSetViewController?
    var isViewDidLoad: Bool = false
    var roomId: Int32 = 0
    var isVideoOn: Bool = true
    var isAudioOn: Bool = true
    // |renderMapView|和|attendeeList|的第一个元素表示自己
    var renderMapView: [String: TUIRoomAttendeeRenderView] = [:]
    var attendeeList: [TUIRoomAttendeeModel] = []
    var attendeeMap: [String: TUIRoomAttendeeModel] = [:]

    // |renderrenderShareMapViewsViews|和|shareAttendeeList|
    var renderShareMapViews: [String: TUIRoomAttendeeRenderView] = [:]
    // 分享用户+self
    var shareAttendeeList: [TUIRoomAttendeeModel] = []
    lazy var audioModel: TUIRoomSetAudioModel = {
        let model = TUIRoomSetAudioModel()
        return model
    }()

    lazy var videoModel: TUIRoomSetVideoModel = {
        let model = TUIRoomSetVideoModel()
        return model
    }()

    lazy var beautyViewModel: TCBeautyViewModel = {
        let model = TCBeautyViewModel(viewModel: TUIRoomCore.shareInstance())
        return model
    }()

    var currentUser: TUIRoomAttendeeModel = {
        let curUser = TUIRoomAttendeeModel()
        if let userInfo = TUIRoomUserManage.getUser(TUIRoomUserManage.currentUserId()) {
            curUser.userInfo = userInfo
        } else {
            curUser.userInfo.userId = TUIRoomUserManage.currentUserId()
            curUser.userInfo.userName = TUIRoomUserManage.currentNickName()
            curUser.userInfo.userAvatar = TUIRoomUserManage.currentFaceUrl()
        }
        return curUser
    }()

    var roomInfo: TUIRoomInfo = TUIRoomInfo()

    var topPadding: CGFloat = {
        if #available(iOS 11.0, *) {
            if let window = UIApplication.shared.keyWindow {
                return window.safeAreaInsets.top
            }
        }
        return 0
    }()

    var pageControl: UIPageControl = {
        let control = UIPageControl()
        control.currentPage = 0
        control.hidesForSinglePage = true
        control.isUserInteractionEnabled = false
        return control
    }()

    lazy var attendeeCollectionView: UICollectionView = {
        let layout = UICollectionViewFlowLayout()
        layout.minimumLineSpacing = 0
        layout.minimumInteritemSpacing = 0
        layout.scrollDirection = .horizontal
        let collection = UICollectionView(frame: CGRect(x: 0, y: 0, width: view.mm_w, height: view.mm_h), collectionViewLayout: layout)
        collection.register(TUIRoomMainViewCell.classForCoder(), forCellWithReuseIdentifier: "TUIRoomMainViewCell")
        collection.register(TUIRoomMainScreenShareViewCell.classForCoder(), forCellWithReuseIdentifier: "TUIRoomMainScreenShareViewCell")

        if #available(iOS 10.0, *) {
            collection.isPrefetchingEnabled = true
        } else {
            // Fallback on earlier versions
        }
        collection.isPagingEnabled = true
        collection.showsVerticalScrollIndicator = false
        collection.showsHorizontalScrollIndicator = false
        if #available(iOS 11.0, *) {
            collection.contentInsetAdjustmentBehavior = .never
        } else {
            // Fallback on earlier versions
        }
        collection.contentMode = .scaleToFill
        collection.backgroundColor = .black
        collection.dataSource = self
        collection.delegate = self
        collection.frame = CGRect(x: 0, y: 0, width: UIScreen.main.bounds.size.width, height: UIScreen.main.bounds.size.height)
        return collection
    }()

    // 背景
    lazy var backView: UIView = {
        self.view
    }()

    // 顶部空间
    lazy var switchAudioRouteButton: UIButton = { // 扬声器切换
        let button = UIButton(type: .custom)
        button.setImage(UIImage(named: "tuiroom_speaker", in: tuiRoomBundle(), compatibleWith: nil), for: .normal)
        button.setImage(UIImage(named: "tuiroom_earphone", in: tuiRoomBundle(), compatibleWith: nil), for: .selected)
        button.sizeToFit()
        return button
    }()

    lazy var switchCameraButton: UIButton = { // 摄像头切换
        let button = UIButton(type: .custom)
        button.setImage(UIImage(named: "tuiroom_switch_camera", in: tuiRoomBundle(), compatibleWith: nil), for: .normal)
        button.setImage(UIImage(named: "tuiroom_switch_camera", in: tuiRoomBundle(), compatibleWith: nil), for: .selected)
        button.sizeToFit()
        return button
    }()

    lazy var roomIdLabel: UILabel = { // 房间号label
        let label = UILabel()
        label.textAlignment = .center
        label.text = "\(self.roomId)".addIntervalSpace(intervalStr: " ", interval: 3)
        label.font = UIFont(name: "PingFangSC-Medium", size: 16)
        label.textColor = .white
        label.isUserInteractionEnabled = true
        label.sizeToFit()
        label.tag = 0
        return label
    }()

    lazy var copyButton: UIButton = {
        let button = UIButton(type: .custom)
        button.setImage(UIImage(named: "tuiroom_copy_white_icon", in: tuiRoomBundle(), compatibleWith: nil), for: .normal)
        return button
    }()

    lazy var exitButton: UIButton = { // 退出
        let button = UIButton(type: .custom)
        button.setTitle(.logoutButtonText, for: .normal)
        button.titleLabel?.font = UIFont.systemFont(ofSize: 14)
        button.backgroundColor = UIColor(red: 232 / 255.0, green: 75 / 255.0, blue: 64 / 255.0, alpha: 1.0)
        button.layer.cornerRadius = 16
        button.sizeToFit()
        return button
    }()

    // 底部空间
    lazy var muteAudioButton: UIButton = { // 开关麦克风
        let button = UIButton(type: .custom)
        button.setImage(UIImage(named: "tuiroom_mic_open", in: tuiRoomBundle(), compatibleWith: nil), for: .normal)
        button.setImage(UIImage(named: "tuiroom_mic_close", in: tuiRoomBundle(), compatibleWith: nil), for: .selected)
        button.setImage(UIImage(named: "tuiroom_mic_disabled", in: tuiRoomBundle(), compatibleWith: nil), for: .disabled)
        button.sizeToFit()
        return button
    }()

    lazy var muteVideoButton: UIButton = { // 开关摄像头
        let button = UIButton(type: .custom)
        button.setImage(UIImage(named: "tuiroom_camera_open", in: tuiRoomBundle(), compatibleWith: nil), for: .normal)
        button.setImage(UIImage(named: "tuiroom_camera_close", in: tuiRoomBundle(), compatibleWith: nil), for: .selected)
        button.setImage(UIImage(named: "tuiroom_camera_disabled", in: tuiRoomBundle(), compatibleWith: nil), for: .disabled)
        button.sizeToFit()
        return button
    }()

    lazy var beautyButton: UIButton = { // 美颜
        let button = UIButton(type: .custom)
        button.setImage(UIImage(named: "tuiroom_beauty", in: tuiRoomBundle(), compatibleWith: nil), for: .normal)
        button.sizeToFit()
        return button
    }()

    lazy var membersButton: UIButton = { // 成员列表
        let button = UIButton(type: .custom)
        button.setImage(UIImage(named: "tuiroom_member", in: tuiRoomBundle(), compatibleWith: nil), for: .normal)
        button.sizeToFit()
        return button
    }()

    lazy var moreSettingButton: UIButton = { // 更多设置按钮
        let button = UIButton(type: .custom)
        button.setImage(UIImage(named: "tuiroom_more", in: tuiRoomBundle(), compatibleWith: nil), for: .normal)
        button.sizeToFit()
        return button
    }()

    init(roomId: Int32, isVideoOn: Bool, isAudioOn: Bool) {
        super.init(nibName: nil, bundle: nil)
        self.roomId = roomId
        self.isVideoOn = isVideoOn
        self.isAudioOn = isAudioOn
        guard let roomInfo = TUIRoomCore.shareInstance().getRoomInfo() else {
            return
        }
        self.roomInfo = roomInfo
        initAttendeeList()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        isViewDidLoad = true
        setupUI()
        activateConstraints()
        bindInteraction()
        applyConfigs()
        reloadData()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        navigationController?.setNavigationBarHidden(true, animated: true)
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        navigationController?.setNavigationBarHidden(false, animated: true)
    }

    func setupUI() { // 控件添加
        UIApplication.shared.isIdleTimerDisabled = true
        backView.backgroundColor = .clear
        backView.addSubview(attendeeCollectionView)
        backView.addSubview(pageControl)
        backView.addSubview(switchAudioRouteButton)
        backView.addSubview(switchCameraButton)
        backView.addSubview(exitButton)
        backView.addSubview(roomIdLabel)
        backView.addSubview(copyButton)
        backView.addSubview(muteAudioButton)
        backView.addSubview(muteVideoButton)
        backView.addSubview(beautyButton)
        backView.addSubview(membersButton)
        backView.addSubview(moreSettingButton)

        if currentUser.userInfo.isRemoteAudioMuted {
            muteVideoButton.isSelected = false
            muteAudioButton.isEnabled = false
        } else {
            muteAudioButton.isEnabled = true
            muteAudioButton.isSelected = !currentUser.isAudioOpen()
        }

        if currentUser.userInfo.isRemoteVideoMuted {
            muteVideoButton.isSelected = false
            muteVideoButton.isEnabled = false
        } else {
            muteVideoButton.isEnabled = true
            muteVideoButton.isSelected = !currentUser.isVideoOpen()
        }
    }

    func activateConstraints() { // 布局
        switchAudioRouteButton.snp.remakeConstraints { make in
            make.leading.equalTo(12)
            make.top.equalTo(topPadding + 12)
            make.width.height.equalTo(32)
        }

        switchCameraButton.snp.remakeConstraints { make in
            make.leading.equalTo(switchAudioRouteButton.snp.trailing).offset(12)
            make.centerY.equalTo(switchAudioRouteButton)
            make.width.height.equalTo(32)
        }

        roomIdLabel.snp.remakeConstraints { make in
            make.centerY.equalTo(switchAudioRouteButton)
            make.centerX.equalToSuperview()
        }
        copyButton.snp.remakeConstraints { make in
            make.centerY.equalTo(roomIdLabel)
            make.left.equalTo(roomIdLabel.snp.right).offset(3)
            make.width.height.equalTo(32)
        }

        exitButton.snp.remakeConstraints { make in
            let width = exitButton.frame.size.width + 12 * 2
            make.trailing.equalTo(-12)
            make.centerY.equalTo(roomIdLabel)
            make.width.equalTo(width)
            make.height.equalTo(32)
        }

        let bottomOffset = -kDeviceSafeBottomHeight - 20
        let leftOffset = (view.mm_w - 284) / 4.0
        muteAudioButton.snp.remakeConstraints { make in
            make.left.equalTo(view).offset(12)
            make.bottom.equalTo(view).offset(bottomOffset)
            make.width.height.equalTo(52)
        }

        muteVideoButton.snp.remakeConstraints { make in
            make.left.equalTo(muteAudioButton.snp.right).offset(leftOffset)
            make.bottom.equalTo(view).offset(bottomOffset)
            make.width.height.equalTo(52)
        }

        beautyButton.snp.remakeConstraints { make in
            make.left.equalTo(muteVideoButton.snp.right).offset(leftOffset)
            make.bottom.equalTo(view).offset(bottomOffset)
            make.width.height.equalTo(52)
        }

        membersButton.snp.remakeConstraints { make in
            make.left.equalTo(beautyButton.snp.right).offset(leftOffset)
            make.bottom.equalTo(view).offset(bottomOffset)
            make.width.height.equalTo(52)
        }

        moreSettingButton.snp.remakeConstraints { make in
            make.left.equalTo(membersButton.snp.right).offset(leftOffset)
            make.bottom.equalTo(view).offset(bottomOffset)
            make.width.height.equalTo(52)
        }

        pageControl.snp.makeConstraints { make in
            make.height.equalTo(30)
            make.centerX.equalTo(view)
            make.bottom.equalTo(beautyButton.snp.top).offset(-12)
        }
    }

    func bindInteraction() { // 点击事件添加
        exitButton.addTarget(self, action: #selector(exitButtonClick), for: .touchUpInside)
        switchAudioRouteButton.addTarget(self, action: #selector(switchAudioButtonClick), for: .touchUpInside)
        switchCameraButton.addTarget(self, action: #selector(switchCameraButtonClick), for: .touchUpInside)
        let longGesture = UILongPressGestureRecognizer(target: self, action: #selector(showLogView(gesture:)))
        longGesture.minimumPressDuration = 3
        roomIdLabel.addGestureRecognizer(longGesture)
        copyButton.addTarget(self, action: #selector(copyButtonClick), for: .touchUpInside)
        muteAudioButton.addTarget(self, action: #selector(muteAudioButtonClick), for: .touchUpInside)
        muteVideoButton.addTarget(self, action: #selector(muteVideoButtonClick), for: .touchUpInside)
        beautyButton.addTarget(self, action: #selector(beautyButtonClick), for: .touchUpInside)
        membersButton.addTarget(self, action: #selector(membersButtonClick), for: .touchUpInside)
        moreSettingButton.addTarget(self, action: #selector(moreSettingButtonClick), for: .touchUpInside)
    }

    deinit {
        TUIRoomCore.destroyInstance()
        UIApplication.shared.isIdleTimerDisabled = false
        debugPrint("deinit \(self)")
    }
}

private extension String {
    static let logoutButtonText = tuiRoomLocalize("TUIRoom.logout.room")
}
