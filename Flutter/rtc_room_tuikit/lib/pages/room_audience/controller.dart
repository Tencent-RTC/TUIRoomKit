import 'package:get/get.dart';
import 'package:rtc_room_engine/api/room/tui_room_engine.dart';
import 'package:rtc_room_tuikit/live_room.dart';

class RoomAudienceController extends GetxController {
  RoomAudienceController();
  final ownerId = '';
  late TUIRoomEngine _roomEngine;
  TUIRoomEngine get roomEngine => _roomEngine;

  @override
  void onInit() {
    super.onInit();
    _roomEngine = TUILiveRoom().roomEngine;
  }

  exitRoom() {
    _roomEngine.exitRoom(false);
    Get.back();
    Get.back();
  }
}
