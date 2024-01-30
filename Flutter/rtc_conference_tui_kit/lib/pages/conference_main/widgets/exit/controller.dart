import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/store/room.dart';
import 'package:rtc_conference_tui_kit/manager/rtc_engine_manager.dart';
import 'package:rtc_room_engine/api/common/tui_common_define.dart';
import 'package:rtc_room_engine/api/room/tui_room_define.dart';

import '../widgets.dart';

class ExitController extends GetxController {
  ExitController();

  final RoomEngineManager _engineManager = RoomEngineManager();

  void exitRoomAction() async {
    if (isRoomOwner()) {
      if (RoomStore.to.userInfoList.length > 2) {
        Get.bottomSheet(const TransferHostWidget(), isScrollControlled: true);
      } else if (RoomStore.to.userInfoList.length == 2) {
        var nextOwnerId = RoomStore.to.userInfoList
            .firstWhere((element) =>
                element.userId.value != RoomStore.to.currentUser.userId.value)
            .userId
            .value;
        var result =
            await _engineManager.changeUserRole(nextOwnerId, TUIRole.roomOwner);
        if (result.code == TUIError.success) {
          _engineManager.exitRoom();
          Get.back();
        }
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

  bool isRoomOwner() {
    return RoomStore.to.currentUser.userRole.value == TUIRole.roomOwner;
  }

  bool isNeedTransferOwner() {
    return isRoomOwner() && RoomStore.to.userInfoList.length > 1;
  }
}
