import 'dart:collection';

import 'package:get/get.dart';
import 'package:rtc_room_engine/rtc_room_engine.dart';
import 'package:tencent_conference_uikit/manager/conference_list_manager.dart';

class ScheduleRoomStore {
  static ScheduleRoomStore get to => Get.find();

  var selfUserId = "";
  var selfUserName = "";
  var _cursor = "";
  final _fetchCount = 10;
  final List<TUIConferenceInfo> _initialConferenceList = [];
  final groupedConferences =
      Rx(SplayTreeMap<DateTime, List<TUIConferenceInfo>>());

  void fetchConferenceList() async {
    final fetchResult = await ConferenceListManager()
        .fetchScheduledConferenceList(
            [TUIConferenceStatus.notStarted, TUIConferenceStatus.running],
            _cursor,
            _fetchCount);
    if (fetchResult.code == TUIError.success) {
      _cursor = fetchResult.data?.cursor ?? "";
      _initialConferenceList.addAll(fetchResult.data?.conferenceInfoList ?? []);
      _groupConferencesByDate();
    }
  }

  void fetchMoreConference() async {
    if (_cursor == "") {
      return;
    }
    final fetchResult = await ConferenceListManager()
        .fetchScheduledConferenceList(
            [TUIConferenceStatus.notStarted, TUIConferenceStatus.running],
            _cursor,
            _fetchCount);
    if (fetchResult.code == TUIError.success) {
      _cursor = fetchResult.data?.cursor ?? "";
      var list = fetchResult.data?.conferenceInfoList ?? [];
      for (var conference in list) {
        addConference(conference);
      }

      groupedConferences.refresh();
    }
  }

  void addConference(TUIConferenceInfo newConference) {
    DateTime utcDateTime = DateTime.fromMillisecondsSinceEpoch(
        newConference.scheduleStartTime! * 1000,
        isUtc: true);
    DateTime localDateTime = utcDateTime.toLocal();
    final date =
        DateTime(localDateTime.year, localDateTime.month, localDateTime.day);

    if (!groupedConferences.value.containsKey(date)) {
      groupedConferences.value[date] = [];
    }

    var conferences = groupedConferences.value[date]!;
    int insertIndex = _binarySearchInsertIndex(conferences, newConference);
    conferences.insert(insertIndex, newConference);
  }

  void removeConference(String roomId) {
    DateTime? dateToRemove;
    TUIConferenceInfo? conferenceToRemove;

    groupedConferences.value.forEach((date, conferences) {
      for (var conference in conferences) {
        if (conference.basicRoomInfo.roomId == roomId) {
          dateToRemove = date;
          conferenceToRemove = conference;
          break;
        }
      }
      if (conferenceToRemove != null) {
        return;
      }
    });

    if (dateToRemove != null && conferenceToRemove != null) {
      _removeConferenceInfo(dateToRemove!, conferenceToRemove!);
    }

    groupedConferences.refresh();
  }

  void changeConferenceStatus(String roomId, TUIConferenceStatus status) {
    groupedConferences.value.forEach((date, conferences) {
      for (var conference in conferences) {
        if (conference.basicRoomInfo.roomId == roomId) {
          conference.status = status;
          break;
        }
      }
    });
    groupedConferences.refresh();
  }

  void changeConferenceInfo(TUIConferenceInfo conferenceInfo,
      List<TUIConferenceModifyFlag> modifyFlagList) {
    DateTime? dateToRemove;
    TUIConferenceInfo? conferenceToRemove;
    groupedConferences.value.forEach((date, conferences) {
      for (var conference in conferences) {
        if (conference.basicRoomInfo.roomId ==
            conferenceInfo.basicRoomInfo.roomId) {
          if (modifyFlagList
                  .contains(TUIConferenceModifyFlag.scheduleStartTime) ||
              modifyFlagList
                  .contains(TUIConferenceModifyFlag.scheduleEndTime)) {
            dateToRemove = date;
            conferenceToRemove = conference;
            break;
          }
          if (modifyFlagList.contains(TUIConferenceModifyFlag.roomName)) {
            conference.basicRoomInfo.name = conferenceInfo.basicRoomInfo.name;
          }
          break;
        }
      }
    });

    if (dateToRemove != null && conferenceToRemove != null) {
      _removeConferenceInfo(dateToRemove!, conferenceToRemove!);
      addConference(conferenceInfo);
    }

    groupedConferences.refresh();
  }

  void refreshConferenceList() {
    _cursor = "";
    _initialConferenceList.clear();
    groupedConferences.value.clear();
    fetchConferenceList();
  }

  int _binarySearchInsertIndex(
      List<TUIConferenceInfo> conferences, TUIConferenceInfo newConference) {
    int low = 0;
    int high = conferences.length - 1;
    while (low <= high) {
      int mid = low + ((high - low) >> 1);
      if (conferences[mid].scheduleStartTime! >
          newConference.scheduleStartTime!) {
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
    return low;
  }

  void _removeConferenceInfo(DateTime date, TUIConferenceInfo conferenceInfo) {
    groupedConferences.value[date]?.remove(conferenceInfo);
    if (groupedConferences.value[date]?.isEmpty ?? false) {
      groupedConferences.value.remove(date);
    }
  }

  void _groupConferencesByDate() {
    var newGroupedConferences = <DateTime, List<TUIConferenceInfo>>{};

    for (var conference in _initialConferenceList) {
      DateTime date = _getTimeInDay(conference.scheduleStartTime!);
      if (!newGroupedConferences.containsKey(date)) {
        newGroupedConferences[date] = [];
      }
      newGroupedConferences[date]!.add(conference);
    }

    newGroupedConferences.forEach((date, conferences) {
      conferences
          .sort((a, b) => a.scheduleStartTime!.compareTo(b.scheduleStartTime!));
    });

    groupedConferences.value.assignAll(newGroupedConferences);
    groupedConferences.refresh();
  }

  DateTime _getTimeInDay(int timeStamp) {
    DateTime utcDateTime =
        DateTime.fromMillisecondsSinceEpoch(timeStamp * 1000, isUtc: true);
    DateTime localDateTime = utcDateTime.toLocal();
    return DateTime(localDateTime.year, localDateTime.month, localDateTime.day);
  }
}
