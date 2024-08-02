import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:rtc_room_engine/rtc_room_engine.dart';
import 'package:tencent_conference_uikit/common/index.dart';
import 'package:tencent_conference_uikit/manager/conference_list_manager.dart';
import 'package:tencent_conference_uikit/tencent_conference_uikit.dart';

class ScheduleDetailsController extends GetxController {
  ScheduleDetailsController(this.conferenceInfo);
  TUIConferenceInfo conferenceInfo;

  String cursor = "";
  final int fetchCount = 20;
  final RxList<TUIUserInfo> attendeesList = RxList<TUIUserInfo>();
  RxInt attendeesCount = 0.obs;
  late RxBool isConferenceStarted =
      (conferenceInfo.status == TUIConferenceStatus.running).obs;
  late TUIConferenceListManagerObserver observer;
  ScrollController scrollController = ScrollController();

  RxString roomName = ''.obs;
  RxString startTime = ''.obs;
  RxString duration = ''.obs;

  bool _isOperating = false;

  @override
  void onInit() {
    _initConferenceInfo();
    _initObserver();
    _fetchAttendeesList();
    scrollController.addListener(_scrollListener);
    super.onInit();
  }

  void _initConferenceInfo() {
    roomName.value = conferenceInfo.basicRoomInfo.name ??
        conferenceInfo.basicRoomInfo.roomId;
    startTime.value = _getStartTimeString(conferenceInfo.scheduleStartTime!);
    duration.value = _getDurationString(
        conferenceInfo.scheduleStartTime!, conferenceInfo.scheduleEndTime!);
  }

  void _initObserver() {
    observer = TUIConferenceListManagerObserver(
      onConferenceInfoChanged: (conferenceInfo, modifyFlagList) {
        if (conferenceInfo.basicRoomInfo.roomId ==
            this.conferenceInfo.basicRoomInfo.roomId) {
          if (modifyFlagList
                  .contains(TUIConferenceModifyFlag.scheduleStartTime) ||
              modifyFlagList
                  .contains(TUIConferenceModifyFlag.scheduleEndTime)) {
            startTime.value =
                _getStartTimeString(conferenceInfo.scheduleStartTime!);
            duration.value = _getDurationString(
                conferenceInfo.scheduleStartTime!,
                conferenceInfo.scheduleEndTime!);
          }
          if (modifyFlagList.contains(TUIConferenceModifyFlag.roomName)) {
            roomName.value = conferenceInfo.basicRoomInfo.name ??
                conferenceInfo.basicRoomInfo.roomId;
          }
          this.conferenceInfo = conferenceInfo;
        }
      },
      onConferenceCancelled: (roomId, reason, operateUser) {
        if (roomId == conferenceInfo.basicRoomInfo.roomId) {
          Get.until((route) => Get.currentRoute == '/schedule_details');
          Get.back();
        }
      },
      onConferenceStatusChanged: (roomId, status) {
        if (roomId == conferenceInfo.basicRoomInfo.roomId) {
          isConferenceStarted.value = status == TUIConferenceStatus.running;
        }
      },
      onScheduleAttendeesChanged: (roomId, leftUsers, joinedUsers) {
        if (roomId == conferenceInfo.basicRoomInfo.roomId) {
          attendeesList.addAll(joinedUsers);
          Set<String> leftUserIds =
              leftUsers.map((user) => user.userId).toSet();
          attendeesList
              .removeWhere((user) => leftUserIds.contains(user.userId));
          attendeesCount.value = attendeesList.length;
        }
      },
    );
    ConferenceListManager().addObserver(observer);
  }

  void _scrollListener() {
    if (scrollController.position.atEdge) {
      bool isBottom = scrollController.position.pixels ==
          scrollController.position.maxScrollExtent;
      if (isBottom && cursor != '') {
        _fetchAttendeesList();
      }
    }
  }

  Future<void> _fetchAttendeesList() async {
    var fetchRes = await ConferenceListManager().fetchAttendeeList(
        conferenceInfo.basicRoomInfo.roomId, cursor, fetchCount);
    var attendees = fetchRes.data?.scheduleAttendees ?? [];
    attendeesList.addAll(attendees);
    attendeesCount.value = fetchRes.data?.totalAttendeeCount ?? 0;
    cursor = fetchRes.data?.cursor ?? '';
  }

  String _getStartTimeString(int startTime) {
    DateTime startUtcDateTime =
        DateTime.fromMillisecondsSinceEpoch(startTime * 1000, isUtc: true);
    DateTime startLocalDateTime = startUtcDateTime.toLocal();
    return startLocalDateTime.format;
  }

  String _getDurationString(int startTime, int endTime) {
    int duration = endTime - startTime;
    int hours = duration ~/ 3600;
    int minutes = (duration % 3600) ~/ 60;
    String hoursString = hours != 0 ? '$hours${'hour'.roomTr}' : '';
    String minsString = minutes != 0 ? '$minutes${'minute'.roomTr}' : '';
    return hoursString + minsString;
  }

  void showInviteSheet() {
    showConferenceBottomSheet(
      InviteSheetWidget(
        roomId: conferenceInfo.basicRoomInfo.roomId,
        backgroundColor: Colors.white,
        titleColor: RoomColors.btnGrey,
        infoTextColor: RoomColors.btnGrey,
        copyButtonColor: RoomColors.switchTrackGrey,
        copyButtonTextColor: RoomColors.btnGrey,
      ),
    );
  }

  void enterConference() {
    if (_isOperating) {
      return;
    }
    _isOperating = true;
    ConferenceSession.newInstance(conferenceInfo.basicRoomInfo.roomId)
      ..onActionSuccess = _onEnterConferenceSuccess
      ..onActionError = _onEnterConferenceError
      ..join();
  }

  void _onEnterConferenceSuccess() {
    Get.back();
    Get.to(
      () => ConferenceMainPage(
        conferenceObserver: ConferenceObserver(
          onConferenceExited: (conferenceId) {
            ScheduleRoomStore.to.refreshConferenceList();
          },
        ),
      ),
    );
    _isOperating = false;
  }

  void _onEnterConferenceError(ConferenceError error, String message) {
    if (error == ConferenceError.errConferenceIdNotExist) {
      ScheduleRoomStore.to
          .removeConference(conferenceInfo.basicRoomInfo.roomId);
    }
    Get.back();
    makeToast(msg: message);
    _isOperating = false;
  }

  bool isRoomOwner() {
    return conferenceInfo.basicRoomInfo.ownerId ==
        ScheduleRoomStore.to.selfUserId;
  }

  Future<void> _cancelConference() async {
    if (_isOperating) {
      return;
    }
    _isOperating = true;
    await ConferenceListManager()
        .cancelConference(conferenceInfo.basicRoomInfo.roomId);
    _isOperating = false;
  }

  void onCancelBtnPressed() {
    showConferenceDialog(
      title: 'cancelRoomTitle'.roomTr,
      message: 'cancelRoomMessage'.roomTr,
      cancelText: 'doNotCancel'.roomTr,
      confirmText: 'cancelRoom'.roomTr,
      confirmTextStyle: const TextStyle(
        color: RoomColors.btnRed,
        fontSize: 16,
        fontWeight: FontWeight.bold,
      ),
      onConfirm: () {
        _cancelConference();
        Get.back();
      },
    );
  }

  void copyRoomId() {
    Clipboard.setData(ClipboardData(text: conferenceInfo.basicRoomInfo.roomId));
    makeToast(msg: 'copyRoomIdSuccess'.roomTr);
  }

  void onModifyPressed() {
    Get.to(() => ScheduleConferencePage(
          conferenceInfo: conferenceInfo,
          selectedAttendeesList: attendeesList,
        ));
  }

  void onAttendeesPressed() {
    if (attendeesCount.value == 0) {
      return;
    }
    showConferenceBottomSheet(
      AttendeesSheet(
        attendeesList: attendeesList,
        scrollController: scrollController,
        length: attendeesCount.value,
      ),
    );
  }

  @override
  void onClose() {
    ConferenceListManager().removeObserver(observer);
    scrollController.removeListener(_scrollListener);
    scrollController.dispose();
    super.onClose();
  }
}
