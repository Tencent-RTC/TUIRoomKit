import 'package:get/get.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_conference_tui_kit/pages/conference_main/index.dart';
import 'package:rtc_conference_tui_kit/rtc_conference_tuikit.dart';
import 'package:rtc_conference_tui_kit/manager/rtc_engine_manager.dart';
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
      Get.to(const ConferenceMainPage(), arguments: Get.currentRoute);
      _decideMediaStatus(enableMic, enableCamera, isSoundOnSpeaker);
    }
    return result;
  }

  Future<void> _decideMediaStatus(
      bool enableMic, bool enableCamera, bool isSoundOnSpeaker) async {
    RoomEngineManager().setAudioRoute(isSoundOnSpeaker);
    var hasPermission = await Permission.microphone.isGranted;
    var isPushAudio = _isPushAudio(enableMic);

    if (hasPermission) {
      if (!isPushAudio) {
        RoomEngineManager().muteLocalAudio();
      }
      RoomEngineManager()
          .openLocalMicrophone()
          .then((value) => _decideCameraStatus(enableCamera));
    } else {
      if (isPushAudio) {
        RoomEngineManager()
            .openLocalMicrophone()
            .then((value) => _decideCameraStatus(enableCamera));
      } else {
        _decideCameraStatus(enableCamera);
      }
    }
  }

  bool _isPushAudio(bool enableMic) {
    if (!enableMic) {
      return false;
    }
    if (_isOwner()) {
      return true;
    }
    if (!RoomStore.to.roomInfo.isMicrophoneDisableForAllUser) {
      return true;
    }
    return false;
  }

  void _decideCameraStatus(bool enableCamera) {
    if (!enableCamera) {
      return;
    }
    if (RoomStore.to.roomInfo.isCameraDisableForAllUser && !_isOwner()) {
      return;
    }
    RoomEngineManager().openLocalCamera();
  }

  bool _isOwner() {
    return RoomStore.to.currentUser.userRole.value == TUIRole.roomOwner;
  }
}
