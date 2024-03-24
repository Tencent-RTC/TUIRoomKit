import 'dart:math';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:room_flutter_example/common/index.dart';
import 'package:rtc_room_engine/rtc_room_engine.dart';

class ProfileController extends GetxController {
  ProfileController();
  final userNameController = TextEditingController();

  _initData() {
    userNameController.text = _getRandomUserName();
    _getRandomAvatarURL();
  }

  @override
  void onInit() {
    super.onInit();
    _initData();
  }

  _getRandomUserName() {
    var index = Random().nextInt(Constants.userNameArray.length);
    return Constants.userNameArray.elementAt(index).tr;
  }

  _getRandomAvatarURL() {
    var index = Random().nextInt(Constants.userAvatarURLArray.length);
    var avatarURL = Constants.userAvatarURLArray.elementAt(index);
    UserStore.to.userModel.avatarURL = avatarURL;
  }

  toMainPage() {
    if (userNameController.text.isEmpty) {
      Get.snackbar("error", "userName is empty",
          snackPosition: SnackPosition.BOTTOM);
      return;
    }
    UserStore.to.userModel.userName = userNameController.text;
    UserStore.to.saveUserModel();
    TUIRoomEngine.setSelfInfo(
        UserStore.to.userModel.userName, UserStore.to.userModel.avatarURL);
    Get.toNamed(RouteNames.commonMain);
  }
}
