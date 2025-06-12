import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:room_flutter_example/common/index.dart';
import 'package:room_flutter_example/debug/index.dart';
import 'package:rtc_room_engine/rtc_room_engine.dart';
import 'package:tencent_cloud_chat_message/tencent_cloud_chat_message.dart';
import 'package:tencent_cloud_chat_sticker/tencent_cloud_chat_sticker.dart';
import 'package:tencent_cloud_chat_sticker/tencent_cloud_chat_sticker_init_data.dart';
import 'package:tencent_cloud_chat_common/tencent_cloud_chat_common.dart';
import 'package:tencent_cloud_chat_common/models/tencent_cloud_chat_models.dart';
import 'package:tencent_cloud_chat_common/components/component_config/tencent_cloud_chat_message_config.dart';
import 'package:tencent_cloud_chat_common/components/component_config/tencent_cloud_chat_message_common_defines.dart';

class LoginController extends GetxController {
  LoginController();
  final userIdController = TextEditingController();

  FocusNode focusNode = FocusNode();

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
    final userSig = GenerateTestUserSig.genTestSig(userId);
    var loginResult = await TUIRoomEngine.login(
        GenerateTestUserSig.sdkAppId, userId, userSig);
    await TencentCloudChat.controller.initUIKit(
      options: TencentCloudChatInitOptions(
        sdkAppID: GenerateTestUserSig.sdkAppId,
        userID: userId,
        userSig: userSig,
      ),
      components: TencentCloudChatInitComponentsRelated(
        usedComponentsRegister: [TencentCloudChatMessageManager.register],
        componentConfigs: TencentCloudChatComponentConfigs(
          messageConfig: TencentCloudChatMessageConfig(
            showMessageSenderName: ({groupID, topicID, userID}) => true,
            showSelfAvatar: ({groupID, topicID, userID}) => true,
            defaultMessageMenuConfig: ({groupID, topicID, userID}) =>
                TencentCloudChatMessageDefaultMessageMenuConfig(
              enableMessageForward: false,
              enableMessageSelect: false,
            ),
          ),
        ),
      ),
      config: const TencentCloudChatConfig(brightness: Brightness.light),
      plugins: [
        TencentCloudChatPluginItem(
          name: "sticker",
          initData: TencentCloudChatStickerInitData(
            useDefaultSticker: true,
            useDefaultCustomFace_4350: false,
            useDefaultCustomFace_4351: false,
            useDefaultCustomFace_4352: false,
            userID: userId,
          ).toJson(),
          pluginInstance: TencentCloudChatStickerPlugin(
            context: Get.context!,
          ),
        ),
      ],
    );
    if (loginResult.code == TUIError.success) {
      UserStore.to.userModel.userId = userId;
      final targetRoute = haveLoggedInBefore == true
          ? RouteNames.conferencePrepare
          : (await _shouldSetProfile()
              ? RouteNames.commonProfile
              : RouteNames.conferencePrepare);
      Get.toNamed(targetRoute);
      focusNode.unfocus();
    } else {
      Get.snackbar("error",
          "login error,code:${loginResult.code},msg:${loginResult.message}",
          snackPosition: SnackPosition.BOTTOM);
    }
  }

  Future<bool> _shouldSetProfile() async {
    final infoList = await TencentImSDKPlugin.v2TIMManager
        .getUsersInfo(userIDList: [UserStore.to.userModel.userId]);
    final selfInfo = infoList.data?.first;

    if (selfInfo == null ||
        selfInfo.nickName == null ||
        selfInfo.nickName!.isEmpty ||
        selfInfo.faceUrl == null ||
        selfInfo.faceUrl!.isEmpty) {
      return true;
    }

    UserStore.to.userModel
      ..userName = selfInfo.nickName!
      ..avatarURL = selfInfo.faceUrl!;
    UserStore.to.saveUserModel();

    return false;
  }
}
