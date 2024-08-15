//
//  ViewSelectors.swift
//  TUIRoomKit
//
//  Created by CY zhao on 2024/7/15.
//

import Foundation

enum ViewSelectors {
    private static let getScheduleStatus = Selector(keyPath: \ViewState.scheduleViewState)
    static let getRefreshListFlag = Selector.with(getScheduleStatus, projector: \ScheduleViewState.shouldRefreshList)
    static let getPopDetailFlag = Selector.with(getScheduleStatus, projector: \ScheduleViewState.detailViewPopFlag)
}
