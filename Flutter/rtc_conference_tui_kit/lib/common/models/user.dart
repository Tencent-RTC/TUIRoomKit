import 'package:get/get.dart';
import 'package:rtc_room_engine/api/room/tui_room_define.dart';

class UserModel {
  UserModel();
  UserModel.fromTUIUserInfo(TUIUserInfo userInfo) {
    userId.value = userInfo.userId;
    userName.value = userInfo.userName;
    userAvatarURL.value = userInfo.avatarUrl;
    userRole.value = userInfo.userRole;
    hasVideoStream.value = userInfo.hasVideoStream!;
    hasAudioStream.value = userInfo.hasAudioStream!;
    hasScreenStream.value = userInfo.hasScreenStream!;
  }
  var userId = ''.obs;
  var userName = ''.obs;
  var userAvatarURL = ''.obs;
  var userRole = TUIRole.generalUser.obs;
  var hasAudioStream = false.obs;
  var hasVideoStream = false.obs;
  var hasScreenStream = false.obs;
  var ableSendingMessage = true.obs;
  var isOnSeat = false.obs;
  var isTalking = false.obs;
}
