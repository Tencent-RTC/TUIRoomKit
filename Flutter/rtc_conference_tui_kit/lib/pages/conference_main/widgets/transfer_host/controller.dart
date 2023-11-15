import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_conference_tui_kit/manager/rtc_engine_manager.dart';
import 'package:rtc_room_engine/rtc_room_engine.dart';

class TransferHostController extends GetxController {
  TransferHostController();

  final RoomEngineManager _engineManager = RoomEngineManager();

  var chosenUserId = ''.obs;
  var isSearchBarEmpty = true.obs;
  RxList<UserModel> searchResults = RxList<UserModel>();

  void searchAction(String value) {
    if (value.isNotEmpty) {
      List<UserModel> results = RoomStore.to.userInfoList
          .where((user) =>
              user.userName.toLowerCase().contains(value.toLowerCase()))
          .toList();
      searchResults.assignAll(results);
      isSearchBarEmpty.value = false;
    } else {
      searchResults.clear();
      isSearchBarEmpty.value = true;
    }
  }

  void appointAndLeaveAction() async {
    var result = await _engineManager.changeUserRole(
        chosenUserId.value, TUIRole.roomOwner);
    if (result.code == TUIError.success) {
      _engineManager.exitRoom();
      Get.back();
      Get.back();
    } else {
      makeToast(msg: result.message!);
    }
  }
}
