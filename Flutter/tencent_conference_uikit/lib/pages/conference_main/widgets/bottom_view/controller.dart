import 'dart:io';

import 'package:get/get.dart';
import 'package:replay_kit_launcher/replay_kit_launcher.dart';
import 'package:tencent_conference_uikit/common/index.dart';
import 'package:tencent_conference_uikit/manager/rtc_engine_manager.dart';
import 'package:tencent_conference_uikit/pages/conference_main/index.dart';
import 'package:rtc_room_engine/api/room/tui_room_define.dart';
import 'package:tencent_conference_uikit/pages/conference_main/widgets/float_window/index.dart';

import '../../../../common/store/float_window_store.dart';

class BottomViewController extends GetxController {
  BottomViewController();

  static const _seatIndex = -1;
  static const _reqTimeout = 0;

  final isUnfold = false.obs;
  final showMoreButton = false.obs;
  final isRequestingTakeSeat = false.obs;
  final isRoomNeedTakeSeat = false.obs;

  late RoomEngineManager _engineManager;
  late RoomStore _store;
  late String _takeSeatRequestId;

  final conferenceMainController = Get.find<ConferenceMainController>();

  @override
  void onInit() {
    super.onInit();
    _engineManager = RoomEngineManager();
    _store = RoomStore.to;
    _takeSeatRequestId = '';
    isRoomNeedTakeSeat.value = _store.roomInfo.isSeatEnabled == true &&
        _store.roomInfo.seatMode == TUISeatMode.applyToTake;
  }

  void muteAudioAction() {
    if (_isOffSeatInSeatMode()) {
      return;
    }

    if (_store.currentUser.hasAudioStream.value) {
      _engineManager.muteLocalAudio();
      return;
    }
    if (_store.roomInfo.isMicrophoneDisableForAllUser &&
        _store.currentUser.userRole.value == TUIRole.generalUser) {
      makeToast(msg: 'muteRoomReason'.roomTr);
      return;
    }
    _engineManager.unMuteLocalAudio();
  }

  void muteVideoAction() {
    if (_isOffSeatInSeatMode()) {
      return;
    }

    if (_store.currentUser.hasVideoStream.value) {
      _engineManager.closeLocalCamera();
      return;
    }
    if (_store.roomInfo.isCameraDisableForAllUser &&
        _store.currentUser.userRole.value == TUIRole.generalUser) {
      makeToast(msg: 'disableVideoRoomReason'.roomTr);
      return;
    }
    _engineManager.openLocalCamera();
  }

  bool _isOffSeatInSeatMode() {
    if (isRoomNeedTakeSeat.value && !_store.currentUser.isOnSeat.value) {
      makeToast(
        msg: 'raiseHandTip'.roomTr,
      );
      return true;
    }
    return false;
  }

  void _startScreenSharing() {
    if (_isOffSeatInSeatMode()) {
      return;
    }

    if (_store.isSharing.value &&
        _store.screenShareUser.userId.value !=
            _store.currentUser.userId.value) {
      makeToast(
        msg: 'otherUserScreenSharing'.roomTr,
      );
      return;
    }

    String appGroup = '';
    if (Platform.isIOS) {
      appGroup = 'com.tencent.TUIRoomTXReplayKit-Screen';
      ReplayKitLauncher.launchReplayKitBroadcast('TXReplayKit_Screen');
    }
    _engineManager.startScreenSharing(appGroup: appGroup);
  }

  void onScreenShareButtonPressed() {
    if (_store.currentUser.hasScreenStream.value) {
      showConferenceDialog(
        title: 'liveScreen'.roomTr,
        message: 'stopTUIRoomScreenShare'.roomTr,
        cancelText: 'cancel'.roomTr,
        confirmText: 'stop'.roomTr,
        onConfirm: () {
          _engineManager.stopScreenSharing();
          Get.back();
        },
      );
    } else {
      _startScreenSharing();
    }
  }

  void raiseHandAction() {
    if (_store.currentUser.isOnSeat.value) {
      return;
    }
    if (!isRequestingTakeSeat.value) {
      isRequestingTakeSeat.value = true;
      if (RoomStore.to.currentUser.userRole.value != TUIRole.administrator) {
        makeToast(
          msg: 'joinStageApplicationSent'.roomTr,
        );
      }
      _takeSeatRequestId = _engineManager
          .takeSeat(
            _seatIndex,
            _reqTimeout,
            TUIRequestCallback(
              onAccepted: (requestId, userId) {
                makeToast(
                  msg: 'takeSeatRequestAgreed'.roomTr,
                );
                isRequestingTakeSeat.value = false;
              },
              onRejected: (requestId, userId, message) {
                makeToast(
                  msg: 'takeSeatRequestRejected'.roomTr,
                );
                isRequestingTakeSeat.value = false;
              },
              onCancelled: (requestId, userId) {
                isRequestingTakeSeat.value = false;
              },
              onTimeout: (requestId, userId) {
                isRequestingTakeSeat.value = false;
              },
              onError: (requestId, userId, error, message) {
                isRequestingTakeSeat.value = false;
              },
            ),
          )
          .requestId;
    } else {
      _engineManager.cancelRequest(_takeSeatRequestId);
      _takeSeatRequestId = '';

      makeToast(
        msg: 'joinStageApplicationCancelled'.roomTr,
      );
      isRequestingTakeSeat.value = false;
    }
  }

  void leaveSeat() {
    if (RoomStore.to.currentUser.userRole.value == TUIRole.administrator) {
      _engineManager.leaveSeat();
      return;
    }
    showConferenceDialog(
      title: 'leaveSeatTitle'.roomTr,
      message: 'leaveSeatMessage'.roomTr,
      confirmText: 'leaveSeat'.roomTr,
      cancelText: 'cancel'.roomTr,
      onConfirm: () {
        _engineManager.leaveSeat();
        Get.back();
      },
    );
  }

  bool isMicAndCameraButtonVisible() {
    return !isRoomNeedTakeSeat.value ||
        RoomStore.to.currentUser.isOnSeat.value ||
        RoomStore.to.currentUser.userRole.value == TUIRole.administrator;
  }

  bool isRaiseHandButtonVisible() {
    return isRoomNeedTakeSeat.value &&
        RoomStore.to.currentUser.userRole.value != TUIRole.roomOwner;
  }

  bool isRaiseHandListButtonVisible() {
    return isRoomNeedTakeSeat.value &&
        RoomStore.to.currentUser.userRole.value != TUIRole.generalUser;
  }

  bool isScreenShareButtonInBaseRow() {
    return !isRoomNeedTakeSeat.value ||
        RoomStore.to.currentUser.userRole.value != TUIRole.administrator;
  }

  bool isInviteButtonInBaseRow() {
    return !isRoomNeedTakeSeat.value ||
        !RoomStore.to.currentUser.isOnSeat.value &&
            RoomStore.to.currentUser.userRole.value != TUIRole.administrator;
  }

  bool isSettingButtonInBaseRow() {
    return isRoomNeedTakeSeat.value &&
        !RoomStore.to.currentUser.isOnSeat.value &&
        RoomStore.to.currentUser.userRole.value != TUIRole.administrator;
  }

  void changeFoldState() {
    if (isUnfold.value != showMoreButton.value) {
      return;
    }
    Future.delayed(const Duration(milliseconds: 300), () {
      showMoreButton.value = isUnfold.value;
    });
    isUnfold.value = !isUnfold.value;
    if (isUnfold.value) {
      conferenceMainController.cancelHideTimer();
    } else {
      conferenceMainController.resetHideTimer();
    }
  }

  Future<void> enableFloatWindow() async {
    Get.put<FloatWindowStore>(FloatWindowStore(), permanent: true);
    bool success = await FloatWindowStore.to.showFloatWindow();
    if (success) {
      Get.back();
    }
  }
}
