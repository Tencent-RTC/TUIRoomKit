import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

import 'rtc_conference_tuikit_platform_interface.dart';

/// An implementation of [RtcConferenceTuikitPlatform] that uses method channels.
class MethodChannelRtcConferenceTuikit extends RtcConferenceTuikitPlatform {
  /// The method channel used to interact with the native platform.
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
}
