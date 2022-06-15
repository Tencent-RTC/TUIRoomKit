//
//  TUIRoomViewController.swift
//  TUIRoom
//
//  Created by WesleyLei on 2021/12/16.
//  Copyright © 2021 Tencent. All rights reserved.
//
import SnapKit
import TUICore
import TXAppBasic
import UIKit

protocol TUIRoomMemberVCDelegate: AnyObject {
    
    func onKickOffUser(userInfo: TUIRoomUserInfo)

    func getAttendeeList() -> [TUIRoomAttendeeModel]
}

public typealias TUIRoomKickOffBlock = (_ userInfo: TUIRoomUserInfo, _ callBack: @escaping TUIRoomActionCallback) -> Void
public typealias TUIRoomMuteBlock = (_ userInfo: TUIRoomUserInfo, _ mute: Bool, _ callBack: @escaping TUIRoomActionCallback) -> Void

class TUIRoomMemberListViewController: UIViewController {
    weak var delegate: TUIRoomMemberVCDelegate?
    
    var attendeeList: [TUIRoomAttendeeModel] = []
    
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
        button.setImage(UIImage(named: "tuiroom_back", in: tuiRoomBundle(), compatibleWith: nil), for: .normal)
        return button
    }()
    // ok
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
        let collection = UICollectionView(frame: CGRect(x: 0, y: 0, width: view.mm_w, height: view.mm_h), collectionViewLayout: layout)
        collection.register(TUIRoomMemberCell.classForCoder(), forCellWithReuseIdentifier: "TUIRoomMemberCell")
        if #available(iOS 10.0, *) {
            collection.isPrefetchingEnabled = true
        } else {
            // Fallback on earlier versions
        }
        collection.showsVerticalScrollIndicator = false
        collection.showsHorizontalScrollIndicator = false
        collection.dataSource = self
        collection.delegate = self
        collection.contentInset = UIEdgeInsets(top: 0, left: 0, bottom: 90 + kDeviceSafeBottomHeight, right: 0)
        collection.clipsToBounds = true
        collection.backgroundColor = .white
        collection.layer.cornerRadius = 20
        return collection

    }()

    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        activateConstraints()
        bindInteraction()
        updateView()
        memberListRefresh()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        navigationController?.setNavigationBarHidden(false, animated: true)
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
    }

    func updateView() {
        guard let roomInfo = TUIRoomCore.shareInstance().getRoomInfo() else {
            return
        }
        muteAllAudioButton.isHidden = !roomInfo.isHomeowner()
        muteAllVideoButton.isHidden = !roomInfo.isHomeowner()
        muteAllAudioButton.isSelected = roomInfo.isAllMicMuted
        muteAllVideoButton.isSelected = roomInfo.isAllCameraMuted
        okButton.isHidden = roomInfo.isHomeowner()
    }

    func setupUI() {
        title = .memberListText
        navigationItem.leftBarButtonItem = UIBarButtonItem(customView: backButton)
        navigationItem.leftBarButtonItem?.tintColor = .black
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
        backButton.addTarget(self, action: #selector(backButtonClick), for: .touchUpInside)
        muteAllVideoButton.addTarget(self, action: #selector(muteAllVideoButtonClick), for: .touchUpInside)
        muteAllAudioButton.addTarget(self, action: #selector(muteAllAudioButtonClick), for: .touchUpInside)
        okButton.addTarget(self, action: #selector(backButtonClick), for: .touchUpInside)
        
        NotificationCenter.default.addObserver(self,
                                               selector: #selector(memberStateRefresh),
                                               name: NSNotification.Name("kMemberStateRefresh"),
                                               object: nil)
        
        NotificationCenter.default.addObserver(self,
                                               selector: #selector(memberListRefresh),
                                               name: NSNotification.Name("kMemberListRefresh"),
                                               object: nil)
        
        NotificationCenter.default.addObserver(self,
                                               selector: #selector(resetView),
                                               name: NSNotification.Name("kResetView"),
                                               object: nil)
    }

    @objc func backButtonClick() {
        navigationController?.popViewController(animated: true)
    }

    @objc func muteAllAudioButtonClick() {
        let mute = !muteAllAudioButton.isSelected
        muteAllAudioButton.isSelected = mute
        TUIRoomCore.shareInstance().muteAllUsersMicrophone(mute) { [weak self] code, message in
            guard let self = self else { return }
            if code == 0 {
                self.view.makeToast(mute ? .allMuteListText : .allUnmuteText)
                guard let roomInfo = TUIRoomCore.shareInstance().getRoomInfo() else {
                    return
                }
                roomInfo.isAllMicMuted = mute
                self.memberStateRefresh()
            } else {
                self.muteAllAudioButton.isSelected = !mute
                self.view.makeToast(message)
            }
        }
    }

    @objc func muteAllVideoButtonClick() {
        let mute = !muteAllVideoButton.isSelected
        muteAllVideoButton.isSelected = mute
        TUIRoomCore.shareInstance().muteAllUsersCamera(mute) { [weak self] code, message in
            guard let self = self else { return }
            if code == 0 {
                self.view.makeToast(mute ? .allStopPictureText : .allOpenPictureText)
                guard let roomInfo = TUIRoomCore.shareInstance().getRoomInfo() else {
                    return
                }
                roomInfo.isAllCameraMuted = mute
                self.memberStateRefresh()
            } else {
                self.muteAllVideoButton.isSelected = !mute
                self.view.makeToast(message)
            }
        }
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
        debugPrint("deinit \(self)")
    }
}

private extension String {
    static let memberListText = tuiRoomLocalize("TUIRoom.logout.member.list")
    static let allStopPictureText = tuiRoomLocalize("TUIRoom.all.stop.picture")
    static let allOpenPictureText = tuiRoomLocalize("TUIRoom.all.open.picture")
    static let allMuteListText = tuiRoomLocalize("TUIRoom.all.mute")
    static let allUnmuteText = tuiRoomLocalize("TUIRoom.all.unmute")
    static let okText = tuiRoomLocalize("TUIRoom.ok")
}
