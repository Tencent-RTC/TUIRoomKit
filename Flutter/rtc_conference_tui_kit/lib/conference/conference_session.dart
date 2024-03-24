import 'package:flutter/material.dart';
import 'package:rtc_conference_tui_kit/manager/rtc_engine_manager.dart';
import 'package:rtc_conference_tui_kit/rtc_conference_tui_kit.dart';
import 'package:rtc_room_engine/rtc_room_engine.dart';

class ConferenceSession {
  factory ConferenceSession.newInstance(String id) {
    return ConferenceSession._internal(id);
  }

  set isMuteMicrophone(bool value) => _isMuteMicrophone = value;
  set isOpenCamera(bool value) => _isOpenCamera = value;
  set isSoundOnSpeaker(bool value) => _isSoundOnSpeaker = value;

  set name(String value) => _name = value;
  set enableMicrophoneForAllUser(bool value) =>
      _enableMicrophoneForAllUser = value;
  set enableCameraForAllUser(bool value) => _enableCameraForAllUser = value;
  set enableMessageForAllUser(bool value) => _enableMessageForAllUser = value;
  set enableSeatControl(bool value) => _enableSeatControl = value;

  set onActionSuccess(VoidCallback callback) => _onActionSuccess = callback;
  set onActionError(Function(ConferenceError, String) callback) =>
      _onActionError = callback;

  ConferenceSession._internal(this._conferenceId);

  String _conferenceId;

  bool _isMuteMicrophone = false;
  bool _isOpenCamera = false;
  bool _isSoundOnSpeaker = true;

  String? _name;
  bool _enableMicrophoneForAllUser = true;
  bool _enableCameraForAllUser = true;
  bool _enableMessageForAllUser = true;
  bool _enableSeatControl = false;

  VoidCallback? _onActionSuccess;
  Function(ConferenceError, String)? _onActionError;

  Future<void> quickStart() async {
    var roomInfo = TUIRoomInfo(roomId: _conferenceId);
    if (_name == null || _name!.isEmpty) {
      _name = _conferenceId;
    }
    roomInfo.name = _name;
    roomInfo.isMicrophoneDisableForAllUser = !_enableMicrophoneForAllUser;
    roomInfo.isCameraDisableForAllUser = !_enableCameraForAllUser;
    roomInfo.isMessageDisableForAllUser = !_enableMessageForAllUser;
    roomInfo.isSeatEnabled = _enableSeatControl;
    roomInfo.seatMode =
        _enableSeatControl ? TUISeatMode.applyToTake : TUISeatMode.freeToTake;

    await _quickStartInternal(
        roomInfo, !_isMuteMicrophone, _isOpenCamera, _isSoundOnSpeaker);
  }

  Future<void> join() async {
    await _joinInternal(
        _conferenceId, !_isMuteMicrophone, _isOpenCamera, _isSoundOnSpeaker);
  }

  Future<void> _quickStartInternal(TUIRoomInfo roomInfo, bool openAudio,
      bool openVideo, bool isSoundOnSpeaker) async {
    var createRoomResult = await RoomEngineManager().createRoom(roomInfo);
    if (createRoomResult.code == TUIError.success) {
      var enterRoomResult = await RoomEngineManager()
          .enterRoom(roomInfo.roomId, openAudio, openVideo, isSoundOnSpeaker);
      if (enterRoomResult.code == TUIError.success) {
        _onActionSuccess?.call();
      } else {
        _onActionError?.call(
            ConferenceErrorExt.fromValue(enterRoomResult.code.value()),
            enterRoomResult.message ?? "");
      }
    } else {
      _onActionError?.call(
          ConferenceErrorExt.fromValue(createRoomResult.code.value()),
          createRoomResult.message ?? "");
    }
  }

  Future<void> _joinInternal(String roomId, bool openAudio, bool openVideo,
      bool isSoundOnSpeaker) async {
    var result = await RoomEngineManager()
        .enterRoom(roomId, openAudio, openVideo, isSoundOnSpeaker);
    if (result.code == TUIError.success) {
      _onActionSuccess?.call();
    } else {
      _onActionError?.call(ConferenceErrorExt.fromValue(result.code.value()),
          result.message ?? "");
    }
  }
}
