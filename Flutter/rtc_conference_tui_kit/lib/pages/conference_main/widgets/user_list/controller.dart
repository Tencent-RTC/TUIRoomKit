import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_conference_tui_kit/manager/rtc_engine_manager.dart';
import 'package:rtc_room_engine/rtc_room_engine.dart';

class UserListController extends GetxController {
  UserListController();

  static const _seatIndex = -1;
  static const _reqTimeout = 0;

  var store = RoomStore.to;
  final RoomEngineManager _engineManager = RoomEngineManager();
  late TUIRoomEngine _roomEngine;
  late TUIRoomObserver observer;
  RxList<UserModel> searchResults = RxList<UserModel>();
  RxBool isSearchBarEmpty = true.obs;
  RxBool isAllMute = RoomStore.to.roomInfo.isMicrophoneDisableForAllUser.obs;
  RxBool isAllCameraDisable =
      RoomStore.to.roomInfo.isCameraDisableForAllUser.obs;

  @override
  void onInit() {
    super.onInit();
    _roomEngine = _engineManager.getRoomEngine();
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
    _roomEngine.addObserver(observer);
  }

  void muteAllAudioAction() async {
    isAllMute.value = !isAllMute.value;
    var result = await _engineManager.muteAllAudioAction(isAllMute.value);
    if (result.code == TUIError.success) {
      makeToast(
          msg: isAllMute.value
              ? RoomContentsTranslations.translate('allMute')
              : RoomContentsTranslations.translate('unAllMute'));
    } else {
      isAllMute.value = !isAllMute.value;
      makeToast(msg: result.message!);
    }
  }

  void muteAllVideoAction() async {
    isAllCameraDisable.value = !isAllCameraDisable.value;
    var result =
        await _engineManager.muteAllVideoAction(isAllCameraDisable.value);
    if (result.code == TUIError.success) {
      makeToast(
          msg: isAllCameraDisable.value
              ? RoomContentsTranslations.translate('disableAllVideo')
              : RoomContentsTranslations.translate('enableAllVideo'));
    } else {
      isAllCameraDisable.value = !isAllCameraDisable.value;
      makeToast(msg: result.message!);
    }
  }

  void searchAction(String value) {
    if (value.isNotEmpty) {
      List<UserModel> results = RoomStore.to.userInfoList
          .where((user) =>
              user.userName.toLowerCase().contains(value.toLowerCase()))
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
      makeToast(msg: RoomContentsTranslations.translate('muteRoomReason'));
      return;
    }

    _engineManager.unMuteLocalAudio();
  }

  void _toggleRemoteAudio(UserModel userModel) async {
    if (userModel.hasAudioStream.value) {
      var result = await _engineManager.closeRemoteDeviceByAdmin(
          userModel.userId.value, TUIMediaDevice.microphone);
      if (result.code != TUIError.success) {
        makeToast(msg: RoomContentsTranslations.translate('muteErrorToast'));
      }
    } else {
      TUIRequestCallback callback = TUIRequestCallback(onAccepted:
          (String requestId, String userId) {
        makeToast(
            msg: userModel.userName +
                RoomContentsTranslations.translate('muteSuccessToast'));
      }, onRejected: (String requestId, String userId, String message) {
        makeToast(
            msg: userModel.userName +
                RoomContentsTranslations.translate('muteRejectToast'));
      }, onCancelled: (String requestId, String userId) {
        makeToast(msg: RoomContentsTranslations.translate('muteErrorToast'));
      }, onTimeout: (String requestId, String userId) {
        makeToast(msg: RoomContentsTranslations.translate('muteErrorToast'));
      }, onError:
          (String requestId, String userId, TUIError error, String message) {
        makeToast(msg: RoomContentsTranslations.translate('muteErrorToast'));
      });
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
      makeToast(
          msg: RoomContentsTranslations.translate('disableVideoRoomReason'));
      return;
    }

    _engineManager.openLocalCamera();
  }

  void _toggleRemoteCamera(UserModel userModel) async {
    if (userModel.hasVideoStream.value) {
      var result = await _engineManager.closeRemoteDeviceByAdmin(
          userModel.userId.value, TUIMediaDevice.camera);
      if (result.code != TUIError.success) {
        makeToast(
            msg: RoomContentsTranslations.translate('disableVideoErrorToast'));
      }
    } else {
      TUIRequestCallback callback = TUIRequestCallback(onAccepted:
          (String requestId, String userId) {
        makeToast(
            msg: userModel.userName +
                RoomContentsTranslations.translate('disableVideoSuccessToast'));
      }, onRejected: (String requestId, String userId, String message) {
        makeToast(
            msg: userModel.userName +
                RoomContentsTranslations.translate('disableVideoRejectToast'));
      }, onCancelled: (String requestId, String userId) {
        makeToast(
            msg: RoomContentsTranslations.translate('disableVideoErrorToast'));
      }, onTimeout: (String requestId, String userId) {
        makeToast(
            msg: RoomContentsTranslations.translate('disableVideoErrorToast'));
      }, onError:
          (String requestId, String userId, TUIError error, String message) {
        makeToast(
            msg: RoomContentsTranslations.translate('disableVideoErrorToast'));
      });
      _engineManager.openRemoteDeviceByAdmin(
          userModel.userId.value, TUIMediaDevice.camera, callback);
    }
  }

  void transferHostAction(String userId) async {
    var result = await _engineManager.changeUserRole(userId, TUIRole.roomOwner);
    if (result.code == TUIError.success) {
      Get.back();
      showConferenceDialog(
        title: RoomContentsTranslations.translate('haveTransferredHost'),
        confirmText: RoomContentsTranslations.translate('ok'),
        titleTextStyle: RoomTheme.defaultTheme.textTheme.displayLarge,
        confirmTextStyle: RoomTheme.defaultTheme.textTheme.displayMedium,
        onConfirm: () {
          Get.back();
        },
        barrierDismissible: false,
      );
      RoomStore.to.inviteSeatList.clear();
      RoomStore.to.inviteSeatMap.clear();
    }
  }

  void disableMessageAction(UserModel userModel) {
    _engineManager.disableSendingMessageByAdmin(
        userModel.userId.value, userModel.ableSendingMessage.value);
  }

  void kickOutAction(UserModel userModel) {
    showConferenceDialog(
      title: RoomContentsTranslations.translate('sureKickOut')
          .replaceAll('xx', userModel.userName.value),
      confirmText: RoomContentsTranslations.translate('sure'),
      cancelText: RoomContentsTranslations.translate('cancel'),
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
    _roomEngine.removeObserver(observer);
    super.onClose();
  }

  void takeUserOnSeat(UserModel userModel) {
    makeToast(
        msg: RoomContentsTranslations.translate('takeSeatInvitationSend'));

    RoomEngineManager().takeUserOnSeat(
      _seatIndex,
      userModel.userId.value,
      _reqTimeout,
      TUIRequestCallback(
        onAccepted: (requestId, userId) {
          makeToast(
              msg:
                  '${userModel.userName.value}${RoomContentsTranslations.translate('takeSeatInvitationAccepted')}');
        },
        onRejected: (requestId, userId, message) {
          makeToast(
              msg:
                  '${userModel.userName.value}${RoomContentsTranslations.translate('takeSeatInvitationRejected')}');
        },
        onCancelled: (requestId, userId) {},
        onTimeout: (requestId, userId) {},
        onError: (requestId, userId, error, message) {},
      ),
    );
  }

  void kickUserOffSeat(String userId) {
    RoomEngineManager().kickUserOffSeat(_seatIndex, userId);
  }

  bool isSeatMode() {
    return RoomStore.to.roomInfo.speechMode ==
        TUISpeechMode.speakAfterTakingSeat;
  }

  bool isOwner() {
    return RoomStore.to.currentUser.userRole.value == TUIRole.roomOwner;
  }

  double getUserControlWidgetHeight(UserModel userModel) {
    if (userModel.userId.value == RoomStore.to.currentUser.userId.value) {
      return 230.0.scale375();
    }
    if (isSeatMode()) {
      if (userModel.isOnSeat.value) {
        return 435.0.scale375();
      }
      return 335.0.scale375();
    }
    return 385.0.scale375();
  }

  bool isSelf(UserModel userModel) {
    return userModel.userId.value == RoomStore.to.currentUser.userId.value;
  }
}
