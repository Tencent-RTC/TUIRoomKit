import 'package:get/get.dart';
import 'package:tencent_conference_uikit/pages/conference_main/index.dart';
import 'package:tencent_conference_uikit/manager/rtc_engine_manager.dart';
import 'package:tencent_conference_uikit/conference/tui_room_kit.dart';
import 'package:rtc_room_engine/rtc_room_engine.dart';

class TUIRoomKitImpl implements TUIRoomKit {
  static final TUIRoomKitImpl _singleton = TUIRoomKitImpl._internal();

  factory TUIRoomKitImpl() {
    return _singleton;
  }

  TUIRoomKitImpl._internal();

  @override
  Future<TUIActionCallback> setSelfInfo(String userName, String avatarURL) {
    return RoomEngineManager().setSelfInfo(userName, avatarURL);
  }

  @override
  Future<TUIActionCallback> createRoom(TUIRoomInfo roomInfo) {
    return RoomEngineManager().createRoom(roomInfo);
  }

  @override
  Future<TUIValueCallBack<TUIRoomInfo>> enterRoom(String roomId, bool enableMic,
      bool enableCamera, bool isSoundOnSpeaker) async {
    var result = await RoomEngineManager()
        .enterRoom(roomId, enableMic, enableCamera, isSoundOnSpeaker);
    if (result.code == TUIError.success) {
      Get.to(const ConferenceMainPage());
    }
    return result;
  }
}
