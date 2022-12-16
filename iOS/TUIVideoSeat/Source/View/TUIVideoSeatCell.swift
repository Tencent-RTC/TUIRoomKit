//
//  TUIVideoSeatCell.swift
//  TUIVideoSeat
//
//  Created by WesleyLei on 2021/12/16.
//  Copyright © 2021 Tencent. All rights reserved.
//

import Kingfisher
import SnapKit
import TUIRoomEngine
import UIKit

protocol TUIRoomCellDelegate: AnyObject {
    func getRenderView(model: TUIVideoSeatAttendeeModel, type: TUIVideoStreamType) -> TUIRoomAttendeeRenderView?
}

protocol TUIRoomAttendeeRenderViewDelegate: AnyObject {
    func suspensionSwitchBigClick()
}

class TUIVideoSeatCell: UICollectionViewCell, TUIRoomAttendeeRenderViewDelegate {
    func suspensionSwitchBigClick() {
        if attendeeModels.count == 2 {
            exchangeValue(&attendeeModels, 0, 1)
            updateByModels(modes: attendeeModels, styleType: styleType)
        }
    }

    private func exchangeValue<T>(_ nums: inout [T], _ a: Int, _ b: Int) {
        (nums[a], nums[b]) = (nums[b], nums[a])
    }

    weak var delegate: TUIRoomCellDelegate?
    var isFirstPage: Bool = true
    private var styleType: TUIVideoSeatCellType = .one
    private var attendeeModels: [TUIVideoSeatAttendeeModel] = []

    func updateByModels(modes: [TUIVideoSeatAttendeeModel], styleType: TUIVideoSeatCellType) {
        self.styleType = styleType
        attendeeModels = modes
        resetView()
    }

    func resetView() {
        for view in subviews {
            view.removeFromSuperview()
        }
        var top = 127 + 44 + kDeviceSafeTopHeight
        var height = (mm_h - top - (156 + kDeviceSafeBottomHeight)) / 2
        if UIScreen.main.bounds.width > UIScreen.main.bounds.height {
            height = (mm_h - kDeviceSafeTopHeight - kDeviceSafeBottomHeight)/2
            top = kDeviceSafeTopHeight
        }
        switch styleType {
        case .one:
            configOneModel(model: attendeeModels[0], rect: bounds, viewStyle: .big)
            return
        case .two:
            configOneModel(model: attendeeModels[0], rect: bounds, viewStyle: .big)
            if attendeeModels[1].userInfo.hasVideoStream {
                configOneModel(model: attendeeModels[1],
                               rect: CGRect(x: mm_w - 96,
                                            y: 68 + 44 + kDeviceSafeTopHeight,
                                            width: 96,
                                            height: 170),
                               viewStyle: .suspension)
            } else {
                configOneModel(model: attendeeModels[1],
                               rect: CGRect(x: mm_w - 96,
                                            y: 68 + 44 + kDeviceSafeTopHeight,
                                            width: 96,
                                            height: 110),
                               viewStyle: .suspension)
            }
            return
        case .three:
            height = (mm_h - (56 + 44 + kDeviceSafeTopHeight) - (93 + kDeviceSafeBottomHeight)) / 2
            top = 56 + 44 + kDeviceSafeTopHeight
            if UIScreen.main.bounds.width > UIScreen.main.bounds.height {
                height = (mm_h - kDeviceSafeTopHeight - kDeviceSafeBottomHeight)/2
                top = kDeviceSafeTopHeight
            }
            configOneModel(model: attendeeModels[0],
                           rect: CGRect(x: 0,
                                        y: top,
                                        width: mm_w / 2,
                                        height: height),
                           viewStyle: .small)
            configOneModel(model: attendeeModels[1],
                           rect: CGRect(x: mm_w / 2,
                                        y: top,
                                        width: mm_w / 2,
                                        height: height),
                           viewStyle: .small)
            configOneModel(model: attendeeModels[2],
                           rect: CGRect(x: mm_w / 4,
                                        y: top + height,
                                        width: mm_w / 2,
                                        height: height),
                           viewStyle: .small)
            return
        case .four:
            configOneModel(model: attendeeModels[0],
                           rect: CGRect(x: 0,
                                        y: top,
                                        width: mm_w / 3,
                                        height: height),
                           viewStyle: .small)
            configOneModel(model: attendeeModels[1],
                           rect: CGRect(x: mm_w / 3,
                                        y: top,
                                        width: mm_w / 3,
                                        height: height),
                           viewStyle: .small)
            configOneModel(model: attendeeModels[2],
                           rect: CGRect(x: 2 * mm_w / 3,
                                        y: top,
                                        width: mm_w / 3,
                                        height: height),
                           viewStyle: .small)
            configOneModel(model: attendeeModels[3],
                           rect: CGRect(x: mm_w / 3,
                                        y: top + height,
                                        width: mm_w / 3,
                                        height: height),
                           viewStyle: .small)
            return
        case .five:
            configOneModel(model: attendeeModels[0],
                           rect: CGRect(x: 0,
                                        y: top,
                                        width: mm_w / 3,
                                        height: height),
                           viewStyle: .small)
            configOneModel(model: attendeeModels[1],
                           rect: CGRect(x: mm_w / 3,
                                        y: top,
                                        width: mm_w / 3,
                                        height: height),
                           viewStyle: .small)
            configOneModel(model: attendeeModels[2],
                           rect: CGRect(x: 2 * mm_w / 3,
                                        y: top,
                                        width: mm_w / 3,
                                        height: height),
                           viewStyle: .small)
            configOneModel(model: attendeeModels[3],
                           rect: CGRect(x: mm_w / 6,
                                        y: top + height,
                                        width: mm_w / 3,
                                        height: height),
                           viewStyle: .small)
            configOneModel(model: attendeeModels[4],
                           rect: CGRect(x: mm_w / 2,
                                        y: top + height,
                                        width: mm_w / 3,
                                        height: height),
                           viewStyle: .small)
            return
        case .six:
            configOneModel(model: attendeeModels[0],
                           rect: CGRect(x: 0,
                                        y: top,
                                        width: mm_w / 3,
                                        height: height),
                           viewStyle: .small)
            configOneModel(model: attendeeModels[1],
                           rect: CGRect(x: mm_w / 3,
                                        y: top,
                                        width: mm_w / 3,
                                        height: height),
                           viewStyle: .small)
            configOneModel(model: attendeeModels[2],
                           rect: CGRect(x: 2 * mm_w / 3,
                                        y: top,
                                        width: mm_w / 3,
                                        height: height),
                           viewStyle: .small)

            configOneModel(model: attendeeModels[3],
                           rect: CGRect(x: 0,
                                        y: top + height,
                                        width: mm_w / 3,
                                        height: height),
                           viewStyle: .small)
            configOneModel(model: attendeeModels[4],
                           rect: CGRect(x: mm_w / 3,
                                        y: top + height,
                                        width: mm_w / 3,
                                        height: height),
                           viewStyle: .small)
            configOneModel(model: attendeeModels[5],
                           rect: CGRect(x: 2 * mm_w / 3,
                                        y: top + height,
                                        width: mm_w / 3,
                                        height: height),
                           viewStyle: .small)
            return
        case .more:
            var left: CGFloat = 0.0
            for (index, value) in attendeeModels.enumerated() {
                left = CGFloat(index % (max_show_cell_count / 2)) * mm_w / 3
                if index / (max_show_cell_count / 2) == 1 {
                    configOneModel(model: value,
                                   rect: CGRect(x: left,
                                                y: top + height,
                                                width: mm_w / 3,
                                                height: height),
                                   viewStyle: .small)
                } else {
                    configOneModel(model: value,
                                   rect: CGRect(x: left,
                                                y: top,
                                                width: mm_w / 3,
                                                height: height),
                                   viewStyle: .small)
                }
            }
            return
        }
    }

    func configOneModel(model: TUIVideoSeatAttendeeModel, rect: CGRect, viewStyle: TUIRoomAttendeeRenderViewType) {
        if model.userInfo.userId.count == 0 {
            return
        }
        guard let renderView = delegate?.getRenderView(model: model, type: .cameraStream) else {
            return
        }
        if renderView.superview != self {
            renderView.removeFromSuperview()
        }
        renderView.frame = rect
        renderView.updateViewByModel(attendeeModel: model, styleType: viewStyle)
        renderView.delegate = self
        addSubview(renderView)
    }
}

class TUIRoomAttendeeRenderView: UIView, UIGestureRecognizerDelegate {
    weak var delegate: TUIRoomAttendeeRenderViewDelegate?
    var attendeeModel = TUIVideoSeatAttendeeModel()
    var styleType: TUIRoomAttendeeRenderViewType = .big
    var roomEngine: TUIRoomEngine?
    let maxRecognizerScale: CGFloat = 4
    let mixRecognizerScale: CGFloat = 0.5
    lazy var avatarImageView: UIImageView = {
        let imageView = UIImageView()
        addSubview(imageView)
        imageView.layer.masksToBounds = true
        return imageView
    }()

    lazy var bgView: UIView = {
        let view = UIView()
        addSubview(view)
        return view
    }()

    lazy var protectiveImageView: UIImageView = {
        let imageView = UIImageView(image: UIImage(named: "tuiroom_protective_bg_icon", in: tuiVideoSeatBundle(), compatibleWith: nil))
        addSubview(imageView)
        return imageView
    }()

    lazy var userLabel: UILabel = {
        let user = UILabel()
        user.textColor = .white
        user.backgroundColor = UIColor.clear
        user.textAlignment = .center
        user.numberOfLines = 1
        bgView.addSubview(user)
        return user
    }()

    lazy var signalImageView: UIImageView = {
        let imageView = UIImageView()
        bgView.addSubview(imageView)
        return imageView
    }()

    lazy var homeownersImageView: UIImageView = {
        let imageView = UIImageView(image: UIImage(named: "tuiroom_homeowners_icon", in: tuiVideoSeatBundle(), compatibleWith: nil))
        bgView.addSubview(imageView)
        return imageView
    }()

    override init(frame: CGRect) {
        super.init(frame: frame)
        protectiveImageView.isHidden = true
        let tap = UITapGestureRecognizer(target: self, action: #selector(tapTheRenderView(tap:)))
        tap.numberOfTapsRequired = 1
        isUserInteractionEnabled = true
        addGestureRecognizer(tap)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    func enableScale(enable: Bool) {
        if enable {
            self.frame = CGRect(x: 0, y: 0, width: ScreenWidth, height: ScreenHeight)
            let pinchGesture = UIPinchGestureRecognizer()
            pinchGesture.addTarget(self, action: #selector(handlePinchGesture(recognizer:)))
            pinchGesture.delegate = self
            pinchGesture.cancelsTouchesInView = false
            addGestureRecognizer(pinchGesture)
            let panRecognizer = UIPanGestureRecognizer(target: self, action: #selector(panClick(recognizer:)))
            addGestureRecognizer(panRecognizer)
            let doubleTapRecognizer = UITapGestureRecognizer(target: self, action: #selector(doubleTap(recognizer:)))
            doubleTapRecognizer.numberOfTapsRequired = 2
            doubleTapRecognizer.delaysTouchesBegan = true
            addGestureRecognizer(doubleTapRecognizer)
        }
    }
    
    @objc func handlePinchGesture(recognizer: UIPinchGestureRecognizer){
        if recognizer.state == UIGestureRecognizer.State.began || recognizer.state == UIGestureRecognizer.State.changed {
            var newRecognizerScale = min(recognizer.scale, maxRecognizerScale)
            newRecognizerScale = max(recognizer.scale, mixRecognizerScale)
            recognizer.view?.transform = .identity.scaledBy(x: newRecognizerScale, y: newRecognizerScale)
        }
    }
    
    @objc func panClick(recognizer: UIPanGestureRecognizer) {
        if recognizer.state == .changed || recognizer.state == .ended {
            let translation: CGPoint = recognizer.translation(in: recognizer.view)
            guard var transform = recognizer.view?.transform else { return }
            transform.tx = translation.x + transform.tx
            transform.ty = translation.y + transform.ty
            recognizer.view?.transform = transform
            recognizer.setTranslation(.zero, in: recognizer.view)
        }
    }
    
    @objc func doubleTap(recognizer: UIGestureRecognizer) {
        recognizer.view?.transform = .identity
    }
    
    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        let superPoint = convert(point, to: superview)
        if frame.contains(superPoint) {
            return self
        }
        return nil
    }
    
    @objc func tapTheRenderView(tap: UITapGestureRecognizer) {
        if styleType == .suspension {
            delegate?.suspensionSwitchBigClick()
        }
    }

    func updateViewByModel(attendeeModel: TUIVideoSeatAttendeeModel, styleType: TUIRoomAttendeeRenderViewType) {
        self.attendeeModel = attendeeModel
        self.styleType = styleType
        updateView()
    }

    func updateView() {
        backgroundColor = UIColor(hex: "2A2A2A")
        avatarImageView.snp.remakeConstraints { make in
            make.width.height.equalTo((self.styleType == .big) ? 100 : 60)
            make.centerX.equalTo(self)
            make.centerY.equalTo(self).offset((self.styleType == .big) ? 0 : -14)
        }

        avatarImageView.layer.cornerRadius = ((styleType == .big) ? 100 : 60) / 2
        let placeholder = UIImage(named: "tuiroom_default_user", in: tuiVideoSeatBundle(), compatibleWith: nil)
        if let url = URL(string: attendeeModel.userInfo.avatarUrl) {
            avatarImageView.kf.setImage(with: .network(url), placeholder: placeholder)
        } else {
            avatarImageView.image = placeholder
        }
        userLabel.text = attendeeModel.userInfo.userName

        var rightDiff: CGFloat = 0.0
        var leftDiff: CGFloat = 0.0
        userLabel.mm_w = mm_w
        if styleType == .suspension {
            if attendeeModel.userInfo.userRole == .roomOwner {
                leftDiff = 8 + 28
            } else {
                leftDiff = 12
            }
            rightDiff = 14 + 8 + 8
            userLabel.mm_h = 28
            userLabel.font = UIFont(name: "PingFangSC-Medium", size: 12)
            signalImageView.frame = CGRect(x: 0, y: 0, width: 14, height: 14)
        } else {
            if attendeeModel.userInfo.userRole == .roomOwner {
                leftDiff = 8 + 30
            } else {
                leftDiff = 8
            }
            rightDiff = 16 + 8 + 8
            userLabel.mm_h = 30
            userLabel.font = UIFont(name: "PingFangSC-Medium", size: 14)
            signalImageView.frame = CGRect(x: 0, y: 0, width: 16, height: 16)
        }
        userLabel.sizeToFit()

        if styleType == .big {
            userLabel.mm_w = min(userLabel.mm_w, mm_w / 2)
        } else {
            userLabel.mm_w = min(userLabel.mm_w, mm_w - leftDiff - rightDiff)
        }

        var width = leftDiff + rightDiff + userLabel.mm_w
        if styleType == .suspension {
            width = mm_w
        }

        if styleType == .big {
            bgView.frame = CGRect(x: 0,
                                  y: mm_h - 92 - kDeviceSafeBottomHeight - 30,
                                  width: width,
                                  height: 30)
            homeownersImageView.frame = CGRect(x: 0, y: 0, width: 30, height: 30)
            userLabel.mm_h = 30
        } else if styleType == .suspension {
            userLabel.mm_h = 28
            homeownersImageView.frame = CGRect(x: 0, y: 0, width: 28, height: 28)
            bgView.frame = CGRect(x: 0, y: mm_h - 28, width: width, height: 28)
        } else {
            userLabel.mm_h = 30
            homeownersImageView.frame = CGRect(x: 0, y: 0, width: 30, height: 30)
            bgView.frame = CGRect(x: 0, y: mm_h - 30 - 12, width: width, height: 30)
        }
        if attendeeModel.userInfo.userRole == .roomOwner {
            homeownersImageView.isHidden = false
            userLabel.mm_x = homeownersImageView.mm_w + 8
            signalImageView.mm_x = userLabel.mm_w + userLabel.mm_x + 8
            signalImageView.mm_centerY = bgView.mm_h / 2
        } else {
            homeownersImageView.isHidden = true
            userLabel.mm_x = CGFloat(leftDiff)
            signalImageView.mm_x = userLabel.mm_w + userLabel.mm_x + 8
            signalImageView.mm_centerY = bgView.mm_h / 2
        }
        avatarImageView.isHidden = attendeeModel.userInfo.hasVideoStream
        refreshProtective()
        refreshSignalView()
        if styleType == .suspension {
            bgView.roundedRect(rect: bgView.bounds,
                               byRoundingCorners: [.bottomRight, .topRight],
                               cornerRadii: CGSize(width: 0, height: 0))
            bgView.backgroundColor = UIColor.black.withAlphaComponent(0.7)
            roundedRect(rect: bounds,
                        byRoundingCorners: [.bottomLeft, .topLeft],
                        cornerRadii: CGSize(width: 8, height: 8))
        } else {
            bgView.roundedRect(rect: bgView.bounds,
                               byRoundingCorners: [.bottomRight, .topRight],
                               cornerRadii: CGSize(width: 6, height: 6))
            bgView.backgroundColor = UIColor.black.withAlphaComponent(0.4)
            roundedRect(rect: bounds,
                        byRoundingCorners: [.bottomLeft, .topLeft],
                        cornerRadii: CGSize(width: 0, height: 0))
        }
        if styleType == .bigShare {
            avatarImageView.isHidden = true
            bgView.isHidden = true
        } else {
            bgView.isHidden = false
        }
        refreshVolumeProgress()
    }

    func getSignalImageView(networkQuality: TUINetworkQuality) -> UIImage? {
        var image: UIImage?
        if networkQuality == .excellent || networkQuality == .good { // 信号好
            image = UIImage(named: "tuiroom_signal3",
                            in: tuiVideoSeatBundle(), compatibleWith: nil)
        } else if networkQuality == .poor { // 信号一般
            image = UIImage(named: "tuiroom_signal2",
                            in: tuiVideoSeatBundle(), compatibleWith: nil)
        } else if networkQuality == .bad || networkQuality == .down { // 信号很差
            image = UIImage(named: "tuiroom_signal1",
                            in: tuiVideoSeatBundle(), compatibleWith: nil)
        } else {
            image = UIImage(named: "tuiroom_signal2",
                            in: tuiVideoSeatBundle(), compatibleWith: nil)
        }
        return image
    }

    func refreshSignalView() {
        signalImageView.image = getSignalImageView(networkQuality: attendeeModel.networkQuality)
        refreshName()
    }

    func refreshVideo(isVideoAvailable: Bool) {
        attendeeModel.userInfo.hasVideoStream = isVideoAvailable
        avatarImageView.isHidden = attendeeModel.userInfo.hasVideoStream
        if styleType == .suspension {
            if attendeeModel.userInfo.hasVideoStream {
                mm_h = 170
            } else {
                mm_h = 110
            }
            bgView.mm_y = mm_h - bgView.mm_h
            roundedRect(rect: bounds, byRoundingCorners: [.bottomLeft, .topLeft], cornerRadii: CGSize(width: 8, height: 8))
        }
        refreshProtective()
    }

    func refreshVolumeProgress() {
        if attendeeModel.volumeState {
            layer.borderColor = UIColor(hex: "006EFF").cgColor
            layer.borderWidth = 2
            delayHide()
        } else {
            if styleType == .small {
                layer.borderColor = UIColor.black.cgColor
                layer.borderWidth = 1
            } else {
                layer.borderWidth = 0
            }
        }
        refreshName()
    }

    func delayHide() {
        NSObject.cancelPreviousPerformRequests(withTarget: self, selector: #selector(resetVolumeView), object: nil)
        perform(#selector(resetVolumeView), with: nil, afterDelay: 2)
    }

    func refreshName() {
        let strCount = userLabel.text?.count ?? 0
        let nameStrCount = attendeeModel.userInfo.userName.count
        // 异步获取用户信息，有可能昵称没有拿到
        if (strCount == 0) && (nameStrCount > 0) {
            let left = userLabel.mm_x
            userLabel.text = attendeeModel.userInfo.userName
            userLabel.sizeToFit()
            userLabel.mm_x = left
            userLabel.mm_h = bgView.mm_h
            if styleType == .big {
                userLabel.mm_w = min(userLabel.mm_w, mm_w / 2)
            } else {
                userLabel.mm_w = min(userLabel.mm_w, mm_w - bgView.mm_w)
            }
            signalImageView.mm_x = userLabel.mm_w + userLabel.mm_x + 8
            bgView.mm_w = signalImageView.mm_w + signalImageView.mm_x + 8
            if styleType == .suspension {
                bgView.roundedRect(rect: bgView.bounds,
                                   byRoundingCorners: [.bottomRight, .topRight],
                                   cornerRadii: CGSize(width: 0, height: 0))
            } else {
                bgView.roundedRect(rect: bgView.bounds,
                                   byRoundingCorners: [.bottomRight, .topRight],
                                   cornerRadii: CGSize(width: 6, height: 6))
            }
            let placeholder = UIImage(named: "tuiroom_default_user", in: tuiVideoSeatBundle(), compatibleWith: nil)
            if let url = URL(string: attendeeModel.userInfo.avatarUrl) {
                avatarImageView.kf.setImage(with: .network(url),
                                            placeholder: placeholder)
            } else {
                avatarImageView.image = placeholder
            }
        }
    }

    @objc func resetVolumeView() {
        if styleType == .small {
            layer.borderColor = UIColor.black.cgColor
            layer.borderWidth = 1
        } else {
            layer.borderWidth = 0
        }
    }

    func refreshAudio(isAudioAvailable: Bool) {
        attendeeModel.userInfo.hasAudioStream = isAudioAvailable
        refreshName()
    }

    func refreshProtective() {
        if !avatarImageView.isHidden {
            if styleType == .big {
                let top = 56 + kDeviceSafeTopHeight
                let height = (mm_h - top - (84 + kDeviceSafeBottomHeight))
                protectiveImageView.frame = CGRect(x: 0, y: top, width: mm_w, height: height)
                protectiveImageView.isHidden = false
            } else {
                protectiveImageView.isHidden = true
            }
        } else {
            protectiveImageView.isHidden = true
        }
    }

    override func didMoveToSuperview() {
        super.didMoveToSuperview()
        if superview == nil {
            NSObject.cancelPreviousPerformRequests(withTarget: self, selector: #selector(resetVolumeView), object: nil)
        }
        if styleType == .bigShare {
            if superview == nil {
                roomEngine?.stopPlayRemoteVideo(userId: attendeeModel.userId(), streamType: .screenStream)
            } else {
                roomEngine?.setRemoteVideoView(userId: attendeeModel.userId(), streamType: .screenStream, view: self)
                roomEngine?.startPlayRemoteVideo(userId: attendeeModel.userId(), streamType: .screenStream) { _ in

                } onLoading: { _ in

                } onError: { _, code, message in
                    debugPrint("startRemoteView" + "\(code)" + message)
                }
            }

        } else {
            if superview == nil {
                if tag == 1 {
                    return
                }
                tag = 1
                DispatchQueue.global().asyncAfter(wallDeadline: .now() + 0.1) { [weak self] in
                    DispatchQueue.main.async {
                        guard let self = self else { return }
                        if self.superview == nil {
                            self.roomEngine?.stopPlayRemoteVideo(userId: self.attendeeModel.userId(), streamType: .cameraStream)
                        }
                        self.tag = 0
                    }
                }
            } else {
                roomEngine?.setRemoteVideoView(userId: attendeeModel.userId(), streamType: .cameraStream, view: self)
                roomEngine?.startPlayRemoteVideo(userId: attendeeModel.userId(), streamType: .cameraStream) { _ in

                } onLoading: { _ in

                } onError: { _, code, message in
                    debugPrint("startRemoteView" + "\(code)" + message)
                }
            }
        }
    }

    deinit {
        NSObject.cancelPreviousPerformRequests(withTarget: self, selector: #selector(resetVolumeView), object: nil)
        debugPrint("deinit \(self)")
    }
}
