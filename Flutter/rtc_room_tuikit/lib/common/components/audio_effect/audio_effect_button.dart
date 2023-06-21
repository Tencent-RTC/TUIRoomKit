import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_room_tuikit/common/components/audio_effect/controller.dart';
import 'package:rtc_room_tuikit/common/index.dart';

import 'audio_effect_panel.dart';

class AudioEffectButton extends GetView<AudioEffectController> {
  const AudioEffectButton({super.key});
  @override
  Widget build(BuildContext context) {
    return GetBuilder<AudioEffectController>(
      init: AudioEffectController(),
      id: "room_anchor",
      builder: (_) {
        return LiveImgButton(
          imgUrl: AssetsImages.audioEffect,
          imgSize: 52,
          onTap: () {
            showModalBottomSheet<void>(
              context: context,
              isScrollControlled: true,
              shape: const RoundedRectangleBorder(
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(20),
                  topRight: Radius.circular(20),
                ),
              ),
              builder: (BuildContext context) {
                return AudioEffectSetting(
                  playMusicTips: '',
                  onSelectMusic: (path, tips) {
                    controller.startPlayMusic(path);
                  },
                  onClose: () {
                    Navigator.of(context).pop(true);
                  },
                  onAllMusicVolumeChange: (double value) {
                    controller.setAllMusicVolume(value.toInt());
                  },
                  onMusicPitchChange: (double value) {
                    controller.setMusicPitch(value.toInt());
                  },
                  onVoiceChangerTypeChange: (int type) {
                    controller.setVoiceChangerType(type);
                  },
                  onVoiceReverbTypeChange: (int type) {
                    controller.setVoiceReverbType(type);
                  },
                  onVoiceVolumeChange: (double value) {
                    controller.setVoiceCaptureVolume(value.toInt());
                  },
                );
              },
            );
          },
        );
      },
    );
  }
}
