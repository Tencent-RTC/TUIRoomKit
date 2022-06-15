//
//  TUIRoomMemberListViewController+CollectionView.swift
//  TRTCScenesDemo
//
//  Created by lijie on 2020/5/7.
//  Copyright © 2022 Tencent. All rights reserved.
//

import Foundation
import ImSDK_Plus
import Kingfisher
import UIKit

class TUIRoomMemberCell: UICollectionViewCell {
    var kickOffBlock: TUIRoomKickOffBlock?
    var muteAudioBlock: TUIRoomMuteBlock?
    var muteVideoBlock: TUIRoomMuteBlock?
    var roomInfo: TUIRoomInfo? = {
        TUIRoomCore.shareInstance().getRoomInfo()
    }()

    var attendeeModel = TUIRoomAttendeeModel() {
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
        button.setImage(UIImage(named: "tuiroom_mic_on", in: tuiRoomBundle(), compatibleWith: nil), for: .normal)
        button.setImage(UIImage(named: "tuiroom_mic_off", in: tuiRoomBundle(), compatibleWith: nil), for: .selected)
        return button
    }()

    lazy var muteVideoButton: UIButton = {
        let button = UIButton(type: .custom)
        button.addTarget(self, action: #selector(muteVideoBtnClick), for: .touchUpInside)
        button.setImage(UIImage(named: "tuiroom_camera_on", in: tuiRoomBundle(), compatibleWith: nil), for: .normal)
        button.setImage(UIImage(named: "tuiroom_camera_off", in: tuiRoomBundle(), compatibleWith: nil), for: .selected)
        return button
    }()

    lazy var kickOffButton: UIButton = {
        let button = UIButton(type: .custom)
        button.setImage(UIImage(named: "tuiroom_kick_off", in: tuiRoomBundle(), compatibleWith: nil), for: .normal)
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

    func updateView(_ model: TUIRoomAttendeeModel) {
        guard let roomInfo = TUIRoomCore.shareInstance().getRoomInfo() else {
            return
        }
        let placeholder = UIImage(named: "tuiroom_default_user", in: tuiRoomBundle(), compatibleWith: nil)
        if let url = URL(string: model.userInfo.userAvatar) {
            avatarImageView.kf.setImage(with: .network(url), placeholder: placeholder)
        } else {
            avatarImageView.image = placeholder
        }
        userLabel.text = model.userInfo.userName

        muteAudioButton.isSelected = !model.userInfo.isAudioOpen()
        muteVideoButton.isSelected = !model.userInfo.isVideoOpen()
        if model.userInfo.userId == curUserID {
            muteAudioButton.isHidden = true
            muteVideoButton.isHidden = true
            kickOffButton.isHidden = true
        } else {
            muteAudioButton.isHidden = false
            muteVideoButton.isHidden = false
            if roomInfo.isHomeowner() {
                muteAudioButton.alpha = 1
                muteVideoButton.alpha = 1
                muteAudioButton.isUserInteractionEnabled = true
                muteVideoButton.isUserInteractionEnabled = true
            } else {
                muteAudioButton.alpha = 0.6
                muteVideoButton.alpha = 0.6
                muteAudioButton.isUserInteractionEnabled = false
                muteVideoButton.isUserInteractionEnabled = false
            }
            if roomInfo.isHomeowner() {
                kickOffButton.isHidden = false
            } else {
                kickOffButton.isHidden = true
            }
        }
    }

    var curUserID: String {
        return TUIRoomUserManage.currentUserId()
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
        guard let roomInfo = TUIRoomCore.shareInstance().getRoomInfo() else {
            return
        }
        if roomInfo.isHomeowner() {
            kickOffButton.snp.remakeConstraints { make in
                make.width.height.equalTo(36)
                make.right.equalToSuperview().offset(-12)
                make.centerY.equalTo(avatarImageView)
            }
            muteVideoButton.snp.remakeConstraints { make in
                make.width.height.equalTo(36)
                make.right.equalTo(kickOffButton.snp.left).offset(-12)
                make.centerY.equalTo(avatarImageView)
            }

            muteAudioButton.snp.remakeConstraints { make in
                make.width.height.equalTo(36)
                make.right.equalTo(muteVideoButton.snp.left).offset(-12)
                make.centerY.equalTo(avatarImageView)
            }
        } else {
            muteVideoButton.snp.remakeConstraints { make in
                make.width.height.equalTo(36)
                make.right.equalToSuperview().offset(-12)
                make.centerY.equalTo(avatarImageView)
            }

            muteAudioButton.snp.remakeConstraints { make in
                make.width.height.equalTo(36)
                make.right.equalTo(muteVideoButton.snp.left).offset(-12)
                make.centerY.equalTo(avatarImageView)
            }
        }
    }
}

extension TUIRoomMemberListViewController: UICollectionViewDelegate,
                                           UICollectionViewDataSource,
                                           UICollectionViewDelegateFlowLayout {
    func reloadData(animate: Bool = false) {
        if animate {
            memberCollectionView.performBatchUpdates({ [weak self] in
                guard let self = self else { return }
                self.memberCollectionView.reloadSections(IndexSet(integer: 0))
            }) { _ in
            }
        } else {
            UIView.performWithoutAnimation { [weak self] in
                guard let self = self else { return }
                self.memberCollectionView.reloadSections(IndexSet(integer: 0))
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
            withReuseIdentifier: "TUIRoomMemberCell",
            for: indexPath) as! TUIRoomMemberCell
        if indexPath.row < attendeeList.count {
            let attendeeModel = attendeeList[indexPath.row]
            cell.attendeeModel = attendeeModel
            cell.kickOffBlock = kickOffBlock
            cell.muteVideoBlock = muteVideoBlock
            cell.muteAudioBlock = muteAudioBlock
        } else {
            cell.attendeeModel = TUIRoomAttendeeModel()
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
