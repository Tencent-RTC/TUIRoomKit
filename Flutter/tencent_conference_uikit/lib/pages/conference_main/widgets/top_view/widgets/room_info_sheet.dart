import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';
import 'package:rtc_room_engine/api/room/tui_room_define.dart';

import '../index.dart';

class RoomInfoSheet extends GetView<TopViewController> {
  const RoomInfoSheet({super.key});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (BuildContext context, BoxConstraints constraints) {
        Orientation orientation = MediaQuery.of(context).orientation;

        return BottomSheetWidget(
          height: orientation == Orientation.portrait
              ? 225.0.scale375()
              : Get.height,
          orientation: orientation,
          child: Column(
            children: [
              Visibility(
                visible: orientation == Orientation.landscape,
                child: SizedBox(height: 24.0.scale375()),
              ),
              SizedBox(
                width: Get.width,
                child: Obx(
                  () => Text(
                    controller.roomName.value,
                    style: RoomTheme.defaultTheme.textTheme.headlineLarge,
                    textAlign: TextAlign.left,
                  ),
                ),
              ),
              SizedBox(height: 20.0.scale375Height()),
              InfoItemWidget(
                prefixText: 'host'.roomTr,
                infoText: controller.roomInfo.ownerName ??
                    controller.roomInfo.ownerId,
                prefixTextStyle: RoomTheme.defaultTheme.textTheme.titleSmall,
                infoTextStyle: RoomTheme.defaultTheme.textTheme.bodyMedium,
                isLeftAlign: true,
                endPadding: 60.0.scale375(),
              ),
              SizedBox(height: 15.0.scale375Height()),
              InfoItemWidget(
                prefixText: 'roomType'.roomTr,
                infoText: controller.roomInfo.isSeatEnabled == false &&
                        controller.roomInfo.seatMode == TUISeatMode.freeToTake
                    ? 'freeToSpeakRoom'.roomTr
                    : 'onStageSpeakingRoom'.roomTr,
                prefixTextStyle: RoomTheme.defaultTheme.textTheme.titleSmall,
                infoTextStyle: RoomTheme.defaultTheme.textTheme.bodyMedium,
                isLeftAlign: true,
                endPadding: 60.0.scale375(),
              ),
              SizedBox(height: 15.0.scale375Height()),
              InfoItemWidget(
                prefixText: 'roomId'.roomTr,
                infoText: controller.roomInfo.roomId,
                prefixTextStyle: RoomTheme.defaultTheme.textTheme.titleSmall,
                infoTextStyle: RoomTheme.defaultTheme.textTheme.bodyMedium,
                isLeftAlign: true,
                child: CopyTextButton(
                  infoText: controller.roomInfo.roomId,
                  successToast: 'copyRoomIdSuccess'.roomTr,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
