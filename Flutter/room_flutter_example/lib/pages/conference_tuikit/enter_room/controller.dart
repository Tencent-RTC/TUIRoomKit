import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:room_flutter_example/common/store/user.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_conference_tui_kit/rtc_conference_tui_kit.dart';

class EnterRoomController extends GetxController {
  EnterRoomController();
  var isOperating = false;
  final roomIdController = TextEditingController();

  getUserName() {
    return UserStore.to.userModel.userName;
  }

  enterRoom() async {
    if (isOperating) {
      return;
    }
    if (roomIdController.text.isEmpty) {
      makeToast(msg: 'nullRoomId'.tr);
      return;
    }
    isOperating = true;
    ConferenceSession.newInstance(roomIdController.text)
      ..isMuteMicrophone = !UserStore.to.openMicrophone.value
      ..isOpenCamera = UserStore.to.openCamera.value
      ..isSoundOnSpeaker = UserStore.to.userSpeaker.value
      ..onActionSuccess = _enterRoomSuccess
      ..onActionError = _enterRoomError
      ..join();
  }

  void _enterRoomSuccess() {
    isOperating = false;
    Get.to(const ConferenceMainPage());
  }

  void _enterRoomError(ConferenceError error, String message) {
    isOperating = false;
    makeToast(msg: "code: $error message: $message");
  }
}
