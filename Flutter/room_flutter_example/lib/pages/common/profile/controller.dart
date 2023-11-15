import 'dart:math';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:room_flutter_example/common/index.dart';
import 'package:rtc_conference_tui_kit/rtc_conference_tuikit.dart';

class ProfileController extends GetxController {
  ProfileController();
  final userNameController = TextEditingController();

  _initData() {
    userNameController.text = _getRandomUserName();
  }

  @override
  void onReady() {
    super.onReady();
    _initData();
  }

  _getRandomUserName() {
    var index = Random().nextInt(Constants.userNameArray.length);
    return Constants.userNameArray.elementAt(index).tr;
  }

  getRandomAvatarURL() {
    var index = Random().nextInt(Constants.userAvatarURLArray.length);
    var avatarURL = Constants.userAvatarURLArray.elementAt(index);
    UserStore.to.userModel.avatarURL = avatarURL;
    return avatarURL;
  }

  toMainPage() {
    if (userNameController.text.isEmpty) {
      Get.snackbar("error", "userName is empty",
          snackPosition: SnackPosition.BOTTOM);
      return;
    }
    UserStore.to.userModel.userName = userNameController.text;
    UserStore.to.saveUserModel();
    var roomKit = TUIRoomKit.createInstance();
    roomKit.setSelfInfo(
        UserStore.to.userModel.userName, UserStore.to.userModel.avatarURL);
    Get.toNamed(RouteNames.commonMain);
  }
}
