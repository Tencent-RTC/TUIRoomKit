import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';
import 'package:tencent_conference_uikit/manager/rtc_engine_manager.dart';
import 'package:rtc_room_engine/rtc_room_engine.dart';

class UserListController extends GetxController {
  UserListController();

  static const _seatIndex = -1;
  static const _reqTimeout = 60;

  var store = RoomStore.to;
  final RoomEngineManager _engineManager = RoomEngineManager();
  late TUIRoomObserver observer;
  RxList<UserModel> searchResults = RxList<UserModel>();
  RxBool isSearchBarEmpty = true.obs;
  RxBool isAllMute = RoomStore.to.roomInfo.isMicrophoneDisableForAllUser.obs;
  RxBool isAllCameraDisable =
      RoomStore.to.roomInfo.isCameraDisableForAllUser.obs;

  @override
  void onInit() {
    super.onInit();
    addObserver();
  }

  void addObserver() {
    observer = TUIRoomObserver(
      onAllUserMicrophoneDisableChanged: (roomId, isDisable) {
        isAllMute.value = isDisable;
      },
      onAllUserCameraDisableChanged: (roomId, isDisable) {
        isAllCameraDisable.value = isDisable;
      },
    );
    _engineManager.addObserver(observer);
  }

  void muteAllAudioAction() {
    var isAllMuteTemp = isAllMute.value;
    showConferenceDialog(
      title: isAllMute.value ? 'unAllMute'.roomTr : 'allMuteTitle'.roomTr,
      message:
          isAllMute.value ? 'allUnMuteMessage'.roomTr : 'allMuteMessage'.roomTr,
      cancelText: 'cancel'.roomTr,
      confirmText: isAllMute.value ? 'confirmRelease'.roomTr : 'allMute'.roomTr,
      onConfirm: () async {
        Get.back();
        if (RoomStore.to.roomInfo.isMicrophoneDisableForAllUser ==
            !isAllMuteTemp) {
          makeToast(
              msg: isAllMute.value
                  ? 'allMutePrompt'.roomTr
                  : 'allUnMutePrompt'.roomTr);
          return;
        }
        isAllMute.value = !isAllMuteTemp;
        var result = await _engineManager.muteAllAudioAction(!isAllMuteTemp);
        if (result.code != TUIError.success) {
          isAllMute.value = !isAllMute.value;
          makeToast(msg: result.message!);
        }
      },
    );
  }

  void muteAllVideoAction() {
    var isAllCameraDisableTemp = isAllCameraDisable.value;
    showConferenceDialog(
      title: isAllCameraDisable.value
          ? 'enableAllVideo'.roomTr
          : 'allDisableVideoTitle'.roomTr,
      message: isAllCameraDisable.value
          ? 'allEnableVideoMessage'.roomTr
          : 'allDisableVideoMessage'.roomTr,
      cancelText: 'cancel'.roomTr,
      confirmText: isAllCameraDisable.value
          ? 'confirmRelease'.roomTr
          : 'disableAllVideo'.roomTr,
      onConfirm: () async {
        Get.back();
        if (RoomStore.to.roomInfo.isCameraDisableForAllUser ==
            !isAllCameraDisableTemp) {
          makeToast(
              msg: isAllCameraDisable.value
                  ? 'disableAllVideoPrompt'.roomTr
                  : 'enableAllVideoPrompt'.roomTr);
          return;
        }
        isAllCameraDisable.value = !isAllCameraDisableTemp;
        var result =
            await _engineManager.muteAllVideoAction(!isAllCameraDisableTemp);
        if (result.code != TUIError.success) {
          isAllCameraDisable.value = !isAllCameraDisable.value;
          makeToast(msg: result.message!);
        }
      },
    );
  }

  void searchAction(String value) {
    if (value.isNotEmpty) {
      List<UserModel> results = RoomStore.to.userInfoList
          .where((user) =>
      user.userName.toLowerCase().contains(value.toLowerCase()) ||
          user.userId.value.toLowerCase().contains(value.toLowerCase()))
          .toList();
      searchResults.assignAll(results);
      isSearchBarEmpty.value = false;
    } else {
      searchResults.clear();
      isSearchBarEmpty.value = true;
    }
  }

  void muteAudioAction(UserModel userModel) async {
    if (userModel.userId == RoomStore.to.currentUser.userId) {
      _toggleLocalAudio(userModel);
      return;
    }

    _toggleRemoteAudio(userModel);
  }

  void _toggleLocalAudio(UserModel userModel) {
    if (userModel.hasAudioStream.value) {
      _engineManager.muteLocalAudio();
      return;
    }
    if (RoomStore.to.roomInfo.isMicrophoneDisableForAllUser &&
        RoomStore.to.currentUser.userRole.value != TUIRole.roomOwner) {
      makeToast(msg: 'muteRoomReason'.roomTr);
      return;
    }

    _engineManager.unMuteLocalAudio();
  }

  void _toggleRemoteAudio(UserModel userModel) async {
    if (userModel.hasAudioStream.value) {
      var result = await _engineManager.closeRemoteDeviceByAdmin(
          userModel.userId.value, TUIMediaDevice.microphone);
      if (result.code != TUIError.success) {
        makeToast(msg: 'muteErrorToast'.roomTr);
      }
    } else {
      TUIRequestCallback callback = TUIRequestCallback(
          onAccepted: (String requestId, String userId) {},
          onRejected: (String requestId, String userId, String message) {},
          onCancelled: (String requestId, String userId) {
            makeToast(msg: 'muteErrorToast'.roomTr);
          },
          onTimeout: (String requestId, String userId) {
            makeToast(msg: 'muteErrorToast'.roomTr);
          },
          onError: (String requestId, String userId, TUIError error,
              String message) {});
      _engineManager.openRemoteDeviceByAdmin(
          userModel.userId.value, TUIMediaDevice.microphone, callback);
    }
  }

  void muteVideoAction(UserModel userModel) {
    if (userModel.userId == RoomStore.to.currentUser.userId) {
      _toggleLocalCamera(userModel);
      return;
    }

    _toggleRemoteCamera(userModel);
  }

  void _toggleLocalCamera(UserModel userModel) {
    if (userModel.hasVideoStream.value) {
      _engineManager.closeLocalCamera();
      return;
    }
    if (RoomStore.to.roomInfo.isCameraDisableForAllUser &&
        RoomStore.to.currentUser.userRole.value != TUIRole.roomOwner) {
      makeToast(msg: 'disableVideoRoomReason'.roomTr);
      return;
    }

    _engineManager.openLocalCamera();
  }

  void _toggleRemoteCamera(UserModel userModel) async {
    if (userModel.hasVideoStream.value) {
      var result = await _engineManager.closeRemoteDeviceByAdmin(
          userModel.userId.value, TUIMediaDevice.camera);
      if (result.code != TUIError.success) {
        makeToast(msg: 'disableVideoErrorToast'.roomTr);
      }
    } else {
      TUIRequestCallback callback = TUIRequestCallback(
          onAccepted: (String requestId, String userId) {},
          onRejected: (String requestId, String userId, String message) {},
          onCancelled: (String requestId, String userId) {
            makeToast(msg: 'disableVideoErrorToast'.roomTr);
          },
          onTimeout: (String requestId, String userId) {
            makeToast(msg: 'disableVideoErrorToast'.roomTr);
          },
          onError: (String requestId, String userId, TUIError error,
              String message) {});
      _engineManager.openRemoteDeviceByAdmin(
          userModel.userId.value, TUIMediaDevice.camera, callback);
    }
  }

  void transferHostAction(UserModel userModel) async {
    showConferenceDialog(
      title: 'transferOwnerTitle'
          .roomTr
          .replaceAll('xx', userModel.userName.value),
      message: 'transferOwnerMessage'.roomTr,
      confirmText: 'sureToTransfer'.roomTr,
      cancelText: 'cancel'.roomTr,
      onConfirm: () async {
        Get.back();
        var result = await _engineManager.changeUserRole(
            userModel.userId.value, TUIRole.roomOwner);
        if (result.code == TUIError.success) {
          makeToast(
              msg: 'haveTransferredOwner'
                  .roomTr
                  .replaceAll('xx', userModel.userName.value));
        }
      },
    );
  }

  void changeAdministratorAction(UserModel userModel) async {
    TUIActionCallback result;
    bool isUserAdministrator = isAdministrator(userModel);
    if (isUserAdministrator) {
      result = await _engineManager.changeUserRole(
          userModel.userId.value, TUIRole.generalUser);
    } else {
      result = await _engineManager.changeUserRole(
          userModel.userId.value, TUIRole.administrator);
    }
    if (result.code == TUIError.success) {
      makeToast(
          msg: isUserAdministrator
              ? 'haveRevokedAdministrator'
                  .roomTr
                  .replaceAll('xx', userModel.userName.value)
              : 'haveSetUpAdministrator'
                  .roomTr
                  .replaceAll('xx', userModel.userName.value));
    }
  }

  void disableMessageAction(UserModel userModel) {
    _engineManager.disableSendingMessageByAdmin(
        userModel.userId.value, userModel.ableSendingMessage.value);
  }

  void kickOutAction(UserModel userModel) {
    showConferenceDialog(
      title: 'sureKickOut'.roomTr.replaceAll('xx', userModel.userName.value),
      confirmText: 'sure'.roomTr,
      cancelText: 'cancel'.roomTr,
      confirmTextStyle: RoomTheme.defaultTheme.textTheme.titleMedium,
      cancelTextStyle: RoomTheme.defaultTheme.textTheme.titleLarge,
      onConfirm: () {
        _engineManager
            .kickRemoteUserOutOfRoom(userModel.userId.value)
            .then((value) {
          if (value.code == TUIError.success) {
            searchResults.removeWhere(
                (element) => element.userId.value == userModel.userId.value);
          }
        });
        Get.back();
      },
    );
  }

  @override
  void onClose() {
    _engineManager.removeObserver(observer);
    super.onClose();
  }

  void changeSeatStatusAction(UserModel userModel) {
    if (userModel.isOnSeat.value) {
      _kickUserOffSeat(userModel.userId.value);
    } else {
      takeUserOnSeat(userModel);
    }
  }

  void takeUserOnSeat(UserModel userModel) {
    makeToast(msg: 'takeSeatInvitationSend'.roomTr);

    RoomEngineManager().takeUserOnSeat(
      _seatIndex,
      userModel.userId.value,
      _reqTimeout,
      TUIRequestCallback(
        onAccepted: (requestId, userId) {
          makeToast(
              msg:
                  '${userModel.userName.value}${'takeSeatInvitationAccepted'.roomTr}');
        },
        onRejected: (requestId, userId, message) {
          makeToast(
              msg:
                  '${userModel.userName.value}${'takeSeatInvitationRejected'.roomTr}');
        },
        onCancelled: (requestId, userId) {},
        onTimeout: (requestId, userId) {
          makeToast(
              msg: 'takeSeatInvitationTimeOut'
                  .roomTr
                  .replaceAll('xx', userModel.userName.value));
        },
        onError: (requestId, userId, error, message) {
          if (error == TUIError.errRequestIdRepeat) {
            makeToast(msg: 'requestRepeat'.roomTr);
          }
        },
      ),
    );
  }

  void _kickUserOffSeat(String userId) {
    RoomEngineManager().kickUserOffSeat(_seatIndex, userId);
  }

  bool isRoomNeedTakeSeat() {
    return RoomStore.to.roomInfo.isSeatEnabled == true &&
        RoomStore.to.roomInfo.seatMode == TUISeatMode.applyToTake;
  }

  bool isOwner() {
    return RoomStore.to.currentUser.userRole.value == TUIRole.roomOwner;
  }

  bool isAdministrator(UserModel userModel) {
    return userModel.userRole.value == TUIRole.administrator;
  }

  double getUserControlWidgetHeight(UserModel userModel) {
    if (isSelf(userModel)) {
      return 230.0.scale375();
    }
    if (isOwner()) {
      if (isRoomNeedTakeSeat()) {
        if (userModel.isOnSeat.value) {
          return 485.0.scale375();
        }
        return 385.0.scale375();
      }
      return 435.0.scale375();
    } else {
      if (isRoomNeedTakeSeat()) {
        if (userModel.isOnSeat.value) {
          return 335.0.scale375();
        }
        return 235.0.scale375();
      }
      return 285.0.scale375();
    }
  }

  bool isSelf(UserModel userModel) {
    return userModel.userId.value == RoomStore.to.currentUser.userId.value;
  }

  bool isAbleToControlUser(UserModel userModel) {
    if (isSelf(userModel)) {
      return false;
    }
    if (isOwner()) {
      return true;
    }
    if (isAdministrator(RoomStore.to.currentUser)) {
      if (isAdministrator(userModel) ||
          userModel.userRole.value == TUIRole.roomOwner) {
        return false;
      }
      return true;
    }
    return false;
  }
}
