import 'package:get/get.dart';

import '../../store/index.dart';

class UserMediaSettingController extends GetxController {
  UserMediaSettingController();

  _initData() {
    update(["user_media_setting"]);
  }

  @override
  void onReady() {
    super.onReady();
    _initData();
  }

  openCamera(bool isOpen) {
    UserStore.to.isOpenCamera = isOpen;
  }

  openMicrophone(bool isOpen) {
    UserStore.to.isOpenMicrophone = isOpen;
  }

  userSpeaker(bool isSpeaker) {
    UserStore.to.isUserSpeaker = isSpeaker;
  }
}
