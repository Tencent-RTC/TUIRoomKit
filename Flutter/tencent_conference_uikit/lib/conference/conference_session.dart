import 'package:flutter/material.dart';
import 'package:tencent_conference_uikit/common/index.dart';
import 'package:tencent_conference_uikit/manager/rtc_engine_manager.dart';
import 'package:tencent_conference_uikit/tencent_conference_uikit.dart';
import 'package:rtc_room_engine/rtc_room_engine.dart';

/// A class representing a conference session.
///
/// When you expect to launch the conference interface after successfully creating/joining a conference,
/// you need to use the [ConferenceSession] class to perform related operations.
///
/// Example:
/// ```dart
///  ConferenceSession.newInstance('yourConferenceId')
///    ..name = 'yourConferenceName'
///    ..isMuteMicrophone = false
///    ..isOpenCamera = true
///    ..isSoundOnSpeaker = true
///    ..enableMicrophoneForAllUser = true
///    ..enableCameraForAllUser = true
///    ..enableMessageForAllUser = true
///    ..enableSeatControl = false
///    ..onActionSuccess =  () {}               // Callback for success, You can navigate to the conference page here.
///    ..onActionError = (error, message) {}    // Callback for error
///    ..quickStart();
/// ```
class ConferenceSession {
  factory ConferenceSession.newInstance(String id) {
    return ConferenceSession._internal(id);
  }

  /// Sets whether the microphone is muted.
  ///
  /// If set to `true`, the microphone will be muted.
  /// The default value is `false`.
  set isMuteMicrophone(bool value) => _isMuteMicrophone = value;

  /// Sets whether the camera is open.
  ///
  /// If set to `true`, the camera will be turned on.
  /// The default value is `false`.
  set isOpenCamera(bool value) => _isOpenCamera = value;

  /// Sets whether the sound is played through the speaker.
  ///
  /// If set to `true`, the sound will be played through the speaker.
  /// The default value is `true`.
  set isSoundOnSpeaker(bool value) => _isSoundOnSpeaker = value;

  /// Sets the name of the conference.
  ///
  /// This is an optional field. If not provided, the conference ID will be used as the name.
  /// Note: This parameter is only effective when creating a conference.
  set name(String value) => _name = value;

  /// Sets whether the microphone is enabled for all users.
  ///
  /// If set to `true`, all users will have their microphones enabled by default.
  /// Note: This parameter is only effective when creating a conference.
  /// The default value is `true`.
  set enableMicrophoneForAllUser(bool value) =>
      _enableMicrophoneForAllUser = value;

  /// Sets whether the camera is enabled for all users.
  ///
  /// If set to `true`, all users will have their cameras enabled by default.
  /// Note: This parameter is only effective when creating a conference.
  /// The default value is `true`.
  set enableCameraForAllUser(bool value) => _enableCameraForAllUser = value;

  /// Sets whether messaging is enabled for all users.
  ///
  /// If set to `true`, all users will be able to send messages by default.
  /// Note: This parameter is only effective when creating a conference.
  /// The default value is `true`.
  set enableMessageForAllUser(bool value) => _enableMessageForAllUser = value;

  /// Sets whether the seat control mode is enabled.
  ///
  /// If set to `true`, the seat control mode will be enabled, allowing users to request to speak.
  /// Note: This parameter is only effective when creating a conference.
  /// The default value is `false`.
  set enableSeatControl(bool value) => _enableSeatControl = value;

  /// Sets the callback to be invoked when creating or joining a conference is successful.
  set onActionSuccess(VoidCallback callback) => _onActionSuccess = callback;

  /// Sets the callback to be invoked when creating or joining a conference encounters an error.
  set onActionError(Function(ConferenceError error, String message) callback) =>
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
      var loginUserInfo = RoomEngineManager().getSelfInfo();
      _name = (loginUserInfo.userName ?? loginUserInfo.userId) +
          'quickConference'.roomTr;
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
