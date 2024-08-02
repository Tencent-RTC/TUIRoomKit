import 'dart:convert';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:rtc_room_engine/rtc_room_engine.dart';
import 'package:tencent_cloud_chat_sdk/manager/v2_tim_manager.dart';
import 'package:tencent_cloud_chat_sdk/models/v2_tim_friend_info.dart';
import 'package:tencent_cloud_chat_sdk/models/v2_tim_value_callback.dart';
import 'package:tencent_cloud_chat_sdk/tencent_im_sdk_plugin.dart';
import 'package:tencent_conference_uikit/common/index.dart';
import 'package:tencent_conference_uikit/manager/conference_list_manager.dart';
import 'package:tencent_conference_uikit/pages/schedule_details/controller.dart';

import 'widgets/widgets.dart';

class ScheduleConferenceController extends GetxController {
  ScheduleConferenceController(this.conferenceInfo, this.selectedAttendeesList);

  final TUIConferenceInfo? conferenceInfo;
  final List<TUIUserInfo>? selectedAttendeesList;

  final ScrollController scrollController = ScrollController();
  final TextEditingController roomNameController = TextEditingController();

  RxString roomTypeString = 'freeToSpeakRoom'.roomTr.obs;
  RxString startTimeString = ''.obs;
  RxString roomDurationString = ''.obs;
  RxString timeZoneString = ''.obs;
  RxBool isMuteAll = false.obs;
  RxBool isDisableAllVideo = false.obs;

  bool _isSeatEnabled = false;
  TUISeatMode _seatMode = TUISeatMode.freeToTake;
  DateTime _chosenTime = DateTime.now();
  DateTime _startTime = DateTime.now();
  Duration _chosenDuration = const Duration(minutes: 30);
  Duration roomDuration = const Duration(minutes: 30);
  int _roomDurationMins = 30;
  int _roomDurationHrs = 0;
  int _localTimeZoneIndex = 0;
  int _currentTimeZoneIndex = 0;
  bool _isOperating = false;
  late final bool _isModify = conferenceInfo != null;
  int _retries = 0;
  final int _maxRetries = 10;

  double timeZoneOffsetInHour =
      DateTime.now().timeZoneOffset.inSeconds / 3600.0;
  String addAttendeesText = 'add'.roomTr;
  List<UserInfo> friendList = [];
  RxList<UserInfo> selectedAttendees = RxList<UserInfo>();
  List<String> selectedAttendeesUserId = [];
  List<String> _initialAttendeesUserId = [];

  final int _numberOfDigits = 6;
  final List<TimeZone> timeZones = [
    TimeZone(offset: -11.0, name: 'SST'.roomTr),
    TimeZone(offset: -10.0, name: 'HST'.roomTr),
    TimeZone(offset: -9.5, name: 'MIT'.roomTr),
    TimeZone(offset: -9.0, name: 'AST'.roomTr),
    TimeZone(offset: -8.0, name: 'PST'.roomTr),
    TimeZone(offset: -7.0, name: 'PNT'.roomTr),
    TimeZone(offset: -7.0, name: 'MST'.roomTr),
    TimeZone(offset: -6.0, name: 'CST'.roomTr),
    TimeZone(offset: -5.0, name: 'EST'.roomTr),
    TimeZone(offset: -5.0, name: 'IET'.roomTr),
    TimeZone(offset: -4.0, name: 'PRT'.roomTr),
    TimeZone(offset: -3.5, name: 'CNT'.roomTr),
    TimeZone(offset: -3.0, name: 'AGT'.roomTr),
    TimeZone(offset: -3.0, name: 'BET'.roomTr),
    TimeZone(offset: -2.0, name: 'FNT'.roomTr),
    TimeZone(offset: -1.0, name: 'CAT'.roomTr),
    TimeZone(offset: 0.0, name: 'GMT'.roomTr),
    TimeZone(offset: 1.0, name: 'ECT'.roomTr),
    TimeZone(offset: 2.0, name: 'EET'.roomTr),
    TimeZone(offset: 2.0, name: 'ART'.roomTr),
    TimeZone(offset: 3.0, name: 'EAT'.roomTr),
    TimeZone(offset: 3.5, name: 'MET'.roomTr),
    TimeZone(offset: 4.0, name: 'NET'.roomTr),
    TimeZone(offset: 4.5, name: 'AFT'.roomTr),
    TimeZone(offset: 5.0, name: 'PLT'.roomTr),
    TimeZone(offset: 5.5, name: 'IST'.roomTr),
    TimeZone(offset: 5.75, name: 'NPT'.roomTr),
    TimeZone(offset: 6.0, name: 'BST'.roomTr),
    TimeZone(offset: 6.5, name: 'MMT'.roomTr),
    TimeZone(offset: 7.0, name: 'VST'.roomTr),
    TimeZone(offset: 8.0, name: 'CTT'.roomTr),
    TimeZone(offset: 9.0, name: 'JST'.roomTr),
    TimeZone(offset: 9.5, name: 'ACT'.roomTr),
    TimeZone(offset: 10.0, name: 'AET'.roomTr),
    TimeZone(offset: 10.5, name: 'LHST'.roomTr),
    TimeZone(offset: 11.0, name: 'VUT'.roomTr),
    TimeZone(offset: 12.0, name: 'NST'.roomTr),
    TimeZone(offset: 12.75, name: 'CHAST'.roomTr),
    TimeZone(offset: 13.0, name: 'PHOT'.roomTr),
    TimeZone(offset: 14.0, name: 'LINT'.roomTr),
  ];

  @override
  onInit() {
    _initRoomName();
    _initRoomType();
    _initStartTime();
    _initDuration();
    _getInitTimeZone();
    _initAttendees();
    roomNameController.addListener(_removeLeadingSpaces);
    super.onInit();
  }

  void _initRoomName() async {
    if (_isModify) {
      roomNameController.text = conferenceInfo?.basicRoomInfo.name ?? '';
    } else {
      final userId = TUIRoomEngine.getSelfInfo().userId;
      final infoList = await TencentImSDKPlugin.v2TIMManager
          .getUsersInfo(userIDList: [userId]);
      final selfInfo = infoList.data?.first;
      final name = selfInfo?.nickName ?? userId;
      roomNameController.text = name + 'temporaryRoom'.roomTr;
    }
  }

  void _initRoomType() {
    if (!_isModify) {
      return;
    }
    _isSeatEnabled = conferenceInfo!.basicRoomInfo.isSeatEnabled;
    _seatMode = conferenceInfo!.basicRoomInfo.seatMode;
    roomTypeString.value = _isSeatEnabled
        ? 'onStageSpeakingRoom'.roomTr
        : 'freeToSpeakRoom'.roomTr;
  }

  void _initStartTime() {
    if (_isModify) {
      DateTime startUtcDateTime = DateTime.fromMillisecondsSinceEpoch(
        conferenceInfo!.scheduleStartTime! * 1000,
        isUtc: true,
      );
      _startTime = startUtcDateTime.toLocal();
    } else {
      _startTime = _roundToNext5Minutes(DateTime.now());
    }
    _chosenTime = _startTime;
    startTimeString.value = _chosenTime.format;
  }

  void _initDuration() {
    if (_isModify) {
      int duration =
          conferenceInfo!.scheduleEndTime! - conferenceInfo!.scheduleStartTime!;
      _roomDurationHrs = duration ~/ 3600;
      _roomDurationMins = (duration % 3600) ~/ 60;
    }
    roomDurationString.value = _formatRoomDuration();
    roomDuration =
        Duration(hours: _roomDurationHrs, minutes: _roomDurationMins);
  }

  Future<void> _initAttendees() async {
    bool isNeedToGetFriends = false;
    try {
      final String response =
          await rootBundle.loadString('assets/members.json');
      final List<dynamic> data = json.decode(response);
      final List<UserInfo> users =
          data.map((json) => UserInfo.fromJson(json)).toList();

      friendList = users;
    } catch (error) {
      isNeedToGetFriends = true;
    }
    if (isNeedToGetFriends) {
      await _getIMFriends();
    }
    if (_isModify) {
      selectedAttendeesUserId =
          selectedAttendeesList!.map((attendee) => attendee.userId).toList();
      _initialAttendeesUserId = List.from(selectedAttendeesUserId);
      selectedAttendees.value = friendList
          .where((friend) => selectedAttendeesUserId.contains(friend.userId))
          .toList();
    }
  }

  Future<void> _getIMFriends() async {
    if (friendList.isNotEmpty) {
      return;
    }
    V2TimValueCallback<List<V2TimFriendInfo>> friendListRes =
        await TencentImSDKPlugin.v2TIMManager
            .getFriendshipManager()
            .getFriendList();
    friendList = friendListRes.data != null
        ? friendListRes.data!
            .map((source) => UserInfo.fromV2TimFriendInfo(source))
            .toList()
        : [];
  }

  void _removeLeadingSpaces() {
    String text = roomNameController.text;
    if (text.startsWith(' ')) {
      roomNameController.text = text.trimLeft();
      roomNameController.selection =
          TextSelection.fromPosition(const TextPosition(offset: 0));
    }
  }

  String _formatRoomDuration() {
    String hoursString =
        _roomDurationHrs != 0 ? '$_roomDurationHrs${'hour'.roomTr}' : '';
    String minsString =
        _roomDurationMins != 0 ? '$_roomDurationMins${'minute'.roomTr}' : '';
    return hoursString + minsString;
  }

  int _getUTCTimeStamp(DateTime dateTime) {
    double offset = timeZones[_currentTimeZoneIndex].offset -
        timeZones[_localTimeZoneIndex].offset;
    Duration offsetDuration = Duration(
        hours: offset.toInt(),
        minutes: ((offset - offset.toInt()) * 60).toInt());
    DateTime utcDateTime = dateTime.subtract(offsetDuration);
    int utcTimestamp = utcDateTime.millisecondsSinceEpoch ~/ 1000;
    return utcTimestamp;
  }

  bool _isStringOver100Bytes(String input) {
    List<int> utf8Bytes = utf8.encode(input);
    int byteLength = utf8Bytes.length;
    return byteLength > 100;
  }

  void onButtonPressed() async {
    if (roomNameController.text.isEmpty) {
      makeToast(msg: 'conferenceNameEmptyToast'.roomTr);
      return;
    }
    if (_isStringOver100Bytes(roomNameController.text)) {
      makeToast(msg: 'conferenceNameTooLong'.roomTr);
      return;
    }
    if (_isOperating) {
      return;
    }
    _isOperating = true;

    int conferenceStartTime = _getUTCTimeStamp(_startTime);
    int conferenceEndTime =
        conferenceStartTime + _roomDurationHrs * 3600 + _roomDurationMins * 60;

    if (!_isModify) {
      await _scheduleRoom(conferenceStartTime, conferenceEndTime);
    } else {
      await _updateConferenceInfo(conferenceStartTime, conferenceEndTime);
    }

    _isOperating = false;
  }

  Future<void> _scheduleRoom(
      int conferenceStartTime, int conferenceEndTime) async {
    if (_startTime.isBefore(_getTimeWithoutSeconds(DateTime.now()))) {
      makeToast(msg: 'startTimeEarlierToast'.roomTr);
      return;
    }

    String? roomId = await _getRoomId();
    if (roomId == null) {
      makeToast(msg: 'roomIdErrorToast'.roomTr);
      return;
    }
    TUIRoomInfo roomInfo = TUIRoomInfo(roomId: roomId);
    roomInfo
      ..name = roomNameController.text
      ..isSeatEnabled = _isSeatEnabled
      ..seatMode = _seatMode
      ..isMicrophoneDisableForAllUser = isMuteAll.value
      ..isCameraDisableForAllUser = isDisableAllVideo.value;
    TUIConferenceInfo conferenceInfo = TUIConferenceInfo(
      basicRoomInfo: roomInfo,
      scheduleStartTime: conferenceStartTime,
      scheduleEndTime: conferenceEndTime,
      reminderSecondsBeforeStart: 0,
      scheduleAttendees: selectedAttendeesUserId,
    );
    var result =
        await ConferenceListManager().scheduleConference(conferenceInfo);
    if (result.code == TUIError.success) {
      Get.back();
      showConferenceBottomSheet(
        InviteSheetWidget(
          title: 'bookingSuccessfulTitle'.roomTr,
          roomId: roomId,
          backgroundColor: Colors.white,
          titleColor: RoomColors.btnGrey,
          infoTextColor: RoomColors.btnGrey,
          copyButtonColor: RoomColors.switchTrackGrey,
          copyButtonTextColor: RoomColors.btnGrey,
        ),
      );
    } else {
      makeToast(msg: result.message ?? "error");
    }
    _isOperating = false;
  }

  Future<void> _updateConferenceInfo(
      int conferenceStartTime, int conferenceEndTime) async {
    if (Get.find<ScheduleDetailsController>().isConferenceStarted.value) {
      makeToast(msg: 'conferenceStartedToast'.roomTr);
      Get.back();
      return;
    }
    var updateRes = await ConferenceListManager().updateConferenceInfo(
        conferenceInfo!.basicRoomInfo.roomId,
        roomName: roomNameController.text,
        scheduleStartTime: conferenceStartTime,
        scheduleEndTime: conferenceEndTime);
    if (updateRes.code != TUIError.success) {
      makeToast(msg: updateRes.message ?? "error");
    }
    Get.back();

    Set<String> selectedSet = selectedAttendeesUserId.toSet();
    Set<String> initialSet = _initialAttendeesUserId.toSet();
    List<String> addedUserIds = selectedSet.difference(initialSet).toList();
    List<String> removedUserIds = initialSet.difference(selectedSet).toList();

    if (addedUserIds.isNotEmpty) {
      ConferenceListManager().addAttendeesByAdmin(
          conferenceInfo!.basicRoomInfo.roomId, addedUserIds);
    }
    if (removedUserIds.isNotEmpty) {
      ConferenceListManager().removeAttendeesByAdmin(
          conferenceInfo!.basicRoomInfo.roomId, removedUserIds);
    }
  }

  Future<String?> _getRoomId() async {
    Random random = Random();
    int minNumber = pow(10, _numberOfDigits - 1).toInt();
    int maxNumber = pow(10, _numberOfDigits).toInt() - 1;
    int randomNumber = random.nextInt(maxNumber - minNumber) + minNumber;
    String roomId = randomNumber.toString();
    if (!await checkIfRoomIdExists(roomId)) {
      return roomId;
    } else {
      _retries++;
      if (_retries > _maxRetries) {
        return null;
      }
      return _getRoomId();
    }
  }

  Future<bool> checkIfRoomIdExists(String roomId) async {
    var result = await V2TIMManager()
        .getGroupManager()
        .getGroupsInfo(groupIDList: [roomId]);
    if (result.data?.first.resultCode == 0) {
      return true;
    } else {
      return false;
    }
  }

  void changeRoomType(String value) {
    roomTypeString.value = value.roomTr;
    _isSeatEnabled = value == 'onStageSpeakingRoom'.tr;
    _seatMode = value == 'onStageSpeakingRoom'.tr
        ? TUISeatMode.applyToTake
        : TUISeatMode.freeToTake;
  }

  DateTime _roundToNext5Minutes(DateTime dateTime) {
    int minute = dateTime.minute;
    int remainder = minute % 5;
    int addMinutes = remainder == 0 ? 0 : 5 - remainder;
    DateTime roundedTime = dateTime.add(Duration(minutes: addMinutes));
    return _getTimeWithoutSeconds(roundedTime);
  }

  DateTime _getTimeWithoutSeconds(DateTime dateTime) {
    return DateTime(
      dateTime.year,
      dateTime.month,
      dateTime.day,
      dateTime.hour,
      dateTime.minute,
    );
  }

  void showStartTimeSelector() {
    DateTime now = _getNowOfTimeZone();
    _chosenTime = _roundToNext5Minutes(_startTime);
    _chosenTime = _chosenTime.isBefore(now) ? now : _chosenTime;
    startTimeString.value = _chosenTime.format;
    _startTime = _chosenTime;
    showConferenceBottomSheet(const StartTimeSelector());
  }

  void onStartTimeChanged(DateTime value) {
    _chosenTime = value;
  }

  void confirmStartTime() {
    _startTime = _chosenTime;
    startTimeString.value = _startTime.format;
    Get.back();
  }

  DateTime _getNowOfTimeZone() {
    double offsetDifference = timeZones[_currentTimeZoneIndex].offset -
        timeZones[_localTimeZoneIndex].offset;
    Duration durationToAdd = Duration(
      hours: offsetDifference.toInt(),
      minutes: ((offsetDifference - offsetDifference.toInt()) * 60).toInt(),
    );
    return _roundToNext5Minutes(DateTime.now().add(durationToAdd));
  }

  DateTime getSelectorMinTime() {
    DateTime now = _getNowOfTimeZone();
    return _chosenTime.isBefore(now) ? _chosenTime : now;
  }

  DateTime getSelectorInitTime() {
    DateTime now = _getNowOfTimeZone();
    return _chosenTime.isBefore(now) ? now : _chosenTime;
  }

  void showDurationSelector() {
    _chosenDuration = roomDuration;
    roomDurationString.value = _formatRoomDuration();
    showConferenceBottomSheet(const RoomDurationSelector());
  }

  void onRoomDurationChanged(Duration value) {
    _chosenDuration = value;
  }

  void confirmDuration() {
    if (_chosenDuration.inMinutes < 15) {
      makeToast(msg: 'minDurationToast'.roomTr);
      return;
    }
    roomDuration = _chosenDuration;
    _roomDurationHrs = _chosenDuration.inHours;
    _roomDurationMins = _chosenDuration.inMinutes % 60;
    roomDurationString.value = _formatRoomDuration();
    Get.back();
  }

  void updateTimeZone(int index) {
    TimeZone timeZone = timeZones[index];
    timeZoneString.value = timeZone.formatTimeZoneName();
    timeZones[_currentTimeZoneIndex].isSelected = false;
    timeZone.isSelected = true;

    double offsetDifference =
        timeZone.offset - timeZones[_currentTimeZoneIndex].offset;
    _startTime = _startTime.add(Duration(
        hours: offsetDifference.toInt(),
        minutes: ((offsetDifference - offsetDifference.toInt()) * 60).toInt()));
    startTimeString.value = _startTime.format;

    _currentTimeZoneIndex = index;

    Get.back();
  }

  void _getInitTimeZone() {
    for (int index = 0; index < timeZones.length; index++) {
      if (timeZones[index].offset == timeZoneOffsetInHour) {
        timeZoneString.value = timeZones[index].formatTimeZoneName();
        timeZones[index].isSelected = true;
        _currentTimeZoneIndex = index;
        _localTimeZoneIndex = index;
        break;
      }
    }
  }

  void _scrollToSelectedTimeZone() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      double targetScrollOffset = _currentTimeZoneIndex * 50;
      double maxScrollOffset = scrollController.position.maxScrollExtent;

      if (targetScrollOffset > maxScrollOffset) {
        targetScrollOffset = maxScrollOffset;
      }
      scrollController.animateTo(
        targetScrollOffset,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    });
  }

  void getToTimeZoneSelector() {
    Get.to(() => const TimeZoneSelector());
    _scrollToSelectedTimeZone();
  }

  void changeAllUserAudioState(bool value) {
    isMuteAll.value = value;
  }

  void changeAllUserVideoState(bool value) {
    isDisableAllVideo.value = value;
  }

  @override
  void onClose() {
    roomNameController.removeListener(_removeLeadingSpaces);
    roomNameController.dispose();
    scrollController.dispose();
    super.onClose();
  }
}
