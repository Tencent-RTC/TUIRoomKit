import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:room_flutter_example/common/store/user.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_conference_tui_kit/rtc_conference_tuikit.dart';
import 'package:rtc_room_engine/api/common/tui_common_define.dart';

class EnterRoomController extends GetxController {
  EnterRoomController();
  final roomIdController = TextEditingController();

  getUserName() {
    return UserStore.to.userModel.userName;
  }

  enterRoom() {
    if (roomIdController.text.isEmpty) {
      makeToast(msg: 'nullRoomId'.tr);
      return;
    }
    var roomKit = TUIRoomKit.createInstance();
    roomKit
        .enterRoom(roomIdController.text, UserStore.to.openMicrophone.value,
            UserStore.to.openCamera.value, UserStore.to.userSpeaker.value)
        .then((value) {
      if (value.code != TUIError.success) {
        makeToast(msg: value.message!);
      }
    });
  }
}
