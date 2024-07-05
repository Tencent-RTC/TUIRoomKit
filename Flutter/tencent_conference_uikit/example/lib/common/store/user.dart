import 'dart:convert';
import 'package:get/get.dart';
import '../index.dart';

class UserStore extends GetxController {
  UserModel userModel = UserModel(userId: "", userName: "", avatarURL: "");
  static UserStore get to => Get.find();
  final openMicrophone = true.obs;
  final userSpeaker = true.obs;
  final openCamera = true.obs;

  set isUserSpeaker(value) {
    userSpeaker.value = value;
  }

  set isOpenCamera(bool isOpen) {
    openCamera.value = isOpen;
  }

  set isOpenMicrophone(bool isOpen) {
    openMicrophone.value = isOpen;
  }

  Future<void> saveUserModel() async {
    StorageService.to
        .setString(Constants.storageUserModelKey, jsonEncode(userModel));
  }

  Future<void> loadUserModel() async {
    String jsonStr = StorageService.to.getString(Constants.storageUserModelKey);
    userModel = UserModel.fromJson(jsonDecode(jsonStr));
  }

  Future<void> destroyUserModel() async {
    StorageService.to.remove(Constants.storageUserModelKey);
  }

  bool haveLoggedInBefore() {
    return StorageService.to.containsKey(Constants.storageUserModelKey);
  }
}
