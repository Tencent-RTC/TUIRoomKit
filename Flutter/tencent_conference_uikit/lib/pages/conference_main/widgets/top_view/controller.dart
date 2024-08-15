import 'dart:async';

import 'package:get/get.dart';
import 'package:rtc_room_engine/rtc_room_engine.dart';
import 'package:tencent_conference_uikit/common/store/index.dart';
import 'package:tencent_conference_uikit/manager/conference_list_manager.dart';
import 'package:tencent_conference_uikit/manager/rtc_engine_manager.dart';
import 'package:tencent_conference_uikit/pages/conference_main/index.dart';

class TopViewController extends GetxController {
  TopViewController();

  final RoomEngineManager _engineManager = RoomEngineManager();
  late TUIRoomInfo roomInfo;
  RxString roomName = ''.obs;
  late TUIConferenceListManagerObserver observer;
  final conferenceMainController = Get.find<ConferenceMainController>();

  Timer? topMenuTimer;
  RxString timerText = '00:00'.obs;

  @override
  void onInit() {
    super.onInit();
    roomInfo = RoomStore.to.roomInfo;
    roomName.value = roomInfo.name ?? roomInfo.roomId;
    _initObserver();
    updateTimerLabelText();
  }

  void _initObserver() {
    observer = TUIConferenceListManagerObserver(
      onConferenceInfoChanged: (conferenceInfo, modifyFlagList) {
        if (conferenceInfo.basicRoomInfo.roomId == roomInfo.roomId &&
            modifyFlagList.contains(TUIConferenceModifyFlag.roomName)) {
          roomName.value = conferenceInfo.basicRoomInfo.name ??
              conferenceInfo.basicRoomInfo.roomId;
          roomInfo.name = roomName.value;
        }
      },
    );
    ConferenceListManager().addObserver(observer);
  }

  void updateTimerLabelText() {
    int currentTimeStamp = DateTime.now().millisecondsSinceEpoch;
    int totalSeconds =
        ((currentTimeStamp - RoomStore.to.timeStampOnEnterRoom) / 1000)
            .abs()
            .floor();

    updateTimer(totalSeconds: totalSeconds);

    topMenuTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      totalSeconds += 1;
      updateTimer(totalSeconds: totalSeconds);
    });
  }

  void updateTimer({required int totalSeconds}) {
    int second = totalSeconds % 60;
    int minute = (totalSeconds ~/ 60) % 60;
    int hour = totalSeconds ~/ 3600;

    if (hour > 0) {
      timerText.value =
          "${hour.toString().padLeft(2, '0')}:${minute.toString().padLeft(2, '0')}:${second.toString().padLeft(2, '0')}";
    } else {
      timerText.value =
          "${minute.toString().padLeft(2, '0')}:${second.toString().padLeft(2, '0')}";
    }
  }

  void switchSpeakerAction() {
    RoomStore.to.audioSetting.isSoundOnSpeaker.value =
        !RoomStore.to.audioSetting.isSoundOnSpeaker.value;
    _engineManager
        .setAudioRoute(RoomStore.to.audioSetting.isSoundOnSpeaker.value);
  }

  void switchCameraAction() {
    _engineManager.switchCamera();
  }

  @override
  void onClose() {
    super.onClose();
    topMenuTimer?.cancel();
    ConferenceListManager().removeObserver(observer);
  }
}
