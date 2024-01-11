import 'dart:math';
import 'package:get/get.dart';
import 'package:room_flutter_example/common/index.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_conference_tui_kit/rtc_conference_tuikit.dart';
import 'package:rtc_room_engine/rtc_room_engine.dart';

class CreateRoomController extends GetxController {
  var isOperating = false;
  CreateRoomController();
  final int numberOfDigits = 6;
  RxString roomTypeString = 'freeToSpeakRoom'.tr.obs;
  RxString chooseSpeechMode = 'freeToSpeakRoom'.obs;
  var _isSeatEnabled = false;
  var _takeSeatMode = TUISeatMode.freeToTake;

  void cancelAction() {
    Get.back();
  }

  void sureAction() {
    if (chooseSpeechMode.value == 'freeToSpeakRoom') {
      _isSeatEnabled = false;
      _takeSeatMode = TUISeatMode.freeToTake;
      roomTypeString.value = 'freeToSpeakRoom'.tr;
    } else {
      _isSeatEnabled = true;
      _takeSeatMode = TUISeatMode.applyToTake;
      roomTypeString.value = 'applyToSpeakRoom'.tr;
    }
    Get.back();
  }

  String _getRoomId() {
    Random random = Random();
    int minNumber = pow(10, numberOfDigits - 1).toInt();
    int maxNumber = pow(10, numberOfDigits).toInt() - 1;
    int randomNumber = random.nextInt(maxNumber - minNumber) + minNumber;
    String roomId = randomNumber.toString();
    return roomId;
  }

  void createRoom() async {
    if (isOperating) {
      return;
    }

    var roomKit = TUIRoomKit.createInstance();
    TUIRoomInfo roomInfo = TUIRoomInfo(roomId: _getRoomId());
    roomInfo.name = UserStore.to.userModel.userName;
    roomInfo.isSeatEnabled = _isSeatEnabled;
    roomInfo.seatMode = _takeSeatMode;
    isOperating = true;
    var createRoomResult = await roomKit.createRoom(roomInfo);
    if (createRoomResult.code == TUIError.success) {
      var enterRoomResult = await roomKit.enterRoom(
          roomInfo.roomId,
          UserStore.to.openMicrophone.value,
          UserStore.to.openCamera.value,
          UserStore.to.userSpeaker.value);

      if (enterRoomResult.code != TUIError.success) {
        makeToast(msg: enterRoomResult.message!);
      }
    } else {
      makeToast(msg: createRoomResult.message!);
    }
    isOperating = false;
  }
}
