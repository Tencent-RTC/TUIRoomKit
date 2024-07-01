import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:room_flutter_example/common/index.dart';
import 'package:room_flutter_example/debug/index.dart';
import 'package:rtc_room_engine/rtc_room_engine.dart';
import 'package:tencent_cloud_chat_sdk/enum/V2TimSDKListener.dart';
import 'package:tencent_cloud_chat_sdk/enum/log_level_enum.dart';
import 'package:tencent_cloud_chat_sdk/models/v2_tim_callback.dart';
import 'package:tencent_cloud_chat_sdk/tencent_im_sdk_plugin.dart';

class LoginController extends GetxController {
  LoginController();
  final userIdController = TextEditingController();

  @override
  Future<void> onReady() async {
    super.onReady();
    await Get.putAsync<StorageService>(() => StorageService().init());
    autoLogin();
    if (TranslationService.isSetLanguageBefore()) {
      Get.updateLocale(Locale(TranslationService.loadLanguage()));
    }
  }

  autoLogin() async {
    if (UserStore.to.haveLoggedInBefore()) {
      UserStore.to.loadUserModel();
      await _loginRoomAndIm(UserStore.to.userModel.userId,
          haveLoggedInBefore: true);
    }
  }

  login() async {
    if (userIdController.text.isEmpty) {
      Get.snackbar("error", "userId is empty",
          snackPosition: SnackPosition.BOTTOM);
      return;
    }
    await _loginRoomAndIm(userIdController.text);
  }

  _loginRoomAndIm(String userId, {bool? haveLoggedInBefore}) async {
    var roomLoginResult = await TUIRoomEngine.login(
        GenerateTestUserSig.sdkAppId,
        userId,
        GenerateTestUserSig.genTestSig(userId));
    await TencentImSDKPlugin.v2TIMManager.initSDK(
        sdkAppID: GenerateTestUserSig.sdkAppId,
        loglevel: LogLevelEnum.V2TIM_LOG_INFO,
        listener: V2TimSDKListener());
    V2TimCallback imLoginResult = await TencentImSDKPlugin.v2TIMManager
        .login(userID: userId, userSig: GenerateTestUserSig.genTestSig(userId));
    if (roomLoginResult.code == TUIError.success && imLoginResult.code == 0) {
      UserStore.to.userModel.userId = userId;
      Get.toNamed(haveLoggedInBefore == true
          ? RouteNames.commonMain
          : RouteNames.commonProfile);
    } else {
      Get.snackbar("error",
          "login error,code:${roomLoginResult.code},msg:${roomLoginResult.message}",
          snackPosition: SnackPosition.BOTTOM);
    }
  }
}
