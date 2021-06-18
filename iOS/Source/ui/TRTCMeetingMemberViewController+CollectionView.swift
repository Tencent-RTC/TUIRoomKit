//
//  TRTCMeetingMemberViewController+CollectionView.swift
//  TRTCScenesDemo
//
//  Created by lijie on 2020/5/7.
//  Copyright © 2020 xcoderliu. All rights reserved.
//

import Foundation
import Kingfisher
import ImSDK_Plus

class MeetingMemberCell: UICollectionViewCell {
    weak var delegate: TRTCMeetingMemberVCDelegate?
    
    var attendeeModel = MeetingAttendeeModel() {
        didSet {
            configModel(model: attendeeModel)
        }
    }
    
    lazy var avatarImageView: UIImageView = {
        let img = UIImageView()
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
    
    @objc func muteAudioBtnClick() {
        self.attendeeModel.isMuteAudio = !self.attendeeModel.isMuteAudio
        self.muteAudioButton.isSelected = self.attendeeModel.isMuteAudio
        self.delegate?.onMuteAudio(userId: self.attendeeModel.userId, mute: self.attendeeModel.isMuteAudio)
    }
    
    lazy var muteAudioButton: UIButton = {
        let button = UIButton()
        button.addTarget(self, action: #selector(muteAudioBtnClick), for: .touchUpInside)
        button.setImage(UIImage.init(named: "meeting_mic_on", in: MeetingBundle(), compatibleWith: nil), for: .normal)
        button.setImage(UIImage.init(named: "meeting_mic_off", in: MeetingBundle(), compatibleWith: nil), for: .selected)
        return button
    }()
    
    @objc func muteVideoBtnClick() {
        self.attendeeModel.isMuteVideo = !self.attendeeModel.isMuteVideo
        self.muteVideoButton.isSelected = self.attendeeModel.isMuteVideo
        self.delegate?.onMuteVideo(userId: self.attendeeModel.userId, mute: self.attendeeModel.isMuteVideo)
    }
    
    lazy var muteVideoButton: UIButton = {
        let button = UIButton(type: .custom)
        button.addTarget(self, action: #selector(muteVideoBtnClick), for: .touchUpInside)
        button.setImage(UIImage.init(named: "meeting_camera_on", in: MeetingBundle(), compatibleWith: nil), for: .normal)
        button.setImage(UIImage.init(named: "meeting_camera_off", in: MeetingBundle(), compatibleWith: nil), for: .selected)
        return button
    }()
    
    func configModel(model: MeetingAttendeeModel) {
        backgroundColor = .clear
        if model.userId.count == 0 {
            return
        }
        
        // 头像图标
        self.addSubview(avatarImageView)
        let placeholder = UIImage.init(named: "default_user", in: MeetingBundle(), compatibleWith: nil)
        if let url = URL(string: model.avatarURL) {
            avatarImageView.kf.setImage(with: .network(url), placeholder: placeholder)
        } else {
            avatarImageView.image = placeholder
        }
        avatarImageView.snp.remakeConstraints { (make) in
            make.width.height.equalTo(40)
            make.leading.equalTo(20)
            make.centerY.equalTo(self)
        }
        avatarImageView.layer.cornerRadius = 20
        avatarImageView.layer.masksToBounds = true
        
        // 用户ID_label
        self.addSubview(userLabel)
        userLabel.text = model.userName
        userLabel.snp.remakeConstraints { (make) in
            make.width.equalTo(100)
            make.height.equalTo(40)
            make.leading.equalTo(avatarImageView.snp.trailing).offset(10)
            make.centerY.equalTo(self)
        }
        
        // 静音按钮
        self.addSubview(muteAudioButton)
        muteAudioButton.snp.remakeConstraints { (make) in
            make.width.height.equalTo(40)
            make.leading.equalTo(self.snp.trailing).offset(-100)
            make.centerY.equalTo(self)
        }
        
        // 禁画按钮
        self.addSubview(muteVideoButton)
        muteVideoButton.snp.remakeConstraints { (make) in
            make.width.height.equalTo(40)
            make.leading.equalTo(self.snp.trailing).offset(-50)
            make.centerY.equalTo(self)
        }
        
        muteAudioButton.isSelected = model.isMuteAudio
        muteVideoButton.isSelected = model.isMuteVideo
        
        // 如果当前cell是自己，那就隐藏静音和静画的按钮
        muteAudioButton.isHidden = (model.userId == curUserID ? true : false)
        muteVideoButton.isHidden = (model.userId == curUserID ? true : false)
    }
    
    var curUserID: String {
        get {
            return V2TIMManager.sharedInstance()?.getLoginUser() ?? ""
        }
    }
}

extension TRTCMeetingMemberViewController: UICollectionViewDelegate, UICollectionViewDataSource, UICollectionViewDelegateFlowLayout {
    func reloadData(animate: Bool = false) {
        if animate {
            memberCollectionView.performBatchUpdates({ [weak self] in
                guard let self = self else {return}
                self.memberCollectionView.reloadSections(IndexSet(integer: 0))
            }) { _ in
                
            }
        } else {
            UIView.performWithoutAnimation { [weak self] in
                guard let self = self else {return}
                self.memberCollectionView.reloadSections(IndexSet(integer: 0))
            }
        }
    }
        
    // MARK: - UICollectionViewDataSource
    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        return attendeeList.count
    }
    
    func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        let cell = collectionView.dequeueReusableCell(withReuseIdentifier: "MeetingMemberCell", for: indexPath) as! MeetingMemberCell
        if (indexPath.row < attendeeList.count) {
            let attendeeModel = attendeeList[indexPath.row]
            cell.attendeeModel = attendeeModel
            cell.delegate = self.delegate
        } else {
            cell.attendeeModel = MeetingAttendeeModel()
        }
        return cell
    }
    
    // MARK: - UICollectionViewDelegateFlowLayout
    func collectionView(_ collectionView: UICollectionView, layout collectionViewLayout: UICollectionViewLayout, sizeForItemAt indexPath: IndexPath) -> CGSize {
        let width = collectionView.frame.size.width
        let height = CGFloat(70)
        return CGSize(width: width, height: height)
    }
    
    func collectionView(_ collectionView: UICollectionView, layout collectionViewLayout: UICollectionViewLayout, minimumLineSpacingForSectionAt section: Int) -> CGFloat {
        return 0
    }
}
