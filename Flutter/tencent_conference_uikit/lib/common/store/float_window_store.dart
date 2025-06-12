import 'dart:io';

import 'package:flutter/cupertino.dart';
import 'package:get/get.dart';
import 'package:rtc_room_engine/rtc_room_engine.dart';
import 'package:tencent_conference_uikit/common/store/room.dart';

import '../../manager/rtc_engine_manager.dart';
import '../../pages/conference_main/widgets/float_window/view.dart';
import '../../platform/rtc_conference_tuikit_platform_interface.dart';
import '../models/user.dart';

class FloatWindowStore extends GetxController {
  static FloatWindowStore get to => Get.find();

  final UserModel _previousFloatWindowUserModel = UserModel();
  final Rx<UserModel> currentFloatWindowUserModel = UserModel().obs;
  final _maxVolumeUserId = "".obs;
  final _volumeFilterMinLimit = 10;
  final int _floatWindowUserIdChangInterval = 5;

  late TUIRoomObserver _observer;

  late Worker _isSharingWorker;
  late Worker _maxVolumeUserIdChangedWorker;
  late Worker _floatUserInfoChangedWorker;

  late int _floatVideoViewPtr;

  OverlayEntry? overlayEntry;

  @override
  Future<void> onInit() async {
    super.onInit();
    _updateFlotWindowUserModel();
    _addEngineObserver();
    _initWorker();
  }

  @override
  void onClose() {
    RoomEngineManager().removeObserver(_observer);
    _maxVolumeUserIdChangedWorker.dispose();
    _isSharingWorker.dispose();
    _floatUserInfoChangedWorker.dispose();
    dismissFloatWindow();
    super.onClose();
  }

  Future<bool> showFloatWindow() async {
    if (Platform.isAndroid) {
      _floatVideoViewPtr =
          await RtcConferenceTuikitPlatform.instance.enableFloatWindow(true);
      _updateFloatWindow(currentFloatWindowUserModel.value);
      return _floatVideoViewPtr != 0;
    } else if (Platform.isIOS) {
      overlayEntry ??= OverlayEntry(builder: (BuildContext context) {
        return FloatWindowWidget(
          top: 100,
          left: Get.width - 100,
          onFloatWindowTap: () => dismissFloatWindow(),
        );
      });
      Overlay.of(Get.overlayContext!).insert(overlayEntry!);
      return true;
    }
    return false;
  }

  dismissFloatWindow() {
    if (Platform.isAndroid) {
      RtcConferenceTuikitPlatform.instance.enableFloatWindow(false);
    } else if (Platform.isIOS) {
      overlayEntry?.remove();
      overlayEntry?.dispose();
      overlayEntry = null;
    }
    onFloatWindowClose();
  }

  onFloatWindowClose() {
    Get.delete<FloatWindowStore>(force: true);
  }

  void _initWorker() {
    _maxVolumeUserIdChangedWorker = interval(
      _maxVolumeUserId,
      (userId) => currentFloatWindowUserModel.value = RoomStore.to.userInfoList
          .firstWhere((user) => user.userId.value == userId,
              orElse: () => currentFloatWindowUserModel.value),
      time: Duration(seconds: _floatWindowUserIdChangInterval),
    );
    _isSharingWorker = ever(RoomStore.to.isSharing, (isSharing) {
      _updateFlotWindowUserModel();
    });
    _floatUserInfoChangedWorker =
        ever(currentFloatWindowUserModel, (userModel) {
      if (!Platform.isAndroid) {
        return;
      }
      _stopPlayVideo(_previousFloatWindowUserModel);
      _updateFloatWindow(currentFloatWindowUserModel.value);
    });
  }

  void _updateFlotWindowUserModel() {
    if (RoomStore.to.isSharing.value) {
      currentFloatWindowUserModel.value = RoomStore.to.screenShareUser;
      return;
    }

    int fistTalkingUserIndex = -1;
    int ownerIndex = -1;
    for (int i = 0; i < RoomStore.to.userInfoList.length; i++) {
      if (RoomStore.to.userInfoList[i].isTalking.value) {
        fistTalkingUserIndex = i;
        break;
      }
      if (RoomStore.to.userInfoList[i].userRole.value == TUIRole.roomOwner) {
        ownerIndex = i;
      }
    }
    currentFloatWindowUserModel.value = fistTalkingUserIndex == -1
        ? RoomStore.to.userInfoList[ownerIndex]
        : RoomStore.to.userInfoList[fistTalkingUserIndex];
  }

  void _addEngineObserver() {
    _observer = TUIRoomObserver(
      onUserVoiceVolumeChanged: (volumeMap) {
        int maxVolume = 0;

        volumeMap.forEach(
          (userId, volume) {
            if (volume < _volumeFilterMinLimit) {
              return;
            }
            if (userId == currentFloatWindowUserModel.value.userId.value) {
              currentFloatWindowUserModel.value.volume.value =
                  currentFloatWindowUserModel.value.hasAudioStream.value
                      ? volume
                      : 0;
              RtcConferenceTuikitPlatform.instance.updateFloatWindowUserModel(
                  currentFloatWindowUserModel.value);
            }
            if (volume > maxVolume) {
              maxVolume = volume;
              _maxVolumeUserId.value = userId;
            }
          },
        );
      },
      onRemoteUserLeaveRoom: (roomId, userInfo) {
        if (roomId != RoomStore.to.roomInfo.roomId) {
          return;
        }
        if (currentFloatWindowUserModel.value.userId.value != userInfo.userId) {
          return;
        }
        _updateFlotWindowUserModel();
      },
      onKickedOutOfRoom: (roomId, reason, message) {
        dismissFloatWindow();
        RoomStore.to.clearStore();
      },
      onRoomDismissed: (roomId, reason) {
        dismissFloatWindow();
        RoomStore.to.clearStore();
      },
      onUserAudioStateChanged: (userId, hasAudio, reason) {
        if (userId != currentFloatWindowUserModel.value.userId.value) {
          return;
        }

        currentFloatWindowUserModel.value.hasAudioStream.value = hasAudio;
        RtcConferenceTuikitPlatform.instance
            .updateFloatWindowUserModel(currentFloatWindowUserModel.value);
      },
      onUserVideoStateChanged: (userId, streamType, hasVideo, reason) {
        if (userId != currentFloatWindowUserModel.value.userId.value) {
          return;
        }
        currentFloatWindowUserModel.value.hasVideoStream.value = hasVideo;
        RtcConferenceTuikitPlatform.instance
            .updateFloatWindowUserModel(currentFloatWindowUserModel.value);
      },
    );
    RoomEngineManager().addObserver(_observer);
  }

  void _updateFloatWindow(UserModel userModel) {
    RtcConferenceTuikitPlatform.instance
        .updateFloatWindowUserModel(currentFloatWindowUserModel.value);
    _startPlayVideo(userModel);
    _updatePreviousUserModel(userModel);
  }

  void _updatePreviousUserModel(UserModel userModel) {
    _previousFloatWindowUserModel.userId.value = userModel.userId.value;
    _previousFloatWindowUserModel.userName.value = userModel.userName.value;
    _previousFloatWindowUserModel.userAvatarURL.value =
        userModel.userAvatarURL.value;
    _previousFloatWindowUserModel.userRole.value = userModel.userRole.value;
    _previousFloatWindowUserModel.hasAudioStream.value =
        userModel.hasAudioStream.value;
    _previousFloatWindowUserModel.hasVideoStream.value =
        userModel.hasVideoStream.value;
    _previousFloatWindowUserModel.hasScreenStream.value =
        userModel.hasScreenStream.value;
    _previousFloatWindowUserModel.ableSendingMessage.value =
        userModel.ableSendingMessage.value;
    _previousFloatWindowUserModel.isOnSeat.value = userModel.isOnSeat.value;
    _previousFloatWindowUserModel.isTalking.value = userModel.isTalking.value;
    _previousFloatWindowUserModel.volume.value = userModel.volume.value;
  }

  void _startPlayVideo(UserModel userModel) {
    if (userModel.userId.value == RoomStore.to.currentUser.userId.value) {
      RoomEngineManager().getRoomEngine().setLocalVideoView(_floatVideoViewPtr);
    } else {
      RoomEngineManager().getRoomEngine().setRemoteVideoView(
          userModel.userId.value,
          userModel.hasScreenStream.value
              ? TUIVideoStreamType.screenStream
              : TUIVideoStreamType.cameraStream,
          _floatVideoViewPtr);
      RoomEngineManager().getRoomEngine().startPlayRemoteVideo(
          userModel.userId.value,
          userModel.hasScreenStream.value
              ? TUIVideoStreamType.screenStream
              : TUIVideoStreamType.cameraStream,
          null);
    }
  }

  void _stopPlayVideo(UserModel userModel) {
    if (userModel.userId.value == RoomStore.to.currentUser.userId.value) {
      RoomEngineManager().getRoomEngine().setLocalVideoView(0);
    } else {
      RoomEngineManager().getRoomEngine().setRemoteVideoView(
          userModel.userId.value,
          userModel.hasScreenStream.value
              ? TUIVideoStreamType.screenStream
              : TUIVideoStreamType.cameraStream,
          0);
      RoomEngineManager().getRoomEngine().stopPlayRemoteVideo(
          userModel.userId.value,
          userModel.hasScreenStream.value
              ? TUIVideoStreamType.screenStream
              : TUIVideoStreamType.cameraStream);
    }
  }
}
