import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';

import '../index.dart';

class RoomDurationSelector extends GetView<ScheduleConferenceController> {
  const RoomDurationSelector({super.key});

  @override
  Widget build(BuildContext context) {
    return BottomSheetWidget(
      height: 324.0.scale375Height(),
      isNeedDropDownButton: false,
      color: Colors.white,
      child: Column(
        children: [
          SizedBox(
            height: 54.0.scale375Height(),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                IconButton(
                  onPressed: () => Get.back(),
                  icon: Image.asset(
                    AssetsImages.roomWrong,
                    package: 'tencent_conference_uikit',
                    width: 24,
                    height: 24,
                  ),
                ),
                Text(
                  'roomDuration'.roomTr,
                  style: const TextStyle(
                    fontSize: 16,
                    color: RoomColors.textBlack,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                IconButton(
                  onPressed: () => controller.confirmDuration(),
                  icon: Image.asset(
                    AssetsImages.roomRight,
                    package: 'tencent_conference_uikit',
                    width: 24,
                    height: 24,
                  ),
                )
              ],
            ),
          ),
          Expanded(
            child: CupertinoTimerPicker(
              mode: CupertinoTimerPickerMode.hm,
              initialTimerDuration: controller.roomDuration,
              minuteInterval: 5,
              onTimerDurationChanged: (Duration value) =>
                  controller.onRoomDurationChanged(value),
            ),
          ),
        ],
      ),
    );
  }
}
