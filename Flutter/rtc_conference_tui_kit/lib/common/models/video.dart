import 'package:get/get.dart';
import 'package:rtc_room_engine/api/room/tui_room_define.dart';

class VideoModel {
  bool isCameraOpened = true;
  final _videoFps = 15.obs;
  final _videoResolution = TUIVideoQuality.videoQuality_540P.obs;
  final _videoBitrate = 900.obs;
  final _isMirror = true.obs;
  bool isFrontCamera = true;

  int get videoFps => _videoFps.value;
  TUIVideoQuality get videoResolution => _videoResolution.value;
  int get videoBitrate => _videoBitrate.value;
  bool get isMirror => _isMirror.value;

  set videoFps(int value) => _videoFps.value = value;
  set videoResolution(TUIVideoQuality value) => _videoResolution.value = value;
  set videoBitrate(int value) => _videoBitrate.value = value;
  set isMirror(bool value) => _isMirror.value = value;
}
