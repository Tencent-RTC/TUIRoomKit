import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_conference_tui_kit/manager/rtc_engine_manager.dart';
import 'package:rtc_room_engine/rtc_room_engine.dart';

class ConferenceMainController extends GetxController {
  ConferenceMainController();
  bool isMicrophoneInviteDialogShow = false;
  bool isCameraInviteDialogShow = false;
  late TUIRoomObserver observer;
  var backRouteName = Get.arguments;

  static const _seatIndex = -1;
  static const _reqTimeout = 0;

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
            showConferenceDialog(
              title: RoomContentsTranslations.translate('haveBecomeMaster'),
              confirmText: RoomContentsTranslations.translate('ok'),
              confirmTextStyle: RoomTheme.defaultTheme.textTheme.displayMedium,
              onConfirm: () {
                Get.back();
              },
              barrierDismissible: false,
            );
          }
          if (role == TUIRole.administrator) {
            if (RoomStore.to.roomInfo.speechMode ==
                    TUISpeechMode.speakAfterTakingSeat &&
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
              showConferenceDialog(
                title: RoomContentsTranslations.translate(
                    'haveBecomeAdministrator'),
                confirmText: RoomContentsTranslations.translate('ok'),
                confirmTextStyle:
                    RoomTheme.defaultTheme.textTheme.displayMedium,
                onConfirm: () {
                  Get.back();
                },
                barrierDismissible: false,
              );
            }
          }
          if (role == TUIRole.generalUser &&
              RoomStore.to.currentUser.userRole.value ==
                  TUIRole.administrator) {
            showConferenceDialog(
              title: RoomContentsTranslations.translate(
                  'revokedYourAdministrator'),
              confirmText: RoomContentsTranslations.translate('ok'),
              confirmTextStyle: RoomTheme.defaultTheme.textTheme.displayMedium,
              onConfirm: () {
                Get.back();
              },
              barrierDismissible: false,
            );
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
  void onClose() {
    RoomEngineManager().getRoomEngine().removeObserver(observer);
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
}
