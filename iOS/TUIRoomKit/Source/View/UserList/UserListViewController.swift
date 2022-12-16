//
//  TUIRoomViewController.swift
//  TUIRoom
//
//  Created by WesleyLei on 2021/12/16.
//  Copyright © 2021 Tencent. All rights reserved.
//
import SnapKit
import TUIRoomEngine
import TXAppBasic
import UIKit

public typealias TUIRoomKickOffBlock = (_ userInfo: TUIUserInfo, _ onSuccess: @escaping TUISuccessBlock,
                                        _ onError: @escaping TUIErrorBlock) -> Void
public typealias TUIRoomMuteBlock = (_ userInfo: TUIUserInfo, _ mute: Bool, _ onSuccess: @escaping TUISuccessBlock,
                                     _ onError: @escaping TUIErrorBlock) -> Void

class UserListViewController: UIViewController {
    var roomId: String = ""
    var roomOwner: String = ""
    var roomPresenter: RoomPresenter
    var currentUserInfo: UserModel? {
        return roomPresenter.currentUser
    }

    var roomEngineInfo: TUIRoomInfo? {
        return roomPresenter.roomInfo
    }

    var attendeeList: [TUIUserInfo] = []
    var attendeeMap: [String: TUIUserInfo] = [:]

    lazy var muteAllAudioButton: UIButton = {
        let button = UIButton(type: .custom)
        button.titleLabel?.font = UIFont.systemFont(ofSize: 14)

        button.setTitle(.allUnmuteText, for: .selected)
        button.setTitleColor(.white, for: .selected)
        if let color = UIColor(hex: "29CC85") {
            button.setBackgroundImage(color.trans2Image(), for: .selected)
        }
        button.setTitle(.allMuteListText, for: .normal)
        button.setTitleColor(UIColor(hex: "29CC85"), for: .normal)
        button.setBackgroundImage(UIColor.white.trans2Image(), for: .normal)

        button.layer.borderWidth = 1
        if let color = UIColor(hex: "29CC85") {
            button.layer.borderColor = color.cgColor
        }
        button.layer.cornerRadius = 25
        button.clipsToBounds = true
        button.titleLabel?.adjustsFontSizeToFitWidth = true
        button.titleLabel?.minimumScaleFactor = 0.5
        button.adjustsImageWhenHighlighted = false
        return button
    }()

    lazy var muteAllVideoButton: UIButton = {
        let button = UIButton(type: .custom)
        button.titleLabel?.font = UIFont.systemFont(ofSize: 14)

        button.setTitle(.allOpenPictureText, for: .selected)
        button.setTitleColor(.white, for: .selected)
        if let color = UIColor(hex: "006EFF") {
            button.setBackgroundImage(color.trans2Image(), for: .selected)
        }
        button.setTitle(.allStopPictureText, for: .normal)
        button.setTitleColor(UIColor(hex: "006EFF"), for: .normal)
        button.setBackgroundImage(UIColor.white.trans2Image(), for: .normal)

        button.layer.borderWidth = 1
        if let color = UIColor(hex: "006EFF") {
            button.layer.borderColor = color.cgColor
        }
        button.layer.cornerRadius = 25
        button.clipsToBounds = true
        button.titleLabel?.adjustsFontSizeToFitWidth = true
        button.titleLabel?.minimumScaleFactor = 0.5
        button.adjustsImageWhenHighlighted = false
        return button
    }()

    lazy var backButton: UIButton = {
        let button = UIButton(type: .custom)
        button.setImage(UIImage(named: "tuiroom_back", in: tuiRoomKitBundle(), compatibleWith: nil), for: .normal)
        return button
    }()

    lazy var okButton: UIButton = {
        let button = UIButton(type: .custom)
        button.titleLabel?.font = UIFont.systemFont(ofSize: 14)
        button.setTitle(.okText, for: .normal)
        button.setTitleColor(.white, for: .normal)
        if let color = UIColor(hex: "006EFF") {
            button.setBackgroundImage(color.trans2Image(), for: .normal)
        }
        button.layer.cornerRadius = 25
        button.clipsToBounds = true
        button.titleLabel?.adjustsFontSizeToFitWidth = true
        button.titleLabel?.minimumScaleFactor = 0.5
        button.adjustsImageWhenHighlighted = false
        return button
    }()

    lazy var memberCollectionView: UICollectionView = {
        let layout = UICollectionViewFlowLayout()
        layout.minimumLineSpacing = 0
        layout.minimumInteritemSpacing = 0
        layout.scrollDirection = .vertical
        layout.itemSize = CGSize(width: view.frame.size.width, height: 68)
        let collection = UICollectionView(frame: CGRect(x: 0, y: 0, width: view.frame.size.width,
                                                        height: view.frame.size.height), collectionViewLayout: layout)
        collection.register(UserCell.classForCoder(), forCellWithReuseIdentifier: "UserCell")
        if #available(iOS 10.0, *) {
            collection.isPrefetchingEnabled = true
        } else {
            // Fallback on earlier versions
        }
        collection.showsVerticalScrollIndicator = false
        collection.showsHorizontalScrollIndicator = false
        collection.dataSource = self
        collection.contentInset = UIEdgeInsets(top: 0, left: 0, bottom: 90 + kDeviceSafeBottomHeight, right: 0)
        collection.clipsToBounds = true
        collection.backgroundColor = .white
        collection.layer.cornerRadius = 20
        return collection

    }()

    init(roomId: String, roomPresent: RoomPresenter) {
        self.roomId = roomId
        roomPresenter = roomPresent
        super.init(nibName: nil, bundle: nil)
        roomPresenter.addListener(listener: self)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        activateConstraints()
        bindInteraction()
        updateView()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        navigationController?.setNavigationBarHidden(false, animated: true)
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
    }

    func updateView() {
        roomPresenter.getRoomInfo { [weak self] roomInfo in
            guard let self = self else { return }
            guard let roomInfo = roomInfo else { return }
            self.muteAllAudioButton.isHidden = !(roomInfo.owner == self.currentUserInfo?.userInfo.userId)
            self.muteAllVideoButton.isHidden = !(roomInfo.owner == self.currentUserInfo?.userInfo.userId)
            self.muteAllAudioButton.isSelected = !roomInfo.enableAudio
            self.muteAllVideoButton.isSelected = !roomInfo.enableVideo
            self.okButton.isHidden = roomInfo.owner == self.currentUserInfo?.userInfo.userId
        } onError: { _, _ in
        }
    }

    func setupUI() {
        title = .userListText
        navigationItem.leftBarButtonItem = UIBarButtonItem(customView: backButton)
        navigationItem.leftBarButtonItem?.tintColor = .black
        navigationItem.titleView?.isHidden = true
        view.addSubview(memberCollectionView)
        view.addSubview(muteAllVideoButton)
        view.addSubview(muteAllAudioButton)
        view.addSubview(okButton)
        view.backgroundColor = UIColor(hex: "F4F5F9")
    }

    func activateConstraints() {
        memberCollectionView.snp.makeConstraints { make in
            make.leading.trailing.equalTo(view)
            make.bottom.equalTo(view)
            make.top.equalTo(10)
            make.height.equalTo(view).offset(0)
        }

        muteAllAudioButton.snp.makeConstraints { make in
            make.trailing.equalTo(view.snp.centerX).offset(-10)
            make.bottom.equalTo(view).offset(-40 - kDeviceSafeBottomHeight)
            make.height.equalTo(50)
            make.leading.equalToSuperview().offset(30)
        }

        muteAllVideoButton.snp.remakeConstraints { make in
            make.leading.equalTo(view.snp.centerX).offset(10)
            make.bottom.equalTo(muteAllAudioButton)
            make.height.equalTo(50)
            make.trailing.equalToSuperview().offset(-30)
        }

        okButton.snp.makeConstraints { make in
            make.bottom.equalTo(view).offset(-40 - kDeviceSafeBottomHeight)
            make.height.equalTo(50)
            make.width.equalTo(200)
            make.centerX.equalToSuperview()
        }
    }

    func bindInteraction() {
        NotificationCenter.default.addObserver(self,
                                               selector: #selector(exitButtonClick),
                                               name: NSNotification.Name("kExitRoomController"),
                                               object: nil)

        NotificationCenter.default.addObserver(self,
                                               selector: #selector(userListRefresh),
                                               name: NSNotification.Name("kUserListRefresh"),
                                               object: nil)

        backButton.addTarget(self, action: #selector(backButtonClick), for: .touchUpInside)
        muteAllVideoButton.addTarget(self, action: #selector(muteAllVideoButtonClick), for: .touchUpInside)
        muteAllAudioButton.addTarget(self, action: #selector(muteAllAudioButtonClick), for: .touchUpInside)
        okButton.addTarget(self, action: #selector(backButtonClick), for: .touchUpInside)
    }

    @objc func backButtonClick() {
        navigationController?.popViewController(animated: true)
    }

    @objc func muteAllAudioButtonClick() {
        guard let roomEngineInfo = roomEngineInfo else {
            return
        }
        let mute = !muteAllAudioButton.isSelected
        muteAllAudioButton.isSelected = mute
        roomEngineInfo.enableAudio = !mute
        roomPresenter.updateRoomInfo(roomInfo: roomEngineInfo) { [weak self] in
            guard let self = self else { return }
            self.view.makeToast(mute ? .allMuteListText : .allUnmuteText)
            self.roomPresenter.getRoomInfo { roomInfo in
                roomInfo?.enableAudio = !mute
                self.userListRefresh()
            } onError: { _, _ in
            }
        } onError: { _, message in
            self.muteAllAudioButton.isSelected = !mute
            self.view.makeToast(message)
        }
    }

    @objc func muteAllVideoButtonClick() {
        guard let roomEngineInfo = roomEngineInfo else {
            return
        }
        let mute = !muteAllVideoButton.isSelected
        muteAllVideoButton.isSelected = mute
        roomEngineInfo.enableVideo = !mute
        roomPresenter.updateRoomInfo(roomInfo: roomEngineInfo) { [weak self] in
            guard let self = self else { return }
            self.view.makeToast(mute ? .allStopPictureText : .allOpenPictureText)
            self.roomPresenter.getRoomInfo { roomInfo in
                roomInfo?.enableVideo = !mute
                self.userListRefresh()
            } onError: { _, _ in
            }
        } onError: { _, message in
            self.muteAllVideoButton.isSelected = !mute
            self.view.makeToast(message)
        }
    }

    @objc func exitButtonClick() {
        attendeeList = []
        attendeeMap = [:]
        roomId = ""
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
        debugPrint("deinit \(self)")
    }
}

private extension String {
    static let userListText = tuiRoomKitLocalize("TUIRoom.logout.member.list")
    static let allStopPictureText = tuiRoomKitLocalize("TUIRoom.all.stop.picture")
    static let allOpenPictureText = tuiRoomKitLocalize("TUIRoom.all.open.picture")
    static let allMuteListText = tuiRoomKitLocalize("TUIRoom.all.mute")
    static let allUnmuteText = tuiRoomKitLocalize("TUIRoom.all.unmute")
    static let okText = tuiRoomKitLocalize("TUIRoom.ok")
}
