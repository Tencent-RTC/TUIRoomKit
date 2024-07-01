import 'package:rtc_room_engine/rtc_room_engine.dart';

class Constants {
  static const roomLink =
      "https://web.sdk.qcloud.com/trtc/webrtc/test/tuiroom-inner/index.html#/room?roomId=";

  static const videoResolutionNameArray = [
    'smoothDefinition',
    'standardDefinition',
    'highDefinition',
    'superDefinition',
  ];

  static const videoResolutionArray = [
    TUIVideoQuality.videoQuality_360P,
    TUIVideoQuality.videoQuality_540P,
    TUIVideoQuality.videoQuality_720P,
    TUIVideoQuality.videoQuality_1080P,
  ];

  static const videoBitrateArray = [500, 850, 1200, 2000];

  static const videoFpsArray = [
    15,
    20,
  ];
}
