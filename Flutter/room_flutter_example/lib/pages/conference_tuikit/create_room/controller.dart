import 'dart:math';
import 'package:get/get.dart';
import 'package:room_flutter_example/common/index.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_conference_tui_kit/rtc_conference_tui_kit.dart';

class CreateRoomController extends GetxController {
  var isOperating = false;
  CreateRoomController();
  final int numberOfDigits = 6;
  RxString roomTypeString = 'freeToSpeakRoom'.tr.obs;
  RxString chooseSpeechMode = 'freeToSpeakRoom'.obs;
  var _isSeatControlEnable = false;

  void cancelAction() {
    Get.back();
  }

  void sureAction() {
    if (chooseSpeechMode.value == 'freeToSpeakRoom') {
      _isSeatControlEnable = false;
      roomTypeString.value = 'freeToSpeakRoom'.tr;
    } else {
      _isSeatControlEnable = true;
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
    isOperating = true;
    ConferenceSession.newInstance(_getRoomId())
      ..name = UserStore.to.userModel.userName
      ..enableSeatControl = _isSeatControlEnable
      ..isMuteMicrophone = !UserStore.to.openMicrophone.value
      ..isOpenCamera = UserStore.to.openCamera.value
      ..isSoundOnSpeaker = UserStore.to.userSpeaker.value
      ..onActionSuccess = _createRoomSuccess
      ..onActionError = _createRoomError
      ..quickStart();
    isOperating = false;
  }

  void _createRoomSuccess() {
    Get.to(const ConferenceMainPage());
  }

  void _createRoomError(ConferenceError error, String message) {
    makeToast(msg: "code: $error message: $message");
  }
}
