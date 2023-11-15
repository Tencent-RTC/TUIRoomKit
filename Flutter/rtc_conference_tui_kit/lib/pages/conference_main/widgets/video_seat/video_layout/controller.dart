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

  double get rightPadding => _right.value;
  double get topPadding => _top.value;
  get isSwitchMainDraggableAndWindow => _isSwitchMainDraggableAndWindow.value;

  set rightPadding(double value) => _right.value = value;
  set topPadding(double value) => _top.value = value;
  set isSwitchMainDraggableAndWindow(value) =>
      _isSwitchMainDraggableAndWindow.value = value;

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
      roomEngine.startPlayRemoteVideo(userId, streamType, null);
    }
  }

  WrapAlignment getWrapAlignment(List<UserModel> userList) {
    return (RoomStore.to.isSharing.value || userList.length > 6)
        ? WrapAlignment.start
        : WrapAlignment.center;
  }
}
