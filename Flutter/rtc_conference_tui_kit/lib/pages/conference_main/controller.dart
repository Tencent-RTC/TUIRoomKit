import 'dart:async';

import 'package:get/get.dart';
import 'package:flutter/material.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_conference_tui_kit/conference/conference_error.dart';
import 'package:rtc_conference_tui_kit/conference/conference_observer.dart';
import 'package:rtc_conference_tui_kit/conference/conference_params.dart';
import 'package:rtc_conference_tui_kit/conference/conference_session.dart';
import 'package:rtc_conference_tui_kit/manager/rtc_engine_manager.dart';
import 'package:rtc_room_engine/rtc_room_engine.dart';

import 'widgets/widgets.dart';

class ConferenceMainController extends GetxController {
  ConferenceMainController({
    this.roomId,
    this.isCreateRoom,
    this.conferenceParams,
    this.conferenceObserver,
  });

  final String? roomId;
  final bool? isCreateRoom;
  final ConferenceParams? conferenceParams;
  final ConferenceObserver? conferenceObserver;

  bool isMicrophoneInviteDialogShow = false;
  bool isCameraInviteDialogShow = false;
  TUIRoomObserver? observer;

  Timer? _hideTimer;
  RxBool areWidgetsVisible = true.obs;
  int _hideDuration = 6;
  RxBool isEnteredRoom = false.obs;

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
  Future<void> onInit() async {
    if (!Get.isRegistered<RoomStore>() || !RoomStore.to.isEnteredRoom) {
      if (roomId == null || isCreateRoom == null) {
        _showNotEnteredRoomDialog();
        return;
      }
      await _enterConference(roomId!, isCreateRoom!, conferenceParams);
    } else if (roomId != null && roomId != RoomStore.to.roomInfo.roomId) {
      _showDifferentRoomIdDialog();
    }
    isEnteredRoom.value = RoomStore.to.isEnteredRoom;
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
        conferenceObserver?.onConferenceFinished
            ?.call(RoomStore.to.roomInfo.roomId);
        RoomStore.to.clearStore();
        showExitRoomDialog(RoomContentsTranslations.translate('roomDestroyed'));
      },
      onKickedOutOfRoom: (roomId, reason, message) {
        conferenceObserver?.onConferenceExited
            ?.call(RoomStore.to.roomInfo.roomId);
        RoomStore.to.clearStore();
        showExitRoomDialog(
            RoomContentsTranslations.translate('kickedOutOfRoom'));
      },
      onUserRoleChanged: (userId, role) {
        if (userId == RoomStore.to.currentUser.userId.value) {
          switch (role) {
            case TUIRole.roomOwner:
              if (RoomStore.to.currentUser.userRole.value ==
                  TUIRole.generalUser) {
                RoomEngineManager().getSeatApplicationList();
              }
              makeToast(
                  msg: RoomContentsTranslations.translate('haveBecomeOwner'));
              break;
            case TUIRole.administrator:
              if (RoomStore.to.currentUser.userRole.value ==
                  TUIRole.generalUser) {
                RoomEngineManager().getSeatApplicationList();
              }
              makeToast(
                  msg: RoomContentsTranslations.translate(
                      'haveBecomeAdministrator'));
              break;
            case TUIRole.generalUser:
              if (RoomStore.to.currentUser.userRole.value ==
                  TUIRole.administrator) {
                makeToast(
                    msg: RoomContentsTranslations.translate(
                        'revokedYourAdministrator'));
              }
              RoomStore.to.inviteSeatList.clear();
              RoomStore.to.inviteSeatMap.clear();
              break;
            default:
              break;
          }
          RoomStore.to.currentUser.userRole.value = role;
          RoomStore.to.updateItemTouchableState();
        }
      },
    );
    RoomEngineManager().addObserver(observer!);
    super.onInit();
  }

  @override
  void onReady() {
    if (isEnteredRoom.value) {
      resetHideTimer();
      _hideDuration = 3;
    }
    super.onReady();
  }

  @override
  void onClose() {
    if (observer != null) {
      RoomEngineManager().removeObserver(observer!);
    }
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
      onConfirm: () async {
        var result = await RoomEngineManager()
            .getRoomEngine()
            .responseRemoteRequest(request.requestId, true);
        Get.back();
        if (result.code == TUIError.errFailed) {
          makeToast(
              msg: RoomContentsTranslations.translate('goOnStageTimeOut'));
        } else if (result.code == TUIError.errAllSeatOccupied) {
          makeToast(
              msg: RoomContentsTranslations.translate(
                  'stageMemberReachedLimit'));
        }
      },
      barrierDismissible: false,
    );
  }

  void showExitRoomDialog(String title) {
    showConferenceDialog(
      title: RoomContentsTranslations.translate(title),
      confirmText: RoomContentsTranslations.translate('ok'),
      confirmTextStyle: RoomTheme.defaultTheme.textTheme.labelMedium,
      onConfirm: () {
        Get.key.currentState?.popUntil((route) {
          return route.settings.name != '/dialog' &&
              route.settings.name != '/bottom_sheet';
        });
        Get.back();
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
    if (!isEnteredRoom.value ||
        Get.find<BottomViewController>().isUnfold.value) {
      return;
    }
    areWidgetsVisible.value = !areWidgetsVisible.value;
    if (areWidgetsVisible.value) {
      resetHideTimer();
    }
  }

  Future<void> _enterConference(String roomId, bool isCreateRoom,
      ConferenceParams? conferenceParams) async {
    ConferenceSession conferenceSession = ConferenceSession.newInstance(roomId);
    if (conferenceParams != null) {
      conferenceSession
        ..isMuteMicrophone = conferenceParams.isMuteMicrophone
        ..isOpenCamera = conferenceParams.isOpenCamera
        ..isSoundOnSpeaker = conferenceParams.isSoundOnSpeaker;
      if (isCreateRoom) {
        conferenceSession
          ..name = conferenceParams.name ?? roomId
          ..enableCameraForAllUser = conferenceParams.enableCameraForAllUsers
          ..enableMicrophoneForAllUser =
              conferenceParams.enableMicrophoneForAllUsers
          ..enableMessageForAllUser = conferenceParams.enableMessageForAllUsers
          ..enableSeatControl = conferenceParams.enableSeatControl;
      }
    }
    conferenceSession
      ..onActionSuccess = () {
        isEnteredRoom.value = true;
        isCreateRoom
            ? conferenceObserver?.onConferenceStarted
                ?.call(roomId, ConferenceError.success)
            : conferenceObserver?.onConferenceJoined
                ?.call(roomId, ConferenceError.success);
      }
      ..onActionError = (error, code) {
        isCreateRoom
            ? conferenceObserver?.onConferenceStarted?.call(roomId, error)
            : conferenceObserver?.onConferenceJoined?.call(roomId, error);
      };

    isCreateRoom
        ? await conferenceSession.quickStart()
        : await conferenceSession.join();
  }

  void _showNotEnteredRoomDialog() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      showConferenceDialog(
        title: RoomContentsTranslations.translate('haveNotEnteredRoomTip'),
        confirmText: RoomContentsTranslations.translate('ok'),
        onConfirm: () {
          Get.back();
          Get.back();
        },
        barrierDismissible: false,
      );
    });
  }

  void _showDifferentRoomIdDialog() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      showConferenceDialog(
        title: RoomContentsTranslations.translate('differentRoomIdTip'),
        confirmText: RoomContentsTranslations.translate('ok'),
        onConfirm: () {
          Get.back();
        },
        barrierDismissible: false,
      );
    });
  }
}
