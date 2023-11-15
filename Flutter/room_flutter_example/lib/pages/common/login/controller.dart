import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:room_flutter_example/common/index.dart';
import 'package:room_flutter_example/debug/index.dart';
import 'package:rtc_room_engine/rtc_room_engine.dart';

class LoginController extends GetxController {
  LoginController();
  final userIdController = TextEditingController();

  @override
  void onReady() {
    super.onReady();
    autoLogin();
  }

  autoLogin() async {
    if (UserStore.to.haveLoggedInBefore()) {
      UserStore.to.loadUserModel();
      var result = await TUIRoomEngine.login(
          GenerateTestUserSig.sdkAppId,
          UserStore.to.userModel.userId,
          GenerateTestUserSig.genTestSig(UserStore.to.userModel.userId));
      if (result.code == TUIError.success) {
        Get.toNamed(RouteNames.commonMain);
      } else {
        Get.snackbar(
            "error", "login error,code:${result.code},msg:${result.message}",
            snackPosition: SnackPosition.BOTTOM);
      }
    }
  }

  login() async {
    if (userIdController.text.isEmpty) {
      Get.snackbar("error", "userId is empty",
          snackPosition: SnackPosition.BOTTOM);
      return;
    }
    var result = await TUIRoomEngine.login(
        GenerateTestUserSig.sdkAppId,
        userIdController.text,
        GenerateTestUserSig.genTestSig(userIdController.text));
    if (result.code == TUIError.success) {
      UserStore.to.userModel.userId = userIdController.text;
      Get.toNamed(RouteNames.commonProfile);
    } else {
      Get.snackbar(
          "error", "login error,code:${result.code},msg:${result.message}",
          snackPosition: SnackPosition.BOTTOM);
    }
  }
}
