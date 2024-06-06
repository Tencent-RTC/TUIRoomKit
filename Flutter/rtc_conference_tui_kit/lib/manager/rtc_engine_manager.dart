import 'dart:async';

import 'package:get/get.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_conference_tui_kit/event/room_event_handler.dart';
import 'package:rtc_conference_tui_kit/platform/rtc_conference_tuikit_platform_interface.dart';
import 'package:rtc_room_engine/rtc_room_engine.dart';
import 'package:tencent_trtc_cloud/trtc_cloud.dart';

class RoomEngineManager {
  static const _seatIndex = -1;
  static const _reqTimeout = 0;
  var _nextSequence = 0;
  late TUIRoomEngine _roomEngine;
  static final RoomEngineManager _instance = RoomEngineManager._internal();

  RoomEngineManager._internal() {
    Get.put<RoomStore>(RoomStore(), permanent: true);
    _roomEngine = TUIRoomEngine.sharedInstance();
    _roomEngine.addObserver(RoomEventHandler());
  }

  factory RoomEngineManager() => _instance;

  TUIRoomEngine getRoomEngine() {
    return _roomEngine;
  }

  Future<TUIActionCallback> createRoom(TUIRoomInfo roomInfo) {
    return _roomEngine.createRoom(roomInfo);
  }

  TUILoginUserInfo getSelfInfo() {
    return TUIRoomEngine.getSelfInfo();
  }

  Future<TUIActionCallback> setSelfInfo(String userName, String avatarURL) {
    return TUIRoomEngine.setSelfInfo(userName, avatarURL);
  }

  Future<void> _getUserList() async {
    var result =
        await RoomEngineManager().getRoomEngine().getUserList(_nextSequence);
    if (result.code == TUIError.success) {
      RoomStore.to
          .addUserByList(result.data!.userInfoList, RoomStore.to.userInfoList);
      if (result.data?.nextSequence != 0) {
        _nextSequence = result.data!.nextSequence;
        _getUserList();
      } else if (RoomStore.to.roomInfo.isSeatEnabled == true &&
          RoomStore.to.roomInfo.seatMode == TUISeatMode.applyToTake) {
        await _getSeatedUserList();
      }
    }
  }

  Future<void> _getSeatedUserList() async {
    var getSeatResult = await _roomEngine.getSeatList();
    if (getSeatResult.code != TUIError.success) {
      return;
    }
    for (var element in getSeatResult.data!) {
      RoomStore.to.updateUserSeatedState(element.userId, true);
      var getUserResult = await _roomEngine.getUserInfo(element.userId);
      if (getUserResult.code == TUIError.success) {
        RoomStore.to.addUser(getUserResult.data!, RoomStore.to.seatedUserList);
      }
    }
  }

  Future<TUIValueCallBack<TUIUserInfo>> getUserInfo(String userId) async {
    return await _roomEngine.getUserInfo(userId);
  }

  Future<TUIValueCallBack<TUIRoomInfo>> enterRoom(String roomId, bool enableMic,
      bool enableCamera, bool isSoundOnSpeaker) async {
    _setFramework();
    TUIValueCallBack<TUIRoomInfo> result = await _roomEngine.enterRoom(roomId);
    if (result.code == TUIError.success) {
      RoomStore.to.roomInfo = result.data!;
      RoomStore.to.isEnteredRoom = true;
      RoomStore.to.timeStampOnEnterRoom = DateTime.now().millisecondsSinceEpoch;
      await _getUserList();
      await RoomStore.to.initialCurrentUser();
      bool isTakeSeatSuccess = await _autoTakeSeatForOwner();
      if (!isTakeSeatSuccess) {
        result.code = TUIError.errUserNotInSeat;
      }
      RoomStore.to.initItemTouchableState();
      _decideMediaStatus(enableMic, enableCamera, isSoundOnSpeaker);
      if (GetPlatform.isAndroid) {
        RtcConferenceTuikitPlatform.instance.startForegroundService();
      }
    }
    return result;
  }

  Future<bool> _autoTakeSeatForOwner() {
    Completer<bool> takeSeatCompleter = Completer();
    if (RoomStore.to.roomInfo.isSeatEnabled != true ||
        RoomStore.to.roomInfo.seatMode != TUISeatMode.applyToTake ||
        RoomStore.to.currentUser.userRole.value != TUIRole.roomOwner) {
      takeSeatCompleter.complete(true);
      return takeSeatCompleter.future;
    }
    takeSeat(
        _seatIndex,
        _reqTimeout,
        TUIRequestCallback(
          onAccepted: (String requestId, String userId) {
            takeSeatCompleter.complete(true);
          },
          onRejected: (String requestId, String userId, String message) {
            takeSeatCompleter.complete(false);
          },
          onCancelled: (String requestId, String userId) {
            takeSeatCompleter.complete(false);
          },
          onTimeout: (String requestId, String userId) {
            takeSeatCompleter.complete(false);
          },
          onError: (String requestId, String userId, TUIError error,
              String message) {
            takeSeatCompleter.complete(false);
          },
        ));
    return takeSeatCompleter.future;
  }

  void _setFramework() {
    String jsonStr =
        "{\n  \"api\":\"setFramework\",\n  \"params\":\n  {\n    \"framework\": 7, \n    \"component\": 18, \n    \"language\": 9\n  }\n}";
    TUIRoomEngine.callExperimentalAPI(jsonStr);
  }

  Future<TUIActionCallback> openLocalCamera() async {
    var cameraPermission = await Permission.camera.request();

    if (!cameraPermission.isGranted) {
      return TUIActionCallback(
          code: TUIError.errPermissionDenied,
          message: "camera permission denied");
    }

    var result = await _roomEngine.openLocalCamera(
        RoomStore.to.videoSetting.isFrontCamera,
        RoomStore.to.videoSetting.videoResolution);
    if (result.code == TUIError.success) {
      RoomStore.to.videoSetting.isCameraOpened = true;
    }
    return result;
  }

  Future<TUIActionCallback> openLocalMicrophone() async {
    var microphone = await Permission.microphone.request();

    if (!microphone.isGranted) {
      return TUIActionCallback(
          code: TUIError.errPermissionDenied,
          message: "camera permission denied");
    }

    var result = await _roomEngine
        .openLocalMicrophone(TUIAudioQuality.audioProfileDefault);
    if (result.code == TUIError.success) {
      RoomStore.to.audioSetting.isMicDeviceOpened = true;
    }
    return result;
  }

  Future<TUIActionCallback> muteLocalAudio() {
    return _roomEngine.muteLocalAudio();
  }

  Future<TUIActionCallback> unMuteLocalAudio() async {
    if (!RoomStore.to.audioSetting.isMicDeviceOpened) {
      await openLocalMicrophone();
    }
    return _roomEngine.unMuteLocalAudio();
  }

  void closeLocalCamera() {
    RoomStore.to.videoSetting.isCameraOpened = false;
    _roomEngine.closeLocalCamera();
  }

  void switchCamera() {
    RoomStore.to.videoSetting.isFrontCamera =
        !RoomStore.to.videoSetting.isFrontCamera;
    _roomEngine
        .getMediaDeviceManager()
        .switchCamera(RoomStore.to.videoSetting.isFrontCamera);
  }

  void setAudioRoute(bool isSoundOnSpeaker) {
    RoomStore.to.audioSetting.isSoundOnSpeaker.value = isSoundOnSpeaker;
    TUIAudioRoute route =
        isSoundOnSpeaker ? TUIAudioRoute.speakerphone : TUIAudioRoute.earpiece;
    return _roomEngine.getMediaDeviceManager().setAudioRoute(route);
  }

  Future<TUIActionCallback> muteAllAudioAction(bool isMute) async {
    var result = await _roomEngine.disableDeviceForAllUserByAdmin(
        TUIMediaDevice.microphone, isMute);
    if (result.code == TUIError.success) {
      RoomStore.to.roomInfo.isMicrophoneDisableForAllUser = isMute;
    }
    return result;
  }

  Future<TUIActionCallback> muteAllVideoAction(bool isMute) async {
    RoomStore.to.roomInfo.isCameraDisableForAllUser = isMute;
    var result = await _roomEngine.disableDeviceForAllUserByAdmin(
        TUIMediaDevice.camera, isMute);
    if (result.code == TUIError.success) {
      RoomStore.to.roomInfo.isCameraDisableForAllUser = isMute;
    }
    return result;
  }

  Future<TUIActionCallback> closeRemoteDeviceByAdmin(
      String userId, TUIMediaDevice device) {
    return _roomEngine.closeRemoteDeviceByAdmin(userId, device);
  }

  TUIRequest openRemoteDeviceByAdmin(
      String userId, TUIMediaDevice device, TUIRequestCallback callback) {
    return _roomEngine.openRemoteDeviceByAdmin(userId, device, 0, callback);
  }

  Future<TUIActionCallback> changeUserRole(String userId, TUIRole role) {
    return _roomEngine.changeUserRole(userId, role);
  }

  Future<TUIActionCallback> disableSendingMessageByAdmin(
      String userId, bool isDisable) {
    return _roomEngine.disableSendingMessageByAdmin(userId, isDisable);
  }

  Future<TUIActionCallback> kickRemoteUserOutOfRoom(String userId) {
    return _roomEngine.kickRemoteUserOutOfRoom(userId);
  }

  Future<TUIActionCallback> exitRoom() async {
    if (GetPlatform.isAndroid) {
      RtcConferenceTuikitPlatform.instance.stopForegroundService();
    }
    RoomStore.to.clearStore();
    return _roomEngine.exitRoom(false);
  }

  Future<TUIActionCallback> destroyRoom() {
    if (GetPlatform.isAndroid) {
      RtcConferenceTuikitPlatform.instance.stopForegroundService();
    }
    RoomStore.to.clearStore();
    return _roomEngine.destroyRoom();
  }

  void setAudioCaptureVolume(int volume) async {
    RoomStore.to.audioSetting.captureVolume = volume;
    var trtcCloud = (await TRTCCloud.sharedInstance())!;
    trtcCloud.setAudioCaptureVolume(volume);
  }

  void setAudioPlayVolume(int volume) async {
    RoomStore.to.audioSetting.playVolume = volume;
    var trtcCloud = (await TRTCCloud.sharedInstance())!;
    trtcCloud.setAudioPlayoutVolume(volume);
  }

  void setVideoFps(int fps) {
    RoomStore.to.videoSetting.videoFps = fps;
    _setVideoEncoderParams();
  }

  void setVideoResolution(TUIVideoQuality resolution) {
    RoomStore.to.videoSetting.videoResolution = resolution;
    _setVideoEncoderParams();
  }

  void setVideoBitrate(int bitrate) {
    RoomStore.to.videoSetting.videoBitrate = bitrate;
  }

  void _setVideoEncoderParams() {
    _roomEngine.updateVideoQualityEx(
      TUIVideoStreamType.cameraStream,
      TUIRoomVideoEncoderParams(
          videoResolution: RoomStore.to.videoSetting.videoResolution,
          resolutionMode: TUIResolutionMode.portrait,
          fps: RoomStore.to.videoSetting.videoFps,
          bitrate: RoomStore.to.videoSetting.videoBitrate),
    );
  }

  void enableAudioVolumeEvaluation(bool enable) async {
    RoomStore.to.audioSetting.volumePrompt = enable;
    var trtcCloud = (await TRTCCloud.sharedInstance())!;
    trtcCloud.enableAudioVolumeEvaluation(enable ? 300 : 0);
  }

  void startScreenSharing({String appGroup = ''}) {
    _roomEngine.startScreenSharing(appGroup: appGroup);
  }

  void stopScreenSharing() {
    _roomEngine.stopScreenSharing();
  }

  Future<TUIActionCallback> responseRemoteRequest(
      String requestId, bool agree) {
    return _roomEngine.responseRemoteRequest(requestId, agree);
  }

  TUIRequest takeSeat(
      int seatIndex, int timeout, TUIRequestCallback? requestCallback) {
    return _roomEngine.takeSeat(seatIndex, timeout, requestCallback);
  }

  void leaveSeat() {
    _roomEngine.leaveSeat();
  }

  void cancelRequest(String requestId) {
    _roomEngine.cancelRequest(requestId);
  }

  void takeUserOnSeat(int seatIndex, String userId, int timeout,
      TUIRequestCallback? requestCallback) {
    _roomEngine.takeUserOnSeatByAdmin(
        seatIndex, userId, timeout, requestCallback);
  }

  void kickUserOffSeat(int seatIndex, String userId) {
    _roomEngine.kickUserOffSeatByAdmin(seatIndex, userId);
  }

  void addObserver(TUIRoomObserver observer) {
    _roomEngine.addObserver(observer);
  }

  void removeObserver(TUIRoomObserver observer) {
    _roomEngine.removeObserver(observer);
  }

  Future<void> getSeatApplicationList() async {
    var result = await _roomEngine.getSeatApplicationList();
    if (result.code == TUIError.success) {
      List<TUIRequest> applicationList = result.data ?? <TUIRequest>[];
      for (var request in applicationList) {
        var userModel = RoomStore.to.getUserById(request.userId) ?? UserModel();
        RoomStore.to.addInviteSeatUser(userModel, request);
      }
    }
  }

  Future<void> _decideMediaStatus(
      bool enableMic, bool enableCamera, bool isSoundOnSpeaker) async {
    setAudioRoute(isSoundOnSpeaker);
    if (RoomStore.to.roomInfo.isSeatEnabled &&
        RoomStore.to.roomInfo.seatMode == TUISeatMode.applyToTake &&
        RoomStore.to.roomInfo.ownerId !=
            RoomStore.to.currentUser.userId.value) {
      return;
    }
    var hasPermission = await Permission.microphone.isGranted;
    var isPushAudio = _isPushAudio(enableMic);

    if (hasPermission) {
      if (!isPushAudio) {
        muteLocalAudio();
      }
      openLocalMicrophone().then((value) => _decideCameraStatus(enableCamera));
    } else {
      if (isPushAudio) {
        openLocalMicrophone()
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
    openLocalCamera();
  }

  bool _isOwner() {
    return RoomStore.to.currentUser.userRole.value == TUIRole.roomOwner;
  }
}
