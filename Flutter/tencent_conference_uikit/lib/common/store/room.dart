import 'package:get/get.dart';
import 'package:tencent_conference_uikit/manager/rtc_engine_manager.dart';
import 'package:tencent_conference_uikit/common/index.dart';
import 'package:rtc_room_engine/rtc_room_engine.dart';

class RoomStore {
  static RoomStore get to => Get.find();
  final _screenShareUser = UserModel();
  final seatedUserList = <UserModel>[].obs;
  final userInfoList = <UserModel>[].obs;
  final inviteSeatList = <UserModel>[].obs;
  final Map<String, String> inviteSeatMap = {};
  final isSharing = false.obs;
  UserModel currentUser = UserModel();
  TUIRoomInfo roomInfo = TUIRoomInfo(roomId: '');
  VideoModel videoSetting = VideoModel();
  AudioModel audioSetting = AudioModel();
  final isFloatChatVisible = true.obs;
  int timeStampOnEnterRoom = 0;
  bool isEnteredRoom = false;
  final roomUserCount = 0.obs;

  static const _seatIndex = -1;
  static const _reqTimeout = 0;

  RxBool isMicItemTouchable = true.obs;
  RxBool isCameraItemTouchable = true.obs;

  void clearStore() {
    screenShareUser = UserModel();
    userInfoList.clear();
    isSharing.value = false;
    currentUser = UserModel();
    roomInfo = TUIRoomInfo(roomId: '');
    videoSetting = VideoModel();
    audioSetting = AudioModel();
    isFloatChatVisible.value = true;
    seatedUserList.clear();
    inviteSeatList.clear();
    inviteSeatMap.clear();
    timeStampOnEnterRoom = 0;
    isEnteredRoom = false;
    isMicItemTouchable = true.obs;
    isCameraItemTouchable = true.obs;
    roomUserCount.value = 0;
  }

  UserModel get screenShareUser => _screenShareUser;

  set screenShareUser(UserModel userModel) {
    _screenShareUser.userId = userModel.userId;
    _screenShareUser.userName = userModel.userName;
    _screenShareUser.userAvatarURL = userModel.userAvatarURL;
    _screenShareUser.userRole = userModel.userRole;
    _screenShareUser.hasVideoStream = userModel.hasVideoStream;
    _screenShareUser.hasAudioStream = userModel.hasAudioStream;
    _screenShareUser.hasScreenStream = userModel.hasScreenStream;
  }

  Future<void> initialCurrentUser() async {
    TUILoginUserInfo loginUserInfo = TUIRoomEngine.getSelfInfo();
    var getCurrentUserResult =
        await RoomEngineManager().getUserInfo(loginUserInfo.userId);
    currentUser.userName.value = getCurrentUserResult.data!.userName;
    currentUser.userId.value = getCurrentUserResult.data!.userId;
    currentUser.userRole.value = getCurrentUserResult.data!.userRole;
    currentUser.userAvatarURL.value = getCurrentUserResult.data!.avatarUrl;
  }

  void addUserByList(
      List<TUIUserInfo> userInfoList, RxList<UserModel> destList) {
    for (var element in userInfoList) {
      addUser(element, destList);
    }
  }

  void addUser(TUIUserInfo userInfo, RxList<UserModel> destList) {
    int index = getUserIndex(userInfo.userId, destList);
    if (index != -1) {
      return;
    }
    if (userInfo.hasScreenStream == true) {
      isSharing.value = true;
      screenShareUser = UserModel.fromTUIUserInfo(userInfo);
    }
    if (userInfo.userRole == TUIRole.roomOwner) {
      destList.insert(0, UserModel.fromTUIUserInfo(userInfo));
    } else {
      destList.add(UserModel.fromTUIUserInfo(userInfo));
    }
  }

  UserModel? getUserById(String userId) {
    int index = getUserIndex(userId, userInfoList);
    if (index == -1) {
      return null;
    }
    return userInfoList[index];
  }

  int getUserIndex(String userId, RxList<UserModel> destList) {
    return destList.indexWhere((element) => element.userId.value == userId);
  }

  void removeUser(String userId, RxList<UserModel> destList) {
    destList.removeWhere((element) => element.userId.value == userId);
  }

  void updateUserVideoState(String userId, bool hasVideo,
      TUIChangeReason reason, RxList<UserModel> destList,
      {bool? isScreenStream}) {
    var index = getUserIndex(userId, destList);
    if (index == -1) {
      return;
    }
    if (isScreenStream == true) {
      destList[index].hasScreenStream.value = hasVideo;
    } else {
      destList[index].hasVideoStream.value = hasVideo;
    }
  }

  void updateSelfVideoState(bool hasVideo, TUIChangeReason reason,
      {bool? isScreenStream}) {
    if (isScreenStream == true) {
      currentUser.hasScreenStream.value = hasVideo;
    } else {
      currentUser.hasVideoStream.value = hasVideo;
    }
    updateItemTouchableState();

    if (reason != TUIChangeReason.changedByAdmin) {
      return;
    }
    if (currentUser.hasVideoStream.value) {
      makeToast(msg: 'cameraTurnedOnByHostToast'.roomTr);
    } else if (!roomInfo.isCameraDisableForAllUser) {
      if (isRoomNeedTakeSeat() && !currentUser.isOnSeat.value) {
        return;
      }
      makeToast(msg: 'cameraTurnedOffByHostToast'.roomTr);
    }
  }

  void updateUserAudioState(String userId, bool hasAudio,
      TUIChangeReason reason, RxList<UserModel> destList) {
    var index = getUserIndex(userId, destList);
    if (index == -1) {
      return;
    }
    destList[index].hasAudioStream.value = hasAudio;
  }

  void updateSelfAudioState(bool hasAudio, TUIChangeReason reason) {
    currentUser.hasAudioStream.value = hasAudio;
    if (reason == TUIChangeReason.changedByAdmin) {
      if (hasAudio) {
        makeToast(msg: 'microphoneTurnedOnByHostToast'.roomTr);
      } else if (!roomInfo.isMicrophoneDisableForAllUser) {
        makeToast(msg: 'microphoneTurnedOffByHostToast'.roomTr);
      }
    }
    updateItemTouchableState();
  }

  void updateUserRole(String userId, TUIRole role, RxList<UserModel> destList) {
    var index = getUserIndex(userId, destList);
    if (index == -1) {
      return;
    }
    destList[index].userRole.value = role;
  }

  void updateSelfRole(TUIRole role) {
    if (isRoomNeedTakeSeat() &&
        !RoomStore.to.currentUser.isOnSeat.value &&
        role == TUIRole.roomOwner) {
      RoomEngineManager().takeSeat(_seatIndex, _reqTimeout, null);
    }
    if (role == TUIRole.roomOwner && !currentUser.ableSendingMessage.value) {
      RoomEngineManager()
          .disableSendingMessageByAdmin(currentUser.userId.value, false);
    }
  }

  void updateUserTalkingState(
      String userId, bool isTalking, RxList<UserModel> destList, int volume) {
    var index = getUserIndex(userId, destList);
    if (index == -1) {
      return;
    }
    if (!destList[index].hasAudioStream.value) {
      destList[index].isTalking.value = false;
      return;
    }
    destList[index].isTalking.value = isTalking;
    destList[index].volume.value = volume;

    if (userId == currentUser.userId.value) {
      currentUser.volume.value = volume;
    }
  }

  void updateUserSeatedState(String userId, bool isOnSeat,
      {TUIUserInfo? fallbackUserInfo}) {
    var index = getUserIndex(userId, userInfoList);

    if (index == -1) {
      if (fallbackUserInfo == null) return;
      addUser(fallbackUserInfo, userInfoList);
      index = getUserIndex(userId, userInfoList);
    }

    userInfoList[index].isOnSeat.value = isOnSeat;

    if (userId == currentUser.userId.value) {
      currentUser.isOnSeat.value = isOnSeat;
      if (!isOnSeat) {
        audioSetting.isMicDeviceOpened = false;
      }
      updateItemTouchableState();
    }
  }

  void updateUserMessageState(
      String userId, bool isDisable, RxList<UserModel> destList) {
    var index = getUserIndex(userId, destList);
    if (index == -1) {
      return;
    }
    destList[index].ableSendingMessage.value = !isDisable;

    if (userId == currentUser.userId.value) {
      currentUser.ableSendingMessage.value = !isDisable;
      if (isDisable) {
        makeToast(msg: 'messageTurnedOffByHostToast'.roomTr);
      } else {
        makeToast(msg: 'messageTurnedOnByHostToast'.roomTr);
      }
    }
  }

  void addInviteSeatUser(UserModel userModel, TUIRequest request) {
    if (inviteSeatMap.containsKey(request.userId)) {
      return;
    }
    inviteSeatList.add(userModel);
    inviteSeatMap[request.userId] = request.requestId;
  }

  void deleteInviteSeatUser(String userId) {
    inviteSeatList.removeWhere((element) => element.userId.value == userId);
    inviteSeatMap.removeWhere((key, value) => key == userId);
  }

  void deleteTakeSeatRequest(String requestId) {
    String userId = inviteSeatMap.entries
        .firstWhere(
          (entry) => entry.value == requestId,
          orElse: () => const MapEntry('', ''),
        )
        .key;
    if (userId.isNotEmpty) {
      deleteInviteSeatUser(userId);
    }
  }

  void initItemTouchableState() {
    if (roomInfo.isMicrophoneDisableForAllUser &&
        currentUser.userRole.value == TUIRole.generalUser) {
      isMicItemTouchable.value = false;
    }
    if (roomInfo.isCameraDisableForAllUser &&
        currentUser.userRole.value == TUIRole.generalUser) {
      isCameraItemTouchable.value = false;
    }
    if (isRoomNeedTakeSeat() && !currentUser.isOnSeat.value) {
      isMicItemTouchable.value = false;
      isCameraItemTouchable.value = false;
    }
  }

  void updateItemTouchableState() {
    if (currentUser.userRole.value == TUIRole.roomOwner) {
      isCameraItemTouchable.value = true;
      isMicItemTouchable.value = true;
      return;
    }
    if (currentUser.userRole.value == TUIRole.administrator) {
      if (isRoomNeedTakeSeat()) {
        if (currentUser.isOnSeat.value) {
          isCameraItemTouchable.value = true;
          isMicItemTouchable.value = true;
        } else {
          isCameraItemTouchable.value = false;
          isMicItemTouchable.value = false;
        }
        return;
      }
      isCameraItemTouchable.value = true;
      isMicItemTouchable.value = true;
      return;
    }
    if (isRoomNeedTakeSeat()) {
      if (currentUser.isOnSeat.value) {
        isCameraItemTouchable.value = true;
        isMicItemTouchable.value = true;
      } else {
        isCameraItemTouchable.value = false;
        isMicItemTouchable.value = false;
      }
    }
    if (roomInfo.isMicrophoneDisableForAllUser &&
        !currentUser.hasAudioStream.value) {
      isMicItemTouchable.value = false;
    } else {
      isMicItemTouchable.value = true;
    }
    if (roomInfo.isCameraDisableForAllUser &&
        !currentUser.hasVideoStream.value) {
      isCameraItemTouchable.value = false;
    } else {
      isCameraItemTouchable.value = true;
    }
  }

  bool isRoomNeedTakeSeat() {
    return roomInfo.isSeatEnabled == true &&
        roomInfo.seatMode == TUISeatMode.applyToTake;
  }
}
