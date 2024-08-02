import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';
import 'package:tencent_conference_uikit/manager/rtc_engine_manager.dart';
import 'package:rtc_room_engine/rtc_room_engine.dart';

class VideoLayoutController extends GetxController {
  VideoLayoutController();
  final _right = 5.0.obs;
  final _top = 5.0.obs;
  double videoLayoutHeight = 665.0.scale375Height();
  double videoLayoutWidth = Get.width;
  final Map<String, int> _viewPtrMap = {};
  late TUIRoomObserver _observer;
  Timer? _speakingUserUpdateTimer;
  RxBool isDraggableWidgetVisible = false.obs;
  var speakingUser = UserModel().obs;

  double get rightPadding => _right.value;
  double get topPadding => _top.value;

  set rightPadding(double value) => _right.value = value;
  set topPadding(double value) => _top.value = value;

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
          if (!isDraggableWidgetVisible.value) {
            return;
          }
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

  updateVideoLayoutSize(Orientation orientation) {
    videoLayoutWidth =
        orientation == Orientation.portrait ? Get.width : 648.0.scale375();
    videoLayoutHeight = orientation == Orientation.portrait
        ? 665.0.scale375Height()
        : Get.height;
  }

  updatePadding(
      Orientation orientation, double widgetWidth, double widgetHeight) {
    if (rightPadding != 5.0) {
      rightPadding = videoLayoutWidth - 5 - widgetWidth;
    }
    topPadding = min(topPadding, videoLayoutHeight - 5 - widgetHeight);
  }

  onPanUpdate(
      DragUpdateDetails details, double widgetWidth, double widgetHeight) {
    rightPadding = (rightPadding -= details.delta.dx)
        .clamp(5, videoLayoutWidth - 5 - widgetWidth);
    if (topPadding + details.delta.dy > 5) {
      topPadding = (topPadding += details.delta.dy)
          .clamp(5, videoLayoutHeight - 5 - widgetHeight);
    }
  }

  onPanEnd(DragEndDetails details, double widgetWidth, double widgetHeight) {
    if (rightPadding < (videoLayoutWidth - widgetWidth) / 2) {
      rightPadding = 5.0;
    } else {
      rightPadding = videoLayoutWidth - 5 - widgetWidth;
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

  void _removeVideoView(String userId, int id) {
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

  WrapAlignment getWrapAlignment(int userListLength, int currentPageIndex) {
    return (RoomStore.to.isSharing.value || userListLength > 6)
        ? (_getTotalPageCount(userListLength) == currentPageIndex + 1 &&
                userListLength % 6 != 0)
            ? WrapAlignment.start
            : WrapAlignment.center
        : WrapAlignment.center;
  }

  void updateVideoItem(
      String oldUserId, int nativeViewPtr, String userId, bool isScreenStream) {
    _removeVideoView(oldUserId, nativeViewPtr);
    setVideoView(userId, nativeViewPtr, isScreenStream: isScreenStream);
  }

  int _getTotalPageCount(int userListLength) {
    return RoomStore.to.isSharing.value
        ? (userListLength / 6).ceil() + 1
        : (userListLength / 6).ceil();
  }
}
