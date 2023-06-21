import 'package:flutter/foundation.dart';
import 'package:get/get.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:rtc_room_engine/api/room/tui_room_define.dart';
import 'package:rtc_room_engine/api/room/tui_room_engine.dart';
import 'package:rtc_room_tuikit/common/index.dart';

class LiveVideoViewController extends GetxController {
  final isPKing = false.obs;
  final TUIRoomEngine _roomEngine;
  String pkUserId = '';

  LiveVideoViewController(this._roomEngine);

  _initData() {
    update(["live_video_view"]);
  }

  setVideoView(String userId, int viewId) {
    if (userId == TUIRoomEngine.getSelfInfo().userId) {
      _roomEngine.setLocalVideoView(TUIVideoStreamType.cameraStream, viewId);
      Permission.camera.isGranted.then((value) {
        if (value) {
          _roomEngine.openLocalCamera(true, TUIVideoQuality.videoQuality_1080P);
        }
      });
      _roomEngine.startPushLocalVideo();
    } else {
      _roomEngine.setRemoteVideoView(
          userId, TUIVideoStreamType.cameraStream, viewId);
      _roomEngine.startPlayRemoteVideo(
          userId, TUIVideoStreamType.cameraStream, null);
    }
  }

  void onTap() {}

  // @override
  // void onInit() {
  //   super.onInit();
  // }

  @override
  void onReady() {
    super.onReady();
    _initData();
  }

// @override
// void onClose() {
//   super.onClose();
// }
}
