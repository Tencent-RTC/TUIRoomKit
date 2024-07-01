import 'package:tencent_conference_uikit/conference/tui_room_kit_impl.dart';
import 'package:rtc_room_engine/api/room/tui_room_define.dart';

@Deprecated('use ConferenceSession instead')
abstract class TUIRoomKit {
  static TUIRoomKit createInstance() {
    return TUIRoomKitImpl();
  }

  @Deprecated('use setSelfInfo in TUIRoomEngine instead')
  Future<TUIActionCallback> setSelfInfo(String userName, String avatarURL);

  @Deprecated('use quickStart in ConferenceSession instead')
  Future<TUIActionCallback> createRoom(TUIRoomInfo roomInfo);

  @Deprecated('use join in ConferenceSession instead')
  Future<TUIValueCallBack<TUIRoomInfo>> enterRoom(
      String roomId, bool enableMic, bool enableCamera, bool isSoundOnSpeaker);
}
