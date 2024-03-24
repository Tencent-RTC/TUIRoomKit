import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_conference_tui_kit/pages/conference_main/widgets/bottom_view/widgets/widgets.dart';

import '../index.dart';

class MicButton extends GetView<BottomViewController> {
  const MicButton({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Column(
          children: [
            BottomButtonItemWidget(
              image: Image.asset(
                AssetsImages.roomMicOff,
                package: 'rtc_conference_tui_kit',
                width: 24,
                height: 24,
              ),
              selectedWidget: SizedBox(
                width: 24,
                height: 24,
                child: VolumeBarWidget(
                  lineWidth: 1,
                  volume: RoomStore.to.currentUser.volume,
                  imageName: AssetsImages.roomUnMuteAudio,
                ),
              ),
              onPressed: () {
                controller.muteAudioAction();
              },
              height: 40,
              width: 40,
              isSelected: RoomStore.to.currentUser.hasAudioStream,
            ),
            SizedBox(height: 5.0.scale375Height()),
          ],
        ),
      ],
    );
  }
}
