import 'package:get/get.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:rtc_room_engine/api/common/tui_common_define.dart';
import 'package:rtc_room_engine/api/room/tui_room_define.dart';
import 'package:rtc_room_engine/api/room/tui_room_engine.dart';
import 'package:rtc_room_tuikit/live_room.dart';
import 'package:tencent_trtc_cloud/trtc_cloud.dart';

class RoomAnchorController extends GetxController {
  RoomAnchorController();

  late TUIRoomEngine _roomEngine;

  TUIRoomEngine get roomEngine => _roomEngine;

  _initData() async {
    bool cameraStatus = await Permission.camera.isGranted;
    if (!cameraStatus) {
      await Permission.camera.request().isGranted;
      _roomEngine.openLocalCamera(true, TUIVideoQuality.videoQuality_1080P);
    }

    bool microphoneStatus = await Permission.microphone.isGranted;
    if (!microphoneStatus) {
      await Permission.microphone.request().isGranted;
    }
    _roomEngine.openLocalMicrophone(TUIAudioQuality.audioProfileDefault);


    Permission.camera.isGranted.then((value) {
      if (!value) {
        Permission.camera.request().isGranted.then((value) {
          Permission.camera.isGranted.then((value2) {
            if (!value) {
              Permission.microphone.request().isGranted;
            }
          });
        });
      }
    });
  }

  @override
  void onInit() async {
    super.onInit();
    _roomEngine = TUILiveRoom().roomEngine;
  }

  @override
  void onReady() {
    super.onReady();
    _initData();
  }

  createRoom(String roomId) async {
    if (roomId.isEmpty) {
      return;
    }
    var roomInfo = TUIRoomInfo(roomId: roomId);
    roomInfo.speechMode = TUISpeechMode.speakAfterTakingSeat;
    roomInfo.roomType = TUIRoomType.livingRoom;
    roomInfo.name = "$roomId's live room";

    _roomEngine.createRoom(roomInfo).then((callback) {
      if (callback.code == TUIError.success) {
        _roomEngine.enterRoom(roomId).then((valueCallback) {
          if (valueCallback.code == TUIError.success) {
            //Todo enterRoom
          }
        });
      } else {
        //Todo error
      }
    });
  }

  destroyRoom() {
    //Todo destroy
    _roomEngine.destroyRoom().then((value) => null);
    Get.back();
    Get.back();
  }

  switchCamera() {
    TRTCCloud.sharedInstance().then((value) {
      value
          ?.getDeviceManager()
          .isFrontCamera()
          .then((isFront) => value.getDeviceManager().switchCamera(!isFront!));
    });
  }
}
