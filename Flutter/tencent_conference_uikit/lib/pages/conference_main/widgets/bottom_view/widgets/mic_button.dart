import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';
import 'package:tencent_conference_uikit/pages/conference_main/widgets/bottom_view/widgets/widgets.dart';

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
                package: 'tencent_conference_uikit',
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
