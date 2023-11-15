import 'package:get/get.dart';
import 'package:flutter/material.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_conference_tui_kit/pages/conference_main/widgets/widgets.dart';

import 'widgets.dart';

class AudioSettingWidget extends GetView<SettingController> {
  const AudioSettingWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return RoundedContainerWidget(
      child: Column(
        children: [
          SettingItemWidget(
            title: RoomContentsTranslations.translate('audioCaptureVolume'),
            child: Obx(
              () => SliderWidget(
                prefixText: '${RoomStore.to.audioSetting.captureVolume}',
                value: RoomStore.to.audioSetting.captureVolume,
                onChanged: (value) {
                  controller.setAudioCaptureVolume(value);
                },
              ),
            ),
          ),
          const Divider(
            height: 36,
          ),
          SettingItemWidget(
            title: RoomContentsTranslations.translate('audioPlayVolume'),
            child: Obx(
              () => SliderWidget(
                prefixText: '${RoomStore.to.audioSetting.playVolume}',
                value: RoomStore.to.audioSetting.playVolume,
                onChanged: (value) {
                  controller.setAudioPlayVolume(value);
                },
              ),
            ),
          ),
          const Divider(
            height: 36,
          ),
          SettingItemWidget(
            title: RoomContentsTranslations.translate('volumePrompt'),
            child: SizedBox(
              height: 24,
              child: Obx(
                () => SwitchWidget(
                  value: RoomStore.to.audioSetting.volumePrompt,
                  onChanged: (value) {
                    controller.enableAudioVolumeEvaluation(value);
                  },
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
