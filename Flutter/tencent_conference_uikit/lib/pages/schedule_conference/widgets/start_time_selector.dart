import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';

import '../index.dart';

class StartTimeSelector extends GetView<ScheduleConferenceController> {
  const StartTimeSelector({super.key});

  @override
  Widget build(BuildContext context) {
    return BottomSheetWidget(
      height: 334.0.scale375Height(),
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
                  'startTime'.roomTr,
                  style: const TextStyle(
                    fontSize: 16,
                    color: RoomColors.textBlack,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                IconButton(
                  onPressed: () => controller.confirmStartTime(),
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
          SizedBox(
            height: 280.0.scale375Height(),
            child: CupertinoDatePicker(
              minuteInterval: 5,
              use24hFormat: true,
              initialDateTime: controller.getSelectorInitTime(),
              minimumDate: controller.getSelectorMinTime(),
              onDateTimeChanged: (DateTime value) =>
                  controller.onStartTimeChanged(value),
            ),
          ),
        ],
      ),
    );
  }
}
