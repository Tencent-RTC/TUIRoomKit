//
//  UserListViewController+CollectionView.swift
//  TRTCScenesDemo
//
//  Created by lijie on 2020/5/7.
//  Copyright © 2022 Tencent. All rights reserved.
//

import Foundation
import ImSDK_Plus
import Kingfisher
import TUIRoomEngine
import UIKit

class TUIRoomAttendeeModel {
    var userInfo = TUIUserInfo()
    var networkQuality: Int = 0
    var audioVolume: Int = 0
    var volumeState: Bool = false
    func userId() -> String {
        return userInfo.userId
    }
}

class UserCell: UICollectionViewCell {
    var kickOffBlock: TUIRoomKickOffBlock?
    var muteAudioBlock: TUIRoomMuteBlock?
    var muteVideoBlock: TUIRoomMuteBlock?
    var roomId: String?
    var roomPresenter: RoomPresenter?
    var currentUserInfo: TUIUserInfo? {
        return roomPresenter?.currentUser.userInfo
    }

    var roomEngineInfo: TUIRoomInfo? {
        return roomPresenter?.roomInfo
    }

    lazy var attendeeModel = TUIUserInfo() {
        didSet {
            updateView(attendeeModel)
        }
    }

    lazy var avatarImageView: UIImageView = {
        let img = UIImageView()
        img.layer.cornerRadius = 20
        img.layer.masksToBounds = true
        return img
    }()

    lazy var userLabel: UILabel = {
        let label = UILabel()
        label.textColor = .black
        label.backgroundColor = UIColor.clear
        label.textAlignment = .left
        label.font = UIFont.systemFont(ofSize: 16)
        label.numberOfLines = 1
        return label
    }()

    lazy var muteAudioButton: UIButton = {
        let button = UIButton()
        button.addTarget(self, action: #selector(muteAudioBtnClick), for: .touchUpInside)
        button.setImage(UIImage(named: "tuiroom_mic_on", in: tuiRoomKitBundle(), compatibleWith: nil), for: .normal)
        button.setImage(UIImage(named: "tuiroom_mic_off", in: tuiRoomKitBundle(), compatibleWith: nil), for: .selected)
        return button
    }()

    lazy var muteVideoButton: UIButton = {
        let button = UIButton(type: .custom)
        button.addTarget(self, action: #selector(muteVideoBtnClick), for: .touchUpInside)
        button.setImage(UIImage(named: "tuiroom_camera_on", in: tuiRoomKitBundle(), compatibleWith: nil), for: .normal)
        button.setImage(UIImage(named: "tuiroom_camera_off", in: tuiRoomKitBundle(), compatibleWith: nil), for: .selected)
        return button
    }()

    lazy var kickOffButton: UIButton = {
        let button = UIButton(type: .custom)
        button.setImage(UIImage(named: "tuiroom_kick_off", in: tuiRoomKitBundle(), compatibleWith: nil), for: .normal)
        button.sizeToFit()
        button.addTarget(self, action: #selector(kickOffButtonClick), for: .touchUpInside)
        return button
    }()

    override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = .clear
        setupUI()
        activateConstraints()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    func updateView(_ model: TUIUserInfo) {
        let placeholder = UIImage(named: "tuiroom_default_user", in: tuiRoomKitBundle(), compatibleWith: nil)
        if let url = URL(string: model.avatarUrl) {
            avatarImageView.kf.setImage(with: .network(url), placeholder: placeholder)
        } else {
            avatarImageView.image = placeholder
        }
        userLabel.text = model.userName

        if roomEngineInfo?.owner == currentUserInfo?.userId {
            kickOffButton.snp.remakeConstraints { make in
                make.width.height.equalTo(36)
                make.right.equalToSuperview().offset(-12)
                make.centerY.equalTo(self.avatarImageView)
            }
            muteVideoButton.snp.remakeConstraints { make in
                make.width.height.equalTo(36)
                make.right.equalTo(self.kickOffButton.snp.left).offset(-12)
                make.centerY.equalTo(self.avatarImageView)
            }

            muteAudioButton.snp.remakeConstraints { make in
                make.width.height.equalTo(36)
                make.right.equalTo(self.muteVideoButton.snp.left).offset(-12)
                make.centerY.equalTo(self.avatarImageView)
            }
        } else {
            muteVideoButton.snp.remakeConstraints { make in
                make.width.height.equalTo(36)
                make.right.equalToSuperview().offset(-12)
                make.centerY.equalTo(self.avatarImageView)
            }

            muteAudioButton.snp.remakeConstraints { make in
                make.width.height.equalTo(36)
                make.right.equalTo(self.muteVideoButton.snp.left).offset(-12)
                make.centerY.equalTo(self.avatarImageView)
            }
        }
        guard let roomEngineInfo = roomEngineInfo else { return }
        muteAudioButton.isSelected = !model.hasAudioStream
        muteVideoButton.isSelected = !model.hasVideoStream
        if model.userId == currentUserInfo?.userId {
            muteAudioButton.isHidden = true
            muteVideoButton.isHidden = true
            kickOffButton.isHidden = true
        } else {
            roomPresenter?.getRoomInfo { [weak self] roomInfo in
                guard let self = self else { return }
                self.muteAudioButton.isHidden = false
                self.muteVideoButton.isHidden = false
                if roomInfo?.owner == self.currentUserInfo?.userId {
                    self.muteAudioButton.alpha = 1
                    self.muteVideoButton.alpha = 1
                    self.muteAudioButton.isUserInteractionEnabled = true
                    self.muteVideoButton.isUserInteractionEnabled = true
                } else {
                    self.muteAudioButton.alpha = 0.6
                    self.muteVideoButton.alpha = 0.6
                    self.muteAudioButton.isUserInteractionEnabled = false
                    self.muteVideoButton.isUserInteractionEnabled = false
                }
                if roomInfo?.owner == self.currentUserInfo?.userId {
                    self.kickOffButton.isHidden = false
                } else {
                    self.kickOffButton.isHidden = true
                }
            } onError: { _, _ in
            }
        }
    }

    func setupUI() {
        addSubview(avatarImageView)

        addSubview(userLabel)

        addSubview(muteAudioButton)

        addSubview(muteVideoButton)

        addSubview(kickOffButton)
    }

    func activateConstraints() {
        avatarImageView.snp.remakeConstraints { make in
            make.width.height.equalTo(48)
            make.leading.equalTo(20)
            make.top.equalToSuperview().offset(20)
        }

        userLabel.snp.remakeConstraints { make in
            make.width.equalTo(150)
            make.height.equalToSuperview()
            make.left.equalTo(avatarImageView.snp.right).offset(12)
            make.centerY.equalTo(avatarImageView)
        }
        if roomEngineInfo?.owner == currentUserInfo?.userId {
            kickOffButton.snp.remakeConstraints { make in
                make.width.height.equalTo(36)
                make.right.equalToSuperview().offset(-12)
                make.centerY.equalTo(self.avatarImageView)
            }
            muteVideoButton.snp.remakeConstraints { make in
                make.width.height.equalTo(36)
                make.right.equalTo(self.kickOffButton.snp.left).offset(-12)
                make.centerY.equalTo(self.avatarImageView)
            }

            muteAudioButton.snp.remakeConstraints { make in
                make.width.height.equalTo(36)
                make.right.equalTo(self.muteVideoButton.snp.left).offset(-12)
                make.centerY.equalTo(self.avatarImageView)
            }
        } else {
            muteVideoButton.snp.remakeConstraints { make in
                make.width.height.equalTo(36)
                make.right.equalToSuperview().offset(-12)
                make.centerY.equalTo(self.avatarImageView)
            }

            muteAudioButton.snp.remakeConstraints { make in
                make.width.height.equalTo(36)
                make.right.equalTo(self.muteVideoButton.snp.left).offset(-12)
                make.centerY.equalTo(self.avatarImageView)
            }
        }
    }
}

extension UserListViewController: UICollectionViewDelegate,
    UICollectionViewDataSource,
    UICollectionViewDelegateFlowLayout {
    func reloadData(animate: Bool = false) {
        if animate {
            memberCollectionView.performBatchUpdates({ [weak self] in
                guard let self = self else { return }
                DispatchQueue.main.async {
                    self.memberCollectionView.reloadData()
                }
            }) { _ in
            }
        } else {
            UIView.performWithoutAnimation { [weak self] in
                guard let self = self else { return }
                DispatchQueue.main.async {
                    self.memberCollectionView.reloadData()
                }
            }
        }
    }

    // MARK: - UICollectionViewDataSource

    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        return attendeeList.count
    }

    func collectionView(_ collectionView: UICollectionView,
                        cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        let cell = collectionView.dequeueReusableCell(
            withReuseIdentifier: "UserCell",
            for: indexPath) as! UserCell
        cell.roomId = roomId
        cell.roomPresenter = roomPresenter
        if indexPath.row < attendeeList.count {
            let attendeeModel = attendeeList[indexPath.row]
            cell.attendeeModel = attendeeModel
            cell.roomPresenter = roomPresenter
            cell.kickOffBlock = kickOffBlock
            cell.muteVideoBlock = muteVideoBlock
            cell.muteAudioBlock = muteAudioBlock
        } else {
            cell.attendeeModel = TUIUserInfo()
        }
        return cell
    }

    // MARK: - UICollectionViewDelegateFlowLayout

    func collectionView(_ collectionView: UICollectionView,
                        layout collectionViewLayout: UICollectionViewLayout,
                        sizeForItemAt indexPath: IndexPath) -> CGSize {
        let width = collectionView.frame.size.width
        let height = CGFloat(68)
        return CGSize(width: width, height: height)
    }

    func collectionView(_ collectionView: UICollectionView,
                        layout collectionViewLayout: UICollectionViewLayout,
                        minimumLineSpacingForSectionAt section: Int) -> CGFloat {
        return 0
    }
}
