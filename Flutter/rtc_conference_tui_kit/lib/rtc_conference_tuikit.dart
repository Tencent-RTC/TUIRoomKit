library rtc_conference_tui_kit;

import 'package:rtc_conference_tui_kit/rtc_conference_tuikit_impl.dart';
import 'package:rtc_room_engine/api/room/tui_room_define.dart';

abstract class TUIRoomKit {
  static TUIRoomKit createInstance() {
    return TUIRoomKitImpl();
  }

  Future<TUIActionCallback> setSelfInfo(String userName, String avatarURL);

  Future<TUIActionCallback> createRoom(TUIRoomInfo roomInfo);

  Future<TUIValueCallBack<TUIRoomInfo>> enterRoom(
      String roomId, bool enableMic, bool enableCamera, bool isSoundOnSpeaker);
}
