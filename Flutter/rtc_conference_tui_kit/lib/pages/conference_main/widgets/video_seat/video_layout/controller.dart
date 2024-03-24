import 'dart:async';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_conference_tui_kit/manager/rtc_engine_manager.dart';
import 'package:rtc_room_engine/rtc_room_engine.dart';

class VideoLayoutController extends GetxController {
  VideoLayoutController();
  final _right = 5.0.obs;
  final _top = 5.0.obs;
  final _isSwitchMainDraggableAndWindow = false.obs;
  final Map<String, int> _viewPtrMap = {};
  late TUIRoomObserver _observer;
  Timer? _speakingUserUpdateTimer;
  RxBool isDraggableWidgetVisible = false.obs;
  var speakingUser = UserModel().obs;

  double get rightPadding => _right.value;
  double get topPadding => _top.value;
  get isSwitchMainDraggableAndWindow => _isSwitchMainDraggableAndWindow.value;

  set rightPadding(double value) => _right.value = value;
  set topPadding(double value) => _top.value = value;
  set isSwitchMainDraggableAndWindow(value) =>
      _isSwitchMainDraggableAndWindow.value = value;

  @override
  void onInit() {
    super.onInit();
    _observer = TUIRoomObserver(
      onUserVoiceVolumeChanged: (volumeMap) {
        if (!RoomStore.to.isSharing.value ||
            _speakingUserUpdateTimer?.isActive == true) {
          return;
        }
        var speakingUserId = volumeMap.entries
            .firstWhere(
              (entry) => entry.value >= 10,
              orElse: () => const MapEntry<String, int>('', -1),
            )
            .key;
        if (speakingUserId.isEmpty) {
          isDraggableWidgetVisible.value = false;
          speakingUser.value = UserModel();
          return;
        }
        speakingUser.value =
            RoomStore.to.getUserById(speakingUserId) ?? UserModel();
        isDraggableWidgetVisible.value = true;
        _speakingUserUpdateTimer = Timer(const Duration(seconds: 5), () {});
      },
    );
    RoomEngineManager().addObserver(_observer);
  }

  @override
  void dispose() {
    if (_speakingUserUpdateTimer != null) {
      _speakingUserUpdateTimer!.cancel();
    }
    RoomEngineManager().removeObserver(_observer);
    super.dispose();
  }

  onPanUpdate(DragUpdateDetails details, double widgetWidth) {
    rightPadding = (rightPadding -= details.delta.dx)
        .clamp(5, Get.width - 5 - widgetWidth);
    if (topPadding + details.delta.dy > 5) {
      topPadding += details.delta.dy;
    }
  }

  onPanEnd(DragEndDetails details, double widgetWidth) {
    if (rightPadding < (Get.width - widgetWidth) / 2) {
      rightPadding = 5.0;
    } else {
      rightPadding = Get.width - 5 - widgetWidth;
    }
  }

  void setVideoView(String userId, int id, {bool? isScreenStream}) {
    var streamType = isScreenStream == true
        ? TUIVideoStreamType.screenStream
        : TUIVideoStreamType.cameraStream;
    var roomEngine = RoomEngineManager().getRoomEngine();
    if (userId == TUIRoomEngine.getSelfInfo().userId) {
      roomEngine.setLocalVideoView(id);
    } else {
      roomEngine.setRemoteVideoView(userId, streamType, id);
    }
    _viewPtrMap[userId] = id;
  }

  void removeVideoView(String userId, int id) {
    if (_viewPtrMap[userId] != id) {
      return;
    }
    if (userId == TUIRoomEngine.getSelfInfo().userId) {
      RoomEngineManager().getRoomEngine().setLocalVideoView(0);
    } else {
      RoomEngineManager()
          .getRoomEngine()
          .setRemoteVideoView(userId, TUIVideoStreamType.cameraStream, 0);
    }
  }

  void updateVideoPlayState(String userId, bool hasVideo,
      {bool? isScreenStream}) {
    var streamType = isScreenStream == true
        ? TUIVideoStreamType.screenStream
        : TUIVideoStreamType.cameraStream;
    var roomEngine = RoomEngineManager().getRoomEngine();
    if (hasVideo) {
      roomEngine.startPlayRemoteVideo(userId, streamType, null);
    } else {
      roomEngine.stopPlayRemoteVideo(userId, streamType);
    }
  }

  WrapAlignment getWrapAlignment(List<UserModel> userList) {
    return (RoomStore.to.isSharing.value || userList.length > 6)
        ? WrapAlignment.start
        : WrapAlignment.center;
  }
}
