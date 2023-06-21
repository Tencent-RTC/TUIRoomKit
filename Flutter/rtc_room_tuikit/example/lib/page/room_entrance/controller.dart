import 'package:get/get.dart';
import 'package:rtc_room_engine/api/room/tui_room_engine.dart';
import 'package:rtc_room_tuikit/live_room.dart';

class RoomEntranceController extends GetxController {
  final _liveRoom = TUILiveRoom();
  RoomEntranceController();

  _initData() {
    update(["room_entrance"]);
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

  _getRoomId() {
    var userId = TUIRoomEngine.getSelfInfo().userId;
    return ('${userId}_tuikit'.hashCode & 0x3B9AC9FF).toString();
  }

  createRoom() {
    _liveRoom.createRoom(_getRoomId());
  }

  enterRoom(String roomId) {
    _liveRoom.enterRoom(roomId);
  }
}
