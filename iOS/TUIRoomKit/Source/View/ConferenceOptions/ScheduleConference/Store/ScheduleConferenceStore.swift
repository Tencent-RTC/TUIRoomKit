//
//  ScheduleConferenceStore.swift
//  TUIRoomKit
//
//  Created by aby on 2024/6/27.
//

import Combine

protocol ScheduleConferenceStore {
    func update(conference info: ConferenceInfo)
    func fetchAttendees(cursor: String)
    func fetchRoomPassword(roomId: String)
    func reportViewShow(dataReport: DataReport)
    func select<Value:Equatable>(_ selector: Selector<ConferenceInfo, Value>) -> AnyPublisher<Value, Never>
    var conferenceInfo: ConferenceInfo { get }
}

class ScheduleConferenceStoreProvider {
    static let updateConferenceInfo = ActionTemplate(id: "updateConferenceInfo", payloadType: ConferenceInfo.self)
    static let fetchAttendeeList = ActionTemplate(id: "fetchAttendeeList", payloadType: (String, String, Int).self)
    static let updateAttendeeList = ActionTemplate(id: "updateAttendeeList", payloadType: ([UserInfo], String, UInt).self)
    static let fetchRoomPassword = ActionTemplate(id: ".fetchRoomPassword", payloadType: String.self)
    static let updateRoomPassword = ActionTemplate(id: "updateRoomPassword", payloadType: String.self)
    static let attendeesPerFetch = 20
    
    // MARK: - private property.
    private lazy var store: Store<ConferenceInfo, ServiceCenter> = {
        let store = Store.init(initialState: ConferenceInfo(), environment: ServiceCenter(), reducers: [self.conferenceReducer])
        store.register(effects: scheduleConferenceEffects())
        return store
    }()
    
    private let conferenceReducer = Reducer<ConferenceInfo>(
        ReduceOn(updateConferenceInfo, reduce: { state, action in
            state = action.payload
        }),
        ReduceOn(updateAttendeeList, reduce: { state, action in
            state.attendeeListResult.attendeeList.append(contentsOf: action.payload.0)
            state.attendeeListResult.fetchCursor = action.payload.1
            state.attendeeListResult.totalCount = action.payload.2
        }),
        ReduceOn(updateRoomPassword, reduce: { state, action in
            state.basicInfo.password = action.payload
            state.basicInfo.isPasswordEnabled = !action.payload.isEmpty
        })
    )
    
    deinit {
        store.unregister(reducer: conferenceReducer)
        store.unregisterEffects(withId: scheduleConferenceEffects.id)
    }
}

extension ScheduleConferenceStoreProvider: ScheduleConferenceStore {
    func reportViewShow(dataReport: DataReport) {
        RoomKitReport.reportData(dataReport)
    }
    
    func update(conference info: ConferenceInfo) {
        store.dispatch(action: ScheduleConferenceStoreProvider.updateConferenceInfo(payload: info))
    }
    
    func fetchAttendees(cursor: String) {
        let conferenceId = conferenceInfo.basicInfo.roomId
        store.dispatch(action: ScheduleConferenceStoreProvider.fetchAttendeeList(payload: (conferenceId, cursor, ScheduleConferenceStoreProvider.attendeesPerFetch)))
    }
    
    func fetchRoomPassword(roomId: String) {
        store.dispatch(action: ScheduleConferenceStoreProvider.fetchRoomPassword(payload: roomId))
    }
    
    func select<Value>(_ selector: Selector<ConferenceInfo, Value>) -> AnyPublisher<Value, Never> where Value : Equatable {
        return store.select(selector)
    }
    
    var conferenceInfo: ConferenceInfo {
        return store.state
    }
}

class scheduleConferenceEffects: Effects {
    typealias Environment = ServiceCenter
    
    let fetchAttendeeList = Effect<Environment>.dispatchingOne { actions, environment in
        actions.wasCreated(from: ScheduleConferenceStoreProvider.fetchAttendeeList)
            .flatMap { action in
                environment.conferenceListService.fetchAttendeeList(conferenceId: action.payload.0,
                                                                          cursor: action.payload.1,
                                                                           count: action.payload.2)
                .map { (userInfoList, cursor, totalCount) in
                    ScheduleConferenceStoreProvider.updateAttendeeList(payload: (userInfoList, cursor, totalCount))
                }
                .catch { error -> Just<Action> in
                    Just(ErrorActions.throwError(payload: error))
                }
            }
            .eraseToAnyPublisher()
    }
    
    let fetchRoomPassword = Effect<Environment>.dispatchingOne { actions, environment in
        actions.wasCreated(from: ScheduleConferenceStoreProvider.fetchRoomPassword)
            .flatMap { action in
                environment.conferenceListService.fetchConferenceInfo(roomId: action.payload)
                    .map { conferenceInfo in
                        ScheduleConferenceStoreProvider.updateRoomPassword(payload: conferenceInfo.basicInfo.password)
                    }
                    .catch { error -> Just<Action> in
                        Just(ErrorActions.throwError(payload: error))
                    }
            }
            .eraseToAnyPublisher()
    }
}
