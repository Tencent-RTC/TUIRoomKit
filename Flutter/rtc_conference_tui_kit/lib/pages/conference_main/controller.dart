import 'dart:async';

import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_conference_tui_kit/manager/rtc_engine_manager.dart';
import 'package:rtc_room_engine/rtc_room_engine.dart';

import 'widgets/widgets.dart';

class ConferenceMainController extends GetxController {
  ConferenceMainController();
  bool isMicrophoneInviteDialogShow = false;
  bool isCameraInviteDialogShow = false;
  late TUIRoomObserver observer;
  var backRouteName = Get.arguments;

  static const _seatIndex = -1;
  static const _reqTimeout = 0;

  Timer? _hideTimer;
  RxBool areWidgetsVisible = true.obs;
  int _hideDuration = 6;

  late TopViewWidget topViewWidget;
  late BottomViewWidget bottomWidget;

  showDialog() {
    showConferenceDialog(
      title: RoomContentsTranslations.translate('liveScreen'),
      message: RoomContentsTranslations.translate('stopTUIRoomScreenShare'),
      cancelText: RoomContentsTranslations.translate('cancel'),
      confirmText: RoomContentsTranslations.translate('stop'),
      onConfirm: () {
        RoomEngineManager().stopScreenSharing();
        Get.back();
      },
    );
  }

  @override
  void onInit() {
    topViewWidget = const TopViewWidget();
    bottomWidget = const BottomViewWidget();
    observer = TUIRoomObserver(
      onRequestReceived: (request) {
        switch (request.requestAction) {
          case TUIRequestAction.requestToOpenRemoteCamera:
          case TUIRequestAction.requestToOpenRemoteMicrophone:
          case TUIRequestAction.requestRemoteUserOnSeat:
            showRequestDialog(request);
            break;
          default:
            break;
        }
      },
      onRequestCancelled: (requestId, userId) {
        if (isCameraInviteDialogShow) {
          Get.back();
          isCameraInviteDialogShow = false;
        }
        if (isMicrophoneInviteDialogShow) {
          Get.back();
          isMicrophoneInviteDialogShow = false;
        }
      },
      onRoomDismissed: (roomId) {
        showExitRoomDialog(RoomContentsTranslations.translate('roomDestroyed'));
      },
      onKickedOutOfRoom: (roomId, reason, message) {
        showExitRoomDialog(
            RoomContentsTranslations.translate('kickedOutOfRoom'));
      },
      onUserRoleChanged: (userId, role) {
        if (userId == RoomStore.to.currentUser.userId.value) {
          if (role == TUIRole.roomOwner) {
            makeToast(
                msg: RoomContentsTranslations.translate('haveBecomeHost'));
          }
          if (role == TUIRole.administrator) {
            if (RoomStore.to.roomInfo.isSeatEnabled == true &&
                RoomStore.to.roomInfo.seatMode == TUISeatMode.applyToTake &&
                !RoomStore.to.currentUser.isOnSeat.value) {
              showConferenceDialog(
                title: RoomContentsTranslations.translate(
                    'haveBecomeAdministrator'),
                message: RoomContentsTranslations.translate(
                    'haveBecomeAdministratorMessage'),
                confirmText:
                    RoomContentsTranslations.translate('joinStageImmediately'),
                cancelText:
                    RoomContentsTranslations.translate('noYetJoinStage'),
                onConfirm: () {
                  RoomEngineManager().takeSeat(_seatIndex, _reqTimeout, null);
                  Get.back();
                },
              );
            } else {
              makeToast(
                  msg: RoomContentsTranslations.translate(
                      'haveBecomeAdministrator'));
            }
          }
          if (role == TUIRole.generalUser &&
              RoomStore.to.currentUser.userRole.value ==
                  TUIRole.administrator) {
            makeToast(
                msg: RoomContentsTranslations.translate(
                    'revokedYourAdministrator'));
            RoomStore.to.inviteSeatList.clear();
            RoomStore.to.inviteSeatMap.clear();
          }
          RoomStore.to.currentUser.userRole.value = role;
          RoomStore.to.updateItemTouchableState();
        }
      },
    );
    RoomEngineManager().getRoomEngine().addObserver(observer);
    super.onInit();
  }

  @override
  void onReady() {
    resetHideTimer();
    _hideDuration = 3;
    super.onReady();
  }

  @override
  void onClose() {
    RoomEngineManager().getRoomEngine().removeObserver(observer);
    Get.delete<BottomViewController>(force: true);
    Get.delete<TopViewController>(force: true);
    super.onClose();
  }

  void showRequestDialog(TUIRequest request) {
    String title = '';
    String message = '';
    String confirmText = '';
    String cancelText = RoomContentsTranslations.translate('doNotOpen');

    if (request.requestAction == TUIRequestAction.requestToOpenRemoteCamera) {
      isCameraInviteDialogShow = true;
      title = RoomContentsTranslations.translate('cameraInviteTitle');
      message = RoomContentsTranslations.translate('cameraInviteMessage');
      confirmText = RoomContentsTranslations.translate('confirmOpenCamera');
    } else if (request.requestAction ==
        TUIRequestAction.requestToOpenRemoteMicrophone) {
      isMicrophoneInviteDialogShow = true;
      title = RoomContentsTranslations.translate('microphoneInviteTitle');
      message = RoomContentsTranslations.translate('microphoneInviteMessage');
      confirmText = RoomContentsTranslations.translate('confirmOpenMicrophone');
    } else if (request.requestAction ==
        TUIRequestAction.requestRemoteUserOnSeat) {
      title = RoomContentsTranslations.translate('takeSeatInviteTitle');
      message = RoomContentsTranslations.translate('takeSeatInviteMessage');
      confirmText = RoomContentsTranslations.translate('agreeTakeSeat');
      cancelText = RoomContentsTranslations.translate('refuse');
    }
    showConferenceDialog(
      title: title,
      message: message,
      cancelText: cancelText,
      confirmText: confirmText,
      onCancel: () {
        RoomEngineManager()
            .getRoomEngine()
            .responseRemoteRequest(request.requestId, false);
        if (request.requestAction ==
            TUIRequestAction.requestToOpenRemoteCamera) {
          isCameraInviteDialogShow = false;
        } else if (request.requestAction ==
            TUIRequestAction.requestToOpenRemoteMicrophone) {
          isMicrophoneInviteDialogShow = false;
        }
      },
      onConfirm: () {
        RoomEngineManager()
            .getRoomEngine()
            .responseRemoteRequest(request.requestId, true);
        Get.back();
      },
    );
  }

  void showExitRoomDialog(String title) {
    showConferenceDialog(
      title: RoomContentsTranslations.translate(title),
      confirmText: RoomContentsTranslations.translate('ok'),
      confirmTextStyle: RoomTheme.defaultTheme.textTheme.labelMedium,
      onConfirm: () {
        Get.until((route) => route.settings.name == backRouteName);
      },
      barrierDismissible: false,
    );
  }

  void cancelHideTimer() {
    _hideTimer?.cancel();
  }

  void resetHideTimer() {
    if (Get.find<BottomViewController>().isUnfold.value) {
      return;
    }
    cancelHideTimer();
    _hideTimer = Timer(Duration(seconds: _hideDuration), () {
      areWidgetsVisible.value = false;
    });
  }

  void onMainViewClick() {
    if (Get.find<BottomViewController>().isUnfold.value) {
      return;
    }
    areWidgetsVisible.value = !areWidgetsVisible.value;
    if (areWidgetsVisible.value) {
      resetHideTimer();
    }
  }
}
