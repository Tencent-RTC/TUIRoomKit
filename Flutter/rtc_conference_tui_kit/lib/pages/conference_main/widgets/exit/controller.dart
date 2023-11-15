import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/store/room.dart';
import 'package:rtc_conference_tui_kit/manager/rtc_engine_manager.dart';
import 'package:rtc_room_engine/api/room/tui_room_define.dart';

import '../widgets.dart';

class ExitController extends GetxController {
  ExitController();

  final RoomEngineManager _engineManager = RoomEngineManager();

  void exitRoomAction() {
    if (RoomStore.to.currentUser.userRole.value == TUIRole.roomOwner) {
      if (RoomStore.to.userInfoList.length > 1) {
        Get.bottomSheet(const TransferHostWidget(), isScrollControlled: true);
      } else {
        destroyRoomAction();
      }
      return;
    }
    _engineManager.exitRoom();
    Get.back();
  }

  void destroyRoomAction() {
    _engineManager.destroyRoom();
    Get.back();
  }
}
