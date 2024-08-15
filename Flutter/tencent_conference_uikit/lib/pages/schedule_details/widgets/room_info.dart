import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_room_engine/rtc_room_engine.dart';
import 'package:tencent_conference_uikit/common/index.dart';

import '../index.dart';

class RoomInfoWidget extends GetView<ScheduleDetailsController> {
  const RoomInfoWidget({required this.conferenceInfo, super.key});

  final TUIConferenceInfo conferenceInfo;

  @override
  Widget build(BuildContext context) {
    return RoundedContainerWidget(
      radius: 6,
      color: Colors.white,
      height: 319.0.scale375Height(),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Obx(
            () => InfoItemWidget(
              prefixText: 'roomName'.roomTr,
              infoText: controller.roomName.value,
              prefixTextFlex: 1,
              infoTextFlex: 2,
            ),
          ),
          InfoItemWidget(
            prefixText: 'roomId'.roomTr,
            infoText: conferenceInfo.basicRoomInfo.roomId,
            prefixTextFlex: 1,
            infoTextFlex: 2,
            child: Image.asset(
              AssetsImages.roomCopy,
              package: 'tencent_conference_uikit',
              color: RoomColors.menuButtonBlue,
              width: 16,
            ),
            onTap: () => controller.copyRoomId(),
          ),
          Obx(
            () => InfoItemWidget(
              prefixText: 'startTime'.roomTr,
              infoText: controller.startTime.value,
              prefixTextFlex: 1,
              infoTextFlex: 2,
            ),
          ),
          Obx(
            () => InfoItemWidget(
              prefixText: 'roomDuration'.roomTr,
              infoText: controller.duration.value,
              prefixTextFlex: 2,
              infoTextFlex: 3,
            ),
          ),
          InfoItemWidget(
            prefixText: 'roomType'.roomTr,
            infoText: conferenceInfo.basicRoomInfo.isSeatEnabled
                ? 'onStageSpeakingRoom'.roomTr
                : 'freeToSpeakRoom'.roomTr,
            prefixTextFlex: 1,
            infoTextFlex: 2,
          ),
          InfoItemWidget(
            prefixText: 'creator'.roomTr,
            infoWidget: _buildCreatorWidget(),
            prefixTextFlex: 1,
            infoTextFlex: 2,
          ),
          Obx(
            () => InfoItemWidget(
              prefixText: 'attendees'.roomTr,
              infoWidget: _buildAttendeesAvatar(),
              prefixTextFlex: 2,
              infoTextFlex: 5,
              child: controller.attendeesCount.value != 0
                  ? Image.asset(
                      AssetsImages.roomArrowRight,
                      width: 16,
                      height: 16,
                      package: 'tencent_conference_uikit',
                      color: RoomColors.infoBlack,
                    )
                  : null,
              onTap: () => controller.onAttendeesPressed(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCreatorWidget() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        Image.network(
          (conferenceInfo.basicRoomInfo.ownerAvatarUrl == null ||
                  conferenceInfo.basicRoomInfo.ownerAvatarUrl!.isEmpty)
              ? Constants.defaultAvatarUrl
              : conferenceInfo.basicRoomInfo.ownerAvatarUrl!,
          width: 32.0,
        ),
        const SizedBox(width: 8),
        Text(
          conferenceInfo.basicRoomInfo.ownerName ??
              conferenceInfo.basicRoomInfo.ownerId,
          style: const TextStyle(
            color: RoomColors.btnGrey,
            fontSize: 16,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }

  Widget _buildAttendeesAvatar() {
    return Obx(() {
      var firstThreeAttendees = controller.attendeesList.take(3).toList();

      List<Widget> firstThreeItems = firstThreeAttendees.map((item) {
        return Row(
          children: [
            Image.network(
              item.avatarUrl.isEmpty
                  ? Constants.defaultAvatarUrl
                  : item.avatarUrl,
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
            controller.attendeesCount.value != 0
                ? '${controller.attendeesCount}/300${'people'.roomTr}'
                : 'noAttendees'.roomTr,
            style: const TextStyle(color: RoomColors.btnGrey, fontSize: 16),
          ),
        ],
      );
    });
  }
}
