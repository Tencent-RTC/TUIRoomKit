//
//  PopUpViewModel.swift
//  TUIRoomKit
//
//  Created by 唐佳宁 on 2023/1/12.
//  Copyright © 2023 Tencent. All rights reserved.
//

import Foundation
import TUICore

enum PopUpViewType {
    case roomInfoViewType
    case moreViewType
    case beautyViewType
    case setUpViewType
}

class PopUpViewModel: NSObject {
    let viewType: PopUpViewType
    let height: CGFloat
    
    init(viewType: PopUpViewType, height: CGFloat) {
        self.viewType = viewType
        self.height = height
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}
