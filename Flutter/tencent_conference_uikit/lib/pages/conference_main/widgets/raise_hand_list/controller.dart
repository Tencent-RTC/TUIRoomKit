import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';
import 'package:tencent_conference_uikit/manager/rtc_engine_manager.dart';
import 'package:rtc_room_engine/api/common/tui_common_define.dart';

class RaiseHandListController extends GetxController {
  RaiseHandListController();

  var isSearchBarEmpty = true.obs;
  RxList<UserModel> searchResults = RxList<UserModel>();
  final RoomEngineManager _engineManager = RoomEngineManager();

  void searchAction(String value) {
    if (value.isNotEmpty) {
      List<UserModel> results = RoomStore.to.inviteSeatList
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

  void allAgreeAction() {
    for (var userInfo in RoomStore.to.inviteSeatList) {
      var requestId = RoomStore.to.inviteSeatMap[userInfo.userId];
      if (requestId == null) {
        return;
      }
      _engineManager.responseRemoteRequest(requestId, true).then((value) {
        if (value.code == TUIError.success) {
          RoomStore.to.deleteInviteSeatUser(userInfo.userId.value);
        }
        if (value.code == TUIError.errAllSeatOccupied) {
          makeToast(
              msg: RoomContentsTranslations.translate(
                  'stageMemberReachedLimit'));
          return;
        }
      });
    }
  }

  void agreeStageAction(String userId, bool isAgree) {
    var requestId = RoomStore.to.inviteSeatMap[userId];
    if (requestId == null) {
      return;
    }
    _engineManager.responseRemoteRequest(requestId, isAgree).then((value) {
      if (value.code == TUIError.success) {
        RoomStore.to.deleteInviteSeatUser(userId);
        searchResults.removeWhere((element) => element.userId.value == userId);
      } else if (value.code == TUIError.errAllSeatOccupied) {
        makeToast(
            msg: RoomContentsTranslations.translate('stageMemberReachedLimit'));
      }
    });
  }
}
