import 'package:get/get.dart';
import 'package:room_flutter_example/common/index.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_conference_tui_kit/rtc_conference_tuikit.dart';
import 'package:rtc_room_engine/rtc_room_engine.dart';

class CreateRoomController extends GetxController {
  CreateRoomController();
  RxString roomTypeString = 'freeToSpeakRoom'.tr.obs;

  RxString chooseSpeechMode = 'freeToSpeakRoom'.obs;
  var roomSpeechMode = TUISpeechMode.freeToSpeak;

  void cancelAction() {
    Get.back();
  }

  void sureAction() {
    roomSpeechMode = chooseSpeechMode.value == 'freeToSpeakRoom'
        ? TUISpeechMode.freeToSpeak
        : TUISpeechMode.speakAfterTakingSeat;
    switch (roomSpeechMode) {
      case TUISpeechMode.freeToSpeak:
        roomTypeString.value = 'freeToSpeakRoom'.tr;
        break;
      case TUISpeechMode.speakAfterTakingSeat:
        roomTypeString.value = 'applyToSpeakRoom'.tr;
        break;
      default:
        break;
    }
    Get.back();
  }

  getRoomId() {
    return (('${UserStore.to.userModel.userId}_room_kit').hashCode & 0x3B9AC9FF)
        .toString();
  }

  void createRoom() {
    var roomKit = TUIRoomKit.createInstance();
    TUIRoomInfo roomInfo = TUIRoomInfo(roomId: getRoomId());
    roomInfo.name = UserStore.to.userModel.userName;
    roomInfo.speechMode = roomSpeechMode;
    roomKit.createRoom(roomInfo).then((value) {
      if (value.code == TUIError.success) {
        roomKit
            .enterRoom(getRoomId(), UserStore.to.openMicrophone.value,
                UserStore.to.openCamera.value, UserStore.to.userSpeaker.value)
            .then((value) {
          if (value.code != TUIError.success) {
            makeToast(msg: value.message!);
          }
        });
      } else {
        makeToast(msg: value.message!);
      }
    });
  }
}
