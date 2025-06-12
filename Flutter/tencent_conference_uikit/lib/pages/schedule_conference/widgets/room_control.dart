import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';

import '../index.dart';

class RoomControlWidget extends GetView<ScheduleConferenceController> {
  const RoomControlWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return RoundedContainerWidget(
      radius: 6.0.scale375(),
      color: Colors.white,
      height: 108.0.scale375Height(),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          SettingItemWidget(
            title: 'allMute'.roomTr,
            titleStyle:
                const TextStyle(fontSize: 16, color: RoomColors.titleBlack),
            child: SizedBox(
              height: 24.0.scale375Height(),
              width: 40.0.scale375(),
              child: Obx(
                () => SwitchWidget(
                  value: controller.isMuteAll.value,
                  trackColor: RoomColors.switchTrackGrey,
                  onChanged: (value) =>
                      controller.changeAllUserAudioState(value),
                ),
              ),
            ),
          ),
          SettingItemWidget(
            title: 'disableAllVideo'.roomTr,
            titleStyle:
                const TextStyle(fontSize: 16, color: RoomColors.titleBlack),
            child: SizedBox(
              height: 24.0.scale375Height(),
              width: 40.0.scale375(),
              child: Obx(
                () => SwitchWidget(
                  value: controller.isDisableAllVideo.value,
                  trackColor: RoomColors.switchTrackGrey,
                  onChanged: (value) =>
                      controller.changeAllUserVideoState(value),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
