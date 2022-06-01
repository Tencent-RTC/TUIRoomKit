//
//  TUIRoomMainScreenShareViewCell.swift
//  TUIRoom
//
//  Created by WesleyLei on 2021/12/16.
//  Copyright © 2021 Tencent. All rights reserved.
//

import TUICore
import TXAppBasic
import UIKit

class TUIRoomMainScreenShareViewCell: UICollectionViewCell {
    weak var delegate: TUIRoomCellDelegate?
    private var shareMode: TUIRoomAttendeeModel = TUIRoomAttendeeModel()
    private var attendeeModel: TUIRoomAttendeeModel = TUIRoomAttendeeModel()

    func updateByModels(_ shareMode: TUIRoomAttendeeModel,
                        attendeeModel: TUIRoomAttendeeModel) {
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
                       type: .screen)
        configOneModel(model: attendeeModel,
                       rect: CGRect(x: mm_w - 96,
                                    y: 68 + 44 + kDeviceSafeTopHeight,
                                    width: 96,
                                    height: attendeeModel.isVideoOpen() ? 170 : 110),
                       viewStyle: .suspension,
                       type: .camera)
    }

    func configOneModel(model: TUIRoomAttendeeModel, rect: CGRect, viewStyle: TUIRoomAttendeeRenderViewType, type: TUIRoomStreamType) {
        if model.userInfo.userId.count == 0 {
            return
        }
        guard let renderView = delegate?.getRenderView(model: model, type: type) else {
            return
        }
        if renderView.superview != self {
            renderView.removeFromSuperview()
        }
        renderView.frame = rect
        renderView.updateViewByModel(attendeeModel: model, styleType: viewStyle)
        addSubview(renderView)
    }

    deinit {
        debugPrint("deinit \(self)")
    }
}
