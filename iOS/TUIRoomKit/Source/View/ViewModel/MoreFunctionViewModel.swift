//
//  MoreFunctionViewModel.swift
//  TUIRoomKit
//
//  Created by 唐佳宁 on 2023/1/12.
//  Copyright © 2023 Tencent. All rights reserved.
//

import Foundation

class MoreFunctionViewModel {
    private(set) var viewItems: [ButtonItemData] = []
    
    init() {
        createBottomData()
    }
    
    func createBottomData() {
        //聊天
        let chatItem = ButtonItemData()
        chatItem.normalIcon = "room_chat"
        chatItem.normalTitle = .chatText
        chatItem.resourceBundle = tuiRoomKitBundle()
        chatItem.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.chatAction(sender: button)
        }
        viewItems.append(chatItem)
        //美颜
        let beautyItem = ButtonItemData()
        beautyItem.normalIcon = "room_beauty"
        beautyItem.normalTitle = .beautyText
        beautyItem.resourceBundle = tuiRoomKitBundle()
        beautyItem.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.beautyAction(sender: button)
        }
        viewItems.append(beautyItem)
        //设置
        let settingItem = ButtonItemData()
        settingItem.normalIcon = "room_setting"
        settingItem.normalTitle = .settingText
        settingItem.resourceBundle = tuiRoomKitBundle()
        settingItem.action = { [weak self] sender in
            guard let self = self, let button = sender as? UIButton else { return }
            self.settingAction(sender: button)
        }
        viewItems.append(settingItem)
    }
    
    func chatAction(sender: UIButton) {
        sender.isSelected = !sender.isSelected
    }
    
    func beautyAction(sender: UIButton) {
        sender.isSelected = !sender.isSelected
        RoomRouter.shared.presentPopUpViewController(viewType: .beautyViewType)
    }
    
    func settingAction(sender: UIButton) {
        sender.isSelected = !sender.isSelected
        RoomRouter.shared.presentPopUpViewController(viewType: .setUpViewType, height: 300.scale375())
    }
    
    deinit {
        debugPrint("deinit \(self)")
    }
}

private extension String {
    static let chatText = localized("TUIRoom.chat")
    static let beautyText = localized("TUIRoom.beauty")
    static let settingText = localized("TUIRoom.setting")
}
