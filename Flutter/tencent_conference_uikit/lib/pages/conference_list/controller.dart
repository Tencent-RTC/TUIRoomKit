import 'dart:collection';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_room_engine/rtc_room_engine.dart';
import 'package:tencent_conference_uikit/common/index.dart';
import 'package:tencent_cloud_chat_sdk/tencent_im_sdk_plugin.dart';
import 'package:tencent_conference_uikit/event/conference_list_event_handler.dart';
import 'package:tencent_conference_uikit/manager/conference_list_manager.dart';
import 'package:tencent_conference_uikit/pages/index.dart';
import 'package:tencent_conference_uikit/tencent_conference_uikit.dart';

class ConferenceListController extends GetxController {
  ConferenceListController();

  late Rx<SplayTreeMap<DateTime, List<TUIConferenceInfo>>> groupedConferences;

  bool _isEnteringRoom = false;

  final ScrollController scrollController = ScrollController();
  late final ConferenceListEventHandler _conferenceListEventHandler =
      ConferenceListEventHandler();

  @override
  onInit() {
    Get.put<ScheduleRoomStore>(ScheduleRoomStore());
    _initCurrentUser();
    groupedConferences = ScheduleRoomStore.to.groupedConferences;
    ScheduleRoomStore.to.fetchConferenceList();
    ConferenceListManager().addObserver(_conferenceListEventHandler);
    scrollController.addListener(_scrollListener);
    super.onInit();
  }

  _initCurrentUser() async {
    final userId = TUIRoomEngine.getSelfInfo().userId;
    ScheduleRoomStore.to.selfUserId = userId;
    final infoList = await TencentImSDKPlugin.v2TIMManager
        .getUsersInfo(userIDList: [userId]);
    final selfInfo = infoList.data?.first;
    ScheduleRoomStore.to.selfUserName = selfInfo?.nickName ?? "";
  }

  void _scrollListener() {
    if (scrollController.position.atEdge) {
      bool isBottom = scrollController.position.pixels ==
          scrollController.position.maxScrollExtent;
      if (isBottom) {
        ScheduleRoomStore.to.fetchMoreConference();
      }
    }
  }

  String getConferenceTimeString(int startTime, int endTime) {
    DateTime startUtcDateTime =
        DateTime.fromMillisecondsSinceEpoch(startTime * 1000, isUtc: true);
    DateTime endUtcDateTime =
        DateTime.fromMillisecondsSinceEpoch(endTime * 1000, isUtc: true);

    DateTime startLocalDateTime = startUtcDateTime.toLocal();
    DateTime endLocalDateTime = endUtcDateTime.toLocal();

    String startTimeString = _formatTime(startLocalDateTime);
    String endTimeString = _formatTime(endLocalDateTime);

    return '$startTimeString - $endTimeString';
  }

  String _formatTime(DateTime dateTime) {
    String twoDigits(int n) => n.toString().padLeft(2, '0');
    String hours = twoDigits(dateTime.hour);
    String minutes = twoDigits(dateTime.minute);
    return '$hours:$minutes';
  }

  void enterConference(String conferenceId) {
    if (_isEnteringRoom) {
      return;
    }
    _isEnteringRoom = true;
    ConferenceSession.newInstance(conferenceId)
      ..onActionSuccess = _onEnterConferenceSuccess
      ..onActionError = (ConferenceError error, String message) {
        _onEnterConferenceError(error, message, conferenceId);
      }
      ..join();
  }

  void _onEnterConferenceSuccess() {
    Get.to(
      () => ConferenceMainPage(
        conferenceObserver: ConferenceObserver(
          onConferenceExited: (conferenceId) {
            ScheduleRoomStore.to.refreshConferenceList();
          },
        ),
      ),
    );
    _isEnteringRoom = false;
  }

  void _onEnterConferenceError(
      ConferenceError error, String message, String conferenceId) {
    if (error == ConferenceError.errConferenceIdNotExist) {
      ScheduleRoomStore.to.removeConference(conferenceId);
    }
    makeToast(msg: message);
    _isEnteringRoom = false;
  }

  void onConferenceItemPressed(TUIConferenceInfo conferenceInfo) {
    Get.to(() => ScheduleDetailsPage(conferenceInfo: conferenceInfo),
        routeName: '/schedule_details');
  }

  @override
  void onClose() {
    ConferenceListManager().removeObserver(_conferenceListEventHandler);
    Get.delete<ScheduleRoomStore>();
    scrollController.removeListener(_scrollListener);
    scrollController.dispose();
    super.onClose();
  }
}
