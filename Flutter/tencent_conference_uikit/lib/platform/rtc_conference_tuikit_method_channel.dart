import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:rtc_room_engine/api/room/tui_room_define.dart';
import 'package:tencent_conference_uikit/common/index.dart';

import '../common/store/float_window_store.dart';
import '../pages/conference_main/view.dart';
import 'rtc_conference_tuikit_platform_interface.dart';

/// An implementation of [RtcConferenceTuikitPlatform] that uses method channels.
class MethodChannelRtcConferenceTuikit extends RtcConferenceTuikitPlatform {
  /// The method channel used to interact with the native platform.
  ///
  MethodChannelRtcConferenceTuikit() {
    methodChannel.setMethodCallHandler((call) async {
      _handleNativeCall(call);
    });
  }

  @visibleForTesting
  final methodChannel = const MethodChannel('rtc_conference_tuikit');

  @override
  Future<void> startForegroundService() async {
    await methodChannel.invokeMethod('startForegroundService', {});
  }

  @override
  Future<void> stopForegroundService() async {
    await methodChannel.invokeMethod('stopForegroundService', {});
  }

  @override
  Future<int> enableFloatWindow(bool enable) async {
    return await methodChannel
        .invokeMethod('enableFloatWindow', {'enable': enable});
  }

  @override
  Future<void> updateFloatWindowUserModel(UserModel userModel) async {
    await methodChannel.invokeMethod('updateFloatWindowUserModel', {
      'userId': userModel.userId.value,
      'userName': userModel.userName.value,
      'avatar': userModel.userAvatarURL.value,
      'role': userModel.userRole.value.value(),
      'hasAudioStream': userModel.hasAudioStream.value,
      'hasVideoStream': userModel.hasVideoStream.value,
      'hasScreenStream': userModel.hasScreenStream.value,
      'volume': userModel.volume.value,
    });
  }

  void _handleNativeCall(MethodCall call) {
    switch (call.method) {
      case "onFloatWindowClicked":
        onFloatWindowClicked();
        break;
      default:
        debugPrint("flutter: MethodNotImplemented ${call.method}");
        break;
    }
  }

  void onFloatWindowClicked() {
    FloatWindowStore.to.onFloatWindowClose();
    Get.to(() => const ConferenceMainPage());
  }
}
