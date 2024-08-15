import 'package:rtc_room_engine/rtc_room_engine.dart';
import 'package:tencent_conference_uikit/common/index.dart';

class ConferenceListEventHandler extends TUIConferenceListManagerObserver {
  final _scheduleRoomStore = ScheduleRoomStore.to;

  ConferenceListEventHandler() {
    super.onConferenceScheduled = (TUIConferenceInfo conferenceInfo) {
      _scheduleRoomStore.addConference(conferenceInfo);
      _scheduleRoomStore.groupedConferences.refresh();
    };

    super.onConferenceCancelled = (roomId, reason, operateUser) {
      _scheduleRoomStore.removeConference(roomId);
    };

    super.onConferenceInfoChanged = (conferenceInfo, modifyFlagList) {
      _scheduleRoomStore.changeConferenceInfo(conferenceInfo, modifyFlagList);
    };

    super.onConferenceStatusChanged = (roomId, status) {
      _scheduleRoomStore.changeConferenceStatus(roomId, status);
    };
  }
}
