import 'dart:async';

import 'package:get/get.dart';
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:tencent_conference_uikit/common/index.dart';
import 'package:tencent_conference_uikit/common/store/float_window_store.dart';
import 'package:tencent_conference_uikit/conference/conference_error.dart';
import 'package:tencent_conference_uikit/conference/conference_observer.dart';
import 'package:tencent_conference_uikit/conference/conference_params.dart';
import 'package:tencent_conference_uikit/conference/conference_session.dart';
import 'package:tencent_conference_uikit/manager/rtc_engine_manager.dart';
import 'package:rtc_room_engine/rtc_room_engine.dart';
import 'package:tencent_float_chat_widget/tencent_float_chat_widget.dart';

import 'widgets/widgets.dart';

class ConferenceMainController extends GetxController {
  ConferenceMainController({
    this.conferenceId,
    this.isCreateConference,
    this.conferenceParams,
    this.conferenceObserver,
    this.chatWidget,
  });

  final String? conferenceId;
  final bool? isCreateConference;
  final ConferenceParams? conferenceParams;
  final ConferenceObserver? conferenceObserver;
  final Widget? chatWidget;

  bool isMicrophoneInviteDialogShow = false;
  bool isCameraInviteDialogShow = false;
  TUIRoomObserver? observer;

  Timer? _hideTimer;
  RxBool areWidgetsVisible = true.obs;
  int _hideDuration = 6;
  RxBool isEnteredRoom = false.obs;


  showDialog() {
    showConferenceDialog(
      title: 'liveScreen'.roomTr,
      message: 'stopTUIRoomScreenShare'.roomTr,
      cancelText: 'cancel'.roomTr,
      confirmText: 'stop'.roomTr,
      onConfirm: () {
        RoomEngineManager().stopScreenSharing();
        Get.back();
      },
    );
  }

  @override
  Future<void> onInit() async {
    if (!Get.isRegistered<RoomStore>() || !RoomStore.to.isEnteredRoom) {
      if (conferenceId == null || isCreateConference == null) {
        _showNotEnteredRoomDialog();
        return;
      }
      await _enterConference(
          conferenceId!, isCreateConference!, conferenceParams);
    } else if (conferenceId != null &&
        conferenceId != RoomStore.to.roomInfo.roomId) {
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
      onRoomDismissed: (roomId, reason) {
        conferenceObserver?.onConferenceFinished
            ?.call(RoomStore.to.roomInfo.roomId);
        RoomStore.to.clearStore();
        showExitRoomDialog('roomDestroyed'.roomTr);
      },
      onKickedOutOfRoom: (roomId, reason, message) {
        conferenceObserver?.onConferenceExited
            ?.call(RoomStore.to.roomInfo.roomId);
        RoomStore.to.clearStore();
        showExitRoomDialog('kickedOutOfRoom'.roomTr);
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
    if (Get.isRegistered<FloatWindowStore>()) {
      FloatWindowStore.to.dismissFloatWindow();
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
    FloatChatManager().deleteStatus();
    super.onClose();
  }

  void showRequestDialog(TUIRequest request) {
    String title = '';
    String message = '';
    String confirmText = '';
    String cancelText = 'doNotOpen'.roomTr;

    if (request.requestAction == TUIRequestAction.requestToOpenRemoteCamera) {
      isCameraInviteDialogShow = true;
      title = 'cameraInviteTitle'.roomTr;
      message = 'cameraInviteMessage'.roomTr;
      confirmText = 'confirmOpenCamera'.roomTr;
    } else if (request.requestAction ==
        TUIRequestAction.requestToOpenRemoteMicrophone) {
      isMicrophoneInviteDialogShow = true;
      title = 'microphoneInviteTitle'.roomTr;
      message = 'microphoneInviteMessage'.roomTr;
      confirmText = 'confirmOpenMicrophone'.roomTr;
    } else if (request.requestAction ==
        TUIRequestAction.requestRemoteUserOnSeat) {
      title = 'takeSeatInviteTitle'.roomTr;
      message = 'takeSeatInviteMessage'.roomTr;
      confirmText = 'agreeTakeSeat'.roomTr;
      cancelText = 'refuse'.roomTr;
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
        bool isGranted = true;
        switch (request.requestAction) {
          case TUIRequestAction.requestToOpenRemoteCamera:
            isGranted = await _requestCameraPermission();
            break;
          case TUIRequestAction.requestToOpenRemoteMicrophone:
            isGranted = await _requestMicPermission();
            break;
          default:
            break;
        }

        if (!isGranted) {
          RoomEngineManager()
              .getRoomEngine()
              .responseRemoteRequest(request.requestId, false);
          return;
        }

        final result = await RoomEngineManager()
            .getRoomEngine()
            .responseRemoteRequest(request.requestId, true);
        Get.back();

        final toastMessages = {
          TUIError.errFailed: 'goOnStageTimeOut'.roomTr,
          TUIError.errAllSeatOccupied: 'stageMemberReachedLimit'.roomTr,
        };

        if (toastMessages.containsKey(result.code)) {
          makeToast(msg: toastMessages[result.code]!);
        }
      },
      barrierDismissible: false,
    );
  }

  Future<bool> _requestMicPermission() async {
    var isGranted = await Permission.microphone.isGranted;
    if (isGranted) {
      return true;
    }

    var microphone = await Permission.microphone.request();
    if (microphone.isGranted) {
      return true;
    }

    return false;
  }

  Future<bool> _requestCameraPermission() async {
    var isGranted = await Permission.camera.isGranted;
    if (isGranted) {
      return true;
    }

    var cameraPermission = await Permission.camera.request();
    if (cameraPermission.isGranted) {
      return true;
    }

    return false;
  }

  void showExitRoomDialog(String title) {
    showConferenceDialog(
      title: title.roomTr,
      confirmText: 'ok'.roomTr,
      confirmTextStyle: RoomTheme.defaultTheme.textTheme.labelMedium,
      onConfirm: () {
        Get.until((route) {
          var args = route.settings.arguments;
          if (args is Map) {
            return route is! PopupRoute && args['from'] != 'ConferenceMainPage';
          }
          return route is! PopupRoute;
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
          ..name = conferenceParams.name ?? ""
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
        title: 'haveNotEnteredRoomTip'.roomTr,
        confirmText: 'ok'.roomTr,
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
        title: 'differentRoomIdTip'.roomTr,
        confirmText: 'ok'.roomTr,
        onConfirm: () {
          Get.back();
        },
        barrierDismissible: false,
      );
    });
  }
}
