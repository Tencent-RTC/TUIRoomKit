//
//  TUIRoomMainViewController.swift
//  TUIRoom
//
//  Created by WesleyLei on 2021/12/16.
//  Copyright © 2021 Tencent. All rights reserved.
//

import SnapKit
import TXAppBasic
import UIKit
import TUICore
import TUIBarrage

public let isOpenTUIRoomTest: Bool = false

class TUIRoomMainViewController: UIViewController {
    // XMagic License 【Optional】
    var xMagicLicenseURL: String = ""
    var xMagicLicenseKey: String = ""
    
    weak var setViewController: TUIRoomSetViewController?
    var isViewDidLoad: Bool = false
    var roomId: String = ""
    var isVideoOn: Bool = true
    var isAudioOn: Bool = true
    
    var renderMapView: [String: TUIRoomAttendeeRenderView] = [:]
    var attendeeList: [TUIRoomAttendeeModel] = []
    var attendeeMap: [String: TUIRoomAttendeeModel] = [:]
    
    
    var renderShareMapViews: [String: TUIRoomAttendeeRenderView] = [:]
    
    var shareAttendeeList: [TUIRoomAttendeeModel] = []
    lazy var audioModel: TUIRoomSetAudioModel = {
        let model = TUIRoomSetAudioModel()
        return model
    }()

    lazy var videoModel: TUIRoomSetVideoModel = {
        let model = TUIRoomSetVideoModel()
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

    lazy var backView: UIView = {
        self.view
    }()

    lazy var switchAudioRouteButton: UIButton = {
        let button = UIButton(type: .custom)
        button.setImage(UIImage(named: "tuiroom_speaker", in: tuiRoomBundle(), compatibleWith: nil), for: .normal)
        button.setImage(UIImage(named: "tuiroom_earphone", in: tuiRoomBundle(), compatibleWith: nil), for: .selected)
        button.sizeToFit()
        return button
    }()

    lazy var barrageSendView: UIView = {
        let view = TUIBarrageSendPlugView(frame: self.view.frame, groupId: self.roomId)
        return view
    }()
    
    lazy var barragePlayView: UIView = {
        let view = TUIBarrageDisplayView(frame: self.view.frame, groupId: self.roomId)
        return view
    }()
    
    lazy var switchCameraButton: UIButton = {
        let button = UIButton(type: .custom)
        button.setImage(UIImage(named: "tuiroom_switch_camera", in: tuiRoomBundle(), compatibleWith: nil), for: .normal)
        button.setImage(UIImage(named: "tuiroom_switch_camera", in: tuiRoomBundle(), compatibleWith: nil), for: .selected)
        button.sizeToFit()
        return button
    }()
    
    lazy var reportButton: UIButton = {
        let button = UIButton(type: .custom)
        button.setImage(UIImage(named: "tuiroom_report", in: tuiRoomBundle(), compatibleWith: nil), for: .normal)
        return button
    }()

    lazy var roomIdLabel: UILabel = {
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

    lazy var exitButton: UIButton = {
        let button = UIButton(type: .custom)
        button.setTitle(.logoutButtonText, for: .normal)
        button.titleLabel?.font = UIFont.systemFont(ofSize: 14)
        button.backgroundColor = UIColor(red: 232 / 255.0, green: 75 / 255.0, blue: 64 / 255.0, alpha: 1.0)
        button.layer.cornerRadius = 16
        button.sizeToFit()
        return button
    }()

    lazy var muteAudioButton: UIButton = {
        let button = UIButton(type: .custom)
        button.setImage(UIImage(named: "tuiroom_mic_open", in: tuiRoomBundle(), compatibleWith: nil), for: .normal)
        button.setImage(UIImage(named: "tuiroom_mic_close", in: tuiRoomBundle(), compatibleWith: nil), for: .selected)
        button.setImage(UIImage(named: "tuiroom_mic_disabled", in: tuiRoomBundle(), compatibleWith: nil), for: .disabled)
        button.sizeToFit()
        return button
    }()

    lazy var msgInputButton: UIButton = {
        let button = TUIBarrageExtension.getEnterButton()
        button.sizeToFit()
        return button
    }()
    
    lazy var muteVideoButton: UIButton = {
        let button = UIButton(type: .custom)
        button.setImage(UIImage(named: "tuiroom_camera_open", in: tuiRoomBundle(), compatibleWith: nil), for: .normal)
        button.setImage(UIImage(named: "tuiroom_camera_close", in: tuiRoomBundle(), compatibleWith: nil), for: .selected)
        button.setImage(UIImage(named: "tuiroom_camera_disabled", in: tuiRoomBundle(), compatibleWith: nil), for: .disabled)
        button.sizeToFit()
        return button
    }()

    lazy var beautyButton: UIButton = {
        let button = UIButton(type: .custom)
        button.setImage(UIImage(named: "tuiroom_beauty", in: tuiRoomBundle(), compatibleWith: nil), for: .normal)
        button.sizeToFit()
        return button
    }()

    lazy var membersButton: UIButton = {
        let button = UIButton(type: .custom)
        button.setImage(UIImage(named: "tuiroom_member", in: tuiRoomBundle(), compatibleWith: nil), for: .normal)
        button.sizeToFit()
        return button
    }()

    lazy var moreSettingButton: UIButton = {
        let button = UIButton(type: .custom)
        button.setImage(UIImage(named: "tuiroom_more", in: tuiRoomBundle(), compatibleWith: nil), for: .normal)
        button.sizeToFit()
        return button
    }()

    var beautyView: UIView? = nil
    var isCreateRoom: Bool = false
    var speechMode: TUIRoomSpeechMode = .freeSpeech
    init(roomId: String,
         isCreate: Bool,
         isVideoOn: Bool,
         isAudioOn: Bool,
         speechMode: TUIRoomSpeechMode? = nil) {
        super.init(nibName: nil, bundle: nil)
        self.roomId = roomId
        self.isCreateRoom = isCreate
        self.isVideoOn = isVideoOn
        self.isAudioOn = isAudioOn
        if let speechMode = speechMode {
            self.speechMode = speechMode
        }
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
#if RTCube_APPSTORE
        let selector = NSSelectorFromString("showAlertUserLiveTips")
        if responds(to: selector) {
            perform(selector)
        }
#endif
        TUILogin.add(self)
        TUIRoomCore.shareInstance().setDelegate(self)
        if isCreateRoom {
            createRoom()
        } else {
            enterRoom()
        }
        
        if let view =  barragePlayView as? TUIBarrageDisplayBaseView {
            TUIBarrageExtension.setDisplayViewByGroupId(view, groupId: self.roomId)
        }
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
        backView.addSubview(barragePlayView)
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
        backView.addSubview(msgInputButton)
        backView.addSubview(barrageSendView)
#if RTCube_APPSTORE
        if !isCreateRoom {
            backView.addSubview(reportButton)
        }
#endif
    }

    func activateConstraints() {
        switchAudioRouteButton.snp.remakeConstraints { make in
            make.leading.equalTo(10)
            make.top.equalTo(topPadding + 12)
            make.width.height.equalTo(32)
        }

        switchCameraButton.snp.remakeConstraints { make in
            make.leading.equalTo(switchAudioRouteButton.snp.trailing).offset(10)
            make.centerY.equalTo(switchAudioRouteButton)
            make.width.height.equalTo(32)
        }
        if reportButton.superview != nil {
            reportButton.snp.makeConstraints { make in
                make.leading.equalTo(switchCameraButton.snp.trailing).offset(10)
                make.centerY.equalTo(switchCameraButton)
                make.width.height.equalTo(32)
            }
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
        
        barrageSendView.snp.makeConstraints { make in
            make.edges.equalToSuperview()
        }

        barragePlayView.snp.makeConstraints { make in
            make.width.equalTo(self.view.mm_w - 40)
            make.height.equalTo(300)
            make.left.equalToSuperview().offset(20)
            make.top.equalToSuperview().offset(self.view.mm_h - 300 - 120)
        }
        
        exitButton.snp.remakeConstraints { make in
            let width = exitButton.frame.size.width + 12 * 2
            make.trailing.equalTo(-12)
            make.centerY.equalTo(roomIdLabel)
            make.width.equalTo(width)
            make.height.equalTo(32)
        }

        let bottomOffset = -kDeviceSafeBottomHeight - 20
        let leftOffset = (view.frame.size.width - 284) / 5.5
        msgInputButton.snp.remakeConstraints { make in
            make.left.equalTo(view).offset(12)
            make.bottom.equalTo(view).offset(bottomOffset)
            make.width.height.equalTo(45)
        }
        
        muteAudioButton.snp.remakeConstraints { make in
            make.left.equalTo(msgInputButton.snp.right).offset(leftOffset)
            make.bottom.equalTo(view).offset(bottomOffset)
            make.width.height.equalTo(45)
        }

        muteVideoButton.snp.remakeConstraints { make in
            make.left.equalTo(muteAudioButton.snp.right).offset(leftOffset)
            make.bottom.equalTo(view).offset(bottomOffset)
            make.width.height.equalTo(45)
        }

        beautyButton.snp.remakeConstraints { make in
            make.left.equalTo(muteVideoButton.snp.right).offset(leftOffset)
            make.bottom.equalTo(view).offset(bottomOffset)
            make.width.height.equalTo(45)
        }

        membersButton.snp.remakeConstraints { make in
            make.left.equalTo(beautyButton.snp.right).offset(leftOffset)
            make.bottom.equalTo(view).offset(bottomOffset)
            make.width.height.equalTo(45)
        }

        moreSettingButton.snp.remakeConstraints { make in
            make.left.equalTo(membersButton.snp.right).offset(leftOffset)
            make.bottom.equalTo(view).offset(bottomOffset)
            make.width.height.equalTo(45)
        }

        pageControl.snp.makeConstraints { make in
            make.height.equalTo(30)
            make.centerX.equalTo(view)
            make.bottom.equalTo(beautyButton.snp.top).offset(-12)
        }
    }

    func bindInteraction() {
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
        reportButton.addTarget(self, action: #selector(reportClick), for: .touchUpInside)
        msgInputButton.addTarget(self, action: #selector(exitMsgButtonClick(sender:)), for: .touchUpInside)
    }

    deinit {
        TUILogin.remove(self)
        TUIRoomCore.destroyInstance()
        TUIRoom.sharedInstance.isEnterRoom = false
        UIApplication.shared.isIdleTimerDisabled = false
        debugPrint("deinit \(self)")
    }
}

// MARK: - CreateRoom、EnterRoom
extension TUIRoomMainViewController {
    
    private func createRoom() {
        TUIRoomCore.shareInstance().createRoom(roomId, speechMode: speechMode) { [weak self] (code, message) in
            guard let self = self else { return }
            if code == 0, let roomInfo = TUIRoomCore.shareInstance().getRoomInfo() {
                self.roomInfo = roomInfo
                self.initRoomData()
            } else {
                self.view.makeToast(message, duration: 1.0) { [weak self] (didTap) in
                    guard let self = self else { return }
                    self.exitRoomLogic(self.isCreateRoom)
                }
            }
        }
    }
    
    private func enterRoom() {
        TUIRoomCore.shareInstance().enterRoom(roomId, callback: { [weak self] (code, message) in
            guard let self = self else { return }
            if code == 0, let roomInfo = TUIRoomCore.shareInstance().getRoomInfo() {
                self.roomInfo = roomInfo
                self.initRoomData()
            } else {
                self.view.makeToast(message, duration: 1.0) { [weak self] (didTap) in
                    guard let self = self else { return }
                    self.exitRoomLogic(self.isCreateRoom)
                }
            }
        })
    }
    
    private func initRoomData() {
        initAttendeeList()
        applyConfigs()
        reloadData()
        if currentUser.userInfo.isRemoteAudioMuted {
            muteAudioButton.isSelected = false
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
        // Load beautyView
        loadBeautyView()
    }
}

// MARK: - Load BeautyView
extension TUIRoomMainViewController {
    
    private func loadBeautyView() {
        if !xMagicLicenseURL.isEmpty, !xMagicLicenseKey.isEmpty {
            TUICore.callService(TUICore_TUIBeautyService,
                                method: TUICore_TUIBeautyService_SetLicense,
                                param: [
                                    TUICore_TUIBeautyExtension_BeautyView_LicenseUrl: xMagicLicenseURL,
                                    TUICore_TUIBeautyExtension_BeautyView_LicenseKey: xMagicLicenseKey])
        }
        let beautyManager = TUIRoomCore.shareInstance().getBeautyManager()
        let beautyInfo = TUICore.getExtensionInfo(TUICore_TUIBeautyExtension_BeautyView,
                                                  param: [
                                                    TUICore_TUIBeautyExtension_BeautyView_BeautyManager: beautyManager])
        if let view = beautyInfo[TUICore_TUIBeautyExtension_BeautyView_View] as? UIView {
            beautyView = view
            TRTCCloud.sharedInstance().setLocalVideoProcessDelegete(self, pixelFormat: ._Texture_2D, bufferType: .texture)
        }
    }
}

// MARK: - TRTCVideoFrameDelegate
extension TUIRoomMainViewController: TRTCVideoFrameDelegate {
    
    public func onProcessVideoFrame(_ srcFrame: TRTCVideoFrame, dstFrame: TRTCVideoFrame) -> UInt32 {
        if let dstTextureId = TUICore.callService(TUICore_TUIBeautyService,
                                                  method: TUICore_TUIBeautyService_ProcessVideoFrame,
                                                  param: [
                                                      TUICore_TUIBeautyService_ProcessVideoFrame_SRCTextureIdKey: srcFrame.textureId,
                                                      TUICore_TUIBeautyService_ProcessVideoFrame_SRCFrameWidthKey: srcFrame.width,
                                                      TUICore_TUIBeautyService_ProcessVideoFrame_SRCFrameHeightKey: srcFrame.height
                                                         ]) as? GLuint {
            dstFrame.textureId = dstTextureId
        }
        return 0
    }
}

private extension String {
    static let logoutButtonText = tuiRoomLocalize("TUIRoom.logout.room")
}
