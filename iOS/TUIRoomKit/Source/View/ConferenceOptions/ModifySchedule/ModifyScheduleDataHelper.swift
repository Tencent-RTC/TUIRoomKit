//
//  ModifyScheduleDataHelper.swift
//  TUIRoomKit
//
//  Created by janejntang on 2024/6/27.
//

import Foundation
import RTCRoomEngine

class ModifyScheduleDataHelper: ScheduleConferenceDataHelper {
    class func generateScheduleConferenceData(route: Route, store: ScheduleConferenceStore, operation: ConferenceStore, modifyStore: ScheduleConferenceStore, viewController: ContactViewSelectDelegate) ->
    [Int : [CellConfigItem]] {
        var menus: [Int:[CellConfigItem]] = [:]
        menus[0] = getFirstSectionModifyMenus(route: route, store: modifyStore, viewController: viewController)
        menus[1] = getSecondSectionModifyMenus(route: route, store: store, operation: operation, modifyStore: modifyStore)
        return menus
    }
    
    private class func getFirstSectionModifyMenus(route: Route, store: ScheduleConferenceStore, viewController: ContactViewSelectDelegate) -> [CellConfigItem] {
        var array: [CellConfigItem] = []
        array.append(getConferenceNameItem(route: route, store: store))
        var conferenceTypeItem = getConferenceTypeItem(route: route, store: store)
        conferenceTypeItem.showButton = false
        conferenceTypeItem.selectClosure = nil
        array.append(conferenceTypeItem)
        array.append(getModifyStartTimeItem(route: route, store: store))
        array.append(getModifyDurationTimeItem(route: route, store: store))
        array.append(getTimeZoneItem(route: route, store: store))
        if let participatingMembersItem = getParticipatingMembersItem(route: route, store: store, viewController: viewController) {
            array.append(participatingMembersItem)
        }
        return array
    }
    
    private class func getSecondSectionModifyMenus(route: Route, store: ScheduleConferenceStore, operation: ConferenceStore, modifyStore:
                                                  ScheduleConferenceStore) -> [CellConfigItem] {
        return [getSaveItem(route: route, store: store, operation: operation, modifyStore: modifyStore)]
    }
    
    private class func getModifyStartTimeItem(route: Route, store: ScheduleConferenceStore) -> CellConfigItem {
        var startTimeItem = getStartTimeItem(route: route, store: store)
        startTimeItem.selectClosure = {
            let view = TimePickerView()
            view.pickerDate = Date(timeIntervalSince1970: TimeInterval(store.conferenceInfo.scheduleStartTime))
            view.dismissAction = {
                route.dismiss(animated: true)
            }
            route.present(route: .popup(view: view))
        }
        return startTimeItem
    }
    
    private class func getModifyDurationTimeItem(route: Route, store: ScheduleConferenceStore) -> ListItem {
        var durationTimeItem = getDurationTimeItem(route: route, store: store)
        durationTimeItem.selectClosure = {
            let view = DurationPickerView()
            view.timeDuration = TimeInterval(store.conferenceInfo.durationTime)
            view.dismissAction = {
                route.dismiss(animated: true)
            }
            route.present(route: .popup(view: view))
        }
        return durationTimeItem
    }
    
    private class func getSaveItem(route: Route, store: ScheduleConferenceStore, operation: ConferenceStore, modifyStore: ScheduleConferenceStore) -> CellConfigItem {
        var item = ButtonItem(title: .saveText)
        item.titleColor = UIColor(0xFFFFFF)
        item.backgroudColor = UIColor(0x1C66E5)
        item.selectClosure = {
            guard modifyStore.conferenceInfo.basicInfo.name.count > 0 else {
                operation.dispatch(action: ViewActions.showToast(payload: ToastInfo(message: .nameCannotBeEmptyText)))
                return
            }
            let currentList = operation.selectCurrent(ConferenceListSelectors.getConferenceList)
            let status = currentList.first(where: { $0.basicInfo.roomId == store.conferenceInfo.basicInfo.roomId })?.status
            guard status != .running else {
                operation.dispatch(action: ViewActions.showToast(payload: ToastInfo(message: .conferenceCannotBeModifiedText)))
                route.pop()
                return
            }
            operation.dispatch(action: ConferenceListActions.modifyConferenceInfo(payload: (store.conferenceInfo, modifyStore.conferenceInfo)))
            store.update(conference: modifyStore.conferenceInfo)
            route.pop()
        }
        return item
    }
}

private extension String {
    static let saveText = localized("Save")
    static let nameCannotBeEmptyText = localized("Conference name cannot be empty!")
    static let conferenceCannotBeModifiedText = localized("Conference has already started, and it cannot be modified!")
}
