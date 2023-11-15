import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';

class VolumeBarWidget extends StatelessWidget {
  final UserModel userModel;
  const VolumeBarWidget({super.key, required this.userModel});

  @override
  Widget build(BuildContext context) {
    return Obx(
      () => Image.asset(
        userModel.hasAudioStream.value
            ? AssetsImages.roomVolumeBarBg
            : AssetsImages.roomNoVolumeBg,
        package: 'rtc_conference_tui_kit',
      ),
    );
  }
}
