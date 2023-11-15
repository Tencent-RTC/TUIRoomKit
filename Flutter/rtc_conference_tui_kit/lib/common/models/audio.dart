import 'package:get/get.dart';
import 'package:rtc_room_engine/api/room/tui_room_define.dart';

class AudioModel {
  bool isMicDeviceOpened = false;
  bool isMicOpened = false;
  RxBool isSoundOnSpeaker = true.obs;
  final _captureVolume = 100.obs;
  final _playVolume = 100.obs;
  final _volumePrompt = true.obs;
  TUIAudioQuality audioQuality = TUIAudioQuality.audioProfileDefault;

  int get captureVolume => _captureVolume.value;
  int get playVolume => _playVolume.value;
  bool get volumePrompt => _volumePrompt.value;

  set captureVolume(int value) => _captureVolume.value = value;
  set playVolume(int value) => _playVolume.value = value;
  set volumePrompt(bool value) => _volumePrompt.value = value;
}
