import 'package:rtc_room_engine/rtc_room_engine.dart';
import 'package:tencent_conference_uikit/manager/rtc_engine_manager.dart';

class ConferenceListManager {
  late TUIConferenceListManager _conferenceListManager;
  static final ConferenceListManager _instance =
      ConferenceListManager._internal();
  factory ConferenceListManager() => _instance;

  ConferenceListManager._internal() {
    _conferenceListManager = RoomEngineManager()
        .getExtension(TUIExtensionType.conferenceListManager);
  }

  Future<TUIActionCallback> scheduleConference(
      TUIConferenceInfo conferenceInfo) {
    return _conferenceListManager.scheduleConference(conferenceInfo);
  }

  Future<TUIActionCallback> cancelConference(String roomId) {
    return _conferenceListManager.cancelConference(roomId);
  }

  Future<TUIValueCallBack<TUIScheduledConferenceListResult>>
      fetchScheduledConferenceList(
          List<TUIConferenceStatus> status, String cursor, int count) {
    return _conferenceListManager.fetchScheduledConferenceList(
        status, cursor, count);
  }

  void addObserver(TUIConferenceListManagerObserver observer) {
    _conferenceListManager.addObserver(observer);
  }

  void removeObserver(TUIConferenceListManagerObserver observer) {
    _conferenceListManager.removeObserver(observer);
  }

  Future<TUIValueCallBack<TUIScheduledAttendeesResult>> fetchAttendeeList(
      String roomId, String cursor, int count) {
    return _conferenceListManager.fetchAttendeeList(roomId, cursor, count);
  }

  Future<TUIActionCallback> addAttendeesByAdmin(
      String roomId, List<String> userIdList) {
    return _conferenceListManager.addAttendeesByAdmin(roomId, userIdList);
  }

  Future<TUIActionCallback> removeAttendeesByAdmin(
      String roomId, List<String> userIdList) {
    return _conferenceListManager.removeAttendeesByAdmin(roomId, userIdList);
  }

  Future<TUIActionCallback> updateConferenceInfo(String roomId,
      {String? roomName, int? scheduleStartTime, int? scheduleEndTime}) {
    return _conferenceListManager.updateConferenceInfo(roomId,
        roomName: roomName,
        scheduleStartTime: scheduleStartTime,
        scheduleEndTime: scheduleEndTime);
  }
}
