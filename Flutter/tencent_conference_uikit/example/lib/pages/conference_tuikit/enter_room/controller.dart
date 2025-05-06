import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:room_flutter_example/common/store/user.dart';
import 'package:tencent_cloud_chat_message/tencent_cloud_chat_message.dart';
import 'package:tencent_conference_uikit/common/widgets/toast.dart';
import 'package:tencent_conference_uikit/tencent_conference_uikit.dart';
import 'package:tencent_cloud_chat_common/components/component_options/tencent_cloud_chat_message_options.dart';

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
    Get.to(
      () => ConferenceMainPage(
        chatWidget: TencentCloudChatMessage(
          options:
              TencentCloudChatMessageOptions(groupID: roomIdController.text),
        ),
      ),
    );
  }

  void _enterRoomError(ConferenceError error, String message) {
    isOperating = false;
    makeToast(msg: "code: $error message: $message");
  }
}
