import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';

import '../index.dart';
import 'widgets.dart';

class RoomInfoWidget extends GetView<ScheduleConferenceController> {
  const RoomInfoWidget({super.key, this.isModify});

  final bool? isModify;

  @override
  Widget build(BuildContext context) {
    return RoundedContainerWidget(
      radius: 6,
      color: Colors.white,
      height: 272.0.scale375Height(),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          InfoItemWidget(
            prefixText: 'roomName'.roomTr,
            prefixTextFlex: 1,
            infoTextFlex: 2,
            isTextField: true,
            textEditingController: controller.roomNameController,
          ),
          Obx(
            () => InfoItemWidget(
              prefixText: 'roomType'.roomTr,
              infoText: controller.roomTypeString.value,
              prefixTextFlex: 1,
              infoTextFlex: 2,
              child: isModify == true
                  ? const SizedBox.shrink()
                  : Image.asset(
                      AssetsImages.dropDown,
                      width: 16,
                      height: 16,
                      package: 'tencent_conference_uikit',
                      fit: BoxFit.contain,
                      color: RoomColors.infoBlack,
                    ),
              onTap: () {
                if (isModify == true) {
                  return;
                }
                showConferenceBottomSheet(const RoomTypeWidget());
              },
            ),
          ),
          Obx(
            () => InfoItemWidget(
              prefixText: 'startTime'.roomTr,
              infoText: controller.startTimeString.value,
              prefixTextFlex: 1,
              infoTextFlex: 2,
              child: Image.asset(
                AssetsImages.dropDown,
                width: 16,
                height: 16,
                package: 'tencent_conference_uikit',
                fit: BoxFit.contain,
                color: RoomColors.infoBlack,
              ),
              onTap: () => controller.showStartTimeSelector(),
            ),
          ),
          Obx(
            () => InfoItemWidget(
              prefixText: 'roomDuration'.roomTr,
              infoText: controller.roomDurationString.value,
              prefixTextFlex: 2,
              infoTextFlex: 3,
              child: Image.asset(
                AssetsImages.dropDown,
                width: 16,
                height: 16,
                fit: BoxFit.contain,
                package: 'tencent_conference_uikit',
                color: RoomColors.infoBlack,
              ),
              onTap: () => controller.showDurationSelector(),
            ),
          ),
          Obx(
            () => InfoItemWidget(
              prefixText: 'timeZone'.roomTr,
              infoText: controller.timeZoneString.value,
              prefixTextFlex: 1,
              infoTextFlex: 2,
              child: Image.asset(
                AssetsImages.dropDown,
                width: 16,
                height: 16,
                package: 'tencent_conference_uikit',
                fit: BoxFit.contain,
                color: RoomColors.infoBlack,
              ),
              onTap: () => controller.getToTimeZoneSelector(),
            ),
          ),
          Obx(
            () => InfoItemWidget(
              prefixText: 'attendees'.roomTr,
              infoText: controller.addAttendeesText,
              infoWidget: controller.selectedAttendees.isEmpty
                  ? null
                  : _buildAttendeesAvatar(),
              prefixTextFlex: 1,
              infoTextFlex: 2,
              child: Image.asset(
                AssetsImages.roomArrowRight,
                width: 16,
                height: 16,
                package: 'tencent_conference_uikit',
                color: RoomColors.infoBlack,
              ),
              onTap: () => Get.to(() => const AttendeesSelectorPage()),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAttendeesAvatar() {
    var firstThreeAttendees = controller.selectedAttendees.take(3).toList();

    List<Widget> firstThreeItems = firstThreeAttendees.map((item) {
      return Row(
        children: [
          Image.network(
            item.avatarUrl,
            width: 32.0,
          ),
          const SizedBox(width: 8),
        ],
      );
    }).toList();

    return Row(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        ...firstThreeItems,
        Text(
          '${controller.selectedAttendees.length}/300${'people'.roomTr}',
          style: const TextStyle(color: RoomColors.btnGrey, fontSize: 16),
        ),
      ],
    );
  }
}
