//
//  TUIVideoSeatShareCell.swift
//  TUIVideoSeat
//
//  Created by WesleyLei on 2021/12/16.
//  Copyright © 2021 Tencent. All rights reserved.
//

import TUIRoomEngine
import UIKit

class TUIVideoSeatShareCell: UICollectionViewCell {
    weak var delegate: TUIRoomCellDelegate?
    private var shareMode: TUIVideoSeatAttendeeModel = TUIVideoSeatAttendeeModel()
    private var attendeeModel: TUIVideoSeatAttendeeModel = TUIVideoSeatAttendeeModel()
    func updateByModels(_ shareMode: TUIVideoSeatAttendeeModel,
                        attendeeModel: TUIVideoSeatAttendeeModel) {
        self.shareMode = shareMode
        self.attendeeModel = attendeeModel
        resetView()
    }

    func resetView() {
        for view in subviews {
            view.removeFromSuperview()
        }
        configOneModel(model: shareMode,
                       rect: bounds,
                       viewStyle: .bigShare,
                       type: .screenStream)
        configOneModel(model: attendeeModel,
                       rect: CGRect(x: mm_w - 96,
                                    y: 68 + 44 + kDeviceSafeTopHeight,
                                    width: 96,
                                    height: attendeeModel.userInfo.hasVideoStream ? 170 : 110),
                       viewStyle: .suspension,
                       type: .cameraStream)
    }

    func configOneModel(model: TUIVideoSeatAttendeeModel, rect: CGRect, viewStyle: TUIRoomAttendeeRenderViewType, type: TUIVideoStreamType) {
        self.isUserInteractionEnabled = true
        if model.userInfo.userId.count == 0 {
            return
        }
        guard let renderView = delegate?.getRenderView(model: model, type: type) else {
            return
        }
        if renderView.superview != self {
            renderView.removeFromSuperview()
        }
        renderView.updateViewByModel(attendeeModel: model, styleType: viewStyle)
        addSubview(renderView)
        if type == .screenStream {
            renderView.snp.remakeConstraints { make in
                make.edges.equalTo(self)
            }
        } else {
            renderView.frame = rect
        }
    }

    deinit {
        debugPrint("deinit \(self)")
    }
}
