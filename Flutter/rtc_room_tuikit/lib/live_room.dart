import 'package:get/get.dart';
import 'package:rtc_room_engine/api/common/tui_common_define.dart';
import 'package:rtc_room_engine/api/room/tui_room_define.dart';
import 'package:rtc_room_engine/api/room/tui_room_engine.dart';
import 'package:rtc_room_tuikit/common/index.dart';
import 'package:rtc_room_tuikit/pages/index.dart';

class TUILiveRoom {
  late TUIRoomEngine _roomEngine;
  static final TUILiveRoom _instance = TUILiveRoom._internal();

  TUILiveRoom._internal() {
    _roomEngine = TUIRoomEngine.createInstance();
    Get.put<RoomStore>(RoomStore());
  }

  factory TUILiveRoom() => _instance;

  TUIRoomEngine get roomEngine => _roomEngine;

  void createRoom(String roomId) {
    if (roomId.isEmpty) {
      return;
    }
    var roomInfo = TUIRoomInfo(roomId: roomId);
    roomInfo.speechMode = TUISpeechMode.speakAfterTakingSeat;
    roomInfo.roomType = TUIRoomType.livingRoom;
    roomInfo.name = "live room";
    _roomEngine.createRoom(roomInfo).then((callback) {
      if (callback.code == TUIError.success) {
        _roomEngine.enterRoom(roomId).then((valueCallback) {
          if (valueCallback.code == TUIError.success) {
            _roomEngine.takeSeat(0, 0, null);
            RoomStore.to.ownerId = valueCallback.data?.ownerId ?? "";
            RoomStore.to.roomId = valueCallback.data?.roomId ?? "";
            RoomStore.to.roomName = valueCallback.data?.name ?? "";
            Get.to(const RoomAnchorPage());
          } else {
            ToastUtil.showToast('${valueCallback.code},${valueCallback.message}');
          }
        });
      } else {
        ToastUtil.showToast('${callback.code},${callback.message}');
      }
    });
    //Get.to(const RoomAnchorPage());
  }

  void enterRoom(String roomId) {
    if (roomId.isEmpty) {
      return;
    }
    _roomEngine.enterRoom(roomId).then((callback) {
      if (callback.code == TUIError.success) {
        RoomStore.to.ownerId = callback.data?.ownerId ?? "";
        RoomStore.to.roomId = callback.data?.roomId ?? "";
        RoomStore.to.roomName = callback.data?.name ?? "";
        Get.to(const RoomAudiencePage());
      } else {
        ToastUtil.showToast('${callback.code},${callback.message}');
      }
    });
  }
}
