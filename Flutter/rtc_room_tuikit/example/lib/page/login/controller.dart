import 'package:get/get.dart';

import '../../common/routers/routes.dart';
import 'package:rtc_room_engine/api/room/tui_room_define.dart';
import 'package:rtc_room_engine/api/room/tui_room_engine.dart';
import 'package:rtc_room_engine/api/common/tui_common_define.dart';
import '../../debug/generate_test_user_sig.dart';

class LoginController extends GetxController {
  LoginController();

  _initData() {
    update(["login"]);
  }

  void onTap() {}

  @override
  void onReady() {
    super.onReady();
    _initData();
  }

  login(String userId) async {
    if (userId.isEmpty) {
      Get.snackbar('userId输入异常', '您输入的userId为空',
          snackPosition: SnackPosition.BOTTOM);
      return;
    }
    TUIActionCallback actionCallback = await TUIRoomEngine.login(GenerateTestUserSig.sdkAppId, userId, GenerateTestUserSig.genTestSig(userId));
    if (actionCallback.code == TUIError.success) {
      Get.toNamed(AppRoutes.roomEntrance);
    } else {
      Get.snackbar(actionCallback.code.toString(), actionCallback.message ?? "", snackPosition: SnackPosition.BOTTOM);
    }
  }
}
