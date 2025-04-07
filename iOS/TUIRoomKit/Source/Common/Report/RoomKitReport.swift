//
//  RoomKitReport.swift
//  Pods
//
//  Created by janejntang on 2025/1/17.
//
import RTCRoomEngine

enum DataReport: Int {
    case metricsBarragePanelShow = 106061
    case metricsBarrageSendMessage = 106062
    case metricsFloatWindowShow = 106063
    case metricsUserListPanelShow = 106064
    case metricsUserListSearch = 106065
    case metricsSettingsPanelShow = 106066
    case metricsChatPanelShow = 106057
    case metricsShareRoomInfoPanelShow = 106067
    case metricsConferenceSchedulePanelShow = 106068
    case metricsConferenceModifyPanelShow = 106069
    case metricsConferenceInfoPanelShow = 106070
    case metricsConferenceAttendee = 106071
    case metricsWaterMarkEnable = 106054
    case metricsWaterMarkCustomText = 106060
}

class RoomKitReport {
    private static let REPORT_API_KEY = "api"
    private static let REPORT_API_VALUE = "KeyMetricsStats"
    private static let REPORT_PARAMS = "params"
    private static let REPORT_PARAMS_KEY = "key"
    private func `init`() {}
    
    static func reportData(_ dataReport: DataReport) {
        let params: [String: Any] = [
            REPORT_API_KEY: REPORT_API_VALUE,
            REPORT_PARAMS: [
                REPORT_PARAMS_KEY: dataReport.rawValue
            ]
        ]
        guard let jsonString = params.convertToString() else { return }
        TUIRoomEngine.callExperimentalAPI(jsonStr: jsonString)
    }
}
