import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_conference_tui_kit/manager/rtc_engine_manager.dart';

class SettingController extends GetxController {
  SettingController();

  late RoomEngineManager _engineManager;
  late PageController pageController;

  final _resolutionName = ''.obs;

  String get resolutionName => _resolutionName.value;
  set resolutionName(String value) => _resolutionName.value = value;

  @override
  void onInit() {
    resolutionName = Constants.videoResolutionNameArray
        .elementAt(getResolutionDefaultIndex());
    _engineManager = RoomEngineManager();
    super.onInit();
  }

  void setAudioCaptureVolume(int volume) {
    _engineManager.setAudioCaptureVolume(volume);
  }

  void setAudioPlayVolume(int volume) {
    _engineManager.setAudioPlayVolume(volume);
  }

  void setVideoFps(int selectedIndex) {
    _engineManager
        .setVideoFps(Constants.videoFpsArray.elementAt(selectedIndex));
  }

  void setVideoResolution(int selectedIndex) {
    resolutionName =
        Constants.videoResolutionNameArray.elementAt(selectedIndex);
    _engineManager
        .setVideoBitrate(Constants.videoBitrateArray.elementAt(selectedIndex));
    _engineManager.setVideoResolution(
        Constants.videoResolutionArray.elementAt(selectedIndex));
  }

  void enableAudioVolumeEvaluation(bool enable) {
    _engineManager.enableAudioVolumeEvaluation(enable);
  }

  int getFpsDefaultIndex() {
    return Constants.videoFpsArray.indexOf(RoomStore.to.videoSetting.videoFps);
  }

  int getResolutionDefaultIndex() {
    return Constants.videoResolutionArray
        .indexOf(RoomStore.to.videoSetting.videoResolution);
  }
}
