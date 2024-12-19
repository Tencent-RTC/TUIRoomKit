//
//  ConferenceListEffects.swift
//  TUIRoomKit
//
//  Created by CY zhao on 2024/6/12.
//

import Foundation
import RTCRoomEngine
import Combine

class ConferenceListEffects: Effects {
    typealias Environment = ServiceCenter
    
    let fetchConferenceList = Effect<Environment>.dispatchingOne { actions, environment in
        actions.wasCreated(from: ConferenceListActions.fetchConferenceList)
            .flatMap { action in
                environment.conferenceListService.fetchConferenceList(status: [.notStarted, .running],
                                                                      cursor: action.payload.0,
                                                                      count: action.payload.1)
                .map { (conferenceList, cursor) in
                    ConferenceListActions.updateConferenceList(payload: (conferenceList, cursor))
                }
                .catch { error -> Just<Action> in
                    Just(ErrorActions.throwError(payload: error))
                }
            }
            .eraseToAnyPublisher()
    }
    
    let scheduleConference = Effect<Environment>.dispatchingOne { actions, environment in
        actions.wasCreated(from: ConferenceListActions.scheduleConference)
            .flatMap { action in
                environment.conferenceListService.scheduleConference(conferenceInfo: action.payload)
                    .map { conferenceInfo in
                        ConferenceListActions.onScheduleSuccess(payload: conferenceInfo)
                    }
                    .catch { error -> Just<Action> in
                        Just(ErrorActions.throwError(payload: error))
                    }
            }
            .eraseToAnyPublisher()
    }
    
    let cancelConference = Effect<Environment>.dispatchingOne { actions, environment in
        actions.wasCreated(from: ConferenceListActions.cancelConference)
            .flatMap { action in
                environment.conferenceListService.cancelConference(conferenceId: action.payload)
                    .map { _ in
                        ConferenceListActions.onCancelSuccess()
                    }
                    .catch { error -> Just<Action> in
                        Just(ErrorActions.throwError(payload: error))
                    }
            }
            .eraseToAnyPublisher()
    }
    
    let modifyConferenceInfo = Effect<Environment>.nonDispatching { actions, environment in
        actions.wasCreated(from: ConferenceListActions.modifyConferenceInfo)
            .sink { action in
                let originInfo = action.payload.0
                let modifiedInfo = action.payload.1
                var modifyFlag: TUIConferenceModifyFlag = []
                if modifiedInfo.basicInfo.name != originInfo.basicInfo.name {
                    modifyFlag = modifyFlag.union(.roomName)
                }
                if modifiedInfo.scheduleStartTime != originInfo.scheduleStartTime ||
                    modifiedInfo.durationTime != originInfo.durationTime {
                    modifyFlag = modifyFlag.union([.scheduleStartTime, .scheduleEndTime])
                }
                let isConferenceInfoChanged = !modifyFlag.isEmpty
                
                let newAttendeeSet = Set(modifiedInfo.attendeeListResult.attendeeList)
                let oldAttendeeSet = Set(originInfo.attendeeListResult.attendeeList)
                let addList = newAttendeeSet.subtracting(oldAttendeeSet).map { $0.userId }
                let removeList = oldAttendeeSet.subtracting(newAttendeeSet).map { $0.userId }
                let isAttendeesChanged = !addList.isEmpty || !removeList.isEmpty
                
                let modifiedConferenceInfo = TUIConferenceInfo(conferenceInfo: modifiedInfo)
                if isConferenceInfoChanged {
                    if isAttendeesChanged {
                        environment.store?.dispatch(action: ConferenceListActions.updateConferenceInfoAndAttendees(payload: (modifiedConferenceInfo, modifyFlag, addList, removeList)))
                    } else {
                        environment.store?.dispatch(action: ConferenceListActions.updateConferenceInfo(payload: (modifiedConferenceInfo, modifyFlag)))
                    }
                } else if isAttendeesChanged {
                    environment.store?.dispatch(action: ConferenceListActions.updateAttendees(payload: (modifiedConferenceInfo.basicRoomInfo.roomId, addList, removeList)))
                }
            }
    }
    
    let updateConferenceInfo = Effect<Environment>.dispatchingOne { actions, environment in
        actions.wasCreated(from: ConferenceListActions.updateConferenceInfo)
            .flatMap { action in
                environment.conferenceListService.updateConferenceInfo(conferenceInfo: action.payload.0,
                                                                           modifyFlag: action.payload.1)
                .map { _ in
                    ConferenceListActions.onUpdateInfoSuccess()
                }
                .catch { error -> Just<Action> in
                    Just(ErrorActions.throwError(payload: error))
                }
            }
            .eraseToAnyPublisher()
    }
    
    let updateAttendees = Effect<Environment>.nonDispatching { actions, environment in
        actions
            .wasCreated(from: ConferenceListActions.updateAttendees)
            .sink { action in
                if !action.payload.1.isEmpty {
                    environment.store?.dispatch(action: ConferenceListActions.addAttendeesByAdmin(payload: (action.payload.0, action.payload.1)))
                }
                if !action.payload.2.isEmpty {
                    environment.store?.dispatch(action: ConferenceListActions.removeAttendeesByAdmin(payload: (action.payload.0, action.payload.2)))
                }
            }
    }
    
    let updateConferenceInfoAndAttendees = Effect<Environment>.dispatchingMultiple { actions, environment in
        actions
            .wasCreated(from: ConferenceListActions.updateConferenceInfoAndAttendees)
            .flatMap { action in
                return environment.conferenceListService.updateConferenceInfo(conferenceInfo: action.payload.0, modifyFlag: action.payload.1)
                    .map { _ in
                        return [ConferenceListActions.onUpdateInfoSuccess(), ConferenceListActions.updateAttendees(payload: (action.payload.0.basicRoomInfo.roomId, action.payload.2, action.payload.3))]
                    }
                    .catch { error -> Just<[Action]> in
                        return Just([ErrorActions.throwError(payload: error), ConferenceListActions.updateAttendees(payload: (action.payload.0.basicRoomInfo.roomId, action.payload.2, action.payload.3))])
                    }
            }
            .eraseToAnyPublisher()
    }
    
    let addAttendeesByAdmin = Effect<Environment>.dispatchingOne { actions, environment in
        actions.wasCreated(from: ConferenceListActions.addAttendeesByAdmin)
            .flatMap { action in
                environment.conferenceListService.addAttendeesByAdmin(conferenceId: action.payload.0, userIdList: action.payload.1)
                    .map { _ in
                        ConferenceListActions.onAddAttendeesSuccess()
                    }
                    .catch { error -> Just<Action> in
                        Just(ErrorActions.throwError(payload: error))
                    }
            }
            .eraseToAnyPublisher()
    }
    
    let removeAttendeesByAdmin = Effect<Environment>.dispatchingOne { actions, environment in
        actions.wasCreated(from: ConferenceListActions.removeAttendeesByAdmin)
            .flatMap { action in
                environment.conferenceListService.removeAttendeesByAdmin(conferenceId: action.payload.0, userIdList: action.payload.1)
                    .map { _ in
                        ConferenceListActions.onRemoveAttendeesSuccess()
                    }
                    .catch { error -> Just<Action> in
                        Just(ErrorActions.throwError(payload: error))
                    }
            }
            .eraseToAnyPublisher()
    }
    
    let onScheduleSuccess = Effect<Environment>.nonDispatching { actions, environment in
        actions
            .wasCreated(from: ConferenceListActions.onScheduleSuccess)
            .sink { action in
                let conferenceInfo = action.payload
                environment.store?.dispatch(action: ScheduleResponseActions.onScheduleSuccess(payload: conferenceInfo))
            }
    }
    
    let onCancelSuccess = Effect<Environment>.nonDispatching { actions, environment in
        actions
            .wasCreated(from: ConferenceListActions.onCancelSuccess)
            .sink { action in
                environment.store?.dispatch(action: ScheduleResponseActions.onCancelSuccess())
            }
    }
    
}

