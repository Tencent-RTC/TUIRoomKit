import 'dart:async';

import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/store/index.dart';
import 'package:tencent_conference_uikit/manager/rtc_engine_manager.dart';
import 'package:tencent_conference_uikit/pages/conference_main/index.dart';
import 'package:rtc_room_engine/api/room/tui_room_define.dart';

class TopViewController extends GetxController {
  TopViewController();

  final RoomEngineManager _engineManager = RoomEngineManager();
  late TUIRoomInfo roomInfo;
  final conferenceMainController = Get.find<ConferenceMainController>();

  Timer? topMenuTimer;
  RxString timerText = '00:00'.obs;

  @override
  void onInit() {
    super.onInit();
    roomInfo = RoomStore.to.roomInfo;
    updateTimerLabelText();
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
  }
}
