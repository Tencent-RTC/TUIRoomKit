import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:room_flutter_example/common/store/user.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_conference_tui_kit/rtc_conference_tuikit.dart';
import 'package:rtc_room_engine/api/common/tui_common_define.dart';

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
    var roomKit = TUIRoomKit.createInstance();
    var result = await roomKit.enterRoom(
        roomIdController.text,
        UserStore.to.openMicrophone.value,
        UserStore.to.openCamera.value,
        UserStore.to.userSpeaker.value);
    isOperating = false;
    if (result.code != TUIError.success) {
      makeToast(msg: result.message!);
    }
  }
}
