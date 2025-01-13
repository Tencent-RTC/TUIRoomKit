import 'package:plugin_platform_interface/plugin_platform_interface.dart';
import 'package:tencent_conference_uikit/common/index.dart';

import 'rtc_conference_tuikit_method_channel.dart';

abstract class RtcConferenceTuikitPlatform extends PlatformInterface {
  /// Constructs a RtcConferenceTuikitPlatform.
  RtcConferenceTuikitPlatform() : super(token: _token);

  static final Object _token = Object();

  static RtcConferenceTuikitPlatform _instance =
      MethodChannelRtcConferenceTuikit();

  /// The default instance of [RtcConferenceTuikitPlatform] to use.
  ///
  /// Defaults to [MethodChannelRtcConferenceTuikit].
  static RtcConferenceTuikitPlatform get instance => _instance;

  /// Platform-specific implementations should set this with their own
  /// platform-specific class that extends [RtcConferenceTuikitPlatform] when
  /// they register themselves.
  static set instance(RtcConferenceTuikitPlatform instance) {
    PlatformInterface.verifyToken(instance, _token);
    _instance = instance;
  }

  Future<void> startForegroundService() async {
    await instance.startForegroundService();
  }

  Future<void> stopForegroundService() async {
    await instance.stopForegroundService();
  }

  Future<int> enableFloatWindow(bool enable) async {
    return await instance.enableFloatWindow(enable);
  }

  Future<void> updateFloatWindowUserModel(UserModel userModel) async {
    await instance.updateFloatWindowUserModel(userModel);
  }
}
